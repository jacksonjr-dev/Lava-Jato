import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { getDemoOwnerLoginHint, useServerFn, verifyOwnerBusiness } from "./lavajato.functions-Dxb3xMaD.mjs";
import { supabase } from "./client-C55mx54i.mjs";
import { toast } from "../_libs/sonner.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { Route$12, endDemoSession, hasDemoSession, isDemoEnabled, isDemoOnboardingPending, startDemoBusinessSignup, startDemoSession } from "./router-BJH1rJwZ.mjs";
import { Button } from "./button-DaOcT_hl.mjs";
import { WashBrand, WashHoseBackdrop, WashMark } from "./wash-hose-backdrop-NFnLurD2.mjs";
import { LoaderCircle } from "../_libs/lucide-react.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
import { Label } from "./label-DgAlJVOt.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-uDTUFabD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuthPage() {
	const navigate = useNavigate();
	const getDemoLoginHint = useServerFn(getDemoOwnerLoginHint);
	const verifyBusiness = useServerFn(verifyOwnerBusiness);
	const search = Route$12.useSearch();
	const [mode, setMode] = (0, import_react.useState)(search.modo === "cadastro" ? "signup" : "login");
	const [businessName, setBusinessName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [nome, setNome] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (hasDemoSession()) {
			navigate({
				to: isDemoOnboardingPending() ? "/onboarding" : "/home",
				replace: true
			});
			return;
		}
		if (isDemoEnabled()) return;
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) navigate({
				to: "/home",
				replace: true
			});
		});
	}, [navigate]);
	async function submit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			if (mode === "login" && isDemoEnabled()) {
				if (!startDemoSession(email, password)) throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
				try {
					await verifyBusiness({ data: { businessName } });
					navigate({
						to: "/home",
						replace: true
					});
					return;
				} catch {
					endDemoSession();
					throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
				}
			}
			if (mode === "signup") {
				if (isDemoEnabled()) {
					startDemoBusinessSignup(nome, email);
					toast.success("Conta de teste criada. Agora cadastre sua empresa.");
					navigate({
						to: "/onboarding",
						replace: true
					});
					return;
				}
				const { error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: `${window.location.origin}/home`,
						data: { nome }
					}
				});
				if (error) throw error;
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (signInError) {
					toast.success("Conta criada! Confirme seu e-mail para entrar.");
					setMode("login");
					return;
				}
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password
				});
				if (error) throw error;
				try {
					if ((await verifyBusiness({ data: { businessName } })).needsOnboarding) {
						navigate({
							to: "/onboarding",
							replace: true
						});
						return;
					}
				} catch {
					await supabase.auth.signOut();
					throw new Error("Nome do lava-jato, e-mail ou senha incorretos.");
				}
			}
			navigate({
				to: "/home",
				replace: true
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : "Não foi possível entrar.";
			toast.error(message.includes("Invalid login credentials") ? "Nome do lava-jato, e-mail ou senha incorretos." : message === "Failed to fetch" ? "Não foi possível conectar ao serviço de cadastro. Verifique a configuração do Supabase." : message);
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "page-enter flex min-h-screen min-h-dvh items-center bg-hero px-4 py-6 sm:px-5 sm:py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashHoseBackdrop, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
			initial: {
				opacity: 0,
				y: 24,
				scale: .98
			},
			animate: {
				opacity: 1,
				y: 0,
				scale: 1
			},
			transition: {
				type: "spring",
				stiffness: 220,
				damping: 26
			},
			className: "mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-card md:grid-cols-[1fr_1.1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative hidden overflow-hidden border-r border-border bg-brand p-10 text-primary-foreground md:flex md:flex-col md:justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						className: "glow-breathe absolute -right-24 -bottom-24 size-72 rounded-full bg-white/15 blur-2xl"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "inline-flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashMark, { className: "size-8 text-primary-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "plate text-xs",
							children: "LAVAPRO / OPERAÇÃO"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-5xl font-bold leading-[0.95]",
						children: "Controle o pátio. Feche o caixa."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 text-sm leading-6 opacity-75",
						children: "Atendimentos, veículos e financeiro em um fluxo único."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] uppercase tracking-widest",
						children: "Sistema operacional para lava-jato"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-6 md:p-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashBrand, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						mode: "wait",
						initial: false,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
							initial: {
								opacity: 0,
								x: mode === "signup" ? 24 : -24
							},
							animate: {
								opacity: 1,
								x: 0
							},
							exit: {
								opacity: 0,
								x: mode === "signup" ? -24 : 24
							},
							transition: {
								type: "spring",
								stiffness: 420,
								damping: 36
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-3 text-2xl font-bold",
									children: mode === "login" ? "Entrar" : "Criar conta"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted-foreground",
									children: mode === "login" ? "Acesse o painel do seu lava-jato." : `Crie sua conta e ganhe 3 dias do plano Max.`
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: submit,
									className: "mt-8 space-y-4",
									children: [
										mode === "login" && isDemoEnabled() && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "interactive-panel w-full border border-primary/40 bg-primary/10 p-4 text-left text-sm",
											onClick: async () => {
												const hint = await getDemoLoginHint();
												setBusinessName(hint?.businessName ?? "");
												setEmail("demo@lavapro.local");
												setPassword("LavaPro@2026");
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-primary",
												children: "Acesso de demonstração"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "mt-1 block text-xs text-muted-foreground",
												children: "Clique para preencher as credenciais fictícias."
											})]
										}),
										mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "nome",
													children: "Nome do proprietário ou responsável"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "nome",
													autoComplete: "name",
													placeholder: "Nome completo",
													value: nome,
													onChange: (e) => setNome(e.target.value),
													required: true
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs leading-5 text-muted-foreground",
													children: "O nome do lava-jato será informado na próxima etapa."
												})
											]
										}),
										mode === "login" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
													htmlFor: "businessName",
													children: "Nome do lava-jato"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													id: "businessName",
													autoComplete: "organization",
													placeholder: "Nome cadastrado da empresa",
													value: businessName,
													onChange: (e) => setBusinessName(e.target.value),
													required: true
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs leading-5 text-muted-foreground",
													children: "Informe o nome usado no cadastro do lava-jato."
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "email",
												children: "E-mail"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "email",
												type: "email",
												autoComplete: "email",
												value: email,
												onChange: (e) => setEmail(e.target.value),
												required: true
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "password",
												children: "Senha"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "password",
												type: "password",
												autoComplete: mode === "login" ? "current-password" : "new-password",
												value: password,
												onChange: (e) => setPassword(e.target.value),
												minLength: 6,
												required: true
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											size: "lg",
											className: "h-13 w-full rounded-2xl text-base shadow-glow transition-transform active:scale-[0.98]",
											disabled: loading,
											children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : mode === "login" ? "Entrar" : "Criar conta"
										})
									]
								})
							]
						}, mode)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-6 w-full text-sm text-muted-foreground underline-offset-4 hover:underline",
						onClick: () => setMode(mode === "login" ? "signup" : "login"),
						children: mode === "login" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"
					})
				]
			})]
		})]
	});
}
//#endregion
export { AuthPage as component };
