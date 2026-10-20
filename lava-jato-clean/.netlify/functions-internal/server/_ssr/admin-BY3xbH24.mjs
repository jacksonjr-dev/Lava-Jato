import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { adminListTenants, adminUpdateSubscription, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { dateBR } from "./plate-C5WvEduv.mjs";
import { PLANS } from "./plans-CITMHSEu.mjs";
import { useMutation, useQuery, useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { LoaderCircle, Search } from "../_libs/lucide-react.mjs";
import { AppShell } from "./shell-CXqKyQlN.mjs";
import { Skeleton } from "./skeleton-CZb5vrGH.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-BY3xbH24.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STATUS_STYLE = {
	TESTE: "border-primary/40 text-primary",
	ATIVA: "border-success/40 text-success",
	TOLERANCIA: "border-warning/50 text-warning",
	GRATIS: "border-border text-muted-foreground"
};
var STATUS_LABEL = {
	TESTE: "TESTE",
	ATIVA: "ATIVA",
	TOLERANCIA: "VENCIDA",
	GRATIS: "GRÁTIS"
};
function AdminPage() {
	const queryClient = useQueryClient();
	const listFn = useServerFn(adminListTenants);
	const updateFn = useServerFn(adminUpdateSubscription);
	const query = useQuery({
		queryKey: ["admin-tenants"],
		queryFn: () => listFn()
	});
	const [search, setSearch] = (0, import_react.useState)("");
	const mutation = useMutation({
		mutationFn: (input) => updateFn({ data: input }),
		onSuccess: async () => {
			toast.success("Assinatura atualizada.");
			await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-tenants"] }), queryClient.invalidateQueries({ queryKey: ["session"] })]);
		},
		onError: (error) => toast.error(error.message)
	});
	const tenants = (0, import_react.useMemo)(() => {
		const term = search.trim().toLocaleLowerCase("pt-BR");
		const all = query.data ?? [];
		if (!term) return all;
		return all.filter((tenant) => [
			tenant.nome,
			tenant.slug,
			tenant.owner_email ?? "",
			tenant.telefone ?? ""
		].some((value) => value.toLocaleLowerCase("pt-BR").includes(term)));
	}, [query.data, search]);
	function run(tenantId, change, confirmText) {
		if (confirmText && !window.confirm(confirmText)) return;
		mutation.mutate({
			tenantId,
			change
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Administração",
		back: "/home",
		wide: true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-primary",
						children: "Somente equipe LavaPro"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-2 text-[clamp(1.75rem,6vw,3rem)] font-bold tracking-[-0.06em]",
						children: "Empresas e assinaturas"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-xl text-xs leading-5 text-muted-foreground",
						children: "Libere o plano depois de confirmar o pagamento. Renovar o mesmo plano soma 30 dias ao vencimento atual; trocar de plano começa a contar hoje."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: search,
						onChange: (event) => setSearch(event.target.value),
						placeholder: "Buscar empresa, e-mail ou telefone",
						className: "pl-9"
					})]
				})]
			}),
			query.isLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 grid gap-3",
				"aria-label": "Carregando empresas",
				children: [
					0,
					1,
					2
				].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-36 rounded-2xl" }, item))
			}),
			query.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "my-8 border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive",
				children: query.error.message
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 grid gap-3",
				children: [tenants.map((tenant) => {
					const sub = tenant.subscription;
					const busy = mutation.isPending && mutation.variables?.tenantId === tenant.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "border border-border bg-card p-4 md:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "truncate text-base font-bold",
										children: tenant.nome
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-1 truncate text-xs text-muted-foreground",
										children: [
											tenant.owner_email ?? "sem e-mail",
											" · ",
											tenant.telefone ?? "sem telefone",
											" · desde ",
											dateBR(tenant.created_at)
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `border px-2 py-1 text-[10px] font-bold ${STATUS_STYLE[sub.status]}`,
									children: [
										STATUS_LABEL[sub.status],
										" · ",
										PLANS[sub.effectivePlan].nome.toUpperCase()
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-3 text-xs text-muted-foreground",
								children: [
									"Contratado: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "text-foreground",
										children: PLANS[sub.plan].nome
									}),
									sub.expiresAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · vence ", dateBR(sub.expiresAt)] }),
									sub.trialEndsAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · teste até ", dateBR(sub.trialEndsAt)] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										disabled: busy,
										onClick: () => run(tenant.id, {
											action: "ATIVAR",
											plan: "BASICO",
											days: 30
										}),
										children: "Básico +30 dias"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										disabled: busy,
										onClick: () => run(tenant.id, {
											action: "ATIVAR",
											plan: "MAX",
											days: 30
										}),
										children: "Max +30 dias"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										disabled: busy,
										onClick: () => run(tenant.id, {
											action: "ESTENDER_TESTE",
											days: 7
										}),
										children: "Teste +7 dias"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
										disabled: busy,
										danger: true,
										onClick: () => run(tenant.id, { action: "GRATIS" }, `Voltar "${tenant.nome}" para o plano Grátis agora? O teste e o plano pago são encerrados.`),
										children: "Voltar ao Grátis"
									}),
									busy && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin self-center text-primary" })
								]
							})
						]
					}, tenant.id);
				}), query.data && tenants.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-8 text-sm text-muted-foreground",
					children: "Nenhuma empresa encontrada."
				})]
			})
		]
	});
}
function ActionButton({ children, onClick, disabled, danger }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		disabled,
		className: `h-9 border px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${danger ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-border hover:border-primary/60 hover:text-primary"}`,
		children
	});
}
//#endregion
export { AdminPage as component };
