import { isValidPlate, normalizePlate } from "./plate-C5WvEduv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/service-selection-BA5z5PKT.js
var AS_LETTER = {
	"0": "O",
	"1": "I",
	"2": "Z",
	"4": "A",
	"5": "S",
	"6": "G",
	"8": "B"
};
var AS_DIGIT = {
	O: "0",
	Q: "0",
	D: "0",
	I: "1",
	L: "1",
	Z: "2",
	A: "4",
	S: "5",
	G: "6",
	T: "7",
	B: "8"
};
/**
* Ajusta confusões letra/número conforme a posição da placa brasileira:
* LLL N (N|L) NN — vale para o padrão antigo (ABC1234) e o Mercosul (ABC1D23).
*/
function correctPlateCharacters(input) {
	const plate = normalizePlate(input);
	if (plate.length !== 7) return plate;
	return plate.split("").map((char, index) => {
		if (index <= 2) return AS_LETTER[char] ?? char;
		if (index === 3 || index >= 5) return AS_DIGIT[char] ?? char;
		return char;
	}).join("");
}
/** Interpreta a resposta do modelo; placas fora do padrão brasileiro são descartadas. */
function parsePlateResponse(raw) {
	const match = raw.match(/\{[\s\S]*\}/);
	if (!match) return {
		plate: "",
		confidence: 0
	};
	let parsed;
	try {
		parsed = JSON.parse(match[0]);
	} catch {
		return {
			plate: "",
			confidence: 0
		};
	}
	const plate = correctPlateCharacters(typeof parsed.plate === "string" ? parsed.plate : "");
	if (!isValidPlate(plate)) return {
		plate: "",
		confidence: 0
	};
	const confidence = Number(parsed.confidence);
	return {
		plate,
		confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : 0
	};
}
function normalizedServiceName(name) {
	return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
function isWashService(service) {
	if (typeof service !== "string" && service.categoria) return service.categoria === "LAVAGEM";
	const normalized = normalizedServiceName(typeof service === "string" ? service : service.nome);
	return normalized.startsWith("lavagem simples") || normalized.startsWith("lavagem completa");
}
function assertCompatibleServices(services) {
	if (services.filter((service) => isWashService(service)).length > 1) throw new Error("Escolha apenas uma lavagem: simples ou completa.");
}
function toggleServiceSelection(selectedIds, service, availableServices) {
	if (selectedIds.includes(service.id)) return selectedIds.filter((id) => id !== service.id);
	if (!isWashService(service)) return [...selectedIds, service.id];
	const washIds = new Set(availableServices.filter((item) => isWashService(item)).map((item) => item.id));
	return [...selectedIds.filter((id) => !washIds.has(id)), service.id];
}
//#endregion
export { assertCompatibleServices, correctPlateCharacters, isWashService, parsePlateResponse, toggleServiceSelection };
