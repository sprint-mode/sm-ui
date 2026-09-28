#!/usr/bin/env bash
# sm-workflow guard — Claude Code PreToolUse hook (Bash matcher).
# stdin: {"tool_input":{"command":"..."}}. Exit 0 allows; exit 2 blocks and
# stderr is shown to the model. Scoped: sprint-mode remotes and kit-adopted checkouts; elsewhere → allow.
set -u

CMD=$(python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null || true)
[ -n "$CMD" ] || exit 0

REMOTE=$(git remote get-url origin 2>/dev/null || true)
# Arm on sprint-mode remotes and on any adopter checkout whose .sm-workflow.conf
# has agent_pilot=on (adopter organizations, FEAT-3820); elsewhere → allow
# (BUG-3837). The hook reads no environment for this: the checkout decides.
GROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if ! printf '%s' "$REMOTE" | grep -qE 'github\.com[:/]sprint-mode/'; then
  # An adopter that opted into unattended execution (agent_pilot=on) gets the
  # guard; a stray conf with only landing branches does not change the old verdict.
  [ -n "$GROOT" ] && grep -qsE '^agent_pilot=on$' "$GROOT/.sm-workflow.conf" || exit 0
fi

BRANCHES="main"
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [ -n "$ROOT" ] && [ -f "$ROOT/.sm-workflow.conf" ]; then
  LB=$(grep '^landing_branches=' "$ROOT/.sm-workflow.conf" 2>/dev/null | head -1 | cut -d= -f2-)
  [ -n "$LB" ] && BRANCHES="$LB"
fi

deny() { echo "$1" >&2; exit 2; }

for b in $BRANCHES; do
  if printf '%s' "$CMD" | grep -qE "git push[^|&;]*[[:space:]](origin[[:space:]]+)?($b|HEAD:$b)([[:space:]]|\$)"; then
    deny "Direct pushes to $b are blocked. Run /merge — it rebases, checks migrations, and lands through the merge queue."
  fi
