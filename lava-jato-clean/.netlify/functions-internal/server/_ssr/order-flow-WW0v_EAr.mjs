//#region node_modules/.nitro/vite/services/ssr/assets/order-flow-WW0v_EAr.js
var NEXT_STATUS = {
	AGUARDANDO: "EM_LAVAGEM",
	EM_LAVAGEM: "AGUARDANDO_PAGAMENTO",
	EM_FINALIZACAO: "AGUARDANDO_PAGAMENTO",
	FINALIZADO: "AGUARDANDO_PAGAMENTO",
	AGUARDANDO_PAGAMENTO: "PAGO",
	PAGO: "ENTREGUE"
};
var CANCELLABLE = /* @__PURE__ */ new Set([
	"AGUARDANDO",
	"EM_LAVAGEM",
	"EM_FINALIZACAO",
	"FINALIZADO",
	"AGUARDANDO_PAGAMENTO"
]);
function nextOrderStatus(status) {
	return NEXT_STATUS[status] ?? null;
}
function allowedManualTransitions(status) {
	const next = nextOrderStatus(status);
	const transitions = [];
	if (next && next !== "PAGO") transitions.push(next);
	if (CANCELLABLE.has(status)) transitions.push("CANCELADO");
	return transitions;
}
function canTransitionOrder(current, target, options = {}) {
	if (current === target) return true;
	if (target === "CANCELADO") return options.canCancel === true && CANCELLABLE.has(current);
	if (target === "PAGO") return options.viaPayment === true && current === "AGUARDANDO_PAGAMENTO";
	return nextOrderStatus(current) === target;
}
function assertOrderTransition(current, target, options = {}) {
	if (!canTransitionOrder(current, target, options)) throw new Error(`Transição de status inválida: ${current} → ${target}.`);
}
//#endregion
export { allowedManualTransitions, assertOrderTransition };
