import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { Avatar as Avatar$1, AvatarFallback as AvatarFallback$1, AvatarImage as AvatarImage$1, require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { getSession, setTenantLogo, updateTenantProfile, useServerFn } from "./lavajato.functions-Dxb3xMaD.mjs";
import { useMutation, useQuery, useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { toast } from "../_libs/sonner.mjs";
import { Button, cn } from "./button-DaOcT_hl.mjs";
import { WashMark } from "./wash-hose-backdrop-NFnLurD2.mjs";
import { TenantLogo } from "./tenant-logo-B6jOuKk0.mjs";
import { Building2, CircleCheck, Clock3, Eye, EyeOff, ImageUp, LoaderCircle, MapPin, Phone, Trash2, WalletCards } from "../_libs/lucide-react.mjs";
import { AppShell, UpgradeNotice, useFeature } from "./shell-CXqKyQlN.mjs";
import { Input } from "./input-DnEHUyw4.mjs";
import { Label } from "./label-DgAlJVOt.mjs";
import { BUSINESS_DAYS, emptyBusinessHours, normalizeBusinessHours } from "./business-hours-CNCSnIUh.mjs";
import { Switch as Switch$1, SwitchThumb } from "../_libs/radix-ui__react-switch.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/perfil-iq-okhQt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MAX_SIDE = 512;
/** Reduz a imagem (máx. 512px) e converte para WebP, mantendo a transparência. */
async function toLogoDataUrl(file) {
	if (!file.type.startsWith("image/")) throw new Error("Escolha um arquivo de imagem.");
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement("canvas");
	canvas.width = Math.max(1, Math.round(bitmap.width * scale));
	canvas.height = Math.max(1, Math.round(bitmap.height * scale));
	canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();
	const webp = canvas.toDataURL("image/webp", .9);
	return webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png");
}
function LogoUploader({ logoUrl, name, onChange }) {
	const inputRef = (0, import_react.useRef)(null);
	const saveLogo = useServerFn(setTenantLogo);
	const mutation = useMutation({
		mutationFn: async (file) => saveLogo({ data: { image: file ? await toLogoDataUrl(file) : null } }),
		onSuccess: async (result, file) => {
			await onChange(result.logo_url);
			toast.success(file ? "Logo atualizado." : "Logo removido.");
		},
		onError: (error) => toast.error(error.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm font-medium",
		children: "Logo do lava-jato"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-background/40 p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-border bg-secondary",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TenantLogo, {
				url: logoUrl || null,
				name: name || "lava-jato",
				className: "size-full rounded-none p-1.5",
				fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashMark, { className: "size-9 text-primary" })
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs leading-5 text-muted-foreground",
				children: "Aparece no topo do sistema e na área do cliente. PNG, JPG ou WebP; de preferência quadrado e com fundo transparente."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						type: "file",
						accept: "image/png,image/jpeg,image/webp",
						className: "hidden",
						onChange: (event) => {
							const file = event.target.files?.[0];
							if (file) mutation.mutate(file);
							event.target.value = "";
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						size: "sm",
						disabled: mutation.isPending,
						onClick: () => inputRef.current?.click(),
						children: [mutation.isPending && mutation.variables !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageUp, { className: "size-4" }), logoUrl ? "Trocar logo" : "Enviar logo"]
					}),
					logoUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						size: "sm",
						variant: "ghost",
						disabled: mutation.isPending,
						onClick: () => mutation.mutate(null),
						className: "text-muted-foreground hover:text-destructive",
						children: [mutation.isPending && mutation.variables === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Remover"]
					})
				]
			})]
		})]
	})] });
}
var Avatar = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Avatar$1, {
	ref,
	className: cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
	...props
}));
Avatar.displayName = Avatar$1.displayName;
var AvatarImage = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage$1, {
	ref,
	className: cn("aspect-square h-full w-full", className),
	...props
}));
AvatarImage.displayName = AvatarImage$1.displayName;
var AvatarFallback = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback$1, {
	ref,
	className: cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
	...props
}));
AvatarFallback.displayName = AvatarFallback$1.displayName;
var Switch = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
	className: cn("peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input", className),
	...props,
	ref,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: cn("pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0") })
}));
Switch.displayName = Switch$1.displayName;
function BusinessProfile() {
	const queryClient = useQueryClient();
	const getCurrentSession = useServerFn(getSession);
	const saveProfile = useServerFn(updateTenantProfile);
	const sessionQuery = useQuery({
		queryKey: ["session"],
		queryFn: () => getCurrentSession()
	});
	const tenant = sessionQuery.data?.tenant;
	const [nome, setNome] = (0, import_react.useState)("");
	const [telefone, setTelefone] = (0, import_react.useState)("");
	const [endereco, setEndereco] = (0, import_react.useState)("");
	const [businessHours, setBusinessHours] = (0, import_react.useState)(() => emptyBusinessHours());
	const [logoUrl, setLogoUrl] = (0, import_react.useState)("");
	const [publicListing, setPublicListing] = (0, import_react.useState)(true);
	const logoLiberado = useFeature("logo");
	(0, import_react.useEffect)(() => {
		if (!tenant) return;
		setNome(tenant.nome);
		setTelefone(tenant.telefone ?? "");
		setEndereco(tenant.endereco ?? "");
		setBusinessHours(normalizeBusinessHours(tenant.business_hours) ?? emptyBusinessHours());
		setLogoUrl(tenant.logo_url ?? "");
		setPublicListing(tenant.public_listing);
	}, [tenant]);
	const mutation = useMutation({
		mutationFn: () => saveProfile({ data: {
			nome,
			telefone,
			endereco,
			business_hours: businessHours,
			public_listing: publicListing
		} }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["session"] });
			toast.success("Perfil do lava-jato atualizado.");
		},
		onError: (error) => toast.error(error.message)
	});
	const role = sessionQuery.data?.membership?.role;
	const roleLabel = role === "OWNER" ? "Proprietário" : role === "MANAGER" ? "Gerente" : "Equipe";
	const createdAt = tenant?.created_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(tenant.created_at)) : null;
	const configuredDays = BUSINESS_DAYS.filter(({ key }) => businessHours[key].enabled).length;
	function updateBusinessDay(key, patch) {
		setBusinessHours((current) => ({
			...current,
			[key]: {
				...current[key],
				...patch
			}
		}));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {
		title: "Perfil do lava-jato",
		back: "/home",
		children: sessionQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-56 items-center justify-center text-primary",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
				className: "size-7 animate-spin",
				"aria-label": "Carregando perfil"
			})
		}) : tenant ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-5 lg:grid-cols-[0.8fr_1.2fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "interactive-panel overflow-hidden border border-primary/30 bg-card",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-20 bg-brand opacity-80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-5 pb-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Avatar, {
								className: "-mt-10 size-20 border-4 border-card bg-secondary",
								children: [logoUrl && logoLiberado ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarImage, {
									src: logoUrl,
									alt: `Logo de ${nome}`
								}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarFallback, {
									className: "bg-secondary text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashMark, { className: "size-9" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "mt-4 break-words text-xl font-bold",
								children: nome || "Nome do lava-jato"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: ["Código: ", tenant.slug]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 space-y-3 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileLine, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, {}),
										value: telefone || "Telefone não informado"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileLine, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {}),
										value: endereco || "Endereço não informado"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileLine, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, {}),
										value: configuredDays > 0 ? `${configuredDays} ${configuredDays === 1 ? "dia configurado" : "dias configurados"}` : "Horários não informados"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileLine, {
										icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, {}),
										value: roleLabel
									})
								]
							})
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "interactive-panel border border-border bg-card p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-bold",
							children: "Recebimento via PIX"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs text-muted-foreground",
							children: "Configure a chave exibida ao cliente."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WalletCards, { className: "size-5 text-primary" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						asChild: true,
						variant: "outline",
						className: "mt-4 w-full rounded-xl",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/financeiro",
							children: "Abrir configuração PIX"
						})
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "interactive-panel border border-border bg-card p-5 md:p-7",
				onSubmit: (event) => {
					event.preventDefault();
					mutation.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-b border-border pb-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-lg font-bold",
							children: "Dados da empresa"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs leading-5 text-muted-foreground",
							children: "Essas informações identificam o lava-jato para sua equipe e para os clientes."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid gap-5 sm:grid-cols-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								className: "sm:col-span-2",
								label: "Nome do lava-jato",
								htmlFor: "profile-name",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "profile-name",
									value: nome,
									onChange: (e) => setNome(e.target.value),
									maxLength: 80,
									required: true
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Telefone",
								htmlFor: "profile-phone",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "profile-phone",
									value: telefone,
									onChange: (e) => setTelefone(e.target.value),
									inputMode: "tel",
									placeholder: "(85) 99999-9999"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								className: "sm:col-span-2",
								label: "Endereço",
								htmlFor: "profile-address",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "profile-address",
									value: endereco,
									onChange: (e) => setEndereco(e.target.value),
									maxLength: 180,
									placeholder: "Rua, número, bairro e cidade"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "sm:col-span-2",
								children: logoLiberado ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogoUploader, {
									logoUrl,
									name: nome,
									onChange: async (next) => {
										setLogoUrl(next ?? "");
										await queryClient.invalidateQueries({ queryKey: ["session"] });
									}
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UpgradeNotice, {
									feature: "logo",
									compact: true
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "mt-6 border-t border-border pt-6",
						"aria-labelledby": "business-hours-title",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock3, { className: "mt-0.5 size-5 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								id: "business-hours-title",
								className: "font-bold",
								children: "Horários de funcionamento"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-5 text-muted-foreground",
								children: "Ative os dias em que o lava-jato funciona e informe abertura e fechamento."
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 overflow-hidden rounded-2xl border border-border bg-background/40",
							children: BUSINESS_DAYS.map(({ key, label }) => {
								const day = businessHours[key];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border/70 p-4 last:border-b-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
											id: `business-hours-${key}`,
											checked: day.enabled,
											onCheckedChange: (enabled) => updateBusinessDay(key, { enabled }),
											"aria-label": `${day.enabled ? "Fechar" : "Abrir"} ${label}`
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: `business-hours-${key}`,
											className: "cursor-pointer",
											children: label
										})]
									}), day.enabled ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex w-full items-center gap-2 sm:w-auto",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
												className: "sr-only",
												htmlFor: `business-hours-${key}-open`,
												children: ["Abertura de ", label]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: `business-hours-${key}-open`,
												type: "time",
												value: day.open,
												onChange: (event) => updateBusinessDay(key, { open: event.target.value }),
												className: "min-w-0 flex-1 sm:max-w-32",
												required: true
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: "às"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
												className: "sr-only",
												htmlFor: `business-hours-${key}-close`,
												children: ["Fechamento de ", label]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: `business-hours-${key}-close`,
												type: "time",
												value: day.close,
												onChange: (event) => updateBusinessDay(key, { close: event.target.value }),
												className: "min-w-0 flex-1 sm:max-w-32",
												required: true
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
										children: "Fechado"
									})]
								}, key);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex items-start justify-between gap-4 rounded-2xl border border-border bg-background/55 p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3",
							children: [publicListing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "mt-0.5 size-5 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "mt-0.5 size-5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
								htmlFor: "profile-public",
								children: "Aparecer na busca dos clientes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-5 text-muted-foreground",
								children: "Quando ativo, clientes podem encontrar este lava-jato pelo nome ou código."
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
							id: "profile-public",
							checked: publicListing,
							onCheckedChange: setPublicListing
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 rounded-2xl border border-border p-4 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: "Conta:"
							}),
							" ",
							sessionQuery.data?.user?.email ?? "E-mail não disponível"
						] }), createdAt ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-foreground",
									children: "Empresa cadastrada em:"
								}),
								" ",
								createdAt
							]
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						size: "lg",
						className: "mt-6 h-13 w-full rounded-2xl text-base",
						disabled: mutation.isPending,
						children: mutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-5" }), " Salvar alterações"] })
					})
				]
			})]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "Nenhum lava-jato vinculado a esta conta."
		})
	});
}
function Field({ label, htmlFor, className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			htmlFor,
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2",
			children
		})]
	});
}
function ProfileLine({ icon, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-2.5 text-muted-foreground",
		children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "break-words",
			children: value
		})]
	});
}
//#endregion
export { BusinessProfile as component };
