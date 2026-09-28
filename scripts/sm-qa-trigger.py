#!/usr/bin/env python3
"""Fire the Playwright QA runner for UI specs in the deployed range.

FEAT-4405: the kit form of sm-api's post-deploy "Trigger PW QA" step. The
merged pull requests since the previous successful deployment carry fenced specs:

    ```pw-verify
    {"bug_id": "bug_xxx", "page": "/path", "verify": "what to see"}
    ```

(one object per block; the primary format), or one legacy block

    ```pw-tests
    [{"id": "bug_xxx", "name": "...", "page": "/path", "steps": [...]}]
    ```

The specs go to sm-api `POST /api/admin/qa/trigger` in one call, with the
repository's scoped key as `Authorization: Bearer`. sm-api mints the magic
link, records the runs and calls the runner, so this script holds no
Cloudflare or D1 credential and writes nothing itself.

QA is non-fatal to a deploy by design: every outcome, including a missing key,
a GitHub or sm-api error and a malformed block, exits 0. The last line is
always `FIRED=<n>`. The key is never printed.
"""

import argparse
import datetime
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

DEFAULT_API_URL = "https://api.sprintmode.ai"
TRIGGER_PATH = "/api/admin/qa/trigger"
USER_AGENT = "sm-workflow-kit-qa/1 (+https://github.com/sprint-mode/sm-workflow)"
VERIFY_BLOCK = re.compile(r"```pw-verify[ \t]*\r?\n(.*?)\r?\n```", re.DOTALL)
TESTS_BLOCK = re.compile(r"```pw-tests[ \t]*\r?\n(.*?)\r?\n```", re.DOTALL)
REPO_SHAPE = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+")
SHA_SHAPE = re.compile(r"[0-9a-f]{40}")
PAGE_SIZE = 100
MAX_PAGES = 10
MAX_LOG_BYTES = 5 * 1024 * 1024


def warn(message):
    print(f"::warning::{message}")


def is_page(value):
    return isinstance(value, str) and value.startswith("/")


def specs_from_body(body):
    """Return (tests, skipped) for one PR body. pw-verify wins over pw-tests."""
    tests = []
    skipped = 0
    verify_blocks = VERIFY_BLOCK.findall(body)
    for raw in verify_blocks:
        try:
            spec = json.loads(raw)
            bug_id, page, verify = spec["bug_id"], spec["page"], spec["verify"]
        except (ValueError, KeyError, TypeError):
            skipped += 1
            continue
        if not (isinstance(bug_id, str) and bug_id and is_page(page) and isinstance(verify, str)):
            skipped += 1
            continue
        test = {"id": bug_id, "name": f"Verify {bug_id}", "page": page, "verify": verify}
        if isinstance(spec.get("steps"), list):
            test["steps"] = spec["steps"]
        tests.append(test)
    if verify_blocks:
        return tests, skipped

    match = TESTS_BLOCK.search(body)
    if not match:
        return tests, skipped
    try:
        entries = json.loads(match.group(1))
    except ValueError:
        return tests, skipped + 1
    if not isinstance(entries, list):
        return tests, skipped + 1
    for entry in entries:
        if not isinstance(entry, dict):
            skipped += 1
            continue
        test_id, name, page = entry.get("id"), entry.get("name"), entry.get("page")
        if not (isinstance(test_id, str) and test_id and isinstance(name, str) and is_page(page)):
            skipped += 1
            continue
        verify = entry.get("verify") if isinstance(entry.get("verify"), str) else name
        test = {"id": test_id, "name": name, "page": page, "verify": verify}
        if isinstance(entry.get("steps"), list):
            test["steps"] = entry["steps"]
        tests.append(test)
    return tests, skipped


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class GitHub:
    """A finite, read-only history lookup; response bodies never enter warnings."""

    def __init__(self, repo, token, api):
        self.root = f"{api.rstrip('/')}/repos/{repo}"
        self.headers = {"Accept": "application/vnd.github+json", "User-Agent": USER_AGENT}
        if token:
            self.headers["Authorization"] = f"Bearer {token}"
        self.deadline = time.monotonic() + 180
        self.requests_left = 200

    def timeout(self):
        remaining = self.deadline - time.monotonic()
        self.requests_left -= 1
        if remaining <= 0 or self.requests_left < 0:
            raise ValueError("GitHub history lookup limit reached")
        return min(30, remaining)

    def json(self, path):
        req = urllib.request.Request(self.root + path, headers=self.headers)
        with urllib.request.urlopen(req, timeout=self.timeout()) as resp:
            return json.load(resp)

    def pages(self, path, key=None):
        separator = "&" if "?" in path else "?"
        for page in range(1, MAX_PAGES + 1):
            result = self.json(f"{path}{separator}per_page={PAGE_SIZE}&page={page}")
            entries = result.get(key) if key and isinstance(result, dict) else result
            if not isinstance(entries, list) or not all(isinstance(x, dict) for x in entries):
                raise ValueError("Invalid GitHub response envelope")
            yield result, entries
            if len(entries) < PAGE_SIZE:
                return
        raise ValueError("GitHub pagination limit reached")

    def objects(self, path, key=None):
        for _, entries in self.pages(path, key):
            yield from entries

    def log(self, job_id):
        # GitHub returns a signed storage URL. Do not forward the repository
        # token to that host (urllib's default redirect handler would do so).
        req = urllib.request.Request(self.root + f"/actions/jobs/{job_id}/logs", headers=self.headers)
        opener = urllib.request.build_opener(NoRedirect())
        try:
            response = opener.open(req, timeout=self.timeout())
        except urllib.error.HTTPError as exc:
            location = exc.headers.get("Location", "")
            if exc.code != 302 or not location.startswith("https://"):
                raise
            response = opener.open(urllib.request.Request(location), timeout=self.timeout())
        with response as resp:
            raw = resp.read(MAX_LOG_BYTES + 1)
        if len(raw) > MAX_LOG_BYTES:
            raise ValueError("Deploy job log exceeds lookup limit")
        return raw.decode("utf-8", errors="replace")


