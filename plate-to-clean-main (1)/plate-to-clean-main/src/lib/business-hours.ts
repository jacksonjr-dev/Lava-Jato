export const BUSINESS_DAYS = [
  { key: "monday", label: "Segunda-feira", shortLabel: "Seg" },
  { key: "tuesday", label: "Terça-feira", shortLabel: "Ter" },
  { key: "wednesday", label: "Quarta-feira", shortLabel: "Qua" },
  { key: "thursday", label: "Quinta-feira", shortLabel: "Qui" },
  { key: "friday", label: "Sexta-feira", shortLabel: "Sex" },
  { key: "saturday", label: "Sábado", shortLabel: "Sáb" },
  { key: "sunday", label: "Domingo", shortLabel: "Dom" },
] as const;

export type BusinessDayKey = (typeof BUSINESS_DAYS)[number]["key"];
export type BusinessDayHours = { enabled: boolean; open: string; close: string };
export type BusinessHours = Record<BusinessDayKey, BusinessDayHours>;

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function emptyBusinessHours(): BusinessHours {
  return Object.fromEntries(
    BUSINESS_DAYS.map(({ key }) => [key, { enabled: false, open: "08:00", close: "18:00" }]),
  ) as BusinessHours;
}

export function normalizeBusinessHours(value: unknown): BusinessHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const normalized = emptyBusinessHours();

  for (const { key } of BUSINESS_DAYS) {
    const raw = source[key];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    const open = typeof entry.open === "string" ? entry.open : "08:00";
    const close = typeof entry.close === "string" ? entry.close : "18:00";
    normalized[key] = {
      enabled: entry.enabled === true,
      open: TIME_PATTERN.test(open) ? open : "08:00",
      close: TIME_PATTERN.test(close) ? close : "18:00",
    };
  }

  return normalized;
}

export function validateBusinessHours(value: unknown): BusinessHours {
  const hours = normalizeBusinessHours(value);
  if (!hours) throw new Error("Informe os horários de funcionamento.");

  for (const { key, label } of BUSINESS_DAYS) {
    const day = hours[key];
    if (day.enabled && day.open >= day.close) {
      throw new Error(`Em ${label}, o horário de fechamento deve ser depois da abertura.`);
    }
  }
  return hours;
}

export function formatBusinessDay(day: BusinessDayHours): string {
  return day.enabled ? `${day.open} às ${day.close}` : "Fechado";
}

export function todayBusinessDayKey(date = new Date()): BusinessDayKey {
  const keys: BusinessDayKey[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return keys[date.getDay()]!;
}
