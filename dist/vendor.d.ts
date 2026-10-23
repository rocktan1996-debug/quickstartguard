export interface MarkdownToken {
    type: string;
    raw: string;
    text?: string;
    lang?: string;
    tokens?: MarkdownToken[];
    items?: {
        tokens: MarkdownToken[];
    }[];
    codeBlockStyle?: string;
}
export declare const marked: {
    lexer: (source: string, options?: Record<string, unknown>) => MarkdownToken[];
};
export declare const yaml: {
    JSON_SCHEMA: unknown;
    load: (source: string, options?: Record<string, unknown>) => unknown;
};
