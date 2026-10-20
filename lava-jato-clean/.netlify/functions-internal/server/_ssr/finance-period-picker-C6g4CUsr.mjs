import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { FINANCE_PERIODS, FINANCE_PERIOD_LABEL } from "./router-BJH1rJwZ.mjs";
import { CalendarDays } from "../_libs/lucide-react.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/finance-period-picker-C6g4CUsr.js
var import_jsx_runtime = require_jsx_runtime();
/** Botões de período do financeiro, com datas quando for "Período". */
function FinancePeriodPicker({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-1.5",
		role: "group",
		"aria-label": "Período",
		children: [FINANCE_PERIODS.map((period) => {
			const active = value.periodo === period;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				"aria-pressed": active,
				onClick: () => onChange({
					...value,
					periodo: period
				}),
				className: `flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`,
				children: [period === "personalizado" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-3.5" }), FINANCE_PERIOD_LABEL[period]]
			}, period);
		}), value.periodo === "personalizado" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex w-full items-center gap-2 pt-1 sm:w-auto sm:pt-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "date",
					"aria-label": "De",
					value: value.de ?? "",
					onChange: (event) => onChange({
						...value,
						de: event.target.value || void 0
					}),
					className: "h-8 text-xs"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: "até"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					type: "date",
					"aria-label": "Até",
					value: value.ate ?? "",
					onChange: (event) => onChange({
						...value,
						ate: event.target.value || void 0
					}),
					className: "h-8 text-xs"
				})
			]
		})]
	});
}
//#endregion
export { FinancePeriodPicker };
