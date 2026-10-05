import e, { useEffect as t, useState as n } from "react";
import { Fragment as r, jsx as i, jsxs as a } from "react/jsx-runtime";
//#region src/SiteHeader.tsx
function o() {
	try {
		return u(localStorage.getItem("sm-theme"));
	} catch {}
	return "auto";
}
function s(e) {
	try {
		e === "auto" ? localStorage.removeItem("sm-theme") : localStorage.setItem("sm-theme", e);
	} catch {}
}
function c(e) {
	return e === "dark" ? !0 : e === "light" ? !1 : typeof window < "u" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : !1;
}
function l(e) {
	if (!(typeof document > "u")) {
		var t = e === "auto" ? c("auto") ? "dark" : "light" : e;
		document.documentElement.setAttribute("data-theme", t), document.documentElement.setAttribute("data-sm-theme-mode", e);
	}
}
function u(e) {
	return e === "light" || e === "dark" ? e : "auto";
}
function d() {
	var e = n("auto"), r = e[0], i = e[1], a = n(!1), d = a[0], f = a[1], p = n(!1), m = p[0], h = p[1];
	return t(function() {
		i(o()), f(!0);
	}, []), t(function() {
		d && (l(r), s(r), h(c(r)));
	}, [r, d]), t(function() {
		if (typeof window > "u") return;
		function e(e) {
			e.key !== "sm-theme" && e.key !== null || i(u(e.key === null ? null : e.newValue));
		}
		return window.addEventListener("storage", e), function() {
			window.removeEventListener("storage", e);
		};
	}, []), t(function() {
		if (!(!d || r !== "auto") && !(typeof window > "u" || !window.matchMedia)) {
			var e = window.matchMedia("(prefers-color-scheme: dark)"), t = function(e) {
				h(e.matches), l("auto");
			};
			return e.addEventListener ? e.addEventListener("change", t) : e.addListener && e.addListener(t), function() {
				e.removeEventListener ? e.removeEventListener("change", t) : e.removeListener && e.removeListener(t);
			};
		}
	}, [r, d]), {
		mode: r,
		ready: d,
		isDark: m,
		toggle: function() {
			i(function(e) {
				return e === "auto" ? "dark" : e === "dark" ? "light" : "auto";
			});
		}
	};
}
function f(e, t, n) {
	return e + "/portals/" + encodeURIComponent(t) + "/" + n;
}
var p = {
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
function m(e) {
	return /* @__PURE__ */ a("svg", {
		...p,
		...e,
		children: [
			/* @__PURE__ */ i("circle", {
				cx: "12",
				cy: "12",
				r: "5"
			}),
			/* @__PURE__ */ i("line", {
				x1: "12",
				y1: "1",
				x2: "12",
				y2: "3"
			}),
			/* @__PURE__ */ i("line", {
				x1: "12",
				y1: "21",
				x2: "12",
				y2: "23"
			}),
			/* @__PURE__ */ i("line", {
				x1: "4.22",
				y1: "4.22",
				x2: "5.64",
				y2: "5.64"
			}),
			/* @__PURE__ */ i("line", {
				x1: "18.36",
				y1: "18.36",
				x2: "19.78",
				y2: "19.78"
			}),
			/* @__PURE__ */ i("line", {
				x1: "1",
				y1: "12",
				x2: "3",
				y2: "12"
			}),
			/* @__PURE__ */ i("line", {
				x1: "21",
				y1: "12",
				x2: "23",
				y2: "12"
			}),
			/* @__PURE__ */ i("line", {
				x1: "4.22",
				y1: "19.78",
				x2: "5.64",
				y2: "18.36"
			}),
			/* @__PURE__ */ i("line", {
				x1: "18.36",
				y1: "5.64",
				x2: "19.78",
				y2: "4.22"
			})
		]
	});
}
function h(e) {
	return /* @__PURE__ */ i("svg", {
		...p,
		...e,
		children: /* @__PURE__ */ i("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })
	});
}
function g(e) {
	return /* @__PURE__ */ a("svg", {
		...p,
		...e,
		children: [
			/* @__PURE__ */ i("rect", {
				x: "3",
				y: "4",
				width: "18",
				height: "12",
				rx: "1"
			}),
			/* @__PURE__ */ i("line", {
				x1: "7",
				y1: "20",
				x2: "17",
				y2: "20"
			}),
			/* @__PURE__ */ i("line", {
				x1: "9",
				y1: "16",
				x2: "9",
				y2: "20"
			}),
			/* @__PURE__ */ i("line", {
				x1: "15",
				y1: "16",
				x2: "15",
				y2: "20"
			})
		]
	});
}
function _(e) {
	var t = e.search(/[?#]/);
	return t >= 0 && (e = e.slice(0, t)), e.length > 1 && e.charAt(e.length - 1) === "/" && (e = e.slice(0, -1)), e || "/";
}
function v(e, t) {
	return !t || e.external || e.href.indexOf("#") >= 0 || /^[a-z]+:/i.test(e.href) || e.href.indexOf("//") === 0 ? !1 : _(e.href) === _(t);
}
function y(e, t) {
	if (!t || !e.items) return !1;
	for (var n = _(t), r = 0; r < e.items.length; r++) {
		var i = e.items[r];
		if (v(i, t)) return !0;
		if (!(i.external || i.href.indexOf("#") >= 0 || /^[a-z]+:/i.test(i.href) || i.href.indexOf("//") === 0)) {
			var a = _(i.href);
			if (a !== "/" && n.indexOf(a + "/") === 0) return !0;
		}
	}
	return !1;
}
var b = ".smsh{background:var(--bg-card,var(--bg));border-bottom:1px solid var(--border);position:sticky;top:0;z-index:9000;flex-shrink:0}.smsh__inner{display:flex;align-items:center;justify-content:space-between;height:56px;padding:0 20px;gap:16px;max-width:var(--max-w,80rem);margin:0 auto}.smsh__brand{display:flex;align-items:baseline;gap:8px;text-decoration:none;color:var(--foreground);flex-shrink:0;min-width:0;transition:opacity .15s}.smsh__brand:hover{opacity:.75}.smsh__logo{height:26px;width:auto;display:block}.smsh__name{font-size:17px;font-weight:500;letter-spacing:-0.3px}.smsh__byline{font-size:13px;font-weight:400;color:var(--muted);white-space:nowrap}.smsh__right{display:flex;align-items:center;gap:10px}.smsh__nav{display:flex;align-items:center;gap:20px;margin-right:6px}.smsh__nav a{font-size:14px;text-decoration:none;font-family:var(--font);color:var(--muted);white-space:nowrap}.smsh__nav a:hover{color:var(--foreground)}.smsh__nav a[data-active=\"true\"]{color:var(--foreground);font-weight:600}.smsh__ddlabel{display:inline-flex;flex-direction:column}.smsh__ddlabel::after{content:attr(data-text);height:0;overflow:hidden;visibility:hidden;font-weight:600;pointer-events:none}.smsh__ddbtn[data-active=\"true\"]{color:var(--foreground);font-weight:600}.smsh__ddpanel a[aria-current=\"page\"],.smsh__mnav a[aria-current=\"page\"]{font-weight:700}.smsh__pill{height:34px;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:0 10px;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);font-family:var(--font);flex-shrink:0;transition:border-color .2s;box-sizing:border-box}.smsh__pill:hover{border-color:var(--accent)}.smsh__pill-label{font-size:11px;font-weight:500;letter-spacing:.3px}.smsh__pm{display:none}.smsh__pm[data-mode=\"auto\"]{display:contents}html[data-sm-theme-mode] .smsh__pm[data-mode]{display:none}html[data-sm-theme-mode=\"auto\"] .smsh__pm[data-mode=\"auto\"],html[data-sm-theme-mode=\"dark\"] .smsh__pm[data-mode=\"dark\"],html[data-sm-theme-mode=\"light\"] .smsh__pm[data-mode=\"light\"]{display:contents}.smsh__signin{display:flex;align-items:center;height:34px;padding:0 14px;border-radius:8px;background:var(--accent);color:#fff;font-size:13px;font-weight:600;text-decoration:none;font-family:var(--font);flex-shrink:0;box-sizing:border-box;white-space:nowrap;transition:box-shadow .15s}.smsh__signin:hover{box-shadow:inset 0 0 0 40px rgba(0,0,0,.14)}.smsh__dd{position:relative}.smsh__ddbtn{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:4px;font-size:14px;font-family:var(--font);color:var(--muted);white-space:nowrap}.smsh__ddbtn[aria-expanded=\"true\"],.smsh__ddbtn:hover{color:var(--foreground)}.smsh__ddbtn:focus-visible,.smsh__menubtn:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}.smsh__ddpanel{position:absolute;top:calc(100% + 12px);left:-12px;min-width:300px;background:var(--bg-card,var(--bg));border:1px solid var(--border);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.14);padding:6px;z-index:9001}.smsh__ddpanel[hidden],.smsh__mnav[hidden]{display:none}.smsh__ddpanel a{display:block;padding:9px 10px;border-radius:7px;text-decoration:none;color:var(--foreground);font-size:14px;font-weight:500;font-family:var(--font);white-space:normal}.smsh__ddpanel a:hover,.smsh__ddpanel a:focus-visible{background:var(--bg-subtle,rgba(0,0,0,.04));outline:none}.smsh__desc{display:block;font-size:12px;font-weight:400;color:var(--muted);margin-top:2px}.smsh__menubtn{all:unset;display:none;cursor:pointer;font-size:13px;font-family:var(--font);color:var(--foreground);border:1px solid var(--border);border-radius:7px;height:34px;padding:0 10px;box-sizing:border-box;align-items:center}.smsh__mnav{border-top:1px solid var(--border);padding:8px 14px 14px;background:var(--bg-card,var(--bg))}.smsh__mnav a{display:block;padding:9px 0;text-decoration:none;color:var(--foreground);font-size:15px;font-family:var(--font)}.smsh__mgroup{font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--muted);padding:10px 0 2px}.smsh__mnav .smsh__msub{padding-left:10px}@media (max-width:680px){.smsh__inner{padding:0 14px;gap:10px}.smsh__byline{display:none}.smsh__nav{display:none}.smsh__menubtn{display:inline-flex}.smsh__pill-label{display:none}.smsh__pill{padding:0 9px}}@media (max-width:389px){.smsh__inner{padding:0 10px;gap:8px}.smsh__right{gap:6px}.smsh__logo{height:22px}.smsh__pill{padding:0 8px}.smsh__signin{padding:0 10px}.smsh__menubtn{padding:0 8px}}@media (prefers-reduced-motion:reduce){.smsh__brand,.smsh__signin,.smsh__pill{transition:none}}";
function x(o) {
	var s = d(), c = o.navLinks || [], l = o.byline === void 0 ? "by Sprint Mode" : o.byline, u = o.homeHref || "/", p = o.signInLabel || "Sign in", _ = n(o.config || null), x = _[0], S = _[1];
	t(function() {
		if (o.config) {
			S(o.config);
			return;
		}
		if (o.subdomain && !(typeof fetch > "u")) {
			var e = o.apiBase || "https://api.sprintmode.ai", t = !1;
			return fetch(e + "/api/portal/config?subdomain=" + encodeURIComponent(o.subdomain)).then(function(e) {
				return e.json();
			}).then(function(e) {
				!t && e && e.ok && e.config && S(e.config);
			}).catch(function() {}), function() {
				t = !0;
			};
		}
	}, [
		o.subdomain,
		o.apiBase,
		o.config
	]), t(function() {
		!x || typeof document > "u" || (x.brand_color && document.documentElement.style.setProperty("--accent", String(x.brand_color)), x.brand_tint && document.documentElement.style.setProperty("--accent-10", String(x.brand_tint)));
	}, [x]);
	var C = o.apiBase || "https://api.sprintmode.ai", w = o.subdomain, T = x && x.name || "Sprint Mode", E = x && x.logo_horizontal_url || (w ? f(C, w, "logo_horizontal.png") : null), D = x && x.logo_dark_url || (w ? f(C, w, "logo_horizontal_dark.png") : null), O = s.isDark && D || E, k = n(!0), A = k[0], j = k[1];
	t(function() {
		j(!0);
	}, [O]);
	var M = s.mode === "auto" ? "Auto" : s.mode === "dark" ? "Dark" : "Light", N = "Theme: " + M, P = n(o.currentPath || ""), F = P[0], I = P[1];
	t(function() {
		if (!(o.currentPath !== void 0 || typeof window > "u")) {
			var e = window.location.pathname;
			e !== F && I(e);
		}
	});
	var L = o.currentPath === void 0 ? F : o.currentPath, R;
	x && x.brand_color && (R = { "--accent": String(x.brand_color) }, x.brand_tint && (R["--accent-10"] = String(x.brand_tint)));
	var z = s.mode === "light" ? m : s.mode === "dark" ? h : g, B = n(null), V = B[0], H = B[1], U = n(!1), W = U[0], G = U[1], K = e.useRef(null);
	t(function() {
		if (!V && !W) return;
		function e(e) {
			K.current && !K.current.contains(e.target) && (H(null), G(!1));
		}
		function t(e) {
			e.key === "Escape" && (H(null), G(!1));
		}
		return document.addEventListener("mousedown", e), document.addEventListener("keydown", t), function() {
			document.removeEventListener("mousedown", e), document.removeEventListener("keydown", t);
		};
	}, [V, W]);
	var q = c.length > 0 && o.mobileMenu === !0;
	return /* @__PURE__ */ a("header", {
		className: "smsh",
		ref: K,
		style: R,
		children: [
			/* @__PURE__ */ i("style", { dangerouslySetInnerHTML: { __html: b } }),
			/* @__PURE__ */ a("div", {
				className: "smsh__inner",
				children: [/* @__PURE__ */ a("a", {
					href: u,
					className: "smsh__brand",
					children: [O && A ? /* @__PURE__ */ i("img", {
						className: "smsh__logo",
						src: O,
						alt: T,
						onError: function() {
							j(!1);
						}
					}) : /* @__PURE__ */ i("span", {
						className: "smsh__name",
						children: T
					}), l ? /* @__PURE__ */ i("span", {
						className: "smsh__byline",
						children: l
					}) : null]
				}), /* @__PURE__ */ a("div", {
					className: "smsh__right",
					children: [
						c.length > 0 ? /* @__PURE__ */ i("nav", {
							className: "smsh__nav",
							children: c.map(function(e) {
								if (e.items && e.items.length > 0) {
									var t = "smsh-dd-" + e.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase(), n = V === e.label, r = y(e, L);
									return /* @__PURE__ */ a("div", {
										className: "smsh__dd",
										children: [/* @__PURE__ */ a("button", {
											type: "button",
											className: "smsh__ddbtn",
											"aria-expanded": n ? "true" : "false",
											"aria-controls": t,
											"data-active": r ? "true" : "false",
											onClick: function() {
												H(n ? null : e.label);
											},
											children: [/* @__PURE__ */ i("span", {
												className: "smsh__ddlabel",
												"data-text": e.label,
												children: e.label
											}), /* @__PURE__ */ i("svg", {
												width: "10",
												height: "10",
												viewBox: "0 0 24 24",
												fill: "none",
												stroke: "currentColor",
												strokeWidth: "2.5",
												"aria-hidden": "true",
												children: /* @__PURE__ */ i("polyline", { points: "6 9 12 15 18 9" })
											})]
										}), /* @__PURE__ */ i("div", {
											className: "smsh__ddpanel",
											id: t,
											hidden: !n,
											children: e.items.map(function(e) {
												return /* @__PURE__ */ a("a", {
													href: e.href,
													...v(e, L) ? { "aria-current": "page" } : {},
													...e.external ? {
														target: "_blank",
														rel: "noopener noreferrer"
													} : {},
													children: [e.label, e.description ? /* @__PURE__ */ i("span", {
														className: "smsh__desc",
														children: e.description
													}) : null]
												}, e.href);
											})
										})]
									}, e.label);
								}
								var o = v(e, L);
								return /* @__PURE__ */ i("a", {
									href: e.href,
									"data-active": o ? "true" : "false",
									...o ? { "aria-current": "page" } : {},
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
							onClick: s.toggle,
							"aria-label": N,
							title: N,
							children: s.ready ? /* @__PURE__ */ a(r, { children: [/* @__PURE__ */ i(z, {}), /* @__PURE__ */ i("span", {
								className: "smsh__pill-label",
								children: M
							})] }) : /* @__PURE__ */ a(r, { children: [
								/* @__PURE__ */ a("span", {
									className: "smsh__pm",
									"data-mode": "auto",
									children: [/* @__PURE__ */ i(g, {}), /* @__PURE__ */ i("span", {
										className: "smsh__pill-label",
										children: "Auto"
									})]
								}),
								/* @__PURE__ */ a("span", {
									className: "smsh__pm",
									"data-mode": "dark",
									children: [/* @__PURE__ */ i(h, {}), /* @__PURE__ */ i("span", {
										className: "smsh__pill-label",
										children: "Dark"
									})]
								}),
								/* @__PURE__ */ a("span", {
									className: "smsh__pm",
									"data-mode": "light",
									children: [/* @__PURE__ */ i(m, {}), /* @__PURE__ */ i("span", {
										className: "smsh__pill-label",
										children: "Light"
									})]
								})
							] })
						}),
						o.signInHref ? /* @__PURE__ */ i("a", {
							className: "smsh__signin",
							href: o.signInHref,
							children: p
						}) : null,
						o.rightSlot,
						q ? /* @__PURE__ */ i("button", {
							type: "button",
							className: "smsh__menubtn",
							"aria-expanded": W ? "true" : "false",
							"aria-controls": "smsh-mnav",
							onClick: function() {
								G(!W);
							},
							children: "Menu"
						}) : null
					]
				})]
			}),
			q ? /* @__PURE__ */ i("nav", {
				className: "smsh__mnav",
				id: "smsh-mnav",
				hidden: !W,
				"aria-label": "Menu",
				children: c.map(function(e) {
					return e.items && e.items.length > 0 ? /* @__PURE__ */ a("div", { children: [/* @__PURE__ */ i("div", {
						className: "smsh__mgroup",
						children: e.label
					}), e.items.map(function(e) {
						return /* @__PURE__ */ i("a", {
							className: "smsh__msub",
							href: e.href,
							...v(e, L) ? { "aria-current": "page" } : {},
							...e.external ? {
								target: "_blank",
								rel: "noopener noreferrer"
							} : {},
							children: e.label
						}, e.href);
					})] }, e.label) : /* @__PURE__ */ i("a", {
						href: e.href,
						...v(e, L) ? { "aria-current": "page" } : {},
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
var S = "(function(){try{var t=localStorage.getItem('sm-theme');var s=(t==='dark'||t==='light');var d=s?t:((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light');document.documentElement.setAttribute('data-theme',d);document.documentElement.setAttribute('data-sm-theme-mode',s?t:'auto');}catch(e){}})();";
function C() {
	if (!(typeof document > "u")) {
		var e = null;
		try {
			e = localStorage.getItem("sm-theme");
		} catch {}
		var t = e === "dark" || e === "light" ? e : typeof window < "u" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		document.documentElement.setAttribute("data-theme", t), document.documentElement.setAttribute("data-sm-theme-mode", e === "dark" || e === "light" ? e : "auto");
	}
}
function w(e, t) {
	return e ? e + " — " + t : t;
}
function T(e, t) {
	typeof document < "u" && (document.title = w(e, t));
}
function E(e, n) {
	t(function() {
		T(e, n);
	}, [e, n]);
}
//#endregion
export { E as a, S as i, w as n, x as o, T as r, C as t };