done
if printf '%s' "$CMD" | grep -qE 'git[[:space:]]+(push|commit)[^|&;]*--no-verify'; then
  # Constrained-sandbox exception (BUG-1841, decision owner ruling 2026-08-11,
  # LANDING-PROCESS): `git commit --no-verify` is allowed when the environment
  # is a constrained agent sandbox — CLAUDE_CODE_REMOTE=true (Claude Code cloud)
  # or hook_profile=fast in .sm-workflow.conf. Temporary until the per-repo
  # pre-commit fast-path lands fleet-wide. `git push --no-verify` never passes:
  # pre-push carries the landing-branch and migration blocks.
  ALLOW_NV=1
  if ! printf '%s' "$CMD" | grep -qE 'git[[:space:]]+push[^|&;]*--no-verify'; then
    if [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; then
      ALLOW_NV=0
    elif [ -n "$ROOT" ] && [ -f "$ROOT/.sm-workflow.conf" ] \
      && grep -q '^hook_profile=fast$' "$ROOT/.sm-workflow.conf" 2>/dev/null; then
      ALLOW_NV=0
    fi
  fi
  if [ "$ALLOW_NV" -ne 0 ]; then
    deny "--no-verify is blocked: the hooks catch migration collisions and CI failures before they cost the queue."
  fi
fi
if printf '%s' "$CMD" | grep -qE 'gh pr merge[^|&;]*--admin'; then
  deny "Admin merges bypass the merge queue. Use 'gh pr merge --auto', or /merge."
fi
# A session must never act as a HUMAN GitHub identity on a PR REVIEW (BUG-3402: a
# session submitted a codeowner APPROVE as the machine's gh login, and auto-merge
# fired on it). The only human approval is the Waffle TOTP tap; the AI review comes
# from /review-pr. Those denies are below and they are unconditional.
#
# MERGING IS GATED ON THE QUEUE, NOT ON WHO IS ASKING (BUG-3641). Through kit 14.50.3
# the merge verbs also required a `wf token` App installation token. That rule could
# not be satisfied on a machine with no threads App key, which is every machine that
# was not provisioned by hand, and it could not be satisfied AT ALL where the minting
# path does not run, so an operator was told by the deny message to run a command his
# machine cannot execute. It also bought less than it cost: entering the merge queue
# does not bypass review, because the required checks and the code-owner rule still
# decide whether the PR lands, whoever armed it. The App identity on a merge commit is
# an attribution property, not an authorization one, and the 2026-09-08 incident was
# an APPROVE -- the merge only fired because that APPROVE had already opened the gate.
#
# What actually needs guarding is a merge that SKIPS the queue. Every rule below keys
# on that and on nothing else, so no identity can fail one and no credential is needed
# to pass one.
merge_skips_queue() {
  # Exit 0 when a command on the line merges on the spot, 1 when every merge it can
  # read only arms auto-merge, and 3 when the line cannot be read. The caller denies on
  # anything that is not 1, so unreadable fails closed.
  #
  # TWO JUDGES, because neither alone is honest about what it can see.
  #
  # The PARSER reads the command the way the shell does: quotes, comments, separators,
  # flag position, wrapper words. That is what a regex cannot do, and four review
  # rounds of regexes produced thirteen ways through.
  #
  # But a parser cannot see a command hidden inside a string that something else
  # executes later -- `echo '...' | bash`, a here-doc fed to `sh`, `python3 -c`,
  # `$SHELL -c`, `awk BEGIN{system(...)}`, a git alias, a trap, `ssh host '...'`, a
  # script written to a file and run. Deciding that statically is not a solvable
  # problem, so the guard does not pretend to solve it.
  #
  # So there is a FLOOR: when a line names an interpreter AND its raw text carries a
  # `gh ... pr ... merge` the parser did not account for, the line is refused.
  #
  # That list of interpreters can never be complete -- `$SHELL -c`, `awk
  # BEGIN{system(...)}`, a git alias, a trap, `ssh host '...'` all walk past it, and a
  # review round found every one of them. Making the floor unconditional does close
  # them, and it was tried: it then refuses `git commit -m "docs: explain gh pr merge
  # --squash"`, `grep -rn 'gh pr merge'`, and a sed over the README. That is a worse
  # trade than the thing it buys, and it is the same kind of trade that made this whole
  # item necessary.
  #
  # The honest framing, because it decides what belongs here: this hook is a guardrail
  # against the obvious mistake, not a sandbox against a determined session. BUG-3402
  # was a session running `gh pr review --approve` because it seemed reasonable, not
  # anyone evading anything. A session that wants around a PreToolUse hook is already
  # around it -- the hook only ever sees what the session chooses to put in a Bash
  # command. What actually decides whether a PR lands is server-side: the required
  # checks, the code-owner rule and the push ruleset, none of which can be talked out
  # of it by any spelling. Rules here earn their place by catching a plausible slip
  # without costing anyone an ordinary day.
  #
  # The cost is a false deny on a line that pipes into an interpreter and merely quotes
  # the command. That is rare, it is loud rather than silent, and it is the right side
  # to be wrong on.
  GUARD_CMD="$CMD" python3 - <<'PY'
import os, re, shlex, sys

SEP = {';', '&&', '&', '||', '|', '(', ')'}
# `;`, `&&`, `||`, `&` and a newline end a pipeline. An interpreter in one pipeline
# says nothing about a quoted mention in the next one.
PIPELINE_END = {';', '&&', '||', '&'}
FALSE = {'false', '0', 'f', 'no', 'n', 'off'}
TAKES_VALUE = {
    '--body', '-b', '--body-file', '-F', '--subject', '-t',
    '--author-email', '-A', '--match-head-commit', '--repo', '-R',
}
NOT_A_MERGE = {'--disable-auto', '--help', '-h'}
WRAPPERS = {
    'env', 'command', 'builtin', 'exec', 'nohup', 'time', 'sudo', 'doas', 'xargs',
    'then', 'else', 'do', 'if', 'while', 'until', '{', '!', 'stdbuf', 'nice',
    'timeout', 'setsid', 'watch', 'ionice', 'chrt',
}
WRAPPER_FLAG_TAKES_VALUE = {'-u', '-n', '-I', '-i', '-o', '-s', '-k', '--signal', '-L', '-P'}
# Anything that can be handed a command as text.
OPAQUE = {'eval', 'sh', 'bash', 'zsh', 'ksh', 'dash', 'busybox', 'source', '.'}
# `.` and `source` mean an interpreter only in HEAD position. As a word anywhere on
# the line `.` is the current directory, which `grep -rn x .` puts there every day, so
# the floor's set leaves them out.
INTERPRETER = (OPAQUE - {'.', 'source'}) | {
    'python', 'python3', 'perl', 'ruby', 'node', 'osascript', 'xargs',
}
ASSIGN = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*=')
# The raw-text floor. Deliberately loose: it only has to notice that the words are there.
RAW_MERGE = re.compile(r'(^|[^A-Za-z0-9_-])gh[^;&|]{0,200}?\bpr\b[^;&|]{0,200}?\bmerge\b')

problems = set()
seen_merge = [False]
interp = [False]


def flag_positions(tokens):
    out, i, ended = [], 0, False
    while i < len(tokens):
        tok = tokens[i]
        if tok == '--':
            ended = True
            i += 1
            continue
        if ended:
            break
        out.append(i)
        if tok in TAKES_VALUE:
            i += 2
            continue
        i += 1
    return out


def applied_auto(tokens):
    for i in flag_positions(tokens):
        tok = tokens[i]
        if tok.startswith('--auto='):
            if tok.split('=', 1)[1].lower() in FALSE:
                continue
            return True
        if tok != '--auto':
            continue
        if len(tokens) > i + 2 and tokens[i + 1] == '=' \
                and tokens[i + 2].lower() in FALSE:
            continue
        return True
    return False


def cancels(tokens):
    return any(tokens[i] in NOT_A_MERGE for i in flag_positions(tokens))


def strip_head(tokens):
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if ASSIGN.match(tok) or tok.rsplit('/', 1)[-1] in WRAPPERS:
            i += 1
            # a wrapper's own flags and their values, and a bare duration
            while i < len(tokens):
                nxt = tokens[i]
                if nxt.startswith('-') and nxt != '--':
                    i += 1
                    if nxt in WRAPPER_FLAG_TAKES_VALUE and i < len(tokens):
                        i += 1
                    continue
                if nxt.isdigit():
                    i += 1
                    continue
                break
            continue
        break
    return tokens[i:]


def strip_comments(text):
    """Drop `#` comments the way shlex does, so the floor and the parser read the
    same bytes. Without this a line that merely documents the verb in a comment is
    refused, which is the opposite of what this change exists for."""
    out = []
    for line in text.split('\n'):
        quote, i = None, 0
        while i < len(line):
            ch = line[i]
            if quote:
                if ch == quote:
                    quote = None
            elif ch in '\'"':
                quote = ch
            elif ch == '#' and (i == 0 or line[i - 1] in ' \t'):
                line = line[:i]
                break
            i += 1
        out.append(line)
    return '\n'.join(out)


def merge_shape(tokens):
    try:
        pr = tokens.index('pr')
        return tokens.index('merge', pr) > pr
    except ValueError:
        return False


SUBST = re.compile(r'\$\([^()]*\)|`[^`]*`')
SHLEX_SPECIAL = ' ()|&;<>"\'`\t'


SUBST_BODIES = []


def _flatten_subst(m):
    inner = m.group(0)
    inner = inner[2:-1] if inner.startswith('$(') else inner[1:-1]
    # The body is a command in its own right. `out=$(gh pr merge 171 --squash)` runs
    # that merge, and the ordinary capture idioms -- `out=$(...)`, `if ! out=$(... 2>&1)`
    # -- are how a person writes it. Keep it for a scan of its own; flattening alone
    # made it invisible to both the parser and the floor.
    SUBST_BODIES.append(inner)
    for ch in SHLEX_SPECIAL:
        inner = inner.replace(ch, '\x1f')
    return '__SM_SUBST__' + inner


def del_bodies():
    del SUBST_BODIES[:]


def tokenize(line):
    # Collapse an unquoted command substitution to one placeholder BEFORE tokenizing.
    # `(` and `)` are segment separators, so `gh pr merge $(gh pr view ...) --auto`
    # split at the `$(` and the leading piece was judged with no --auto in sight -- an
    # armed, ordinary command refused with a message telling the operator to arm it.
    # Keep the substitution's CONTENT but neutralise every character shlex would
    # split or quote on, so it survives as ONE token. The parser must not split at the
    # `$(` -- that refused `gh pr merge $(gh pr view ...) --auto`, an armed command --
    # and the raw-text floor must still read `sh -c "$(printf 'gh pr merge ...')"`.
    line = SUBST.sub(_flatten_subst, line)
    lex = shlex.shlex(line, posix=True, punctuation_chars=True)
    lex.whitespace_split = True
    return list(lex)


def scan(text, depth=0):
    if depth > 3:
        problems.add('unreadable')
        return
    text = text.replace('\\\n', ' ')
    body, lines, skip_to = [], [], None
    for line in text.split('\n'):
        if skip_to is not None:
            if line.strip() == skip_to:
                skip_to = None
            else:
                body.append(line)                      # keep it; it may be a script
            continue
        here = re.search(r'<<-?\s*[\'"]?([A-Za-z_][A-Za-z0-9_]*)[\'"]?', line)
        if here:
            skip_to = here.group(1)
        lines.append(line)
    for line in lines:
        del SUBST_BODIES[:]
        try:
            tokens = tokenize(line)
        except ValueError:
            # An unbalanced quote in ordinary prose is not the guard's business, but a
            # line that looks like a merge is: the floor below decides, and this line
            # still contributes its interpreter words to the here-doc question.
            if RAW_MERGE.search(strip_comments(line)):
                problems.add('unreadable')
            if any(w in line for w in INTERPRETER):
                interp[0] = True
            continue
        bodies, _ = list(SUBST_BODIES), del_bodies()
        segment, pipeline = [], []
        for tok in tokens + [';']:
            if tok in SEP:
                inspect(segment, depth)
                pipeline.extend(segment)
                segment = []
                if tok in PIPELINE_END:
                    judge_pipeline(pipeline)
                    pipeline = []
            else:
                segment.append(tok)
        judge_pipeline(pipeline)
        for inner in bodies:
            scan(inner, depth + 1)
    if body:
        # a here-doc body reaches an interpreter only when the line had one
        if interp[0]:
            scan('\n'.join(body), depth + 1)


def judge_pipeline(tokens):
    """The floor. A parser cannot see a command inside a string that something else
    runs later, so when ONE PIPELINE both names an interpreter and carries a raw
    `gh ... pr ... merge` the parser did not account for, the pipeline is refused.

    Scoping this to the pipeline rather than the line matters: `bash tests/run-all.sh
    && grep -rn 'gh pr merge' plugin/` is two unrelated commands, and this repository's
    own tests grep that literal.

    The cost is that `echo '...' > f.sh; bash f.sh` passes, because writing the text in
    one pipeline and running it in the next is structurally the same shape. There is no
    rule that keeps one and drops the other. Writing a merge to a file and running it is
    something a session does on purpose; grepping for the string is something everyone
    does by Tuesday, and this hook exists to catch the accident, not the intent.

    The same trade covers `X='gh pr merge 171 --squash'; eval "$X"` and
    `printf '...' > f.sh; sh f.sh`: text written in one pipeline and run in the next.
    They are pinned as allowed in the tests so the trade stays visible to whoever
    re-scopes this next."""
    if not tokens:
        return
    if not any(t.rsplit('/', 1)[-1] in INTERPRETER for t in tokens):
        return
    interp[0] = True          # before the short-circuit: here-doc descent reads this
    if seen_merge[0]:
        return
    if RAW_MERGE.search(strip_comments(' '.join(tokens).replace('\x1f', ' '))):
        problems.add('unreadable')


def inspect(segment, depth):
    core = strip_head(segment)
    if not core:
        return
    head = core[0].rsplit('/', 1)[-1]
    if head in OPAQUE:
        for tok in core[1:]:
            if len(tok.split()) > 1:
                scan(tok, depth + 1)
        return
    if not merge_shape(core):
        return
    if head != 'gh':
        # Only a head we cannot name is suspicious. `grep -rn pr merge`, `ls pr merge`
        # and `echo pr merge` are ordinary commands that happen to carry both words, so
        # a concrete command word returns clean. A head of `pr` is gh's own subcommand
        # standing where the command should be, which is what `$(echo gh) pr merge`
        # leaves behind; a head that is not a plain word is `$G pr merge`.
        # The substitution placeholder is a command we could not read, not a name.
        if head == 'pr' or head.startswith('__SM_SUBST__') \
                or not head.replace('-', '').replace('_', '').isalnum():
            problems.add('unreadable')
            return
        # `op run -- gh pr merge`, `caffeinate gh pr merge`: a wrapper this list does
        # not know, with a real gh behind it. The merge is there; we just cannot name
        # the thing in front. `grep -rn pr merge` carries no gh token and stays clean.
        try:
            if any(t.rsplit('/', 1)[-1] == 'gh' for t in core[:core.index('pr')]):
                problems.add('unreadable')
        except ValueError:
            pass
        return
    seen_merge[0] = True
    if cancels(core):
        return
    if not applied_auto(core):
        problems.add('skips')


try:
    scan(os.environ.get('GUARD_CMD', ''))
except Exception:                                      # a bug here must not allow
    sys.exit(3)
if 'unreadable' in problems or 'skips' in problems:
    sys.exit(3)
sys.exit(7)                                            # the only status that allows
PY
}
# `gh pr review|merge` is the same verb with -R/--repo before or after `pr`
# (gh inherits those flags on the subcommand). A quoted `pr` is the same argv.
gh_pr() {
  _gf='(-[A-Za-z]|--[A-Za-z0-9-]+)(=|[[:space:]]+)[^[:space:]]+[[:space:]]+'
  printf '%s' "$CMD" | grep -qE "gh[[:space:]]+(${_gf})*['\"]?pr['\"]?[[:space:]]+(${_gf})*$1([[:space:]]|$)"
}
if gh_pr review; then
  deny "gh pr review is blocked: a session never submits a PR review under a human gh identity (BUG-3402). --approve, --request-changes and --comment are all blocked. Codeowner approval is the Waffle TOTP tap; the AI review comes from /review-pr."
fi
if printf '%s' "$CMD" | grep -qE 'gh[[:space:]]+api[^|&;]*[/[:space:]]graphql([[:space:]]|$)' \
  && printf '%s' "$CMD" | grep -qE '((add|submit|dismiss)PullRequestReview([^A-Za-z]|$)|(^|[[:space:]])--input([[:space:]]|=)|(-f|-F|--field|--raw-field)(=|[[:space:]]+)query=@)'; then
  deny "Casting a PR review through 'gh api graphql' (addPullRequestReview/submitPullRequestReview) is blocked (BUG-3402): a session never submits a review. Use /review-pr; codeowner approval is the Waffle TOTP tap."
fi
if printf '%s' "$CMD" | grep -qE 'gh[[:space:]]+api[^|&;]*pulls/[^|&;/]+/reviews'; then
  # PUT too: .../reviews/<id>/dismissals is a dismissal, which is a review write.
  if printf '%s' "$CMD" | grep -qE '(-[Xx][[:space:]]*([Pp][Oo][Ss][Tt]|[Pp][Uu][Tt])|-[Xx]=([Pp][Oo][Ss][Tt]|[Pp][Uu][Tt])|--method[[:space:]=]+([Pp][Oo][Ss][Tt]|[Pp][Uu][Tt])|(^|[[:space:]])(-f|-F|--field|--raw-field|--input)([[:space:]]|=))'; then
    deny "Posting a PR review through 'gh api .../reviews' is blocked (BUG-3402): a session never submits an approving or blocking review under a human gh identity. Use /review-pr; codeowner approval is the Waffle TOTP tap."
  fi
fi
# The review endpoints, like the merge endpoint below, are denied by URL rather than by
# client. BUG-3402's incident was a codeowner APPROVE, and every rule naming `gh` left
# `curl` a clear path to the same endpoint. Identity used to stand behind that gap; it
# no longer does, so the gap closes here.
if printf '%s' "$CMD" | grep -qE '[Aa][Pp][Ii]\.[Gg][Ii][Tt][Hh][Uu][Bb]\.[Cc][Oo][Mm]\.?(:[0-9]+)?/repos/[^[:space:]"'\'']*/pulls/[^[:space:]"'\''/]+/reviews' \
  && printf '%s' "$CMD" | grep -qE '(-X[[:space:]]*[PpDd]|--request[[:space:]=]+[PpDd]|--method[[:space:]=]+[PpDd]|(^|[[:space:]])(-d|--data|--data-raw|--data-binary|--data-urlencode|--json|--post-data|--post-file|--body-data|--body-file|-T|--upload-file|-f|-F|--field|--raw-field|--input)([[:space:]]|=))'; then
  deny "Submitting or dismissing a PR review through the .../pulls/<n>/reviews endpoint is blocked whichever client sends it (BUG-3402): a session never reviews under a human identity. Use /review-pr; codeowner approval is the Waffle TOTP tap."
fi
if printf '%s' "$CMD" | grep -qE '[Aa][Pp][Ii]\.[Gg][Ii][Tt][Hh][Uu][Bb]\.[Cc][Oo][Mm]\.?(:[0-9]+)?/graphql' \
  && printf '%s' "$CMD" | grep -qE '(add|submit|dismiss)PullRequestReview([^A-Za-z]|$)'; then
  deny "Casting a PR review through the GraphQL endpoint is blocked whichever client sends it (BUG-3402). Use /review-pr; codeowner approval is the Waffle TOTP tap."
fi
# A graphql body the guard cannot read is a body the guard cannot clear. `-f
# query="$(cat r.gql)"` and `-f query="$Q"` hide the mutation name from every check
# above exactly as `query=@file` does, and that spelling is already denied.
if printf '%s' "$CMD" | grep -qE 'gh[[:space:]]+api[^|&;]*[/[:space:]]graphql([[:space:]]|$)' \
  && printf '%s' "$CMD" | grep -qE '(-f|-F|--field|--raw-field)(=|[[:space:]]+)query=["'\'']?(\$\(|`|\$[A-Za-z_{])'; then
  deny "A 'gh api graphql' body built from a command substitution or a variable cannot be inspected, so it is blocked the same way query=@file is (BUG-3402). Put the mutation on the command line, or use /review-pr and /merge."
fi
if gh_pr merge; then
  printf '%s' "$CMD" | grep -qE -- '--admin([[:space:]=]|$)' && deny "Admin merges bypass the merge queue. Use 'gh pr merge --auto', or /merge."
fi
# The TOKENIZER decides, not this grep. Gating the queue rule on a literal `gh ... pr
# ... merge` adjacency meant a merge whose command word was assembled -- `$(echo gh) pr
# merge`, `G=gh; $G pr merge` -- never reached the rule at all. The gate below is only
# a cheap way to skip the interpreter on the overwhelming majority of commands that
# cannot possibly be a PR merge; anything carrying the bare word goes to the parser,
# which names an unreadable merge command rather than waving it through.
if printf '%s' "$CMD" | grep -qE '(^|[^A-Za-z-])merge([^A-Za-z-]|$)'; then
  # Without --auto, `gh pr merge` merges on the spot if the PR is mergeable, which
  # skips the queue exactly as --admin does. With --auto it only ARMS auto-merge, and
  # the required checks plus the code-owner rule still decide. Arming is the sanctioned
  # entry and needs no credential of its own.
  # Deny on 0 (a merge skips the queue) and on anything that is not 1 (the line could
  # not be read, or the interpreter is missing). Only a clean parse allows.
  merge_skips_queue; _msq=$?
  # 7 is the only status that allows. Python exits 1 on an unhandled exception and the
  # shell exits 127 when the interpreter is missing, so allowing on anything common
  # would let a bug in this helper wave a merge through.
  [ "$_msq" -eq 7 ] \
    || deny "this 'gh pr merge' merges immediately and skips the merge queue, or could not be read. Arm it instead: 'gh pr merge --auto --squash', or run /merge, which arms it for you."
fi
# GraphQL: mergePullRequest merges on the spot. enablePullRequestAutoMerge and
# enqueuePullRequest are queue entry, the GraphQL spelling of --auto, and are allowed.
if printf '%s' "$CMD" | grep -qE '[Aa][Pp][Ii]\.[Gg][Ii][Tt][Hh][Uu][Bb]\.[Cc][Oo][Mm]\.?(:[0-9]+)?/graphql' \
  && printf '%s' "$CMD" | grep -qE 'mergePullRequest([^A-Za-z]|$)'; then
  deny "Merging through the GraphQL endpoint skips the merge queue, whichever client sends it. Arm it instead: 'gh pr merge --auto --squash', enablePullRequestAutoMerge, or /merge."
fi
if printf '%s' "$CMD" | grep -qE 'gh[[:space:]]+api[^|&;]*[/[:space:]]graphql([[:space:]]|$)' \
  && printf '%s' "$CMD" | grep -qE 'mergePullRequest([^A-Za-z]|$)'; then
  deny "'gh api graphql' with mergePullRequest merges immediately and skips the merge queue. Arm it instead: 'gh pr merge --auto --squash', enablePullRequestAutoMerge, or /merge."
fi
if printf '%s' "$CMD" | grep -qE 'gh[[:space:]]+api[^|&;]*pulls/[^|&;/]+/merge' \
  && printf '%s' "$CMD" | grep -qE '(-[Xx][[:space:]]*[Pp][Uu][Tt]|-[Xx]=[Pp][Uu][Tt]|--method[[:space:]]+[Pp][Uu][Tt]|--method=[Pp][Uu][Tt])'; then
  deny "'gh api .../pulls/<n>/merge' (PUT) merges immediately and skips the merge queue. Arm it instead: 'gh pr merge --auto --squash', or /merge."
fi
# The merge endpoint skips the queue whoever calls it. The rules above name `gh`;
# this one names the URL, so curl/wget/http reach it too. Identity used to backstop
# this gap and no longer does, so it is closed here rather than left to the client.
if printf '%s' "$CMD" | grep -qE '[Aa][Pp][Ii]\.[Gg][Ii][Tt][Hh][Uu][Bb]\.[Cc][Oo][Mm]\.?(:[0-9]+)?/repos/[^[:space:]"'\'']*/pulls/[^[:space:]"'\''/]+/merge' \
  && printf '%s' "$CMD" | grep -qE '(-[Xx][[:space:]]*[Pp][Uu][Tt]|-[Xx]=[Pp][Uu][Tt]|--request[[:space:]=]+[Pp][Uu][Tt]|--method[[:space:]=]+[Pp][Uu][Tt]|(^|[[:space:]])(-T|--upload-file|--json|--post-data|--post-file|--body-data|--body-file)([[:space:]]|=))'; then
  deny "A PUT to the pulls/<n>/merge endpoint merges immediately and skips the merge queue, whichever client sends it. Arm it instead: 'gh pr merge --auto --squash', or /merge."
fi
if printf '%s' "$CMD" | grep -qE '(wrangler|npm run)[[:space:]]+(pages[[:space:]]+)?deploy'; then
  deny "Deploys run only from CI after the gates. Land through the queue and let the pipeline ship it."
fi
exit 0
