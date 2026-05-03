import type { MarkdownBlock, MarkdownSpan } from './parseMarkdown';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

type AstNode = {
    type: string;
    value?: string;
    depth?: number;
    lang?: string | null;
    url?: string;
    alt?: string | null;
    ordered?: boolean;
    start?: number;
    children?: AstNode[];
    checked?: boolean | null;
};

const OPTIONS_PLACEHOLDER_PREFIX = 'EASYCODER_OPTIONS_BLOCK_TOKEN_';

function styleEquals(a: MarkdownSpan['styles'], b: MarkdownSpan['styles']) {
    if (a.length !== b.length) return false;
    return a.every((style, index) => style === b[index]);
}

function pushSpan(spans: MarkdownSpan[], span: MarkdownSpan) {
    if (!span.text) return;

    const last = spans[spans.length - 1];
    if (last && last.url === span.url && styleEquals(last.styles, span.styles)) {
        last.text += span.text;
        return;
    }

    spans.push(span);
}

function pushTextWithAutoLinks(spans: MarkdownSpan[], text: string, styles: MarkdownSpan['styles']) {
    const urlPattern = /https?:\/\/[^\s<]+/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlPattern.exec(text)) !== null) {
        const plainText = text.slice(lastIndex, match.index);
        if (plainText) {
            pushSpan(spans, { styles, text: plainText, url: null });
        }

        let url = match[0];
        let trailing = '';
        while (/[),.;:!?]$/.test(url)) {
            trailing = url.slice(-1) + trailing;
            url = url.slice(0, -1);
        }

        if (url) {
            pushSpan(spans, { styles, text: url, url });
        }

        if (trailing) {
            pushSpan(spans, { styles, text: trailing, url: null });
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        pushSpan(spans, { styles, text: text.slice(lastIndex), url: null });
    }
}

function prependTextSpan(spans: MarkdownSpan[], prefix: string): MarkdownSpan[] {
    if (!prefix) return spans;
    return [{ styles: [], text: prefix, url: null }, ...spans];
}

function appendPhrasingSpans(
    spans: MarkdownSpan[],
    nodes: AstNode[] | undefined,
    header: boolean,
    styles: MarkdownSpan['styles'] = []
) {
    if (!nodes || nodes.length === 0) return;

    for (const node of nodes) {
        if (node.type === 'text') {
            pushTextWithAutoLinks(spans, node.value ?? '', styles);
            continue;
        }

        if (node.type === 'inlineCode') {
            pushSpan(spans, { styles: ['code'], text: node.value ?? '', url: null });
            continue;
        }

        if (node.type === 'strong') {
            const nextStyles = header || styles.includes('bold') ? styles : [...styles, 'bold' as const];
            appendPhrasingSpans(spans, node.children, header, nextStyles);
            continue;
        }

        if (node.type === 'emphasis') {
            const nextStyles = header || styles.includes('italic') ? styles : [...styles, 'italic' as const];
            appendPhrasingSpans(spans, node.children, header, nextStyles);
            continue;
        }

        if (node.type === 'delete') {
            const nextStyles = styles.includes('strikethrough') ? styles : [...styles, 'strikethrough' as const];
            appendPhrasingSpans(spans, node.children, header, nextStyles);
            continue;
        }

        if (node.type === 'link') {
            const linkTextSpans: MarkdownSpan[] = [];
            appendPhrasingSpans(linkTextSpans, node.children, header, styles);
            const url = node.url ?? null;
            for (const span of linkTextSpans) {
                pushSpan(spans, { ...span, url });
            }
            continue;
        }

        if (node.type === 'break') {
            pushSpan(spans, { styles, text: '\n', url: null });
            continue;
        }

        if (node.children && node.children.length > 0) {
            appendPhrasingSpans(spans, node.children, header, styles);
        }
    }
}

function nodeToSpans(node: AstNode, header: boolean): MarkdownSpan[] {
    const spans: MarkdownSpan[] = [];
    appendPhrasingSpans(spans, node.children, header);
    return spans;
}

function listItemToSpans(item: AstNode): MarkdownSpan[] {
    const spans: MarkdownSpan[] = [];
    const blocks = item.children ?? [];

    blocks.forEach((child, index) => {
        if (index > 0) {
            pushSpan(spans, { styles: [], text: '\n', url: null });
        }

        if (child.type === 'paragraph') {
            appendPhrasingSpans(spans, child.children, false);
            return;
        }

        if (child.type === 'code') {
            pushSpan(spans, { styles: ['code'], text: child.value ?? '', url: null });
            return;
        }

        if (child.children && child.children.length > 0) {
            appendPhrasingSpans(spans, child.children, false);
            return;
        }

        if (child.value) {
            pushTextWithAutoLinks(spans, child.value, []);
        }
    });

    return spans;
}

