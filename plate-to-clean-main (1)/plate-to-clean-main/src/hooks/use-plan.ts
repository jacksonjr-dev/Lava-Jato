import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSession } from "@/lib/lavajato.functions";
import { isDemoOnboardingPending } from "@/lib/demo-auth";
import { hasFeature, type Feature, type Subscription } from "@/lib/plans";

/** Sessão compartilhada (mesma chave usada pelo AppShell e demais telas). */
export function useSessionQuery() {
  const session = useServerFn(getSession);
  return useQuery({
    queryKey: ["session"],
    queryFn: () => session(),
    staleTime: 60_000,
    enabled: !isDemoOnboardingPending(),
  });
}

export function useSubscription(): Subscription | null {
  return useSessionQuery().data?.subscription ?? null;
}

/**
 * true enquanto a sessão carrega, para não piscar o cadeado; a trava de
 * verdade está no servidor.
 */
export function useFeature(feature: Feature): boolean {
  const subscription = useSubscription();
  return subscription ? hasFeature(subscription, feature) : true;
}
