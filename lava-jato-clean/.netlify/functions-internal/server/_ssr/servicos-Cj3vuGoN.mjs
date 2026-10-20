import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { createService, deactivateService, getSession, listServices, updateService, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { brl } from "./plate-C5WvEduv.mjs";
import { useMutation, useQuery, useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { AnimatePresence } from "../_libs/framer-motion+[...].mjs";
import { m } from "../_libs/motion.mjs";
import { Button, cn } from "./button-DaOcT_hl.mjs";
import { Check, ChevronDown, ChevronUp, Clock3, LoaderCircle, Pencil, Plus, Power, PowerOff, Wrench, X } from "../_libs/lucide-react.mjs";
import { Dialog as Dialog$1, DialogClose, DialogContent as DialogContent$1, DialogDescription as DialogDescription$1, DialogOverlay as DialogOverlay$1, DialogPortal as DialogPortal$1, DialogTitle as DialogTitle$1 } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { AppShell } from "./shell-CXqKyQlN.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
import { Label } from "./label-DgAlJVOt.mjs";
import { Select as Select$1, SelectContent as SelectContent$1, SelectIcon, SelectItem as SelectItem$1, SelectItemIndicator, SelectItemText, SelectLabel as SelectLabel$1, SelectPortal, SelectScrollDownButton as SelectScrollDownButton$1, SelectScrollUpButton as SelectScrollUpButton$1, SelectSeparator as SelectSeparator$1, SelectTrigger as SelectTrigger$1, SelectValue as SelectValue$1, SelectViewport } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/servicos-Cj3vuGoN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Dialog = Dialog$1;
var DialogPortal = DialogPortal$1;
var DialogOverlay = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay$1, {
	ref,
	className: cn("fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
	...props
}));
DialogOverlay.displayName = DialogOverlay$1.displayName;
var DialogContent = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent$1, {
	ref,
	className: cn("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogClose, {
		className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "sr-only",
			children: "Close"
		})]
	})]
})] }));
DialogContent.displayName = DialogContent$1.displayName;
var DialogHeader = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className),
	...props
});
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({ className, ...props }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
	...props
});
DialogFooter.displayName = "DialogFooter";
var DialogTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle$1, {
	ref,
	className: cn("text-lg font-semibold leading-none tracking-tight", className),
	...props
}));
DialogTitle.displayName = DialogTitle$1.displayName;
var DialogDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription$1, {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
DialogDescription.displayName = DialogDescription$1.displayName;
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
var Textarea = import_react.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
var emptyDraft = {
	nome: "",
	descricao: "",
	preco: "",
	duracao: "",
	categoria: "ADICIONAL"
};
function ServicesCatalog() {
	const queryClient = useQueryClient();
	const listFn = useServerFn(listServices);
	const sessionFn = useServerFn(getSession);
	const createFn = useServerFn(createService);
	const updateFn = useServerFn(updateService);
	const deactivateFn = useServerFn(deactivateService);
	const [draft, setDraft] = (0, import_react.useState)(emptyDraft);
	const [formOpen, setFormOpen] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const [editDraft, setEditDraft] = (0, import_react.useState)(emptyDraft);
	const session = useQuery({
		queryKey: ["session"],
		queryFn: () => sessionFn()
	});
	const services = useQuery({
		queryKey: ["services"],
		queryFn: () => listFn()
	});
	const canManage = session.data?.membership?.role !== "EMPLOYEE";
	async function refreshServices() {
		await queryClient.invalidateQueries({ queryKey: ["services"] });
	}
	const createMutation = useMutation({
		mutationFn: () => createFn({ data: {
			nome: draft.nome,
			descricao: draft.descricao,
			preco: Number(draft.preco),
			duracao_min: draft.duracao ? Number(draft.duracao) : void 0,
			categoria: draft.categoria
		} }),
		onSuccess: async () => {
			setDraft(emptyDraft);
			await refreshServices();
			toast.success("Serviço adicionado ao catálogo.");
		},
		onError: (error) => toast.error(error.message)
	});
	const updateMutation = useMutation({
		mutationFn: () => {
			if (!editing) throw new Error("Serviço não selecionado.");
			return updateFn({ data: {
				id: editing.id,
				nome: editDraft.nome,
				descricao: editDraft.descricao,
				preco: Number(editDraft.preco),
				duracao_min: editDraft.duracao ? Number(editDraft.duracao) : null,
				categoria: editDraft.categoria
			} });
		},
		onSuccess: async () => {
			setEditing(null);
			await refreshServices();
			toast.success("Serviço atualizado.");
		},
		onError: (error) => toast.error(error.message)
	});
	const statusMutation = useMutation({
		mutationFn: async (service) => {
			if (service.ativo) return deactivateFn({ data: { id: service.id } });
			return updateFn({ data: {
				id: service.id,
				ativo: true
			} });
		},
		onSuccess: async (_data, service) => {
			await refreshServices();
			toast.success(service.ativo ? "Serviço desativado." : "Serviço reativado.");
		},
		onError: (error) => toast.error(error.message)
	});
	const rows = services.data ?? [];
	const activeCount = rows.filter((service) => service.ativo).length;
	function startEditing(service) {
		setEditing(service);
		setEditDraft({
			nome: service.nome,
			descricao: service.descricao ?? "",
			preco: String(service.preco),
			duracao: service.duracao_min ? String(service.duracao_min) : "",
			categoria: service.categoria === "LAVAGEM" ? "LAVAGEM" : "ADICIONAL"
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, {
		title: "Serviços",
		wide: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-5 lg:grid-cols-[0.85fr_1.15fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "interactive-panel h-fit border border-primary/35 bg-card p-5 md:p-7",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setFormOpen((open) => !open),
					"aria-expanded": formOpen,
					className: "flex w-full items-start gap-3 text-left lg:pointer-events-none lg:border-b lg:border-border lg:pb-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-2xl border border-primary/30 bg-primary/10 p-3 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: `size-5 transition-transform duration-300 ${formOpen ? "rotate-45 lg:rotate-0" : ""}` })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-bold",
								children: "Adicionar serviço"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-5 text-muted-foreground",
								children: "Este serviço ficará disponível somente para este lava-jato."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: `mt-3 size-5 shrink-0 text-muted-foreground transition-transform duration-300 lg:hidden ${formOpen ? "rotate-180" : ""}` })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
					initial: false,
					animate: formOpen ? {
						height: "auto",
						opacity: 1
					} : {
						height: 0,
						opacity: 0
					},
					transition: {
						duration: .32,
						ease: [
							.2,
							.75,
							.25,
							1
						]
					},
					className: "overflow-hidden lg:!h-auto lg:!overflow-visible lg:!opacity-100",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 border-t border-border pt-5 lg:border-0 lg:pt-0",
						children: canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "space-y-4",
							onSubmit: (event) => {
								event.preventDefault();
								createMutation.mutate();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceFields, {
								draft,
								onChange: setDraft,
								prefix: "new-service"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								type: "submit",
								className: "h-13 w-full rounded-2xl",
								disabled: createMutation.isPending,
								children: createMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-5" }), " Adicionar ao catálogo"] })
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "Apenas proprietários e gerentes podem alterar o catálogo."
						})
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "interactive-panel border border-border bg-card p-5 md:p-7",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold text-primary",
						children: "CATÁLOGO DESTA EMPRESA"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-1 text-xl font-bold",
						children: "Serviços disponíveis"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-xl border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground",
						children: [
							activeCount,
							" ativos · ",
							rows.length,
							" cadastrados"
						]
					})]
				}), services.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex min-h-48 items-center justify-center text-primary",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "size-6 animate-spin",
						"aria-label": "Carregando serviços"
					})
				}) : rows.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-5 space-y-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AnimatePresence, {
						initial: true,
						mode: "popLayout",
						children: rows.map((service, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.article, {
							layout: true,
							initial: {
								opacity: 0,
								y: 14
							},
							animate: {
								opacity: service.ativo ? 1 : .65,
								y: 0,
								transition: { delay: Math.min(index, 8) * .04 }
							},
							exit: {
								opacity: 0,
								scale: .95
							},
							className: `rounded-2xl border p-4 transition-colors ${service.ativo ? "border-border bg-background/45 hover:border-primary/40" : "border-border/60 bg-background/20"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "break-words font-bold",
												children: service.nome
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded-lg border border-primary/25 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary",
												children: service.categoria === "LAVAGEM" ? "LAVAGEM" : "ADICIONAL"
											}),
											!service.ativo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground",
												children: "INATIVO"
											}) : null
										]
									}), service.descricao ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-2 text-xs leading-5 text-muted-foreground",
										children: service.descricao
									}) : null]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "shrink-0 text-lg font-bold text-primary",
									children: brl(service.preco)
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "flex items-center gap-2 text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "size-4" }), service.duracao_min ? `${service.duracao_min} minutos` : "Sem duração definida"]
								}), canManage ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										size: "sm",
										variant: "outline",
										className: "rounded-xl",
										onClick: () => startEditing(service),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), " Editar"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										type: "button",
										size: "sm",
										variant: "outline",
										className: "rounded-xl",
										disabled: statusMutation.isPending,
										onClick: () => statusMutation.mutate(service),
										children: [service.ativo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PowerOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Power, { className: "size-4" }), service.ativo ? "Desativar" : "Reativar"]
									})]
								}) : null]
							})]
						}, service.id))
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-56 flex-col items-center justify-center text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-8 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 font-bold",
							children: "Nenhum serviço cadastrado"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 max-w-xs text-xs leading-5 text-muted-foreground",
							children: "Adicione o primeiro serviço para iniciar novos atendimentos."
						})
					]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: editing !== null,
			onOpenChange: (open) => !open && setEditing(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "max-h-[90vh] overflow-y-auto rounded-3xl border-primary/30 bg-card sm:max-w-lg",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Editar serviço" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "A alteração vale para novos atendimentos. O histórico mantém o nome e o preço registrados." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-3 space-y-4",
					onSubmit: (event) => {
						event.preventDefault();
						updateMutation.mutate();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ServiceFields, {
						draft: editDraft,
						onChange: setEditDraft,
						prefix: "edit-service"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "h-12 w-full rounded-2xl",
						disabled: updateMutation.isPending,
						children: updateMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : "Salvar serviço"
					})]
				})]
			})
		})]
	});
}
function ServiceFields({ draft, onChange, prefix }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: `${prefix}-name`,
			children: "Nome do serviço"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			id: `${prefix}-name`,
			className: "mt-2",
			value: draft.nome,
			onChange: (event) => onChange({
				...draft,
				nome: event.target.value
			}),
			maxLength: 80,
			placeholder: "Ex.: Higienização de bancos",
			required: true
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-4 sm:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: `${prefix}-price`,
				children: "Preço"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				id: `${prefix}-price`,
				className: "mt-2",
				type: "number",
				min: "0",
				max: "100000",
				step: "0.01",
				inputMode: "decimal",
				value: draft.preco,
				onChange: (event) => onChange({
					...draft,
					preco: event.target.value
				}),
				placeholder: "0,00",
				required: true
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
				htmlFor: `${prefix}-duration`,
				children: "Duração estimada (min)"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				id: `${prefix}-duration`,
				className: "mt-2",
				type: "number",
				min: "1",
				max: "1440",
				inputMode: "numeric",
				value: draft.duracao,
				onChange: (event) => onChange({
					...draft,
					duracao: event.target.value
				}),
				placeholder: "60"
			})] })]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: `${prefix}-category`,
			children: "Categoria"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
			value: draft.categoria,
			onValueChange: (categoria) => onChange({
				...draft,
				categoria
			}),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
				id: `${prefix}-category`,
				className: "mt-2 h-11 rounded-xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: "ADICIONAL",
				children: "Adicional — pode combinar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
				value: "LAVAGEM",
				children: "Lavagem — apenas uma"
			})] })]
		})] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor: `${prefix}-description`,
			children: "Descrição"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
			id: `${prefix}-description`,
			className: "mt-2 min-h-24 rounded-xl",
			value: draft.descricao,
			onChange: (event) => onChange({
				...draft,
				descricao: event.target.value
			}),
			maxLength: 240,
			placeholder: "Explique o que está incluído no serviço"
		})] })
	] });
}
//#endregion
export { ServicesCatalog as component };
