export function formatCurrencyWon(value?: number) {
  return `${(value ?? 0).toLocaleString()}원`;
}