function blockquoteItemSpans(node: AstNode): MarkdownSpan[][] {
    const items: MarkdownSpan[][] = [];

    if (node.type === 'paragraph') {
        const spans = nodeToSpans(node, false);
        if (spans.length > 0) items.push(spans);
        return items;
    }

    if (node.type === 'list') {
        const listItems = node.children ?? [];
        const startNumber = typeof node.start === 'number' ? node.start : 1;
        listItems.forEach((item, index) => {
            const spans = listItemToSpans(item);
            if (spans.length === 0) return;

            const prefix = node.ordered ? `${startNumber + index}. ` : '- ';
            items.push(prependTextSpan(spans, prefix));
        });
        return items;
    }

    if (node.type === 'code') {
        const codeText = node.value ?? '';
        if (codeText.length > 0) {
            items.push([{ styles: ['code'], text: codeText, url: null }]);
        }
        return items;
    }

    if (node.children && node.children.length > 0) {
        const spans = nodeToSpans(node, false);
        if (spans.length > 0) items.push(spans);
    }

    return items;
}

function extractOptionsBlocks(markdown: string) {
    const optionsByToken = new Map<string, string[]>();
    let optionsIndex = 0;

    const processedMarkdown = markdown.replace(/<options>\s*([\s\S]*?)\s*<\/options>/gi, (_, inner: string) => {
        const items: string[] = [];
        const optionPattern = /<option>([\s\S]*?)<\/option>/gi;
        let match: RegExpExecArray | null;

        while ((match = optionPattern.exec(inner)) !== null) {
            const value = match[1].trim();
            if (value.length > 0) {
                items.push(value);
            }
        }

        if (items.length === 0) {
            return '';
        }

        const token = `${OPTIONS_PLACEHOLDER_PREFIX}${optionsIndex++}__`;
        optionsByToken.set(token, items);
        return `\n\n${token}\n\n`;
    });

    return { processedMarkdown, optionsByToken };
}

function toMarkdownBlock(node: AstNode, optionsByToken: Map<string, string[]>): MarkdownBlock | null {
    if (node.type === 'heading') {
        const level = Math.min(Math.max(node.depth ?? 1, 1), 6) as 1 | 2 | 3 | 4 | 5 | 6;
        return {
            type: 'header',
            level,
            content: nodeToSpans(node, true),
        };
    }

    if (node.type === 'paragraph') {
        const children = node.children ?? [];
        if (children.length === 1 && children[0].type === 'image') {
            return {
                type: 'image',
                alt: children[0].alt ?? '',
                url: children[0].url ?? '',
            };
        }

        const spans = nodeToSpans(node, false);
        const text = spans.map((span) => span.text).join('').trim();
        const options = optionsByToken.get(text);
        if (options && options.length > 0) {
            return { type: 'options', items: options };
        }

        if (spans.length === 0) {
            return null;
        }

        return {
            type: 'text',
            content: spans,
        };
    }

    if (node.type === 'code') {
        const language = node.lang ?? null;
        const content = node.value ?? '';

        if (language === 'mermaid') {
            return { type: 'mermaid', content };
        }

        return {
            type: 'code-block',
            language,
            content,
        };
    }

    if (node.type === 'thematicBreak') {
        return { type: 'horizontal-rule' };
    }

    if (node.type === 'list') {
        const items = node.children ?? [];
        const isTaskList = items.length > 0 && items.every((item) => typeof item.checked === 'boolean');
        if (isTaskList) {
            return {
                type: 'task-list',
                items: items.map((item) => ({
                    checked: !!item.checked,
                    spans: listItemToSpans(item),
                })),
            };
        }

        if (node.ordered) {
            const startNumber = typeof node.start === 'number' ? node.start : 1;
            return {
                type: 'numbered-list',
                items: items.map((item, index) => ({
                    number: startNumber + index,
                    spans: listItemToSpans(item),
                })),
            };
        }

        return {
            type: 'list',
            items: items.map((item) => listItemToSpans(item)),
        };
    }

    if (node.type === 'blockquote') {
        const items = (node.children ?? []).flatMap((child) => blockquoteItemSpans(child));
        if (items.length === 0) {
            return null;
        }

        return {
            type: 'blockquote',
            items,
        };
    }

    if (node.type === 'table') {
        const rows = node.children ?? [];
        const [headerRow, ...bodyRows] = rows;
        if (!headerRow || !headerRow.children) {
            return null;
        }

        const headers = headerRow.children.map((cell) => nodeToSpans(cell, false));
        const parsedRows = bodyRows.map((row) => (row.children ?? []).map((cell) => nodeToSpans(cell, false)));

        return {
            type: 'table',
            headers,
            rows: parsedRows,
        };
    }

    return null;
}

export function parseMarkdownAst(markdown: string): MarkdownBlock[] {
    const { processedMarkdown, optionsByToken } = extractOptionsBlocks(markdown);
    const tree = unified().use(remarkParse).use(remarkGfm).parse(processedMarkdown) as AstNode;
    const blocks: MarkdownBlock[] = [];

    for (const child of tree.children ?? []) {
        const block = toMarkdownBlock(child, optionsByToken);
        if (block) {
            blocks.push(block);
        }
    }

    const merged: MarkdownBlock[] = [];
    for (const block of blocks) {
        const previous = merged[merged.length - 1];

        if (previous?.type === 'list' && block.type === 'list') {
            previous.items.push(...block.items);
            continue;
        }

        if (previous?.type === 'numbered-list' && block.type === 'numbered-list') {
            previous.items.push(...block.items);
            continue;
        }

        if (previous?.type === 'task-list' && block.type === 'task-list') {
            previous.items.push(...block.items);
            continue;
        }

        merged.push(block);
    }

    return merged;
}
