export type AirtableRepositoryErrorContext = {
  status?: number;
  code?: string;
  operation?: string;
  tableName?: string;
  recordId?: string;
  cause?: unknown;
};

export class AirtableRepositoryError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly operation?: string;
  readonly tableName?: string;
  readonly recordId?: string;

  constructor(message: string, context: AirtableRepositoryErrorContext = {}) {
    super(message, { cause: context.cause });
    this.name = "AirtableRepositoryError";
    this.status = context.status;
    this.code = context.code;
    this.operation = context.operation;
    this.tableName = context.tableName;
    this.recordId = context.recordId;
  }
}

export function logAirtableRepositoryError(
  scope: string,
  error: AirtableRepositoryError
) {
  console.error({
    scope,
    operation: error.operation,
    tableName: error.tableName,
    recordId: error.recordId,
    code: error.code,
    status: error.status,
    message: error.message,
  });
}
