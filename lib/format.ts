const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number | string | null): string {
  const amount = Number(value ?? 0);
  return currencyFormatter.format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value: string | Date | null): string {
  if (!value) return "—";
  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(
            Number(value.slice(0, 4)),
            Number(value.slice(5, 7)) - 1,
            Number(value.slice(8, 10)),
          )
        : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export function formatShortDate(value: string | Date | null): string {
  if (!value) return "—";
  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}/.test(value)
        ? new Date(
            Number(value.slice(0, 4)),
            Number(value.slice(5, 7)) - 1,
            Number(value.slice(8, 10)),
          )
        : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function floorLabel(value: number | string): string {
  const floor = Number(value);
  return floor === 0 ? "Ground" : String(floor);
}
