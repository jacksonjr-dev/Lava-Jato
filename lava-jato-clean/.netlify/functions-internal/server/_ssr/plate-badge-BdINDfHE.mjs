import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/plate-badge-BdINDfHE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Moldura de placa no padrão Mercosul: faixa azul "BRASIL" e caracteres pretos. */
function PlateFrame({ size, children, className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `overflow-hidden rounded-xl border-2 border-neutral-900 bg-white text-neutral-950 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `flex items-center justify-between bg-[#0b3d91] px-2 font-sans font-bold tracking-[0.3em] text-white ${size === "lg" ? "h-6 text-[10px]" : "h-4 text-[7px]"}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": "true",
					children: "●"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BRASIL" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					"aria-hidden": "true",
					className: "opacity-80",
					children: "BR"
				})
			]
		}), children]
	});
}
function PlateBadge({ plate, size = "md", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateFrame, {
		size,
		className: `inline-block ${className ?? ""}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `plate px-3 text-center font-bold tracking-[0.18em] ${size === "lg" ? "py-2 text-4xl" : "py-1 text-lg"}`,
			children: plate || "———————"
		})
	});
}
/** Campo de digitação com a aparência de uma placa. */
var PlateInput = (0, import_react.forwardRef)(function PlateInput({ className = "", ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateFrame, {
		size: "lg",
		className: "w-full max-w-sm focus-within:ring-4 focus-within:ring-primary/40",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref,
			...props,
			className: `plate w-full bg-transparent px-3 py-3 text-center text-4xl font-bold uppercase tracking-[0.18em] text-neutral-950 outline-none placeholder:text-neutral-300 sm:text-5xl ${className}`,
			autoComplete: "off",
			autoCapitalize: "characters",
			spellCheck: false
		})
	});
});
//#endregion
export { PlateBadge, PlateInput };
