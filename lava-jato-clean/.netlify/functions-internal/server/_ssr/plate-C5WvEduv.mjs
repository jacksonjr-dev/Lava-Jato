//#region node_modules/.nitro/vite/services/ssr/assets/plate-C5WvEduv.js
function normalizePlate(input) {
	return (input ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}
function isValidPlate(input) {
	const p = normalizePlate(input);
	return /^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$/.test(p);
}
var STATUS_LABEL = {
	AGUARDANDO: "Aguardando",
	EM_LAVAGEM: "Em serviço",
	EM_FINALIZACAO: "Em serviço",
	FINALIZADO: "Pronto para retirada",
	AGUARDANDO_PAGAMENTO: "Pronto para retirada",
	PAGO: "Pago",
	ENTREGUE: "Entregue",
	CANCELADO: "Cancelado"
};
var PAYMENT_METHODS = [
	"DINHEIRO",
	"PIX",
	"DEBITO",
	"CREDITO",
	"OUTRO"
];
var PAYMENT_LABEL = {
	DINHEIRO: "Dinheiro",
	PIX: "PIX",
	DEBITO: "Débito",
	CREDITO: "Crédito",
	OUTRO: "Outro"
};
function brl(value) {
	const n = typeof value === "string" ? Number(value) : value ?? 0;
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL"
	}).format(n || 0);
}
function dateBR(value) {
	if (!value) return "-";
	return new Date(value).toLocaleDateString("pt-BR");
}
//#endregion
export { PAYMENT_LABEL, PAYMENT_METHODS, STATUS_LABEL, brl, dateBR, isValidPlate, normalizePlate };
