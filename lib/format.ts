const dateFormatter = new Intl.DateTimeFormat("es-VE", {
  dateStyle: "short",
  timeStyle: "short",
});

const moneyFormatter = new Intl.NumberFormat("es-VE", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

export function formatDateTime(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}
