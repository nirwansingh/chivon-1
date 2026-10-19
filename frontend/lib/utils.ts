export { cn } from "cn";
export { formatAED as formatCurrency } from "./money";
import { format } from "date-fns";

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "-";
  return format(new Date(date), "dd MMM yyyy");
}
