import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wash-hose-backdrop-NFnLurD2.js
var import_jsx_runtime = require_jsx_runtime();
/** Símbolo próprio do LavaPro: gota, brilho e linha d'água. */
function WashMark({ className = "size-8 text-primary" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 48 48",
		role: "img",
		"aria-label": "LavaPro",
		className: `wash-mark shrink-0 ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				className: "wash-mark__drop",
				d: "M24 4.5c-3.5 6.1-11.8 14.6-11.8 23.1A11.8 11.8 0 0 0 24 39.4a11.8 11.8 0 0 0 11.8-11.8C35.8 19.1 27.5 10.6 24 4.5Z",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				className: "wash-mark__wave",
				d: "M8 39.1c4.4-2.7 8.8-2.7 13.2 0s8.8 2.7 13.2 0 7.5-2.7 9.6-1.3",
				fill: "none",
				stroke: "currentColor",
				strokeLinecap: "round",
				strokeWidth: "2.8"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				className: "wash-mark__shine",
				d: "M20.2 16.5c-2.1 2.8-3.6 5.7-3.6 8.1",
				fill: "none",
				stroke: "currentColor",
				strokeLinecap: "round",
				strokeWidth: "2.5"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: "wash-mark__bubble",
				cx: "39.5",
				cy: "10",
				r: "3",
				fill: "currentColor"
			})
		]
	});
}
function WashBrand({ suffix }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "plate text-sm text-primary",
			children: ["LAVAPRO", suffix ? ` / ${suffix}` : ""]
		})]
	});
}
/**
* Ilustração ambiente compartilhada pelas áreas pública, cliente e proprietário.
*
* Cada parte (mangueira, jato e gotas) fica numa camada própria e só se move com
* transform/opacity. Assim a placa de vídeo anima as camadas já desenhadas, sem
* redesenhar a tela inteira (e o desfoque do jato) a cada quadro.
*/
function WashHoseBackdrop() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "wash-hose-backdrop",
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Layer, {
				className: "wash-hose-backdrop__hose",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						className: "wash-hose-backdrop__tube-shadow",
						d: "M-90 865C35 768 99 807 140 748c35-50 8-111 51-151 31-29 81-27 120-18"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						className: "wash-hose-backdrop__tube",
						d: "M-90 865C35 768 99 807 140 748c35-50 8-111 51-151 31-29 81-27 120-18"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
						className: "wash-hose-backdrop__nozzle",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M275 550l74 25-12 35-76-24z",
								className: "wash-hose-backdrop__handle"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M333 568l48 1-7 28-42 11z",
								className: "wash-hose-backdrop__metal"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M370 569l37-6 5 23-40 11z",
								className: "wash-hose-backdrop__tip"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M288 586l-14 63 28 8 27-57z",
								className: "wash-hose-backdrop__grip"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Layer, {
				className: "wash-hose-backdrop__spray",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
						id: "hose-water-stream",
						x1: "0",
						y1: "1",
						x2: "1",
						y2: "0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0",
								stopColor: "currentColor",
								stopOpacity: "0.92"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "0.55",
								stopColor: "currentColor",
								stopOpacity: "0.46"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
								offset: "1",
								stopColor: "currentColor",
								stopOpacity: "0"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("filter", {
						id: "hose-water-glow",
						x: "-20%",
						y: "-40%",
						width: "150%",
						height: "180%",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("feGaussianBlur", { stdDeviation: "7" })
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M402 574C622 505 864 350 1275 116",
						className: "wash-hose-backdrop__jet-glow"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M402 574C622 505 864 350 1275 116",
						className: "wash-hose-backdrop__jet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M405 578C654 526 916 421 1328 274",
						className: "wash-hose-backdrop__mist-line"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
						d: "M401 569C622 463 840 291 1180 63",
						className: "wash-hose-backdrop__mist-line"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Layer, {
				className: "wash-hose-backdrop__drops",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "538",
						cy: "514",
						r: "5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "742",
						cy: "401",
						r: "6"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "955",
						cy: "291",
						r: "5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "1192",
						cy: "166",
						r: "4.5"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Layer, {
				className: "wash-hose-backdrop__drops wash-hose-backdrop__drops--late",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "627",
						cy: "463",
						r: "3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "848",
						cy: "335",
						r: "3.5"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "1080",
						cy: "207",
						r: "3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						cx: "1298",
						cy: "96",
						r: "3"
					})
				]
			})
		]
	});
}
function Layer({ className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: `wash-hose-backdrop__layer ${className}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			viewBox: "0 0 1440 900",
			preserveAspectRatio: "xMinYMid slice",
			children
		})
	});
}
//#endregion
export { WashBrand, WashHoseBackdrop, WashMark };
