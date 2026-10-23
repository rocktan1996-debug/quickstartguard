import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export interface MarkdownToken {
  type: string; raw: string; text?: string; lang?: string;
  tokens?: MarkdownToken[]; items?: {tokens: MarkdownToken[]}[];
  codeBlockStyle?: string;
}
export const marked = require('../vendor/marked.cjs') as {
  lexer: (source: string, options?: Record<string, unknown>) => MarkdownToken[];
};
export const yaml = require('../vendor/js-yaml.cjs') as {
  JSON_SCHEMA: unknown;
  load: (source: string, options?: Record<string, unknown>) => unknown;
};
