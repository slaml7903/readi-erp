export class PurchaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PurchaseValidationError";
  }
}
