import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link, useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { createNewCustomerOrder, createOrder, findVehicleByPlate, listServices, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { brl, dateBR, isValidPlate, normalizePlate } from "./plate-C5WvEduv.mjs";
import { useMutation, useQuery } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { CountUp } from "./router-BJH1rJwZ.mjs";
import { Button } from "./button-DaOcT_hl.mjs";
import { ArrowLeft, ArrowRight, Camera, Check, History, LoaderCircle, Lock, Phone, Sparkles, UserPlus, X } from "../_libs/lucide-react.mjs";
import { AppShell, useFeature } from "./shell-CXqKyQlN.mjs";
import { Skeleton } from "./skeleton-CZb5vrGH.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
import { correctPlateCharacters, isWashService, toggleServiceSelection } from "./service-selection-BA5z5PKT.mjs";
import { PlateBadge, PlateInput } from "./plate-badge-BdINDfHE.mjs";
import { Label } from "./label-DgAlJVOt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/atendimento.novo-DXzrMIlI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var TARGET_WIDTH = 1400;
var MERCOSUL_LETTER = {
	"0": "O",
	"1": "I",
	"2": "Z",
	"4": "A",
	"5": "S",
	"6": "G",
	"8": "B"
};
var workerPromise = null;
function getWorker() {
	workerPromise ??= (async () => {
		const { createWorker, OEM } = await import("../_libs/tesseract.js.mjs").then((n) => /* @__PURE__ */ __toESM(n.require_src()));
		const worker = await createWorker("eng", OEM.LSTM_ONLY, {
			workerPath: "/ocr/worker.min.js",
			corePath: "/ocr/core",
			langPath: "/ocr/lang",
			workerBlobURL: false
		});
		await worker.setParameters({ tessedit_char_whitelist: WHITELIST });
		return worker;
	})().catch((error) => {
		workerPromise = null;
		throw error;
	});
	return workerPromise;
}
/** Diagnóstico: localStorage.setItem("lavapro:ocr-debug", "1") mostra cada leitura no console. */
function debugEnabled() {
	try {
		return localStorage.getItem("lavapro:ocr-debug") === "1";
	} catch {
		return false;
	}
}
/** Carrega o OCR antecipadamente (ex.: ao abrir a tela de novo atendimento). */
function preloadPlateOcr() {
	getWorker().catch(() => void 0);
}
/**
* Procura sequências de 7 caracteres que formem uma placa brasileira válida,
* na ordem em que aparecem (a mais à esquerda primeiro).
*/
function findPlateCandidates(text, mercosul, strict = false) {
	const found = [];
	for (const line of text.toUpperCase().split(/\n+/)) {
		const compact = normalizePlate(line);
		for (let start = 0; start + 7 <= compact.length; start++) {
			let candidate = compact.slice(start, start + 7);
			if (!strict) candidate = correctPlateCharacters(candidate);
			const fifth = candidate[4];
			if (!strict && mercosul && MERCOSUL_LETTER[fifth]) candidate = candidate.slice(0, 4) + MERCOSUL_LETTER[fifth] + candidate.slice(5);
			if (strict && mercosul && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(candidate)) continue;
			if (isValidPlate(candidate) && !found.includes(candidate)) found.push(candidate);
		}
	}
	return found;
}
var POSITION_WEIGHT = [
	1,
	.25,
	.1
];
/**
* Soma os votos de cada leitura: vence a placa que aparece em mais variações,
* pesada pela confiança do OCR e pela confiabilidade da variação (`weight`).
*/
function tallyVotes(readings) {
	const scores = /* @__PURE__ */ new Map();
	for (const { candidates, confidence, weight = .3 } of readings) candidates.forEach((plate, index) => {
		const entry = scores.get(plate) ?? {
			score: 0,
			votes: 0,
			confidence: 0
		};
		entry.score += (weight + confidence) * (POSITION_WEIGHT[index] ?? .05);
		entry.votes += 1;
		entry.confidence = Math.max(entry.confidence, confidence);
		scores.set(plate, entry);
	});
	return [...scores.entries()].map(([plate, entry]) => ({
		plate,
		...entry
	})).sort((a, b) => b.score - a.score);
}
function scaled(bitmap) {
	const scale = Math.min(TARGET_WIDTH / bitmap.width, 3);
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return canvas;
}
var isBlue = (data, i) => data[i + 2] > 120 && data[i + 2] > data[i] * 1.8 && data[i + 2] > data[i + 1] * 1.25;
var median = (values) => values.length ? values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)] : 0;
/**
* Localiza a placa Mercosul pela faixa azul, corrige a inclinação e devolve só a
* linha dos caracteres. null quando não há faixa azul reconhecível.
*/
function locateMercosulCharacters(base) {
	const { width, height } = base;
	const { data } = base.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, width, height);
	let top = -1;
	let bottom = -1;
	for (let y = 0; y < height; y++) {
		let blue = 0;
		for (let x = 0; x < width; x += 2) if (isBlue(data, (y * width + x) * 4)) blue++;
		if (blue > width / 2 * .12) {
			if (top < 0) top = y;
			bottom = y;
		}
	}
	if (top < 0) return null;
	const strong = [];
	let peak = 0;
	const columns = [];
	for (let x = 0; x < width; x++) {
		let blue = 0;
		for (let y = top; y <= bottom; y += 2) if (isBlue(data, (y * width + x) * 4)) blue++;
		columns.push(blue);
		peak = Math.max(peak, blue);
	}
	columns.forEach((value) => strong.push(value > peak * .25));
	let left = 0;
	let right = 0;
	for (let x = 0, start = -1, gap = 0; x < width; x++) if (strong[x]) {
		if (start < 0) start = x;
		gap = 0;
		if (x - start > right - left) [left, right] = [start, x];
	} else if (start >= 0 && ++gap > 20) {
		start = -1;
		gap = 0;
	}
	const bandWidth = right - left;
	if (bandWidth < width * .15) return null;
	const thickness = [];
	const firstBlue = [];
	const xs = [];
	for (let x = left + Math.round(bandWidth * .1); x <= right - Math.round(bandWidth * .1); x += 3) {
		let count = 0;
		let first = -1;
		for (let y = Math.max(0, top - 80); y <= Math.min(height - 1, bottom + 80); y++) if (isBlue(data, (y * width + x) * 4)) {
			count++;
			if (first < 0) first = y;
		}
		if (count) {
			thickness.push(count);
			firstBlue.push(first);
			xs.push(x);
		}
	}
	if (xs.length < 5) return null;
	const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
	const meanY = firstBlue.reduce((a, b) => a + b, 0) / firstBlue.length;
	let num = 0;
	let den = 0;
	xs.forEach((x, i) => {
		num += (x - meanX) * (firstBlue[i] - meanY);
		den += (x - meanX) ** 2;
	});
	const angle = Math.atan(num / Math.max(1, den));
	const bandHeight = Math.max(10, median(thickness));
	const chars = document.createElement("canvas");
	chars.width = Math.round(bandWidth * 1.04);
	chars.height = Math.round(bandHeight * 2.5);
	const context = chars.getContext("2d");
	context.fillStyle = "#fff";
	context.fillRect(0, 0, chars.width, chars.height);
	context.translate(chars.width / 2, chars.height / 2);
	context.rotate(-angle);
	const centerX = left + bandWidth / 2;
	const centerY = median(firstBlue) + bandHeight * 1.05 + chars.height / 2;
	context.drawImage(base, -centerX, -centerY);
	return chars;
}
/** Recorta a região e aplica tons de cinza (threshold < 0) ou preto e branco. */
function prepare(source, region, threshold) {
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(source.width * region.w));
	canvas.height = Math.max(1, Math.round(source.height * region.h));
	const context = canvas.getContext("2d", { willReadFrequently: true });
	context.drawImage(source, source.width * region.x, source.height * region.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
	const image = context.getImageData(0, 0, canvas.width, canvas.height);
	const { data } = image;
	for (let i = 0; i < data.length; i += 4) {
		const gray = .299 * data[i] + .587 * data[i + 1] + .114 * data[i + 2];
		const value = threshold < 0 ? gray : gray < threshold * 255 ? 0 : 255;
		data[i] = data[i + 1] = data[i + 2] = value;
	}
	context.putImageData(image, 0, 0);
	return canvas;
}
/** Filtro separável de mínimo/máximo em imagem binária (0 = escuro). */
function spread(bin, width, height, radius, dark) {
	const pass = (source, horizontal) => {
		const out = new Uint8Array(source.length);
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			let hit = false;
			for (let k = -radius; k <= radius && !hit; k++) {
				const xx = horizontal ? x + k : x;
				const yy = horizontal ? y : y + k;
				if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
				hit = dark ? source[yy * width + xx] === 0 : source[yy * width + xx] === 255;
			}
			out[y * width + x] = dark ? hit ? 0 : 255 : hit ? 255 : 0;
		}
		return out;
	};
	return pass(pass(bin, true), false);
}
/**
* Preto e branco + fechamento morfológico: preenche o relevo "MERCOSUL" que
* fica dentro dos traços das letras e as deixa sólidas para o OCR.
*/
function solidCharacters(source, threshold, blur, radius) {
	const canvas = document.createElement("canvas");
	canvas.width = source.width;
	canvas.height = source.height;
	const context = canvas.getContext("2d", { willReadFrequently: true });
	context.filter = blur ? `blur(${blur}px)` : "none";
	context.drawImage(source, 0, 0);
	context.filter = "none";
	const image = context.getImageData(0, 0, canvas.width, canvas.height);
	let bin = new Uint8Array(canvas.width * canvas.height);
	for (let p = 0, i = 0; p < bin.length; p++, i += 4) {
		const gray = .299 * image.data[i] + .587 * image.data[i + 1] + .114 * image.data[i + 2];
		bin[p] = gray < threshold * 255 ? 0 : 255;
	}
	if (radius > 0) bin = spread(spread(bin, canvas.width, canvas.height, radius, true), canvas.width, canvas.height, radius, false);
	for (let p = 0, i = 0; p < bin.length; p++, i += 4) image.data[i] = image.data[i + 1] = image.data[i + 2] = bin[p];
	context.putImageData(image, 0, 0);
	return canvas;
}
/**
* Confiança exibida: a maior entre a confiança do OCR e a fração de leituras
* que concordaram (a do Tesseract sozinha subestima placas com marca d'água).
*/
function agreement(entry, readings) {
	return Math.min(.99, Math.max(entry.confidence, entry.votes / Math.max(1, readings)));
}
/** Lê a placa da foto; devolve placa vazia se nada válido for encontrado. */
async function readPlateWithOcr(file, options = {}) {
	const bitmap = await createImageBitmap(file);
	const base = scaled(bitmap);
	bitmap.close();
	const characters = locateMercosulCharacters(base);
	const mercosul = characters !== null;
	const full = {
		x: 0,
		y: 0,
		w: 1,
		h: 1
	};
	const { PSM } = await import("../_libs/tesseract.js.mjs").then((n) => /* @__PURE__ */ __toESM(n.require_src()));
	const attempts = [
		...characters ? [
			{
				image: () => solidCharacters(characters, .6, 0, 0),
				mode: PSM.SINGLE_LINE,
				weight: 1
			},
			{
				image: () => solidCharacters(characters, .6, 0, 3),
				mode: PSM.SINGLE_LINE,
				weight: 1
			},
			{
				image: () => solidCharacters(characters, .6, 2, 0),
				mode: PSM.SINGLE_LINE,
				weight: 1
			}
		] : [],
		{
			image: () => prepare(base, full, -1),
			mode: PSM.SINGLE_LINE
		},
		{
			image: () => prepare(base, full, .5),
			mode: PSM.SINGLE_LINE
		},
		{
			image: () => prepare(base, full, -1),
			mode: PSM.SPARSE_TEXT
		},
		{
			image: () => prepare(base, full, .35),
			mode: PSM.SINGLE_LINE
		},
		...characters ? [] : [{
			image: () => prepare(base, {
				x: .1,
				y: .35,
				w: .8,
				h: .5
			}, -1),
			mode: PSM.SPARSE_TEXT
		}, {
			image: () => prepare(base, {
				x: 0,
				y: .5,
				w: 1,
				h: .5
			}, -1),
			mode: PSM.SPARSE_TEXT
		}]
	];
	const worker = await getWorker();
	const readings = [];
	for (const attempt of attempts) {
		await worker.setParameters({ tessedit_pageseg_mode: attempt.mode });
		const { data } = await worker.recognize(attempt.image());
		if (debugEnabled()) console.info("[OCR]", attempts.indexOf(attempt), JSON.stringify(data.text), data.confidence);
		readings.push({
			candidates: findPlateCandidates(data.text, mercosul, options.strict),
			confidence: Math.max(0, Math.min(1, data.confidence / 100)),
			...attempt.weight ? { weight: attempt.weight } : {}
		});
		const [leader, runnerUp] = tallyVotes(readings);
		if (leader && leader.votes >= 2 && leader.score >= 1.5 * (runnerUp?.score ?? 0)) return {
			plate: leader.plate,
			confidence: agreement(leader, readings.length)
		};
	}
	const [winner] = tallyVotes(readings);
	return winner ? {
		plate: winner.plate,
		confidence: agreement(winner, readings.length)
	} : {
		plate: "",
		confidence: 0
	};
}
var MIN_FRAME_BRIGHTNESS = 24;
var MAX_FRAME_BRIGHTNESS = 238;
var MIN_FRAME_SHARPNESS = 7;
/** Fast exposure and Laplacian checks on the same cropped frame sent to OCR. */
function assessFrameQuality(pixels, width, height) {
	if (width < 3 || height < 3 || pixels.length < width * height * 4) return {
		usable: false,
		brightness: 0,
		sharpness: 0,
		reason: "blurred"
	};
	const luminance = (x, y) => {
		const i = (y * width + x) * 4;
		return .299 * pixels[i] + .587 * pixels[i + 1] + .114 * pixels[i + 2];
	};
	let brightnessTotal = 0;
	let laplacianTotal = 0;
	let samples = 0;
	for (let y = 1; y < height - 1; y += 3) for (let x = 1; x < width - 1; x += 3) {
		const center = luminance(x, y);
		brightnessTotal += center;
		laplacianTotal += Math.abs(4 * center - luminance(x - 1, y) - luminance(x + 1, y) - luminance(x, y - 1) - luminance(x, y + 1));
		samples += 1;
	}
	const brightness = brightnessTotal / samples;
	const sharpness = laplacianTotal / samples;
	const reason = brightness < MIN_FRAME_BRIGHTNESS ? "dark" : brightness > MAX_FRAME_BRIGHTNESS ? "bright" : sharpness < MIN_FRAME_SHARPNESS ? "blurred" : null;
	return {
		usable: reason === null,
		brightness,
		sharpness,
		reason
	};
}
/** Requires several consecutive, exact OCR readings before accepting a plate. */
var PlateReadConfirmation = class {
	candidate = null;
	stableReads = 0;
	observe(plateInput, confidence) {
		const plate = normalizePlate(plateInput);
		if (!isValidPlate(plate) || !Number.isFinite(confidence) || confidence < .75) {
			this.reset();
			return {
				plate: null,
				stableReads: 0,
				confirmed: null
			};
		}
		if (plate === this.candidate) this.stableReads += 1;
		else {
			this.candidate = plate;
			this.stableReads = 1;
		}
		return {
			plate,
			stableReads: this.stableReads,
			confirmed: this.stableReads >= 3 ? plate : null
		};
	}
	reset() {
		this.candidate = null;
		this.stableReads = 0;
	}
};
var STAGES = [
	"Placa",
	"Cliente",
	"Serviços"
];
var STAGE_OF = {
	plate: 0,
	vehicle: 1,
	quick: 1,
	services: 2
};
function NovoAtendimento() {
	const navigate = useNavigate();
	const videoRef = (0, import_react.useRef)(null);
	const leituraPorFoto = useFeature("placa_foto");
	const [scannerOpen, setScannerOpen] = (0, import_react.useState)(false);
	const [scannerMessage, setScannerMessage] = (0, import_react.useState)("");
	const [stableReads, setStableReads] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (leituraPorFoto) preloadPlateOcr();
	}, [leituraPorFoto]);
	const findFn = useServerFn(findVehicleByPlate);
	const servicesFn = useServerFn(listServices);
	const createOrderFn = useServerFn(createOrder);
	const createNewCustomerOrderFn = useServerFn(createNewCustomerOrder);
	const [step, setStep] = (0, import_react.useState)("plate");
	const [direction, setDirection] = (0, import_react.useState)(1);
	const [plate, setPlate] = (0, import_react.useState)("");
	const [confidence, setConfidence] = (0, import_react.useState)(null);
	const [vehicleId, setVehicleId] = (0, import_react.useState)(null);
	const [summary, setSummary] = (0, import_react.useState)(null);
	const [selected, setSelected] = (0, import_react.useState)([]);
	const [cliente, setCliente] = (0, import_react.useState)({
		nome: "",
		telefone: ""
	});
	const [veic, setVeic] = (0, import_react.useState)({
		marca: "",
		modelo: "",
		cor: ""
	});
	(0, import_react.useEffect)(() => {
		if (!scannerOpen) return;
		let cancelled = false;
		let stream = null;
		let timer;
		const videoElement = videoRef.current;
		const canvas = document.createElement("canvas");
		const confirmation = new PlateReadConfirmation();
		const scheduleNextFrame = (delay = 500) => {
			timer = window.setTimeout(() => void scanFrame(), delay);
		};
		async function scanFrame() {
			if (cancelled) return;
			const video = videoElement;
			if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
				setScannerMessage("Iniciando a câmera traseira…");
				scheduleNextFrame(250);
				return;
			}
			let frame = null;
			try {
				const sourceWidth = video.videoWidth * .9;
				const sourceHeight = video.videoHeight * .4;
				const sourceX = video.videoWidth * .05;
				const sourceY = video.videoHeight * .3;
				const scale = Math.min(1, 1400 / sourceWidth);
				canvas.width = Math.round(sourceWidth * scale);
				canvas.height = Math.round(sourceHeight * scale);
				const context = canvas.getContext("2d");
				if (!context) throw new Error("Canvas indisponível.");
				context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
				const quality = assessFrameQuality(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
				if (!quality.usable) {
					confirmation.reset();
					setStableReads(0);
					setScannerMessage(quality.reason === "dark" ? "Imagem escura. Aponte para uma área mais iluminada." : quality.reason === "bright" ? "Imagem com reflexo ou luz forte. Mude um pouco o ângulo." : "Imagem desfocada. Segure o celular firme e aguarde o foco.");
					scheduleNextFrame();
					return;
				}
				frame = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", .9));
				if (!frame) throw new Error("Não foi possível capturar um quadro da câmera.");
			} catch (error) {
				if (!cancelled) {
					console.error("[scanner da placa]", error);
					setScannerMessage("Não consegui analisar este quadro. Mantenha a placa na moldura.");
					scheduleNextFrame();
				}
				return;
			}
			try {
				const result = await readPlateWithOcr(frame, { strict: true });
				if (cancelled) return;
				const progress = confirmation.observe(result.plate, result.confidence);
				setStableReads(progress.stableReads);
				if (progress.confirmed) {
					setPlate(progress.confirmed);
					setConfidence(result.confidence);
					setScannerOpen(false);
					return;
				}
				setScannerMessage(progress.stableReads > 0 ? `Confirmando ${progress.plate}: ${progress.stableReads}/3 leituras estáveis…` : result.plate ? "Leitura instável. Continue mantendo a placa na moldura." : "Procurando a placa. Centralize, aproxime e melhore a iluminação.");
			} catch (error) {
				if (cancelled) return;
				confirmation.reset();
				setStableReads(0);
				console.error("[OCR ao vivo]", error);
				setScannerMessage("A leitura falhou neste quadro. Mantenha a placa visível e tente novamente.");
			}
			if (!cancelled) scheduleNextFrame();
		}
		async function startCamera() {
			if (!navigator.mediaDevices?.getUserMedia) {
				setScannerMessage("Este navegador não oferece acesso à câmera. Tente em outro navegador.");
				return;
			}
			try {
				stream = await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
						facingMode: { ideal: "environment" },
						width: { ideal: 1280 },
						height: { ideal: 720 }
					}
				});
				if (cancelled) {
					stream.getTracks().forEach((track) => track.stop());
					return;
				}
				const video = videoElement;
				if (!video) throw new Error("Vídeo da câmera indisponível.");
				video.srcObject = stream;
				await video.play();
				if (!cancelled) {
					setScannerMessage("Procurando a placa. Centralize na moldura e mantenha o celular firme.");
					scheduleNextFrame(250);
				}
			} catch (error) {
				if (cancelled) return;
				stream?.getTracks().forEach((track) => track.stop());
				stream = null;
				if (videoElement) videoElement.srcObject = null;
				const name = error instanceof DOMException ? error.name : "";
				setScannerMessage(name === "NotAllowedError" ? "Acesso à câmera negado. Libere a câmera nas permissões do navegador e tente novamente." : name === "NotFoundError" ? "Nenhuma câmera foi encontrada neste dispositivo." : "Não foi possível iniciar a câmera. Verifique as permissões e tente novamente.");
			}
		}
		startCamera();
		return () => {
			cancelled = true;
			if (timer !== void 0) window.clearTimeout(timer);
			stream?.getTracks().forEach((track) => track.stop());
			const video = videoElement;
			if (video) {
				video.pause();
				video.srcObject = null;
			}
		};
	}, [scannerOpen]);
	function go(next) {
		setDirection(STAGE_OF[next] >= STAGE_OF[step] ? 1 : -1);
		setStep(next);
	}
	function goBack() {
		if (step === "services") go(vehicleId ? "vehicle" : "quick");
		else if (step === "vehicle" || step === "quick") go("plate");
	}
	const services = useQuery({
		queryKey: ["services"],
		queryFn: () => servicesFn()
	});
	const findMutation = useMutation({
		mutationFn: (placa) => findFn({ data: { placa } }),
		onSuccess: (res) => {
			setSummary(res);
			setPlate(res.placa);
			if (res.vehicle) {
				setVehicleId(res.vehicle.id);
				go("vehicle");
			} else {
				setVehicleId(null);
				go("quick");
			}
		},
		onError: (e) => toast.error(e.message)
	});
	const orderMutation = useMutation({
		mutationFn: () => vehicleId ? createOrderFn({ data: {
			vehicle_id: vehicleId,
			service_ids: selected
		} }) : createNewCustomerOrderFn({ data: {
			placa: plate,
			cliente_nome: cliente.nome,
			cliente_telefone: cliente.telefone,
			marca: veic.marca,
			modelo: veic.modelo,
			cor: veic.cor,
			service_ids: selected
		} }),
		onSuccess: (res) => {
			toast.success("Atendimento criado!");
			navigate({
				to: "/os/$id",
				params: { id: res.orderId }
			});
		},
		onError: (e) => toast.error(e.message)
	});
	const active = (services.data ?? []).filter((s) => s.ativo);
	const subtotal = active.filter((s) => selected.includes(s.id)).reduce((acc, s) => acc + Number(s.preco), 0);
	const stage = STAGE_OF[step];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Novo atendimento",
		back: "/home",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { stage }),
				step !== "plate" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: goBack,
					className: "mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Voltar"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						mode: "wait",
						custom: direction,
						initial: false,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
							custom: direction,
							variants: {
								enter: (dir) => ({
									opacity: 0,
									x: dir * 40
								}),
								center: {
									opacity: 1,
									x: 0
								},
								exit: (dir) => ({
									opacity: 0,
									x: dir * -40
								})
							},
							initial: "enter",
							animate: "center",
							exit: "exit",
							transition: {
								type: "spring",
								stiffness: 420,
								damping: 36
							},
							children: [
								step === "plate" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepTitle, {
											title: "Qual é a placa?",
											text: "Digite a placa ou aponte a câmera. O sistema busca o cliente e o histórico."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
											className: "flex flex-col items-center gap-3",
											onSubmit: (event) => {
												event.preventDefault();
												if (plate.length >= 6) findMutation.mutate(plate);
											},
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateInput, {
													value: plate,
													onChange: (e) => {
														setPlate(normalizePlate(e.target.value).slice(0, 7));
														setConfidence(null);
													},
													placeholder: "ABC1D23",
													"aria-label": "Placa do veículo",
													autoFocus: true
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: confidence !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.p, {
													initial: {
														opacity: 0,
														y: -6
													},
													animate: {
														opacity: 1,
														y: 0
													},
													exit: { opacity: 0 },
													className: "flex items-center gap-1.5 text-xs text-primary",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-3.5" }),
														"Lida ao vivo · confiança ",
														Math.round(confidence * 100),
														"%. Confira antes de seguir."
													]
												}) }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													type: "submit",
													className: "mt-2 h-14 w-full max-w-sm rounded-2xl text-base font-bold shadow-glow",
													disabled: plate.length < 6 || findMutation.isPending,
													children: findMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["CONTINUAR ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5" })] })
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" }),
												" ou",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-px flex-1 bg-border" })
											]
										}),
										leituraPorFoto ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
											type: "button",
											whileTap: { scale: .97 },
											onClick: () => {
												setStableReads(0);
												setScannerMessage("Solicitando acesso à câmera traseira…");
												setScannerOpen(true);
											},
											className: "flex h-20 w-full items-center justify-center gap-3 rounded-3xl border border-primary/40 bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-6" }), " LER PLACA AO VIVO"]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/planos",
											className: "flex h-20 w-full flex-col items-center justify-center gap-1 rounded-3xl border border-dashed border-border text-center text-xs text-muted-foreground hover:border-primary/50 hover:text-primary",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-2 font-bold",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-4" }), " LEITURA DA PLACA PELA CÂMERA"]
											}), "Disponível no plano Max"]
										})
									]
								}),
								step === "vehicle" && summary?.vehicle && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepTitle, {
											title: "Cliente encontrado",
											text: "Confira os dados e escolha os serviços."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-3xl border border-border/60 bg-card p-5 shadow-card",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-center justify-between gap-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateBadge, { plate: summary.vehicle.placa }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded-full border border-success/40 bg-success/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-success",
														children: "Cliente cadastrado"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-4 text-sm text-muted-foreground",
													children: [
														summary.vehicle.marca,
														summary.vehicle.modelo,
														summary.vehicle.cor
													].filter(Boolean).join(" · ") || "Sem dados do veículo"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-4 flex items-center gap-3 border-t border-border/60 pt-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary",
														children: (summary.vehicle.customers?.nome ?? "?").slice(0, 1).toUpperCase()
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "truncate font-semibold",
															children: summary.vehicle.customers?.nome ?? "Sem cliente"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "flex items-center gap-1 text-xs text-muted-foreground",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-3" }), summary.vehicle.customers?.telefone ?? "—"]
														})]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-4 grid grid-cols-3 gap-2 text-center",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
															label: "Visitas",
															value: String(summary.stats?.total ?? 0)
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
															label: "Última",
															value: dateBR(summary.stats?.last ?? null).slice(0, 5)
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniStat, {
															label: "Gasto",
															value: brl(summary.stats?.totalGasto ?? 0)
														})
													]
												}),
												summary.stats?.topServices.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "mt-4 flex items-center gap-2 text-xs text-muted-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(History, { className: "size-3.5 shrink-0 text-primary" }),
														"Costuma fazer:",
														" ",
														summary.stats.topServices.map((service) => service.nome).join(", ")
													]
												}) : null
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											className: "h-14 w-full rounded-2xl text-base font-bold shadow-glow",
											onClick: () => go("services"),
											children: ["ESCOLHER SERVIÇOS ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5" })]
										})
									]
								}),
								step === "quick" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									className: "space-y-5",
									onSubmit: (e) => {
										e.preventDefault();
										const phone = cliente.telefone.replace(/\D/g, "");
										if (cliente.nome.trim().length < 2) {
											toast.error("Informe o nome do cliente.");
											return;
										}
										if (phone.length < 10 || phone.length > 11) {
											toast.error("Informe um telefone válido com DDD.");
											return;
										}
										go("services");
									},
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepTitle, {
											title: "Primeira visita",
											text: "Esta placa ainda não tem cadastro. Leva menos de um minuto."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between gap-4 rounded-3xl border border-warning/40 bg-warning/5 p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateBadge, { plate }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-6 text-warning" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											id: "cnome",
											label: "Nome do cliente",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "cnome",
												value: cliente.nome,
												onChange: (e) => setCliente({
													...cliente,
													nome: e.target.value
												}),
												autoComplete: "name",
												autoFocus: true,
												required: true
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
											id: "ctel",
											label: "Telefone com DDD",
											hint: "Usado para o cliente acompanhar o serviço.",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "ctel",
												inputMode: "tel",
												autoComplete: "tel",
												placeholder: "(85) 99999-1234",
												value: cliente.telefone,
												onChange: (e) => setCliente({
													...cliente,
													telefone: e.target.value
												}),
												required: true,
												minLength: 10
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
											className: "group rounded-2xl border border-border bg-card/60 p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
												className: "cursor-pointer list-none text-sm font-semibold text-muted-foreground",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-primary transition-transform group-open:rotate-45 inline-block mr-2",
													children: "+"
												}), "Dados do veículo (opcional)"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-4 grid grid-cols-2 gap-3",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
														id: "marca",
														label: "Marca",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "marca",
															value: veic.marca,
															onChange: (e) => setVeic({
																...veic,
																marca: e.target.value
															})
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
														id: "modelo",
														label: "Modelo",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
															id: "modelo",
															value: veic.modelo,
															onChange: (e) => setVeic({
																...veic,
																modelo: e.target.value
															})
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "col-span-2",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
															id: "cor",
															label: "Cor",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
																id: "cor",
																value: veic.cor,
																onChange: (e) => setVeic({
																	...veic,
																	cor: e.target.value
																})
															})
														})
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											type: "submit",
											className: "h-14 w-full rounded-2xl text-base font-bold shadow-glow",
											children: ["ESCOLHER SERVIÇOS ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5" })]
										})
									]
								}),
								step === "services" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-4 pb-28",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-end justify-between gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StepTitle, {
												title: "Quais serviços?",
												text: "Uma opção de lavagem por atendimento; adicionais podem ser combinados."
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlateBadge, {
												plate,
												className: "shrink-0"
											})]
										}),
										services.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "space-y-2",
											children: [
												0,
												1,
												2
											].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-[72px] rounded-2xl" }, item))
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "space-y-2",
											children: active.map((s, index) => {
												const on = selected.includes(s.id);
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.button, {
													type: "button",
													"aria-pressed": on,
													initial: {
														opacity: 0,
														y: 10
													},
													animate: {
														opacity: 1,
														y: 0,
														transition: { delay: index * .04 }
													},
													whileTap: { scale: .98 },
													onClick: () => setSelected(toggleServiceSelection(selected, s, active)),
													className: `flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${on ? "border-primary bg-primary/10" : "border-border/60 bg-card hover:border-primary/40"}`,
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: `flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, { children: on && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
																initial: { scale: 0 },
																animate: { scale: 1 },
																exit: { scale: 0 },
																transition: {
																	type: "spring",
																	stiffness: 700,
																	damping: 20
																},
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5" })
															}) })
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "min-w-0 flex-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "block font-semibold",
																children: s.nome
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "mt-0.5 block text-[11px] text-muted-foreground",
																children: [isWashService(s) ? "Lavagem" : "Adicional", s.duracao_min ? ` · ${s.duracao_min} min` : ""]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-sm font-bold tabular-nums",
															children: brl(s.preco)
														})
													]
												}, s.id);
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mx-auto flex max-w-xl items-center gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[10px] uppercase tracking-wider text-muted-foreground",
														children: [
															selected.length,
															" ",
															selected.length === 1 ? "serviço" : "serviços"
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xl font-bold tabular-nums text-primary",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, {
															value: subtotal,
															format: brl
														})
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
													className: "h-13 flex-1 rounded-2xl text-sm font-bold shadow-glow",
													disabled: !selected.length || orderMutation.isPending,
													onClick: () => orderMutation.mutate(),
													children: orderMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : vehicleId ? "CRIAR ATENDIMENTO" : "CADASTRAR E CRIAR"
												})]
											})
										})
									]
								})
							]
						}, step)
					})
				})
			]
		}), scannerOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "plate-scanner-title",
			className: "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-black px-4 py-6 text-white",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex w-full max-w-2xl items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "plate-scanner-title",
						className: "text-lg font-bold",
						children: "Leitura automática da placa"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-white/70",
						children: "Centralize a placa na moldura e mantenha o celular firme."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setScannerOpen(false),
						className: "flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20",
						"aria-label": "Cancelar leitura e fechar câmera",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative aspect-video w-full max-w-2xl overflow-hidden rounded-3xl bg-neutral-900",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
						ref: videoRef,
						autoPlay: true,
						muted: true,
						playsInline: true,
						className: "size-full object-cover",
						"aria-label": "Imagem ao vivo da câmera traseira"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						"aria-hidden": "true",
						className: "pointer-events-none absolute left-[5%] top-[34%] flex h-[32%] w-[90%] items-end justify-center rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(0,0,0,0.3)]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mb-2 rounded-full bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200",
							children: "Área de leitura"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "w-full max-w-2xl space-y-4 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							"aria-live": "polite",
							className: "min-h-10 text-sm text-white/90",
							children: scannerMessage || "Iniciando a câmera traseira…"
						}),
						stableReads > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mx-auto flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold",
							"aria-label": `${stableReads} de 3 leituras estáveis`,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }),
								" ",
								stableReads,
								"/3 leituras estáveis"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setScannerOpen(false),
							className: "h-12 rounded-xl border border-white/30 px-6 text-sm font-bold hover:bg-white/10",
							children: "CANCELAR LEITURA"
						})
					]
				})
			]
		})]
	});
}
function Progress({ stage }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "grid grid-cols-3 gap-2",
		"aria-label": "Etapas do novo atendimento",
		children: STAGES.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			"aria-current": index === stage ? "step" : void 0,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block h-1.5 overflow-hidden rounded-full bg-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
					className: "block h-full origin-left rounded-full bg-primary",
					initial: false,
					animate: { scaleX: index <= stage ? 1 : 0 },
					transition: {
						duration: .4,
						ease: "easeOut"
					}
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `mt-2 block text-[10px] font-bold uppercase tracking-wider ${index === stage ? "text-primary" : index < stage ? "text-foreground" : "text-muted-foreground"}`,
				children: [
					index + 1,
					". ",
					label
				]
			})]
		}, label))
	});
}
function StepTitle({ title, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
		className: "text-2xl font-bold tracking-[-0.04em]",
		children: title
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 text-sm leading-6 text-muted-foreground",
		children: text
	})] });
}
function Field({ id, label, hint, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: id,
				children: label
			}),
			children,
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] text-muted-foreground",
				children: hint
			})
		]
	});
}
function MiniStat({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-border/60 bg-background/40 p-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-0.5 truncate text-sm font-bold",
			children: value
		})]
	});
}
//#endregion
export { NovoAtendimento as component };
