import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { Check, CircleX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/order-timeline-CEUvHlFy.js
var import_jsx_runtime = require_jsx_runtime();
var TIMELINE = [
	"AGUARDANDO",
	"EM_LAVAGEM",
	"AGUARDANDO_PAGAMENTO",
	"PAGO",
	"ENTREGUE"
];
var TIMELINE_LABEL = {
	AGUARDANDO: "Chegou",
	EM_LAVAGEM: "Lavando",
	AGUARDANDO_PAGAMENTO: "Pronto",
	PAGO: "Pago",
	ENTREGUE: "Entregue"
};
/** Status legados caem na etapa equivalente da linha do tempo. */
var TIMELINE_INDEX = {
	EM_FINALIZACAO: 1,
	FINALIZADO: 2
};
function OrderTimeline({ status, title = "Andamento" }) {
	if (status === "CANCELADO") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-5 shrink-0" }), "Este atendimento foi cancelado."]
	});
	const current = TIMELINE_INDEX[status] ?? TIMELINE.indexOf(status);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl border border-border/60 bg-card p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-4 grid grid-cols-5 gap-1",
			"aria-label": "Etapas do atendimento",
			children: TIMELINE.map((step, index) => {
				const done = index < current || index === current && step === "ENTREGUE";
				const active = index === current && !done;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "relative flex flex-col items-center text-center",
					children: [
						index > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2 overflow-hidden bg-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
								className: "block h-full w-full origin-left bg-primary",
								initial: { scaleX: 0 },
								animate: { scaleX: index <= current ? 1 : 0 },
								transition: {
									duration: .45,
									delay: index * .12,
									ease: "easeOut"
								}
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: `relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${done ? "border-primary bg-primary text-primary-foreground" : active ? "border-primary bg-background text-primary shadow-glow" : "border-border bg-background text-muted-foreground"}`,
							"aria-current": active ? "step" : void 0,
							children: [done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
								initial: {
									scale: 0,
									rotate: -45
								},
								animate: {
									scale: 1,
									rotate: 0
								},
								transition: {
									type: "spring",
									stiffness: 600,
									damping: 18,
									delay: index * .12
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" })
							}) : index + 1, active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute inset-0 animate-ping rounded-full border-2 border-primary/50" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `mt-2 text-[10px] leading-tight ${active ? "font-bold text-primary" : done ? "text-foreground" : "text-muted-foreground"}`,
							children: TIMELINE_LABEL[step]
						})
					]
				}, step);
			})
		})]
	});
}
//#endregion
export { OrderTimeline };
