import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { cn } from "./button-DaOcT_hl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/skeleton-CZb5vrGH.js
var import_jsx_runtime = require_jsx_runtime();
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-primary/10", className),
		...props
	});
}
//#endregion
export { Skeleton };
