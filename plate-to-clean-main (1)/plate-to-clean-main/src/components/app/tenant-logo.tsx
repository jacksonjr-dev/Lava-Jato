import { useState, type ReactNode } from "react";

/** Logo do lava-jato; mostra `fallback` se não houver logo ou se a imagem falhar. */
export function TenantLogo({
  url,
  name,
  className = "size-8",
  fallback,
}: {
  url: string | null | undefined;
  name: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!url || failed === url) return <>{fallback}</>;
  return (
    <img
      src={url}
      alt={`Logo de ${name}`}
      onError={() => setFailed(url)}
      className={`shrink-0 rounded-lg bg-white object-contain ${className}`}
    />
  );
}
