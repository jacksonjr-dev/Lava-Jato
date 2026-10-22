import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { clearLegacySupabaseTokens, getOwner } from "@/lib/auth-client";
import { hasDemoSession, isDemoEnabled } from "@/lib/demo-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (hasDemoSession()) return { user: { id: "demo-user", email: "demo@lavapro.local" } };
    if (isDemoEnabled()) throw redirect({ to: "/auth" });
    clearLegacySupabaseTokens();
    const owner = await getOwner().catch(() => null);
    if (!owner) throw redirect({ to: "/auth" });
    return { user: owner };
  },
  component: () => <Outlet />,
});
