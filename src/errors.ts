export class QsgError extends Error {
  constructor(public code: string, message: string) {
    super(message); this.name = 'QsgError';
  }
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