def timestamp(value):
    return datetime.datetime.fromisoformat(value.replace("Z", "+00:00"))


def checkout_sha(job, log):
    steps = [s for s in job["steps"] if s["name"].startswith("Run actions/checkout@")]
    if len(steps) != 1 or steps[0]["conclusion"] != "success":
        raise ValueError("Ambiguous deployment checkout")
    start = timestamp(steps[0]["started_at"])
    # Job metadata rounds timestamps down to seconds; logs preserve fractions.
    end = timestamp(steps[0]["completed_at"]) + datetime.timedelta(seconds=1)
    lines, candidates = log.splitlines(), []
    for index, line in enumerate(lines[:-1]):
        parts = line.split(" ", 1)
        if len(parts) != 2 or not re.fullmatch(r"\[command\]\S*/git log -1 --format=%H", parts[1]):
            continue
        following = lines[index + 1].split(" ", 1)
        if (len(following) == 2 and SHA_SHAPE.fullmatch(following[1])
                and start <= timestamp(parts[0]) < end
                and start <= timestamp(following[0]) < end):
            candidates.append(following[1])
    if len(candidates) != 1:
        raise ValueError("Could not prove the deployment checkout SHA")
    return candidates[0]


def previous_deploy_sha(github, run_id, job_name):
    current = github.json(f"/actions/runs/{run_id}")
    jobs = [j for j in github.objects(f"/actions/runs/{run_id}/jobs", "jobs") if j["name"] == job_name]
    if len(jobs) != 1:
        raise ValueError("Current deploy job is ambiguous")
    start = timestamp(jobs[0]["started_at"])
    path = f"/actions/workflows/{current['workflow_id']}/runs?status=success"
    for run in github.objects(path, "workflow_runs"):
        if run["run_number"] >= current["run_number"] or run["head_branch"] != current["head_branch"]:
            continue
        jobs = [j for j in github.objects(f"/actions/runs/{run['id']}/jobs", "jobs") if j["name"] == job_name]
        if len(jobs) != 1:
            raise ValueError("Previous deploy job is ambiguous")
        job = jobs[0]
        # A successful workflow can have a skipped deploy. It is not a baseline.
        if job["conclusion"] != "success" or timestamp(job["completed_at"]) > start:
            continue
        return checkout_sha(job, github.log(job["id"]))
    # Only fully exhausted history proves a first deployment; API/limit failures
    # propagate instead of turning an unknown baseline into an invented range.
    return None


def merged_pr_bodies(repo, sha, token, api, run_id, job_name):
    github = GitHub(repo, token, api)
    previous = previous_deploy_sha(github, run_id, job_name)
    commits = []
    if previous:
        total = None
        for result, page in github.pages(f"/compare/{previous}...{sha}", "commits"):
            if result.get("status") not in ("ahead", "identical"):
                raise ValueError("Previous deploy is not an ancestor of this deploy")
            if not isinstance(result.get("total_commits"), int):
                raise ValueError("Invalid comparison total")
            if total is not None and total != result["total_commits"]:
                raise ValueError("Comparison changed while paging")
            total = result["total_commits"]
            commits.extend(page)
        if len(commits) != total:
            raise ValueError("Incomplete deployment comparison")
    else:
        commits = list(github.objects(f"/commits?sha={sha}"))
    seen, bodies = set(), []
    for commit in commits:
        if not SHA_SHAPE.fullmatch(commit["sha"]):
            raise ValueError("Invalid commit SHA")
        for pull in github.objects(f"/commits/{commit['sha']}/pulls"):
            if not isinstance(pull.get("number"), int) or "merged_at" not in pull:
                raise ValueError("Invalid pull request")
            number = pull["number"]
            if pull["merged_at"] and number not in seen:
                seen.add(number)
                if pull.get("body") is not None and not isinstance(pull["body"], str):
                    raise ValueError("Invalid pull request body")
                bodies.append((number, pull.get("body") or ""))
    return bodies


