import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, X } from "lucide-react";
import { coverCropRect, PLATE_FRAME } from "@/lib/plate-camera";

type Status = "starting" | "ready" | "capturing" | "error";

/**
 * Câmera com moldura: a pessoa enquadra a placa e toca em "Tirar foto". A foto
 * sai recortada exatamente na moldura (com uma folga), em resolução cheia, e
 * segue o mesmo caminho da foto comum (leitura no aparelho e, se preciso, IA).
 */
export function PlateCameraDialog({
  onPhoto,
  onUseNativeCamera,
  onClose,
}: {
  onPhoto: (photo: Blob) => void;
  onUseNativeCamera: () => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [message, setMessage] = useState("Abrindo a câmera traseira…");

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    const video = videoRef.current;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled || !video) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (!cancelled) {
          setStatus("ready");
          setMessage("Enquadre a placa na moldura, de frente, e toque em Tirar foto.");
        }
      } catch (error) {
        if (cancelled) return;
        stream?.getTracks().forEach((track) => track.stop());
        stream = null;
        const name = error instanceof DOMException ? error.name : "";
        setStatus("error");
        setMessage(
          name === "NotAllowedError"
            ? "Acesso à câmera negado. Libere a câmera nas permissões do navegador ou use a câmera do celular."
            : name === "NotFoundError"
              ? "Nenhuma câmera foi encontrada neste aparelho."
              : "Não foi possível abrir a câmera aqui. Use a câmera do celular.",
        );
      }
    }

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      if (video) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, []);

  async function takePhoto() {
    const video = videoRef.current;
    const view = viewRef.current?.getBoundingClientRect();
    if (!video || !view || !video.videoWidth) return;
    setStatus("capturing");
    try {
      const rect = coverCropRect(
        { width: view.width, height: view.height },
        { width: video.videoWidth, height: video.videoHeight },
      );
      const canvas = document.createElement("canvas");
      canvas.width = rect.w;
      canvas.height = rect.h;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas indisponível.");
      context.drawImage(video, rect.x, rect.y, rect.w, rect.h, 0, 0, rect.w, rect.h);
      const photo = await new Promise<Blob | null>((resolve) =>
        // PNG, sem perda: o OCR erra com o ruído de compressão do JPEG.
        canvas.toBlob(resolve, "image/png"),
      );
      if (!photo) throw new Error("Não foi possível capturar a foto.");
      onPhoto(photo);
    } catch (error) {
      console.error("[câmera da placa]", error);
      setStatus("ready");
      setMessage("Não consegui tirar a foto. Tente de novo.");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plate-camera-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-black px-4 py-6 text-white"
    >
      <div className="flex w-full max-w-2xl items-center justify-between gap-4">
        <h2 id="plate-camera-title" className="text-lg font-bold">
          Fotografar a placa
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          aria-label="Fechar câmera"
        >
          <X className="size-5" />
        </button>
      </div>

      <div
        ref={viewRef}
        className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-3xl bg-neutral-900"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="size-full object-cover"
          aria-label="Imagem da câmera traseira"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(0,0,0,0.35)]"
          style={{
            left: `${PLATE_FRAME.left * 100}%`,
            top: `${PLATE_FRAME.top * 100}%`,
            width: `${PLATE_FRAME.width * 100}%`,
            height: `${PLATE_FRAME.height * 100}%`,
          }}
        />
      </div>

      <p aria-live="polite" className="min-h-10 max-w-2xl text-center text-sm text-white/90">
        {message}
      </p>

      <div className="flex w-full max-w-2xl flex-col items-center gap-3">
        {status !== "error" ? (
          <button
            type="button"
            onClick={() => void takePhoto()}
            disabled={status !== "ready"}
            className="flex h-14 w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-emerald-400 text-base font-bold text-black disabled:opacity-50"
          >
            {status === "ready" ? (
              <>
                <Camera className="size-5" /> TIRAR FOTO
              </>
            ) : (
              <Loader2 className="size-5 animate-spin" />
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onUseNativeCamera}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
        >
          <ImageUp className="size-4" /> Usar a câmera do celular
        </button>
      </div>
    </div>
  );
}
