import { __toESM } from "../_runtime.mjs";
import { require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { PLANS, PLAN_IDS, salesWhatsappLink } from "./plans-CITMHSEu.mjs";
import { m } from "../_libs/motion.mjs";
import { Stagger, StaggerItem } from "./router-BJH1rJwZ.mjs";
import { WashBrand, WashHoseBackdrop } from "./wash-hose-backdrop-NFnLurD2.mjs";
import { ArrowRight, BadgeCheck, Camera, Car, ChartNoAxesCombined, Check, Clock, FileSpreadsheet, Menu, MessageCircle, QrCode, ShieldCheck, Smartphone, Store, Users, Wrench, X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DeASbLey.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var NAV_LINKS = [
	{
		href: "#funcionalidades",
		label: "Funcionalidades"
	},
	{
		href: "#como-funciona",
		label: "Como funciona"
	},
	{
		href: "#cliente",
		label: "Para o cliente"
	},
	{
		href: "#planos",
		label: "Planos"
	},
	{
		href: "#duvidas",
		label: "Dúvidas"
	}
];
function Landing() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen min-h-dvh bg-hero text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashHoseBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "page-enter",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hero, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Audiences, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Features, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowItWorks, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientArea, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Finance, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Security, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plans, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Faq, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FinalCta, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SiteFooter, {})
		]
	});
}
function SiteHeader() {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "wash-header sticky top-0 z-40 border-b border-border/60 bg-background/95",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#inicio",
					"aria-label": "LavaPro — início",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashBrand, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden items-center gap-6 text-xs text-muted-foreground lg:flex",
					children: NAV_LINKS.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: link.href,
						className: "transition-colors hover:text-primary",
						children: link.label
					}, link.href))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden items-center gap-2 lg:flex",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/cliente",
							className: "px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-primary",
							children: "Área do cliente"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/auth",
							className: "border border-border px-3 py-2 text-xs font-semibold hover:border-primary/60 hover:text-primary",
							children: "Entrar"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/auth",
							search: { modo: "cadastro" },
							className: "border border-primary bg-brand px-3 py-2 text-xs font-bold text-primary-foreground shadow-glow",
							children: "Criar conta"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "border border-border p-2 lg:hidden",
					"aria-label": open ? "Fechar menu" : "Abrir menu",
					"aria-expanded": open,
					onClick: () => setOpen((value) => !value),
					children: open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { className: "size-5" })
				})
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			className: "border-t border-border/60 bg-background px-5 py-4 lg:hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-1",
				children: NAV_LINKS.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: link.href,
					onClick: () => setOpen(false),
					className: "py-2 text-sm text-muted-foreground hover:text-primary",
					children: link.label
				}, link.href))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth",
						search: { modo: "cadastro" },
						className: "border border-primary bg-brand px-4 py-3 text-center text-sm font-bold text-primary-foreground",
						children: "Criar conta"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth",
						className: "border border-border px-4 py-3 text-center text-sm",
						children: "Entrar"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/cliente",
						className: "px-4 py-2 text-center text-sm text-muted-foreground",
						children: "Área do cliente"
					})
				]
			})]
		})]
	});
}
function Hero() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "inicio",
		className: "mx-auto max-w-6xl scroll-mt-24 px-5 pb-12 pt-12 md:pt-20",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
				initial: {
					opacity: 0,
					y: 24
				},
				animate: {
					opacity: 1,
					y: 0
				},
				transition: {
					type: "spring",
					stiffness: 200,
					damping: 26
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-semibold text-primary",
						children: "SISTEMA DE GESTÃO PARA LAVA-JATO"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 text-[clamp(2.5rem,9vw,5rem)] font-bold leading-[0.95] tracking-[-0.06em]",
						children: "Do pátio até a entrega, sem papel e sem planilha."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-xl text-sm leading-6 text-muted-foreground md:text-base md:leading-7",
						children: "Abra o atendimento pela placa, acompanhe cada carro por etapa, receba no PIX e veja o faturamento do dia. O seu cliente acompanha o serviço pelo celular, sem instalar nada."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex flex-col gap-3 sm:flex-row",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/auth",
							search: { modo: "cadastro" },
							className: "group inline-flex h-14 items-center justify-between gap-6 border border-primary bg-brand px-5 text-sm font-bold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5 active:scale-95",
							children: ["COMEÇAR AGORA", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5 transition-transform group-hover:translate-x-1" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#como-funciona",
							className: "inline-flex h-14 items-center justify-center border border-border bg-secondary px-5 text-sm font-bold text-secondary-foreground hover:border-primary/50 hover:text-primary",
							children: "VER COMO FUNCIONA"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.div, {
				initial: {
					opacity: 0,
					y: 40,
					rotate: 2
				},
				animate: {
					opacity: 1,
					y: 0,
					rotate: 0
				},
				transition: {
					type: "spring",
					stiffness: 140,
					damping: 20,
					delay: .15
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "float-slow",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderMockup, {})
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "reveal-stagger mt-12 grid grid-cols-2 gap-3 md:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					value: "1 placa",
					label: "identifica carro, cliente e histórico"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					value: "5 etapas",
					label: "do carro aguardando até a entrega"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					value: "PIX",
					label: "QR Code gerado com o valor da OS"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
					value: "0 apps",
					label: "para o cliente instalar"
				})
			]
		})]
	});
}
function OrderMockup() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "interactive-panel relative border border-border bg-card p-5 shadow-glow md:p-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] tracking-[0.18em] text-muted-foreground",
					children: "OS #1042"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "border border-primary/40 px-2 py-1 text-[10px] font-semibold text-primary",
					children: "EM SERVIÇO"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "plate mt-5 inline-block border-2 border-foreground/80 bg-foreground px-4 py-2 text-2xl font-bold tracking-[0.12em] text-background",
				children: "ABC1D23"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-muted-foreground",
				children: "Onix prata · Carlos Souza"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
				className: "mt-6 grid grid-cols-5 gap-1.5",
				"aria-label": "Etapas do atendimento",
				children: [
					"Aguardando",
					"Em serviço",
					"Pronto",
					"Pago",
					"Entregue"
				].map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `block h-1.5 ${index <= 1 ? "bg-primary" : "bg-muted"}`,
					"aria-hidden": "true"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `mt-2 block text-[9px] leading-tight ${index === 1 ? "font-semibold text-primary" : "text-muted-foreground"}`,
					children: step
				})] }, step))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 space-y-2 border-t border-border/60 pt-4 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MockRow, {
						label: "Lavagem completa",
						value: "R$ 60,00"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MockRow, {
						label: "Enceramento",
						value: "R$ 80,00"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MockRow, {
						label: "Total",
						value: "R$ 140,00",
						strong: true
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex items-center gap-3 border border-border/70 bg-background/60 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, {
					className: "size-9 shrink-0 text-primary",
					strokeWidth: 1.5
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs leading-5 text-muted-foreground",
					children: "PIX copia e cola pronto para o cliente pagar na retirada."
				})]
			})
		]
	});
}
function MockRow({ label, value, strong }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: strong ? "font-bold" : "text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `tabular-nums ${strong ? "font-bold text-primary" : ""}`,
			children: value
		})]
	});
}
function Stat({ value, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-border bg-card/80 p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xl font-bold text-primary md:text-2xl",
			children: value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-1 text-[11px] leading-4 text-muted-foreground",
			children: label
		})]
	});
}
function Audiences() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto max-w-6xl px-5 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
			eyebrow: "UM SISTEMA, DOIS LADOS",
			title: "Feito para quem lava e para quem é atendido."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Stagger, {
			className: "mt-8 grid gap-6 md:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudienceCard, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, {
					className: "size-8",
					strokeWidth: 1.5
				}),
				eyebrow: "PROPRIETÁRIO",
				title: "Controle a operação.",
				items: [
					"Atendimentos abertos em segundos pela placa",
					"Status de cada carro em tempo real",
					"Pagamentos, ticket médio e faturamento",
					"Equipe com acesso por função"
				],
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/auth",
					search: { modo: "cadastro" },
					className: "group mt-8 flex h-14 items-center justify-between border border-primary bg-brand px-4 text-sm font-bold text-primary-foreground shadow-glow",
					children: ["CADASTRAR MEU LAVA-JATO", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5 transition-transform group-hover:translate-x-1" })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudienceCard, {
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Smartphone, {
					className: "size-8",
					strokeWidth: 1.5
				}),
				eyebrow: "CLIENTE",
				title: "Acompanhe o seu carro.",
				items: [
					"Entra só com a placa e o telefone",
					"Vê em que etapa está o serviço",
					"Consulta valores e histórico de visitas",
					"Paga com PIX direto pelo celular"
				],
				action: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/cliente",
					className: "group mt-8 flex h-14 items-center justify-between border border-border bg-secondary px-4 text-sm font-bold text-secondary-foreground hover:border-primary/50 hover:text-primary",
					children: ["ACESSAR COMO CLIENTE", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5 transition-transform group-hover:translate-x-1" })]
				})
			})]
		})]
	});
}
function AudienceCard({ icon, eyebrow, title, items, action }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StaggerItem, {
		as: "article",
		className: "interactive-panel flex flex-col border border-border bg-card p-6 md:p-9",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-primary",
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-8 text-xs font-semibold text-primary",
				children: eyebrow
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "mt-3 text-3xl font-bold tracking-[-0.055em] md:text-4xl",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-6 grid gap-3 text-sm text-muted-foreground",
				children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-4 shrink-0 text-primary" }), item]
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-auto",
				children: action
			})
		]
	});
}
var FEATURES = [
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Car, { className: "size-5" }),
		title: "Atendimento pela placa",
		text: "Digite a placa e o sistema traz cliente, veículo e histórico. Carro novo é cadastrado no mesmo passo."
	},
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "size-5" }),
		title: "Leitura da placa pela foto",
		text: "Tire uma foto do carro e a placa é preenchida automaticamente. Sem digitação no pátio."
	},
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "size-5" }),
		title: "Ordens de serviço por etapa",
		text: "Aguardando, em serviço, pronto, pago e entregue. Cada mudança fica registrada."
	},
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "size-5" }),
		title: "Catálogo de serviços",
		text: "Monte seus preços de lavagens e adicionais. O sistema impede duas lavagens na mesma OS."
	},
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, { className: "size-5" }),
		title: "Cobrança PIX",
		text: "Cadastre sua chave e o QR Code sai com o valor exato de cada ordem de serviço."
	},
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartNoAxesCombined, { className: "size-5" }),
		title: "Financeiro em tempo real",
		text: "Faturamento do dia, semana e mês, ticket médio e receita por forma de pagamento."
	},
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-5" }),
		title: "Horário de funcionamento",
		text: "Defina os dias e horários de atendimento e mostre isso para os seus clientes."
	},
	{
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" }),
		title: "Equipe com permissões",
		text: "Proprietário, gerente e funcionário, cada um vendo e fazendo só o que deve."
	}
];
function Features() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "funcionalidades",
		className: "mx-auto max-w-6xl scroll-mt-24 px-5 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
			eyebrow: "FUNCIONALIDADES",
			title: "Tudo o que o lava-jato precisa no dia a dia.",
			description: "Pensado para o ritmo do pátio: poucos toques, letras grandes e funcionando no celular."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stagger, {
			className: "mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4",
			children: FEATURES.map((feature) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StaggerItem, {
				as: "article",
				className: "interactive-panel border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex size-10 items-center justify-center border border-primary/40 text-primary",
						children: feature.icon
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-5 text-sm font-bold",
						children: feature.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs leading-5 text-muted-foreground",
						children: feature.text
					})
				]
			}, feature.title))
		})]
	});
}
var STEPS = [
	{
		title: "Carro chegou",
		text: "Digite ou fotografe a placa. Cliente e histórico aparecem na hora."
	},
	{
		title: "Escolha os serviços",
		text: "Selecione a lavagem e os adicionais. O valor é calculado automaticamente."
	},
	{
		title: "Acompanhe o pátio",
		text: "Mova a OS de etapa em etapa. O cliente vê cada mudança pelo celular."
	},
	{
		title: "Receba e entregue",
		text: "Registre o pagamento em dinheiro, cartão ou PIX e libere o carro."
	}
];
function HowItWorks() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "como-funciona",
		className: "mx-auto max-w-6xl scroll-mt-24 px-5 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
			eyebrow: "COMO FUNCIONA",
			title: "Quatro passos, do pátio ao caixa."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stagger, {
			as: "ol",
			className: "mt-8 grid gap-3 md:grid-cols-4",
			children: STEPS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StaggerItem, {
				as: "li",
				className: "border border-border bg-card p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs tabular-nums text-primary",
						children: String(index + 1).padStart(2, "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-6 text-lg font-bold tracking-[-0.03em]",
						children: step.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs leading-5 text-muted-foreground",
						children: step.text
					})
				]
			}, step.title))
		})]
	});
}
function ClientArea() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "cliente",
		className: "mx-auto max-w-6xl scroll-mt-24 px-5 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid items-center gap-10 border border-border bg-card/70 p-6 md:p-10 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					eyebrow: "ÁREA DO CLIENTE",
					title: "Seu cliente para de ligar perguntando se o carro está pronto.",
					description: "Ele encontra o seu lava-jato, informa a placa e o telefone usados no atendimento e acompanha tudo pelo navegador do celular."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-6 grid gap-3 text-sm text-muted-foreground",
					children: [
						"Status atualizado automaticamente enquanto o carro está no pátio",
						"Histórico de visitas e quanto já gastou",
						"QR Code PIX para pagar sem fila no caixa",
						"Endereço, telefone e horário de funcionamento do seu lava-jato"
					].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-4 shrink-0 text-primary" }), item]
					}, item))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/cliente",
					className: "group mt-8 inline-flex h-12 items-center gap-6 border border-border bg-secondary px-4 text-sm font-bold hover:border-primary/50 hover:text-primary",
					children: ["VER A ÁREA DO CLIENTE", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 transition-transform group-hover:translate-x-1" })]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneMockup, {})]
		})
	});
}
function PhoneMockup() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
		initial: { opacity: 0 },
		whileInView: { opacity: 1 },
		viewport: { once: true },
		className: "float-slow mx-auto w-full max-w-[280px] border-[6px] border-secondary bg-background p-4 shadow-glow",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-muted-foreground",
				children: "Olá, Carlos"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "plate mt-2 text-xl font-bold tracking-[0.1em]",
				children: "ABC1D23"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 border border-primary/40 bg-primary/10 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground",
					children: "Status agora"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm font-bold text-primary",
					children: "Pronto para retirada"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex items-center gap-3 border border-border p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(QrCode, {
					className: "size-10 text-foreground",
					strokeWidth: 1.25
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-muted-foreground",
					children: "Pagar com PIX"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-bold tabular-nums",
					children: "R$ 140,00"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-[10px] text-muted-foreground",
				children: "Últimas visitas"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 space-y-1.5 text-[11px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MockRow, {
					label: "12/10 · Lavagem completa",
					value: "R$ 60"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MockRow, {
					label: "28/09 · Polimento",
					value: "R$ 150"
				})]
			})
		]
	});
}
function Finance() {
	const bars = [
		38,
		52,
		44,
		70,
		61,
		88,
		74
	];
	const days = [
		"S",
		"T",
		"Q",
		"Q",
		"S",
		"S",
		"D"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mx-auto max-w-6xl px-5 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "order-2 border border-border bg-card p-6 lg:order-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] text-muted-foreground",
							children: "Faturamento da semana"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-2xl font-bold tabular-nums",
							children: "R$ 4.380,00"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] text-muted-foreground",
							children: "exemplo ilustrativo"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 flex h-36 items-end gap-2",
						"aria-hidden": "true",
						children: bars.map((height, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-full flex-1 flex-col items-center justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(m.span, {
								className: "w-full origin-bottom bg-primary/80",
								style: { height: `${height}%` },
								initial: { scaleY: 0 },
								whileInView: { scaleY: 1 },
								viewport: { once: true },
								transition: {
									type: "spring",
									stiffness: 160,
									damping: 18,
									delay: index * .06
								}
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] text-muted-foreground",
								children: days[index]
							})]
						}, index))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 grid grid-cols-3 gap-2 text-center text-[10px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniKpi, {
								label: "PIX",
								value: "58%"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniKpi, {
								label: "Cartão",
								value: "31%"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniKpi, {
								label: "Dinheiro",
								value: "11%"
							})
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "order-1 lg:order-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
					eyebrow: "FINANCEIRO",
					title: "Saiba quanto entrou hoje sem fazer conta.",
					description: "Cada pagamento registrado alimenta o painel: faturamento por período, ticket médio, serviços mais vendidos e divisão por forma de pagamento."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-6 flex items-center gap-3 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-5 shrink-0 text-primary" }), "Exporte o balanço do mês em PDF ou Excel para o seu contador."]
				})]
			})]
		})
	});
}
function MiniKpi({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-border/70 p-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm font-bold text-primary",
			children: value
		})]
	});
}
function Security() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mx-auto max-w-6xl px-5 py-12",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-6 border border-border bg-card/70 p-6 md:flex-row md:items-center md:p-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
				className: "size-12 shrink-0 text-primary",
				strokeWidth: 1.25
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-bold tracking-[-0.03em] md:text-2xl",
				children: "Os dados do seu lava-jato ficam só com você."
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 max-w-3xl text-sm leading-6 text-muted-foreground",
				children: "Cada empresa tem seus dados isolados no banco. Pagamentos só podem ser registrados pelo fluxo do sistema, e o cliente acessa apenas o próprio veículo, com placa e telefone e limite de tentativas."
			})] })]
		})
	});
}
function Plans() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "planos",
		className: "mx-auto max-w-6xl scroll-mt-24 px-5 py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
				eyebrow: "PLANOS",
				title: "Escolha o plano do tamanho do seu pátio.",
				description: `Comece com 3 dias grátis do plano Max. Depois, escolha o seu plano ou continue no Grátis, sem perder seus dados.`
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stagger, {
				className: "mt-8 grid gap-6 lg:grid-cols-3",
				children: PLAN_IDS.map((id) => PLANS[id]).map((plan) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(StaggerItem, {
					as: "article",
					className: `relative flex flex-col border bg-card p-6 md:p-8 ${plan.destaque ? "border-primary shadow-glow" : "border-border"}`,
					children: [
						plan.destaque && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -top-3 left-6 bg-brand px-2 py-1 text-[10px] font-bold text-primary-foreground",
							children: "MAIS ESCOLHIDO"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-2xl font-bold tracking-[-0.04em]",
							children: plan.nome
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: plan.descricao
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-6 text-3xl font-bold text-primary",
							children: [plan.preco ?? "Sob consulta", plan.preco && plan.id !== "GRATIS" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-normal text-muted-foreground",
								children: "/mês"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-6 grid gap-3 text-sm text-muted-foreground",
							children: plan.itens.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "mt-0.5 size-4 shrink-0 text-primary" }), item]
							}, item))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlanCta, { plan })
					]
				}, plan.nome))
			}),
			SALES_CONTACT && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-8 text-center text-sm text-muted-foreground",
				children: [
					"Dúvidas sobre os planos?",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: SALES_CONTACT,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "inline-flex items-center gap-1.5 font-bold text-primary underline-offset-4 hover:underline",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4" }), "Fale com a gente no WhatsApp"]
					})
				]
			})
		]
	});
}
/** Grátis vai para o cadastro; os pagos abrem o WhatsApp para negociar. */
function PlanCta({ plan }) {
	const className = `flex h-12 items-center justify-center gap-2 border text-sm font-bold ${plan.destaque ? "border-primary bg-brand text-primary-foreground" : "border-border bg-secondary hover:border-primary/50 hover:text-primary"}`;
	const whatsapp = plan.id === "GRATIS" ? null : salesWhatsappLink(`Olá! Quero contratar o plano ${plan.nome} do LavaPro.`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-auto pt-8",
		children: whatsapp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
			href: whatsapp,
			target: "_blank",
			rel: "noopener noreferrer",
			className,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "size-4" }),
				"FALAR SOBRE O ",
				plan.nome.toUpperCase()
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/auth",
			search: { modo: "cadastro" },
			className,
			children: ["COMEÇAR COM O ", plan.nome.toUpperCase()]
		})
	});
}
var SALES_CONTACT = salesWhatsappLink("Olá! Quero saber mais sobre o LavaPro.");
var FAQ = [
	{
		question: "Preciso instalar algum programa?",
		answer: "Não. O LavaPro funciona no navegador do celular, tablet ou computador. Basta criar a conta e cadastrar o seu lava-jato."
	},
	{
		question: "Meu cliente precisa baixar um aplicativo?",
		answer: "Não. Ele acessa a área do cliente pelo navegador, escolhe o seu lava-jato e informa a placa e o telefone usados no atendimento."
	},
	{
		question: "O PIX cai direto na minha conta?",
		answer: "Sim. O QR Code é gerado com a sua própria chave PIX e o valor da ordem de serviço. O LavaPro não intermedeia o dinheiro."
	},
	{
		question: "Posso cadastrar os meus próprios serviços e preços?",
		answer: "Sim. Você monta o catálogo com lavagens e adicionais, define preço, duração e descrição, e pode desativar o que não oferece mais."
	},
	{
		question: "Meus funcionários veem o financeiro?",
		answer: "Não. Funcionários abrem e movimentam atendimentos. Financeiro, preços, PIX e cancelamentos ficam com o proprietário e o gerente."
	}
];
function Faq() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		id: "duvidas",
		className: "mx-auto max-w-3xl scroll-mt-24 px-5 py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, {
			eyebrow: "DÚVIDAS",
			title: "Perguntas frequentes."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-8 divide-y divide-border border border-border bg-card",
			children: FAQ.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
				className: "group p-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
					className: "flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold",
					children: [item.question, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-primary transition-transform group-open:rotate-45",
						children: "+"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm leading-6 text-muted-foreground",
					children: item.answer
				})]
			}, item.question))
		})]
	});
}
function FinalCta() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mx-auto max-w-6xl px-5 py-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "border border-primary/50 bg-card p-8 text-center shadow-glow md:p-14",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mx-auto max-w-2xl text-[clamp(1.75rem,5vw,3rem)] font-bold leading-tight tracking-[-0.05em]",
					children: "Organize o seu lava-jato a partir de hoje."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mx-auto mt-4 max-w-xl text-sm text-muted-foreground",
					children: "Crie a conta, cadastre a empresa e abra o primeiro atendimento em poucos minutos."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-col justify-center gap-3 sm:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/auth",
						search: { modo: "cadastro" },
						className: "group inline-flex h-14 items-center justify-center gap-6 border border-primary bg-brand px-6 text-sm font-bold text-primary-foreground",
						children: ["CRIAR MINHA CONTA", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-5 transition-transform group-hover:translate-x-1" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/auth",
						className: "inline-flex h-14 items-center justify-center border border-border bg-secondary px-6 text-sm font-bold hover:border-primary/50 hover:text-primary",
						children: "JÁ TENHO CONTA"
					})]
				})
			]
		})
	});
}
function SiteFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "border-t border-border/60 bg-background/80",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.5fr_1fr_1fr]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WashBrand, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-sm text-xs leading-5 text-muted-foreground",
					children: "Sistema de gestão para lava-jato: atendimento pela placa, ordens de serviço, PIX, financeiro e acompanhamento em tempo real para o cliente."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FooterColumn, {
					title: "Proprietário",
					links: [
						{
							label: "Criar conta",
							to: "/auth",
							cadastro: true
						},
						{
							label: "Entrar",
							to: "/auth"
						},
						{
							label: "Planos",
							href: "#planos"
						},
						...SALES_CONTACT ? [{
							label: "Falar no WhatsApp",
							href: SALES_CONTACT
						}] : []
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FooterColumn, {
					title: "Cliente",
					links: [
						{
							label: "Acompanhar meu carro",
							to: "/cliente"
						},
						{
							label: "Como funciona",
							href: "#cliente"
						},
						{
							label: "Dúvidas",
							href: "#duvidas"
						}
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-between gap-2 border-t border-border/60 px-5 py-5 text-center text-[10px] text-muted-foreground sm:flex-row sm:px-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"© ",
				(/* @__PURE__ */ new Date()).getFullYear(),
				" LavaPro. Todos os direitos reservados."
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"Desenvolvido por",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "https://jpglabs.netlify.app/",
					target: "_blank",
					rel: "noopener noreferrer",
					className: "font-bold text-primary underline-offset-2 hover:underline",
					children: "JPGLabs"
				})
			] })]
		})]
	});
}
function FooterColumn({ title, links }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-xs font-semibold text-primary",
		children: title.toUpperCase()
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
		className: "mt-4 grid gap-2 text-xs text-muted-foreground",
		children: links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "href" in link ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
			href: link.href,
			className: "hover:text-primary",
			...link.href.startsWith("http") ? {
				target: "_blank",
				rel: "noopener noreferrer"
			} : {},
			children: link.label
		}) : link.to === "/auth" && link.cadastro ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/auth",
			search: { modo: "cadastro" },
			className: "hover:text-primary",
			children: link.label
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: link.to,
			className: "hover:text-primary",
			children: link.label
		}) }, link.label))
	})] });
}
function SectionTitle({ eyebrow, title, description }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(m.div, {
		className: "max-w-2xl",
		initial: {
			opacity: 0,
			y: 20
		},
		whileInView: {
			opacity: 1,
			y: 0
		},
		viewport: {
			once: true,
			margin: "0px 0px -10% 0px"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-semibold text-primary",
				children: eyebrow
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 text-[clamp(1.75rem,4.5vw,2.75rem)] font-bold leading-tight tracking-[-0.05em]",
				children: title
			}),
			description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-4 text-sm leading-6 text-muted-foreground",
				children: description
			})
		]
	});
}
//#endregion
export { Landing as component };
