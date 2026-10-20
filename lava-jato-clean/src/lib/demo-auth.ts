export const DEMO_EMAIL = "demo@lavapro.local";
export const DEMO_PASSWORD = "LavaPro@2026";
export const DEMO_SESSION_KEY = "lavapro-demo-session";
const DEMO_PROFILE_KEY = "lavapro-demo-profile";
const DEMO_BUSINESS_KEY = "lavapro-demo-business";

export type DemoBusiness = {
  id: string;
  slug: string;
  nome: string;
  telefone: string;
  endereco: string;
  logo_url: string | null;
};

export function isDemoEnabled(): boolean {
  return import.meta.env["VITE_DEMO_MODE"] === "true";
}

export function hasDemoSession(): boolean {
  if (!isDemoEnabled()) return false;
  return ["active", "access", "signup", "business"].includes(
    localStorage.getItem(DEMO_SESSION_KEY) ?? "",
  );
}

export function startDemoSession(email: string, password: string): boolean {
  if (!isDemoEnabled() || email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return false;
  localStorage.setItem(DEMO_SESSION_KEY, "access");
  localStorage.removeItem(DEMO_PROFILE_KEY);
  localStorage.removeItem(DEMO_BUSINESS_KEY);
  return true;
}

export function startDemoBusinessSignup(nome: string, email: string): void {
  if (!isDemoEnabled()) return;
  localStorage.setItem(DEMO_SESSION_KEY, "signup");
  localStorage.setItem(
    DEMO_PROFILE_KEY,
    JSON.stringify({ nome: nome.trim(), email: email.trim() }),
  );
  localStorage.removeItem(DEMO_BUSINESS_KEY);
}

export function isDemoOnboardingPending(): boolean {
  return (
    isDemoEnabled() &&
    localStorage.getItem(DEMO_SESSION_KEY) === "signup" &&
    !localStorage.getItem(DEMO_BUSINESS_KEY)
  );
}

export function completeDemoBusinessRegistration(data: Omit<DemoBusiness, "id">): DemoBusiness {
  const business = { id: "demo-tenant", ...data };
  localStorage.setItem(DEMO_BUSINESS_KEY, JSON.stringify(business));
  localStorage.setItem(DEMO_SESSION_KEY, "business");
  return business;
}

export function getDemoBusiness(): DemoBusiness | null {
  if (!isDemoEnabled()) return null;
  const saved = localStorage.getItem(DEMO_BUSINESS_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as Partial<DemoBusiness>;
    if (!parsed.nome) return null;
    const slug =
      parsed.slug ||
      parsed.nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    return {
      id: "demo-tenant",
      slug,
      nome: parsed.nome,
      telefone: parsed.telefone ?? "",
      endereco: parsed.endereco ?? "",
      logo_url: parsed.logo_url ?? null,
    };
  } catch {
    localStorage.removeItem(DEMO_BUSINESS_KEY);
    return null;
  }
}

export function endDemoSession(): void {
  localStorage.removeItem(DEMO_SESSION_KEY);
  localStorage.removeItem(DEMO_PROFILE_KEY);
  localStorage.removeItem(DEMO_BUSINESS_KEY);
}
