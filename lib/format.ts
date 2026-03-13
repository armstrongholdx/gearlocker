import { format } from "date-fns";

export function formatCurrency(value: number | null, currency = "USD") {
  if (value === null) {
    return "Not set";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | string | null) {
  if (!value) {
    return "Not set";
  }

  return format(new Date(value), "MMM d, yyyy");
}

export function formatDateInput(value: Date | string | null) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "yyyy-MM-dd");
}
