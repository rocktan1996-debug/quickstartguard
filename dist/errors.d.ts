export declare class QsgError extends Error {
    code: string;
    constructor(code: string, message: string);
}
export declare function errorMessage(error: unknown): string;
