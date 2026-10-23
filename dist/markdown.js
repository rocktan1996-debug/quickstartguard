import { marked } from './vendor.js';
import { QsgError } from './errors.js';
import { ID_PATTERN, MAX_MARKDOWN_BYTES, MAX_SCRIPT_BYTES } from './types.js';
function nestedMarkers(tokens) {
    for (const token of tokens) {
        if (token.type === 'code' && /(?:^|\s)qsg=/.test(token.lang ?? ''))
            return true;
        if (token.tokens && nestedMarkers(token.tokens))
            return true;
        if (token.items?.some(item => nestedMarkers(item.tokens)))
            return true;
    }
    return false;
}
export function extractBlocks(input, label = 'README.md') {
    if (Buffer.byteLength(input) > MAX_MARKDOWN_BYTES)
        throw new QsgError('INPUT_SIZE', `${label} exceeds 512 KiB.`);
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(input))
        throw new QsgError('MARKDOWN_CONTROL', `${label} contains unsupported control characters.`);
    const source = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    // Block tokens form the Markdown AST. HTML is not rendered; quoted/list examples never execute.
    const tokens = marked.lexer(source, { gfm: true });
    const blocks = [];
    const ids = new Set();
    let cursor = 0;
    for (const token of tokens) {
        const offset = source.indexOf(token.raw, cursor);
        if (offset < cursor)
            throw new QsgError('MARKDOWN_POSITION', `${label}: unable to map Markdown tokens back to source.`);
        const start = offset;
        cursor = start + token.raw.length;
        if (token.tokens && nestedMarkers(token.tokens) || token.items?.some(item => nestedMarkers(item.tokens))) {
            throw new QsgError('NESTED_MARKER', `${label}: qsg blocks inside lists or blockquotes are not supported; move them to document level.`);
        }
        if (token.type !== 'code' || !/(?:^|\s)qsg=/.test(token.lang ?? ''))
            continue;
        const metadata = (token.lang ?? '').trim().split(/\s+/);
        const language = metadata[0] ?? '';
        const markers = metadata.filter(item => item.startsWith('qsg='));
        if (markers.length !== 1)
            throw new QsgError('MARKDOWN_MARKER', `${label}: each block must have exactly one qsg=id marker.`);
        const id = markers[0].slice(4);
        if (!ID_PATTERN.test(id))
            throw new QsgError('INVALID_ID', `${label}: invalid qsg ID '${id}'.`);
        if (ids.has(id))
            throw new QsgError('DUPLICATE_BLOCK', `${label}: duplicate block '${id}'.`);
        ids.add(id);
        if (!['bash', 'powershell', 'pwsh'].includes(language))
            throw new QsgError('MARKDOWN_LANGUAGE', `${label}: ${id} requires bash, powershell or pwsh.`);
        const lines = token.raw.replace(/\n$/, '').split('\n');
        const fence = /^ {0,3}(`{3,}|~{3,})/.exec(lines[0] ?? '')?.[1];
        if (!fence || token.codeBlockStyle === 'indented')
            throw new QsgError('MARKDOWN_FENCE', `${label}: ${id} must be a fenced code block.`);
        const closing = lines[lines.length - 1] ?? '';
        const closingPattern = new RegExp(`^ {0,3}${fence[0]}{${fence.length},} *$`);
        if (lines.length < 3 || !closingPattern.test(closing))
            throw new QsgError('UNCLOSED_FENCE', `${label}: ${id} must have an explicit closing fence.`);
        const code = token.text ?? '';
        if (!code.trim())
            throw new QsgError('EMPTY_BLOCK', `${label}: ${id} is empty.`);
        if (Buffer.byteLength(code) > MAX_SCRIPT_BYTES)
            throw new QsgError('SCRIPT_SIZE', `${label}: ${id} exceeds 64 KiB.`);
        const fenceLine = source.slice(0, start).split('\n').length;
        blocks.push({ id, language, code, fenceLine, startLine: fenceLine + 1, endLine: fenceLine + lines.length - 2 });
    }
    return blocks;
}
//# sourceMappingURL=markdown.js.map