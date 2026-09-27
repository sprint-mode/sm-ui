import e, { useEffect as t, useState as n } from "react";
import { jsx as r, jsxs as i } from "react/jsx-runtime";
//#region src/SiteHeader.tsx
function a() {
	try {
		var e = localStorage.getItem("sm-theme");
		if (e === "light" || e === "dark") return e;
	} catch {}
	return "auto";
}
function o(e) {
	try {
		e === "auto" ? localStorage.removeItem("sm-theme") : localStorage.setItem("sm-theme", e);
	} catch {}
}
function s(e) {
	return e === "dark" ? !0 : e === "light" ? !1 : typeof window < "u" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : !1;
}
function c(e) {
	if (!(typeof document > "u")) {
		var t = e === "auto" ? s("auto") ? "dark" : "light" : e;
		document.documentElement.setAttribute("data-theme", t);
	}
}
function l() {
	var e = n(a), r = e[0], i = e[1], l = n(function() {
		return s(r);
	}), u = l[0], d = l[1];
	return t(function() {
		c(r), o(r), d(s(r));
	}, [r]), t(function() {
		if (r === "auto" && !(typeof window > "u" || !window.matchMedia)) {
			var e = window.matchMedia("(prefers-color-scheme: dark)"), t = function(e) {
				d(e.matches), c("auto");
			};
			return e.addEventListener ? e.addEventListener("change", t) : e.addListener && e.addListener(t), function() {
				e.removeEventListener ? e.removeEventListener("change", t) : e.removeListener && e.removeListener(t);
			};
		}
	}, [r]), {
		mode: r,
		isDark: u,
		toggle: function() {
			i(function(e) {
				return e === "auto" ? "dark" : e === "dark" ? "light" : "auto";
			});
		}
	};
}
function u(e, t, n) {
	return e + "/portals/" + encodeURIComponent(t) + "/" + n;
}
var d = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 16,
	height: 16,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
};
function f(e) {
	return /* @__PURE__ */ i("svg", {
		...d,
		...e,
		children: [
			/* @__PURE__ */ r("circle", {
				cx: "12",
				cy: "12",
				r: "5"
			}),
			/* @__PURE__ */ r("line", {
				x1: "12",
				y1: "1",
				x2: "12",
				y2: "3"
			}),
			/* @__PURE__ */ r("line", {
				x1: "12",
				y1: "21",
				x2: "12",
				y2: "23"
			}),
			/* @__PURE__ */ r("line", {
				x1: "4.22",
				y1: "4.22",
				x2: "5.64",
				y2: "5.64"
			}),
			/* @__PURE__ */ r("line", {
				x1: "18.36",
				y1: "18.36",
				x2: "19.78",
				y2: "19.78"
			}),
			/* @__PURE__ */ r("line", {
				x1: "1",
				y1: "12",
				x2: "3",
				y2: "12"
			}),
			/* @__PURE__ */ r("line", {
				x1: "21",
				y1: "12",
				x2: "23",
				y2: "12"
			}),
			/* @__PURE__ */ r("line", {
				x1: "4.22",
				y1: "19.78",
				x2: "5.64",
				y2: "18.36"
			}),
			/* @__PURE__ */ r("line", {
				x1: "18.36",
				y1: "5.64",
				x2: "19.78",
				y2: "4.22"
			})
		]
	});
}
function p(e) {
	return /* @__PURE__ */ r("svg", {
		...d,
		...e,
		children: /* @__PURE__ */ r("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })
	});
}
function m(e) {
	return /* @__PURE__ */ i("svg", {
		...d,
		...e,
		children: [
			/* @__PURE__ */ r("rect", {
				x: "3",
				y: "4",
				width: "18",
				height: "12",
				rx: "1"
			}),
			/* @__PURE__ */ r("line", {
				x1: "7",
				y1: "20",
				x2: "17",
				y2: "20"
			}),
			/* @__PURE__ */ r("line", {
				x1: "9",
				y1: "16",
				x2: "9",
				y2: "20"
			}),
			/* @__PURE__ */ r("line", {
				x1: "15",
				y1: "16",
				x2: "15",
				y2: "20"
			})
		]
	});
}
var h = ".smsh{background:var(--bg-card,var(--bg));border-bottom:1px solid var(--border);position:sticky;top:0;z-index:9000;flex-shrink:0}.smsh__inner{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 20px;gap:16px;max-width:var(--max-w,80rem);margin:0 auto}.smsh__brand{display:flex;align-items:baseline;gap:8px;text-decoration:none;color:var(--foreground);flex-shrink:0;min-width:0}.smsh__logo{height:26px;width:auto;display:block}.smsh__name{font-size:17px;font-weight:500;letter-spacing:-0.3px}.smsh__byline{font-size:13px;font-weight:400;color:var(--muted);white-space:nowrap}.smsh__right{display:flex;align-items:center;gap:10px}.smsh__nav{display:flex;align-items:center;gap:20px;margin-right:6px}.smsh__nav a{font-size:14px;text-decoration:none;font-family:var(--font);color:var(--muted);white-space:nowrap}.smsh__nav a[data-active=\"true\"]{color:var(--foreground);font-weight:600}.smsh__pill{height:34px;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:0 10px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);font-family:var(--font);flex-shrink:0;transition:border-color .2s;box-sizing:border-box}.smsh__pill:hover{border-color:var(--accent)}.smsh__pill-label{font-size:11px;font-weight:500;letter-spacing:.3px}.smsh__signin{display:flex;align-items:center;height:34px;padding:0 14px;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;font-weight:600;text-decoration:none;font-family:var(--font);flex-shrink:0;box-sizing:border-box;white-space:nowrap}.smsh__signin:hover{opacity:.9}.smsh__dd{position:relative}.smsh__ddbtn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-size:14px;font-family:var(--font);color:var(--muted);white-space:nowrap}.smsh__ddbtn[aria-expanded=\"true\"],.smsh__ddbtn:hover{color:var(--foreground)}.smsh__ddbtn:focus-visible,.smsh__menubtn:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}.smsh__ddpanel{position:absolute;top:calc(100% + 12px);left:-12px;min-width:300px;background:var(--bg-card,var(--bg));border:1px solid var(--border);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.14);padding:6px;z-index:9001}.smsh__ddpanel[hidden],.smsh__mnav[hidden]{display:none}.smsh__ddpanel a{display:block;padding:9px 10px;border-radius:7px;text-decoration:none;color:var(--foreground);font-size:14px;font-weight:500;font-family:var(--font);white-space:normal}.smsh__ddpanel a:hover,.smsh__ddpanel a:focus-visible{background:var(--bg-subtle,rgba(0,0,0,.04));outline:none}.smsh__desc{display:block;font-size:12px;font-weight:400;color:var(--muted);margin-top:2px}.smsh__menubtn{all:unset;display:none;cursor:pointer;font-size:13px;font-family:var(--font);color:var(--foreground);border:1px solid var(--border);border-radius:7px;height:34px;padding:0 10px;box-sizing:border-box;align-items:center}.smsh__mnav{border-top:1px solid var(--border);padding:8px 14px 14px;background:var(--bg-card,var(--bg))}.smsh__mnav a{display:block;padding:9px 0;text-decoration:none;color:var(--foreground);font-size:15px;font-family:var(--font)}.smsh__mgroup{font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);padding:10px 0 2px}.smsh__mnav .smsh__msub{padding-left:10px}@media (max-width:680px){.smsh__inner{padding:0 14px;gap:10px}.smsh__byline{display:none}.smsh__nav{display:none}.smsh__menubtn{display:inline-flex}.smsh__pill-label{display:none}.smsh__pill{padding:0 9px}}";
function g(a) {
	var o = l(), s = a.navLinks || [], c = a.byline === void 0 ? "by Sprint Mode" : a.byline, d = a.homeHref || "/", g = a.signInLabel || "Sign in", _ = n(a.config || null), v = _[0], y = _[1];
	t(function() {
		if (a.config) {
			y(a.config);
			return;
		}
		if (a.subdomain && !(typeof fetch > "u")) {
			var e = a.apiBase || "https://api.sprintmode.ai", t = !1;
			return fetch(e + "/api/portal/config?subdomain=" + encodeURIComponent(a.subdomain)).then(function(e) {
				return e.json();
			}).then(function(e) {
				!t && e && e.ok && e.config && y(e.config);
			}).catch(function() {}), function() {
				t = !0;
			};
		}
	}, [
		a.subdomain,
		a.apiBase,
		a.config
	]), t(function() {
		!v || typeof document > "u" || (v.brand_color && document.documentElement.style.setProperty("--accent", String(v.brand_color)), v.brand_tint && document.documentElement.style.setProperty("--accent-10", String(v.brand_tint)));
	}, [v]);
	var b = a.apiBase || "https://api.sprintmode.ai", x = a.subdomain, S = v && v.name || "Sprint Mode", C = v && v.logo_horizontal_url || (x ? u(b, x, "logo_horizontal.png") : null), w = v && v.logo_dark_url || (x ? u(b, x, "logo_horizontal_dark.png") : null), T = o.isDark && w || C, E = n(!0), D = E[0], O = E[1];
	t(function() {
		O(!0);
	}, [T]);
	var k = o.mode === "auto" ? "Auto" : o.mode === "dark" ? "Dark" : "Light", A = o.mode === "auto" ? "Theme: System" : o.mode === "dark" ? "Theme: Dark" : "Theme: Light", j = typeof window < "u" ? window.location.pathname : "", M = o.mode === "light" ? f : o.mode === "dark" ? p : m, N = n(null), P = N[0], F = N[1], I = n(!1), L = I[0], R = I[1], z = e.useRef(null);
	t(function() {
		if (!P && !L) return;
		function e(e) {
			z.current && !z.current.contains(e.target) && (F(null), R(!1));
		}
		function t(e) {
			e.key === "Escape" && (F(null), R(!1));
		}
		return document.addEventListener("mousedown", e), document.addEventListener("keydown", t), function() {
			document.removeEventListener("mousedown", e), document.removeEventListener("keydown", t);
		};
	}, [P, L]);
	var B = s.length > 0 && a.mobileMenu === !0;
	return /* @__PURE__ */ i("header", {
		className: "smsh",
		ref: z,
		children: [
			/* @__PURE__ */ r("style", { dangerouslySetInnerHTML: { __html: h } }),
			/* @__PURE__ */ i("div", {
				className: "smsh__inner",
				children: [/* @__PURE__ */ i("a", {
					href: d,
					className: "smsh__brand",
					children: [T && D ? /* @__PURE__ */ r("img", {
						className: "smsh__logo",
						src: T,
						alt: S,
						onError: function() {
							O(!1);
						}
					}) : /* @__PURE__ */ r("span", {
						className: "smsh__name",
						children: S
					}), c ? /* @__PURE__ */ r("span", {
						className: "smsh__byline",
						children: c
					}) : null]
				}), /* @__PURE__ */ i("div", {
					className: "smsh__right",
					children: [
						s.length > 0 ? /* @__PURE__ */ r("nav", {
							className: "smsh__nav",
							children: s.map(function(e) {
								if (e.items && e.items.length > 0) {
									var t = "smsh-dd-" + e.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), n = P === e.label;
									return /* @__PURE__ */ i("div", {
										className: "smsh__dd",
										children: [/* @__PURE__ */ i("button", {
											type: "button",
											className: "smsh__ddbtn",
											"aria-expanded": n ? "true" : "false",
											"aria-controls": t,
											onClick: function() {
												F(n ? null : e.label);
											},
											children: [e.label, /* @__PURE__ */ r("svg", {
												width: "10",
												height: "10",
												viewBox: "0 0 24 24",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "2.5",
												"aria-hidden": "true",
												children: /* @__PURE__ */ r("polyline", { points: "6 9 12 15 18 9" })
											})]
										}), /* @__PURE__ */ r("div", {
											className: "smsh__ddpanel",
											id: t,
											hidden: !n,
											children: e.items.map(function(e) {
												return /* @__PURE__ */ i("a", {
													href: e.href,
													...e.external ? {
														target: "_blank",
														rel: "noopener noreferrer"
													} : {},
													children: [e.label, e.description ? /* @__PURE__ */ r("span", {
														className: "smsh__desc",
														children: e.description
													}) : null]
												}, e.href);
											})
										})]
									}, e.label);
								}
								var a = !e.external && j === e.href;
								return /* @__PURE__ */ r("a", {
									href: e.href,
									"data-active": a ? "true" : "false",
									...e.external ? {
										target: "_blank",
										rel: "noopener noreferrer"
									} : {},
									children: e.label
								}, e.href);
							})
						}) : null,
						/* @__PURE__ */ i("button", {
							className: "smsh__pill",
							onClick: o.toggle,
							"aria-label": A,
							title: A,
							children: [/* @__PURE__ */ r(M, {}), /* @__PURE__ */ r("span", {
								className: "smsh__pill-label",
								children: k
							})]
						}),
						a.signInHref ? /* @__PURE__ */ r("a", {
							className: "smsh__signin",
							href: a.signInHref,
							children: g
						}) : null,
						a.rightSlot,
						B ? /* @__PURE__ */ r("button", {
							type: "button",
							className: "smsh__menubtn",
							"aria-expanded": L ? "true" : "false",
							"aria-controls": "smsh-mnav",
							onClick: function() {
								R(!L);
							},
							children: "Menu"
						}) : null
					]
				})]
			}),
			B ? /* @__PURE__ */ r("nav", {
				className: "smsh__mnav",
				id: "smsh-mnav",
				hidden: !L,
				"aria-label": "Menu",
				children: s.map(function(e) {
					return e.items && e.items.length > 0 ? /* @__PURE__ */ i("div", { children: [/* @__PURE__ */ r("div", {
						className: "smsh__mgroup",
						children: e.label
					}), e.items.map(function(e) {
						return /* @__PURE__ */ r("a", {
							className: "smsh__msub",
							href: e.href,
							...e.external ? {
								target: "_blank",
								rel: "noopener noreferrer"
							} : {},
							children: e.label
						}, e.href);
					})] }, e.label) : /* @__PURE__ */ r("a", {
						href: e.href,
						...e.external ? {
							target: "_blank",
							rel: "noopener noreferrer"
						} : {},
						children: e.label
					}, e.href);
				})
			}) : null
		]
	});
}
//#endregion
//#region src/site-helpers.ts
var _ = "(function(){try{var t=localStorage.getItem('sm-theme');var d=(t==='dark'||t==='light')?t:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',d);}catch(e){}})();";
function v() {
	if (!(typeof document > "u")) {
		var e = null;
		try {
			e = localStorage.getItem("sm-theme");
		} catch {}
		var t = e === "dark" || e === "light" ? e : typeof window < "u" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		document.documentElement.setAttribute("data-theme", t);
	}
}
function y(e, t) {
	return e ? e + " — " + t : t;
}
function b(e, t) {
	typeof document < "u" && (document.title = y(e, t));
}
function x(e, n) {
	t(function() {
		b(e, n);
	}, [e, n]);
}
//#endregion
export { x as a, _ as i, y as n, g as o, b as r, v as t };
