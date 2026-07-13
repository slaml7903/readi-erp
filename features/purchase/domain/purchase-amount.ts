export type PurchaseAmountInput = {
  quantity: number;
  unitPrice: number;
  vatIncluded: boolean;
  vatRate?: number;
};

export type PurchaseAmountResult = {
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
};

const DEFAULT_VAT_RATE = 0.1;

function roundCurrency(value: number) {
  return Math.round(value);
}

export function calculatePurchaseAmount({
  quantity,
  unitPrice,
  vatIncluded,
  vatRate = DEFAULT_VAT_RATE,
}: PurchaseAmountInput): PurchaseAmountResult {
  const rawTotalAmount = quantity * unitPrice;

  if (!vatIncluded) {
    return {
      supplyAmount: roundCurrency(rawTotalAmount),
      vatAmount: 0,
      totalAmount: roundCurrency(rawTotalAmount),
    };
  }

  const supplyAmount = rawTotalAmount / (1 + vatRate);
  const vatAmount = rawTotalAmount - supplyAmount;

  return {
    supplyAmount: roundCurrency(supplyAmount),
    vatAmount: roundCurrency(vatAmount),
    totalAmount: roundCurrency(rawTotalAmount),
  };
}
