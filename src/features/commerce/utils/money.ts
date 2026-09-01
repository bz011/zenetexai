/** amount_minor_units is always fils (1 AED = 100 fils) in this schema. */
export function formatMoney(amountMinorUnits: number, currency: string): string {
  const major = amountMinorUnits / 100;
  const formatted = Number.isInteger(major) ? major.toString() : major.toFixed(2);
  return `${currency} ${formatted}`;
}