def trigger(api_url, key, base_url, tests):
    payload = json.dumps({"base_url": base_url, "tests": tests, "trigger": "deploy-prod"}).encode()
    req = urllib.request.Request(
        api_url.rstrip("/") + TRIGGER_PATH,
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def main(argv):
    parser = argparse.ArgumentParser(prog="sm-qa-trigger.py")
    parser.add_argument("--repo", required=True, help="owner/name of the deployed repository")
    parser.add_argument("--sha", required=True, help="the deployed commit (40 hex)")
    parser.add_argument("--base-url", required=True, help="where the runner opens the product")
    parser.add_argument("--api-url", default=DEFAULT_API_URL)
    parser.add_argument("--github-api", default="https://api.github.com")
    parser.add_argument("--run-id", default=os.environ.get("GITHUB_RUN_ID", ""), help="current deploy workflow run")
    parser.add_argument("--job-name", default="deploy", help="deploy job's Actions display name")
    parser.add_argument("--body-file", help="read one PR body from a file instead of GitHub")
    args = parser.parse_args(argv)

    if not REPO_SHAPE.fullmatch(args.repo) or not SHA_SHAPE.fullmatch(args.sha):
        warn("PW QA skipped: --repo or --sha is malformed")
        print("FIRED=0")
        return 0
    if not args.base_url.startswith("https://"):
        warn("PW QA skipped: --base-url must be an https URL")
        print("FIRED=0")
        return 0

    try:
        if args.body_file:
            with open(args.body_file, encoding="utf-8", errors="replace") as fh:
                bodies = [(None, fh.read())]
        else:
            if not args.run_id.isdigit():
                raise ValueError("Current deployment run is required")
            bodies = merged_pr_bodies(args.repo, args.sha, os.environ.get("GH_TOKEN", ""),
                                      args.github_api, args.run_id, args.job_name)
    except (urllib.error.URLError, OSError, ValueError) as exc:
        warn(f"PW QA skipped: could not read the merged pull requests ({type(exc).__name__})")
        print("FIRED=0")
        return 0

    tests = []
    for number, body in bodies:
        found, skipped = specs_from_body(body)
        label = f"PR #{number}" if number else "PR body"
        if skipped:
            warn(f"{label}: skipped {skipped} malformed QA spec(s)")
        tests.extend(found)

    if not tests:
        print("No pw-verify or pw-tests spec in the deployed pull requests - PW QA not needed.")
        print("FIRED=0")
        return 0

    key = os.environ.get("QA_TRIGGER_KEY", "")
    if not key:
        warn(f"PW QA skipped: {len(tests)} spec(s) found but QA_TRIGGER_KEY is not set on this repository")
        print("FIRED=0")
        return 0

    try:
        result = trigger(args.api_url, key, args.base_url, tests)
    except urllib.error.HTTPError as exc:
        warn(f"PW QA trigger refused: HTTP {exc.code} from {TRIGGER_PATH} (non-fatal)")
        print("FIRED=0")
        return 0
    except (urllib.error.URLError, OSError, ValueError) as exc:
        warn(f"PW QA trigger failed: {type(exc).__name__} (non-fatal)")
        print("FIRED=0")
        return 0

    runs = result.get("data", {}).get("runs") if isinstance(result, dict) and isinstance(result.get("data"), dict) else None
    if not isinstance(runs, list) or not all(
            isinstance(entry, dict) and all(isinstance(entry.get(field), str) for field in ("test_id", "id", "status"))
            for entry in runs):
        warn("PW QA trigger returned an invalid response envelope (non-fatal)")
        print("FIRED=0")
        return 0
    fired = 0
    for run in runs:
        status = str(run.get("status", ""))
        line = f"{run['test_id']} -> {run['id']}: {status}"
        print(line.replace(key, "[REDACTED]"))
        if status == "running":
            fired += 1
    print(f"FIRED={fired}")
    return 0


def run(argv):
    # This optional post-deploy consumer must contain unexpected upstream
    # failures too. Never include an exception's text: it may contain a key.
    try:
        return main(argv)
    except Exception as exc:
        warn(f"PW QA skipped: unexpected {type(exc).__name__} (non-fatal)")
        print("FIRED=0")
        return 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1:]))
