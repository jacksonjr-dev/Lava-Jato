type BusinessIdentity = {
  nome: string;
  slug?: string | null;
};

export function normalizeBusinessIdentity(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}

export function matchesBusinessIdentity(input: string, business: BusinessIdentity): boolean {
  const normalizedInput = normalizeBusinessIdentity(input);
  if (normalizedInput.length < 2) return false;

  return [business.nome, business.slug]
    .filter((value): value is string => Boolean(value))
    .some((value) => normalizeBusinessIdentity(value) === normalizedInput);
}
