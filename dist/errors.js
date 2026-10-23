export class QsgError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'QsgError';
    }
}
export function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=errors.js.map