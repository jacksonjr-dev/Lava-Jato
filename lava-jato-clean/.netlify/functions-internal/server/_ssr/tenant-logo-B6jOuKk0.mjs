import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tenant-logo-B6jOuKk0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Logo do lava-jato; mostra `fallback` se não houver logo ou se a imagem falhar. */
function TenantLogo({ url, name, className = "size-8", fallback }) {
	const [failed, setFailed] = (0, import_react.useState)(null);
	if (!url || failed === url) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: fallback });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: url,
		alt: `Logo de ${name}`,
		onError: () => setFailed(url),
		className: `shrink-0 rounded-lg bg-white object-contain ${className}`
	});
}
//#endregion
export { TenantLogo };
