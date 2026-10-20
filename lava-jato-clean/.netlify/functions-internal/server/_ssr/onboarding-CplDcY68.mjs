import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { createTenant, getSession, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { useMutation, useQuery, useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { completeDemoBusinessRegistration, isDemoOnboardingPending } from "./router-BJH1rJwZ.mjs";
import { Button } from "./button-DaOcT_hl.mjs";
import { LoaderCircle } from "../_libs/lucide-react.mjs";
import { AppShell } from "./shell-CXqKyQlN.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
import { Label } from "./label-DgAlJVOt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/onboarding-CplDcY68.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Onboarding() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const session = useServerFn(getSession);
	const create = useServerFn(createTenant);
	const demoOnboardingPending = isDemoOnboardingPending();
	const sessionQuery = useQuery({
		queryKey: ["session"],
		queryFn: () => session(),
		enabled: !demoOnboardingPending
	});
	(0, import_react.useEffect)(() => {
		if (sessionQuery.data?.membership) navigate({
			to: "/home",
			replace: true
		});
	}, [sessionQuery.data, navigate]);
	const [nome, setNome] = (0, import_react.useState)("");
	const [telefone, setTelefone] = (0, import_react.useState)("");
	const [endereco, setEndereco] = (0, import_react.useState)("");
	const mutation = useMutation({
		mutationFn: async () => {
			const result = await create({ data: {
				nome,
				telefone,
				endereco
			} });
			if (demoOnboardingPending) completeDemoBusinessRegistration({
				slug: nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
				nome: nome.trim(),
				telefone: telefone.trim(),
				endereco: endereco.trim(),
				logo_url: null
			});
			return result;
		},
		onSuccess: async () => {
			toast.success(demoOnboardingPending ? "Empresa criada no ambiente de teste!" : "Lava-jato criado!");
			await queryClient.invalidateQueries();
			navigate({
				to: "/home",
				replace: true
			});
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Seu lava-jato",
		children: [
			demoOnboardingPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-5 border border-primary/40 bg-primary/10 p-4 text-xs leading-5 text-primary",
				children: "AMBIENTE DE TESTE — este cadastro fica salvo no servidor local, mas não cria uma empresa na produção."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "Só precisamos de alguns dados para liberar o atendimento."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-6 space-y-4",
				onSubmit: (e) => {
					e.preventDefault();
					mutation.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "nome",
							children: "Nome do lava-jato"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "nome",
							value: nome,
							onChange: (e) => setNome(e.target.value),
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "tel",
							children: "Telefone"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "tel",
							inputMode: "tel",
							value: telefone,
							onChange: (e) => setTelefone(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
							htmlFor: "end",
							children: "Endereço (opcional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							id: "end",
							value: endereco,
							onChange: (e) => setEndereco(e.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "lg",
						className: "h-13 w-full text-base",
						disabled: mutation.isPending,
						children: mutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : "Criar e começar"
					})
				]
			})
		]
	});
}
//#endregion
export { Onboarding as component };
