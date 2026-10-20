import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link, useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { getSession, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { dateBR } from "./plate-C5WvEduv.mjs";
import { FEATURE_LABEL, PLANS, hasFeature, minimumPlanFor } from "./plans-CITMHSEu.mjs";
import { supabase } from "./client-C55mx54i.mjs";
import { useQuery, useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { m } from "../_libs/motion.mjs";
import { endDemoSession, getDemoBusiness, hasDemoSession, isDemoOnboardingPending } from "./router-BJH1rJwZ.mjs";
import { Button, cn } from "./button-DaOcT_hl.mjs";
import { WashHoseBackdrop, WashMark } from "./wash-hose-backdrop-NFnLurD2.mjs";
import { TenantLogo } from "./tenant-logo-B6jOuKk0.mjs";
import { ArrowLeft, Building2, Car, Check, ChevronRight, Circle, Crown, House, Lock, LogOut, Menu, ShieldCheck, Sparkles, WalletCards, Wrench } from "../_libs/lucide-react.mjs";
import { CheckboxItem2, Content2, Item2, ItemIndicator2, Label2, Portal2, RadioItem2, Root2, Separator2, SubContent2, SubTrigger2, Trigger } from "../_libs/@radix-ui/react-dropdown-menu+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shell-CXqKyQlN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var DropdownMenu = Root2;
var DropdownMenuTrigger = Trigger;
var DropdownMenuSubTrigger = import_react.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SubTrigger2, {
	ref,
	className: cn("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "ml-auto" })]
}));
DropdownMenuSubTrigger.displayName = SubTrigger2.displayName;
var DropdownMenuSubContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubContent2, {
	ref,
	className: cn("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}));
DropdownMenuSubContent.displayName = SubContent2.displayName;
var DropdownMenuContent = import_react.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Portal2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content2, {
	ref,
	sideOffset,
	className: cn("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)", className),
	...props
}) }));
DropdownMenuContent.displayName = Content2.displayName;
var DropdownMenuItem = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Item2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0", inset && "pl-8", className),
	...props
}));
DropdownMenuItem.displayName = Item2.displayName;
var DropdownMenuCheckboxItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CheckboxItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), children]
}));
DropdownMenuCheckboxItem.displayName = CheckboxItem2.displayName;
var DropdownMenuRadioItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadioItem2, {
	ref,
	className: cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemIndicator2, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "h-2 w-2 fill-current" }) })
	}), children]
}));
DropdownMenuRadioItem.displayName = RadioItem2.displayName;
var DropdownMenuLabel = import_react.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label2, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
	...props
}));
DropdownMenuLabel.displayName = Label2.displayName;
var DropdownMenuSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator2, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
DropdownMenuSeparator.displayName = Separator2.displayName;
var DropdownMenuShortcut = ({ className, ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("ml-auto text-xs tracking-widest opacity-60", className),
		...props
	});
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";
/** Sessão compartilhada (mesma chave usada pelo AppShell e demais telas). */
function useSessionQuery() {
	const session = useServerFn(getSession);
	return useQuery({
		queryKey: ["session"],
		queryFn: () => session(),
		staleTime: 6e4,
		enabled: !isDemoOnboardingPending()
	});
}
function useSubscription() {
	return useSessionQuery().data?.subscription ?? null;
}
/**
* true enquanto a sessão carrega, para não piscar o cadeado; a trava de
* verdade está no servidor.
*/
function useFeature(feature) {
	const subscription = useSubscription();
	return subscription ? hasFeature(subscription, feature) : true;
}
function SubscriptionBanner() {
	const { data } = useSessionQuery();
	const subscription = data?.subscription;
	if (!subscription) return null;
	let message = null;
	if (subscription.status === "TESTE") {
		const days = subscription.daysLeft ?? 0;
		message = `Teste grátis do plano Max: ${days === 1 ? "falta 1 dia" : `faltam ${days} dias`}.`;
	} else if (subscription.status === "TOLERANCIA") message = `Seu plano ${PLANS[subscription.plan].nome} venceu. Regularize até ${dateBR(subscription.graceEndsAt)} para não voltar ao Grátis.`;
	else if (subscription.status === "GRATIS") message = `Plano Grátis: ${data?.usage?.ordersThisMonth ?? 0} de ${subscription.monthlyOrderLimit} atendimentos usados este mês.`;
	else if (subscription.daysLeft !== null && subscription.daysLeft <= 5) message = `Seu plano ${PLANS[subscription.plan].nome} vence em ${dateBR(subscription.expiresAt)}.`;
	if (!message) return null;
	const warning = subscription.status === "TOLERANCIA";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b px-4 py-2 text-center text-[11px] ${warning ? "border-warning/40 bg-warning/15 text-warning" : "border-primary/30 bg-primary/10 text-primary"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: message }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/planos",
			className: "font-bold underline underline-offset-2",
			children: "Ver planos"
		})]
	});
}
/** Card exibido no lugar de um recurso que o plano atual não inclui. */
function UpgradeNotice({ feature, compact }) {
	const plan = minimumPlanFor(feature);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `border border-primary/40 bg-card text-center ${compact ? "p-4" : "p-8 md:p-12"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mx-auto inline-flex size-11 items-center justify-center border border-primary/40 text-primary",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: `mt-4 font-bold ${compact ? "text-sm" : "text-xl"}`,
				children: FEATURE_LABEL[feature]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground",
				children: [
					"Disponível a partir do plano ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "text-foreground",
						children: plan.nome
					}),
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/planos",
				className: "mt-5 inline-flex h-11 items-center gap-2 border border-primary bg-brand px-5 text-xs font-bold text-primary-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }), "CONHECER OS PLANOS"]
			})
		]
	});
}
function AppShell({ title, back, children, action, wide = false }) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const sessionQuery = useSessionQuery();
	const financeiroLiberado = useFeature("financeiro");
	const logoLiberado = useFeature("logo");
	const demoBusiness = getDemoBusiness();
	const businessName = demoBusiness?.nome ?? sessionQuery.data?.tenant?.nome;
	const tabs = [
		{
			to: "/home",
			label: "Operação",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, {})
		},
		{
			to: "/servicos",
			label: "Serviços",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, {})
		},
		{
			to: "/financeiro",
			label: "Financeiro",
			icon: financeiroLiberado ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletCards, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {}),
			locked: !financeiroLiberado
		},
		{
			to: "/veiculos",
			label: "Veículos",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, {})
		}
	];
	async function signOut() {
		await queryClient.cancelQueries();
		queryClient.clear();
		if (hasDemoSession()) endDemoSession();
		else await supabase.auth.signOut();
		navigate({
			to: "/auth",
			replace: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen min-h-dvh flex-col bg-hero",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashHoseBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "wash-header sticky top-0 z-30 border-b border-border bg-background/95",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 md:px-6",
					children: [
						back ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: back,
							className: "-ml-2 rounded-full p-2 transition-colors hover:bg-secondary",
							"aria-label": "Voltar",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" })
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/home",
							"aria-label": "Início",
							className: "shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TenantLogo, {
								url: logoLiberado ? sessionQuery.data?.tenant?.logo_url : null,
								name: businessName ?? "lava-jato",
								className: "size-8",
								fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashMark, { className: "size-7 text-primary" })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1 md:flex-none",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "truncate text-sm font-bold uppercase tracking-[0.08em]",
								children: title
							}), businessName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-0.5 truncate text-[10px] text-muted-foreground",
								children: businessName
							}) : null]
						}),
						!back && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							"aria-label": "Navegação principal",
							className: "mx-auto hidden md:flex",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-1 rounded-full border border-border bg-card/70 p-1",
								children: tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: tab.to,
									activeProps: { className: "text-primary-foreground" },
									inactiveProps: { className: "text-muted-foreground hover:text-foreground" },
									className: "relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors [&_svg]:size-4",
									children: ({ isActive }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
										layoutId: "desktop-nav-pill",
										className: "absolute inset-0 rounded-full bg-primary shadow-glow"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "relative z-10 flex items-center gap-2",
										children: [tab.icon, tab.label]
									})] })
								}, tab.to))
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: back ? "ml-auto" : "md:ml-0",
							children: action ?? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountMenu, {
								businessName,
								isPlatformAdmin: Boolean(sessionQuery.data?.isPlatformAdmin),
								onSignOut: () => void signOut()
							})
						})
					]
				})
			}),
			demoBusiness ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-primary/30 bg-primary/10 px-4 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-primary",
				children: "Ambiente de teste · dados simulados"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubscriptionBanner, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.main, {
				initial: {
					opacity: 0,
					y: 10
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					type: "spring",
					stiffness: 300,
					damping: 30
				},
				className: `mx-auto w-full flex-1 px-4 py-6 md:px-6 md:py-8 ${wide ? "max-w-6xl" : "max-w-5xl"}`,
				children
			}),
			!back && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				"aria-label": "Navegação principal",
				className: "sticky bottom-0 z-30 border-t border-border bg-background/95 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto grid max-w-md grid-cols-4 gap-1",
					children: tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: tab.to,
						activeProps: { className: "text-primary" },
						inactiveProps: { className: "text-muted-foreground" },
						className: "flex min-w-0 flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-bold uppercase tracking-wide transition-colors",
						children: ({ isActive }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.span, {
							whileTap: { scale: .86 },
							className: "relative flex h-8 w-14 items-center justify-center [&_svg]:size-5",
							children: [isActive && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
								layoutId: "mobile-tab-pill",
								className: "absolute inset-0 rounded-full bg-primary/15"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
								className: "relative z-10",
								animate: isActive ? {
									y: -1,
									scale: 1.08
								} : {
									y: 0,
									scale: 1
								},
								children: tab.icon
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "max-w-full truncate",
							children: tab.label
						})] })
					}, tab.to))
				})
			})
		]
	});
}
function AccountMenu({ businessName, isPlatformAdmin, onSignOut }) {
	const itemClass = "rounded-xl px-3 py-3 focus:bg-primary/10 focus:text-primary";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenu, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuTrigger, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			variant: "ghost",
			size: "icon",
			className: "rounded-xl transition-transform duration-200 hover:scale-105 active:scale-90",
			"aria-label": "Abrir menu da conta",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuContent, {
		align: "end",
		className: "w-64 rounded-2xl border-primary/25 bg-card/98 p-2 shadow-xl backdrop-blur",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuLabel, {
				className: "px-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-xs text-muted-foreground",
					children: "Lava-jato"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mt-0.5 block truncate text-sm",
					children: businessName ?? "Minha empresa"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				asChild: true,
				className: itemClass,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/perfil",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {}), "Perfil do lava-jato"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				asChild: true,
				className: itemClass,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/planos",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, {}), "Planos e assinatura"]
				})
			}),
			isPlatformAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuItem, {
				asChild: true,
				className: itemClass,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/admin",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {}), "Administração LavaPro"]
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DropdownMenuSeparator, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DropdownMenuItem, {
				className: "rounded-xl px-3 py-3 text-destructive focus:bg-destructive/10 focus:text-destructive",
				onSelect: onSignOut,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {}), "Sair"]
			})
		]
	})] });
}
//#endregion
export { AppShell, UpgradeNotice, useFeature, useSessionQuery };
