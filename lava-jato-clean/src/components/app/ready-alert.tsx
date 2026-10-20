import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2, Share } from "lucide-react";
import { pushErrorMessage } from "@/lib/customer-notifications";
import {
  portalPushKey,
  subscribePortalPush,
  unsubscribePortalPush,
} from "@/lib/lavajato.functions";

type AlertState =
  "checking" | "unsupported" | "ios-install" | "off" | "busy" | "on" | "denied" | "unavailable";

/** Qual veículo este aparelho está acompanhando (um aparelho avisa sobre um carro por vez). */
const STORAGE_KEY = "lavapro:aviso-veiculo";

function storedVehicle(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeVehicle(vehicleId: string | null) {
  try {
    if (vehicleId) localStorage.setItem(STORAGE_KEY, vehicleId);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem armazenamento: o aviso continua funcionando, só não é lembrado na tela.
  }
}

function pushSupported() {
  return (
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** No iPhone o aviso só funciona com o site adicionado à Tela de Início (regra da Apple). */
function iosNeedsInstall() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios && !standalone;
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const base64 = (value + "=".repeat((4 - (value.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration("/");
  return (await registration?.pushManager.getSubscription()) ?? null;
}

/** "Me avise quando ficar pronto": notificação no celular quando o lava-jato marcar como pronto. */
export function ReadyAlert({ accessToken, vehicleId }: { accessToken: string; vehicleId: string }) {
  const getKey = useServerFn(portalPushKey);
  const subscribe = useServerFn(subscribePortalPush);
  const unsubscribe = useServerFn(unsubscribePortalPush);
  const [state, setState] = useState<AlertState>("checking");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      let next: AlertState;
      if (iosNeedsInstall()) next = "ios-install";
      else if (!pushSupported()) next = "unsupported";
      else if (Notification.permission === "denied") next = "denied";
      else {
        const subscription = await currentSubscription().catch(() => null);
        next = subscription && storedVehicle() === vehicleId ? "on" : "off";
      }
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [vehicleId]);

  async function activate() {
    setState("busy");
    setError("");
    try {
      const { publicKey } = await getKey();
      if (!publicKey) {
        setState("unavailable");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64UrlToBytes(publicKey),
        }));
      await subscribe({ data: { accessToken, subscription: subscription.toJSON() } });
      storeVehicle(vehicleId);
      setState("on");
    } catch (cause) {
      console.error("[aviso no celular]", cause);
      setError(pushErrorMessage(cause));
      setState("off");
    }
  }

  async function deactivate() {
    setState("busy");
    try {
      const subscription = await currentSubscription();
      if (subscription) {
        await unsubscribe({ data: { accessToken, endpoint: subscription.endpoint } });
        await subscription.unsubscribe();
      }
    } catch (cause) {
      console.error("[aviso no celular]", cause);
    }
    storeVehicle(null);
    setState("off");
  }

  if (state === "checking") return null;

  const box = "mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm";

  if (state === "on") {
    return (
      <div className={`${box} border-primary/40 bg-primary/10`}>
        <BellRing className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Aviso ativado</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Você recebe uma notificação neste aparelho quando o carro ficar pronto, mesmo com esta
            página fechada.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void deactivate()}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          Desativar
        </button>
      </div>
    );
  }

  if (state === "ios-install") {
    return (
      <div className={`${box} border-border/70 bg-secondary/40`}>
        <Share className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-xs leading-5 text-muted-foreground">
          <span className="font-semibold text-foreground">Quer ser avisado no iPhone?</span> Toque
          em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.
          Abra o LavaPro pelo ícone e ative o aviso.
        </p>
      </div>
    );
  }

  if (state === "unsupported" || state === "unavailable") {
    return null;
  }

  if (state === "denied") {
    return (
      <div className={`${box} border-border/70 bg-secondary/40`}>
        <BellOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-5 text-muted-foreground">
          As notificações estão bloqueadas para este site. Para ser avisado, libere as notificações
          nas configurações do navegador.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => void activate()}
        disabled={state === "busy"}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
      >
        {state === "busy" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bell className="size-4" />
        )}
        Me avise quando ficar pronto
      </button>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
