// Nikola QA findings 19, 28, 40, 51, 54 on the SiteHeader (FEAT-4168).
import React from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "../SiteHeader.tsx";
import { siteThemeSnippet } from "../site-helpers.ts";

function installLocalStorage() {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

const CONFIG = {
  subdomain: "website",
  name: "Sprint Mode",
  brand_color: "#e4562a",
  brand_tint: "#f6e3dc",
  logo_horizontal_url: "/brand/sm-lockup.svg",
  logo_dark_url: "/brand/sm-lockup-dark.svg",
};

const NAV = [
  {
    label: "Products",
    href: "/#products",
    items: [
      { label: "Signal", href: "/signal/" },
      { label: "PrivacyAI", href: "https://privacyai.com", external: true },
    ],
  },
  {
    label: "Platform",
    href: "/platform/",
    items: [
      { label: "The Platform", href: "/platform/" },
      { label: "Studios", href: "/studios/" },
      { label: "Foundry", href: "/platform/foundry/" },
    ],
  },
  {
    label: "Invest",
    href: "/invest/",
    items: [
      { label: "Get to know Sprint Mode", href: "/invest/" },
      { label: "Introduce yourself", href: "/invest/#ask" },
    ],
  },
  { label: "Library", href: "/library/" },
];

beforeEach(() => {
  installLocalStorage();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.removeAttribute("data-sm-theme-mode");
  document.documentElement.style.removeProperty("--accent");
  document.documentElement.style.removeProperty("--accent-10");
  document.body.innerHTML = "";
});

describe("Nikola 19: stored theme hydrates without a mismatch", () => {
  for (const stored of ["dark", "light"]) {
    it("sm-theme=" + stored + ": no recoverable hydration error, then the pill shows it", async () => {
      // Server: no stored theme is visible (no localStorage on the server).
      const html = renderToString(<SiteHeader subdomain="website" config={CONFIG} navLinks={NAV} />);
      localStorage.setItem("sm-theme", stored);

      const container = document.createElement("div");
      container.innerHTML = html;
      document.body.appendChild(container);

      const recoverable = vi.fn();
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      let root;
      await act(async () => {
        root = hydrateRoot(container, <SiteHeader subdomain="website" config={CONFIG} navLinks={NAV} />, {
          onRecoverableError: recoverable,
        });
      });
      const hydrationLogs = consoleError.mock.calls.filter((c) => /hydrat/i.test(String(c[0])));
      consoleError.mockRestore();

      expect(recoverable).not.toHaveBeenCalled();
      expect(hydrationLogs).toEqual([]);
      const label = stored === "dark" ? "Dark" : "Light";
      const pill = container.querySelector(".smsh__pill");
      expect(pill.getAttribute("aria-label")).toBe("Theme: " + label);
      expect(pill.querySelector(".smsh__pill-label").textContent).toBe(label);
      // the stored choice survives hydration (it is not overwritten by 'auto')
      expect(localStorage.getItem("sm-theme")).toBe(stored);
      expect(document.documentElement.getAttribute("data-theme")).toBe(stored);
      // the wordmark follows the stored theme after hydration
      const logo = container.querySelector(".smsh__logo");
      expect(logo.getAttribute("src")).toBe(stored === "dark" ? CONFIG.logo_dark_url : CONFIG.logo_horizontal_url);
      act(() => root.unmount());
    });
  }
});

describe("Nikola 54: prerendered pill shows the stored theme before hydration", () => {
  it("server HTML carries all three modes for CSS to pick from", () => {
    const html = renderToString(<SiteHeader subdomain="website" config={CONFIG} />);
    expect(html).toContain('data-mode="auto"');
    expect(html).toContain('data-mode="dark"');
    expect(html).toContain('data-mode="light"');
    expect(html).toContain("html[data-sm-theme-mode=\"dark\"] .smsh__pm[data-mode=\"dark\"]");
  });

  it("the snippet records the chosen mode on <html>", () => {
    localStorage.setItem("sm-theme", "dark");
    new Function(siteThemeSnippet)();
    expect(document.documentElement.getAttribute("data-sm-theme-mode")).toBe("dark");
    localStorage.removeItem("sm-theme");
    new Function(siteThemeSnippet)();
    expect(document.documentElement.getAttribute("data-sm-theme-mode")).toBe("auto");
  });

  it("server HTML scopes the brand accent to the header, so Sign in is not the default blue", () => {
    const html = renderToString(<SiteHeader subdomain="website" config={CONFIG} signInHref="/auth/login" />);
    expect(html).toMatch(/<header class="smsh"[^>]*style="--accent:#e4562a;--accent-10:#f6e3dc"/);
  });
});

describe("Nikola 40: the pill's name matches its label", () => {
  it("Auto is named Theme: Auto", () => {
    render(<SiteHeader subdomain="website" config={CONFIG} />);
    const pill = screen.getByRole("button", { name: "Theme: Auto" });
    expect(pill).toHaveAttribute("title", "Theme: Auto");
    expect(pill.textContent).toBe("Auto");
  });
});

describe("Nikola 28: the current section is marked", () => {
  function groupBtn(name) {
    return screen.getByRole("button", { name });
  }

  it("prerender with currentPath marks the group and the item", () => {
    const html = renderToString(
      <SiteHeader subdomain="website" config={CONFIG} navLinks={NAV} currentPath="/platform/foundry/" />,
    );
    document.body.innerHTML = html;
    const btns = Array.from(document.querySelectorAll(".smsh__ddbtn"));
    const active = btns.filter((b) => b.getAttribute("data-active") === "true").map((b) => b.textContent);
    expect(active).toEqual(["Platform"]);
    const cur = Array.from(document.querySelectorAll('a[aria-current="page"]')).map((a) => a.getAttribute("href"));
    expect(cur).toEqual(["/platform/foundry/"]);
  });

  it("without currentPath it reads the location after mount (direct load)", () => {
    window.history.pushState({}, "", "/studios/");
    render(<SiteHeader subdomain="website" config={CONFIG} navLinks={NAV} mobileMenu />);
    expect(groupBtn(/Platform/)).toHaveAttribute("data-active", "true");
    expect(groupBtn(/Products/)).toHaveAttribute("data-active", "false");
    const cur = Array.from(document.querySelectorAll('a[aria-current="page"]')).map((a) => a.getAttribute("href"));
    // desktop panel item and phone menu item
    expect(cur).toEqual(["/studios/", "/studios/"]);
    window.history.pushState({}, "", "/");
  });

  it("a hash link never marks the page; the home page marks nothing", () => {
    render(<SiteHeader subdomain="website" config={CONFIG} navLinks={NAV} currentPath="/invest/" />);
    expect(groupBtn(/Invest/)).toHaveAttribute("data-active", "true");
    const cur = Array.from(document.querySelectorAll('a[aria-current="page"]')).map((a) => a.getAttribute("href"));
    expect(cur).toEqual(["/invest/"]);
    cleanup();
    render(<SiteHeader subdomain="website" config={CONFIG} navLinks={NAV} currentPath="/" />);
    expect(document.querySelectorAll('[data-active="true"]').length).toBe(0);
    expect(document.querySelectorAll('[aria-current]').length).toBe(0);
  });

  it("plain links get aria-current and data-active, trailing slash ignored", () => {
    render(<SiteHeader subdomain="website" config={CONFIG} navLinks={NAV} currentPath="/library" />);
    const link = screen.getByRole("link", { name: "Library" });
    expect(link).toHaveAttribute("aria-current", "page");
    expect(link).toHaveAttribute("data-active", "true");
  });
});

describe("Nikola 51: a theme change in another tab reaches this one", () => {
  function storageEvent(key, newValue) {
    const e = new Event("storage");
    Object.defineProperty(e, "key", { value: key });
    Object.defineProperty(e, "newValue", { value: newValue });
    return e;
  }

  it("follows sm-theme storage events and ignores other keys", () => {
    render(<SiteHeader subdomain="website" config={CONFIG} />);
    const pill = screen.getByRole("button", { name: /Theme:/ });

    act(() => { window.dispatchEvent(storageEvent("sm-theme", "dark")); });
    expect(pill).toHaveAttribute("aria-label", "Theme: Dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    act(() => { window.dispatchEvent(storageEvent("other-key", "light")); });
    expect(pill).toHaveAttribute("aria-label", "Theme: Dark");

    act(() => { window.dispatchEvent(storageEvent("sm-theme", "light")); });
    expect(pill).toHaveAttribute("aria-label", "Theme: Light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => { window.dispatchEvent(storageEvent("sm-theme", null)); });
    expect(pill).toHaveAttribute("aria-label", "Theme: Auto");
  });

  it("stops listening on unmount", () => {
    const { unmount } = render(<SiteHeader subdomain="website" config={CONFIG} />);
    unmount();
    act(() => { window.dispatchEvent(storageEvent("sm-theme", "dark")); });
    expect(document.documentElement.getAttribute("data-theme")).not.toBe("dark");
  });

  it("local clicks still cycle and persist", () => {
    render(<SiteHeader subdomain="website" config={CONFIG} />);
    fireEvent.click(screen.getByRole("button", { name: /Theme:/ }));
    expect(localStorage.getItem("sm-theme")).toBe("dark");
  });
});
