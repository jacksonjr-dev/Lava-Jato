function field(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function pixText(value: string, maxLength: number): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildPixPayload({
  key,
  receiverName,
  city,
  amount,
  transactionId,
}: {
  key: string;
  receiverName: string;
  city: string;
  amount: number;
  transactionId: string;
}): string {
  const cleanKey = key.trim().slice(0, 77);
  if (!cleanKey) throw new Error("Chave PIX não configurada.");
  const cleanReceiverName = pixText(receiverName, 25);
  const cleanCity = pixText(city, 15);
  if (!cleanReceiverName || !cleanCity) {
    throw new Error("Nome e cidade do recebedor são obrigatórios.");
  }

  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", cleanKey);
  const additionalData = field("05", pixText(transactionId, 25) || "***");
  const base =
    field("00", "01") +
    field("26", merchantAccount) +
    field("52", "0000") +
    field("53", "986") +
    field("54", Math.max(0, amount).toFixed(2)) +
    field("58", "BR") +
    field("59", cleanReceiverName) +
    field("60", cleanCity) +
    field("62", additionalData) +
    "6304";

  return `${base}${crc16(base)}`;
}
