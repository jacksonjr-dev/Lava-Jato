export type ServiceSelectionItem = {
  id: string;
  nome: string;
  categoria?: string | null;
};

function normalizedServiceName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function isWashService(
  service: string | Pick<ServiceSelectionItem, "nome" | "categoria">,
): boolean {
  if (typeof service !== "string" && service.categoria) {
    return service.categoria === "LAVAGEM";
  }
  const name = typeof service === "string" ? service : service.nome;
  const normalized = normalizedServiceName(name);
  return normalized.startsWith("lavagem simples") || normalized.startsWith("lavagem completa");
}

export function assertCompatibleServices(services: ServiceSelectionItem[]): void {
  const washes = services.filter((service) => isWashService(service));
  if (washes.length > 1) {
    throw new Error("Escolha apenas uma lavagem: simples ou completa.");
  }
}

export function toggleServiceSelection(
  selectedIds: string[],
  service: ServiceSelectionItem,
  availableServices: ServiceSelectionItem[],
): string[] {
  if (selectedIds.includes(service.id)) {
    return selectedIds.filter((id) => id !== service.id);
  }

  if (!isWashService(service)) return [...selectedIds, service.id];

  const washIds = new Set(
    availableServices.filter((item) => isWashService(item)).map((item) => item.id),
  );
  return [...selectedIds.filter((id) => !washIds.has(id)), service.id];
}
