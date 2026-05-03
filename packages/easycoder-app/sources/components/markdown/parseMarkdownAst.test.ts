import { describe, expect, it } from 'vitest';
import { parseMarkdownAst } from './parseMarkdownAst';

describe('parseMarkdownAst', () => {
    it('parses unordered lists and link spans', () => {
        const blocks = parseMarkdownAst([
            '* first item',
            '+ second item with [docs](https://example.com/docs)',
            '- third item with https://example.com/raw.',
        ].join('\n'));

        expect(blocks).toHaveLength(1);
        expect(blocks[0]?.type).toBe('list');
        if (blocks[0]?.type !== 'list') {
            throw new Error('Expected list block');
        }

        expect(blocks[0].items).toHaveLength(3);
        expect(blocks[0].items[1]).toEqual([
            { styles: [], text: 'second item with ', url: null },
            { styles: [], text: 'docs', url: 'https://example.com/docs' },
        ]);
        expect(blocks[0].items[2]).toEqual([
            { styles: [], text: 'third item with ', url: null },
            { styles: [], text: 'https://example.com/raw', url: 'https://example.com/raw' },
            { styles: [], text: '.', url: null },
        ]);
    });

    it('parses mermaid fenced code blocks', () => {
        const blocks = parseMarkdownAst([
            '```mermaid',
            'graph TD',
            'A --> B',
            '```',
        ].join('\n'));

        expect(blocks).toEqual([
            {
                type: 'mermaid',
                content: 'graph TD\nA --> B',
            },
        ]);
    });

    it('parses options xml blocks', () => {
        const blocks = parseMarkdownAst([
            '<options>',
            '<option>Plan A</option>',
            '<option>Plan B</option>',
            '</options>',
        ].join('\n'));

        expect(blocks).toEqual([
            {
                type: 'options',
                items: ['Plan A', 'Plan B'],
            },
        ]);
    });

    it('parses gfm tables', () => {
        const blocks = parseMarkdownAst([
            '| A | B |',
            '|---|---|',
            '| 1 | 2 |',
        ].join('\n'));

        expect(blocks).toEqual([
            {
                type: 'table',
                headers: [
                    [{ styles: [], text: 'A', url: null }],
                    [{ styles: [], text: 'B', url: null }],
                ],
                rows: [
                    [
                        [{ styles: [], text: '1', url: null }],
                        [{ styles: [], text: '2', url: null }],
                    ],
                ],
            },
        ]);
    });

    it('parses task lists', () => {
        const blocks = parseMarkdownAst([
            '- [ ] todo item',
            '- [x] done item',
        ].join('\n'));

        expect(blocks).toEqual([
            {
                type: 'task-list',
                items: [
                    {
                        checked: false,
                        spans: [{ styles: [], text: 'todo item', url: null }],
                    },
                    {
                        checked: true,
                        spans: [{ styles: [], text: 'done item', url: null }],
                    },
                ],
            },
        ]);
    });

    it('parses blockquotes with multiple paragraphs', () => {
        const blocks = parseMarkdownAst([
            '> first line',
            '>',
            '> second paragraph',
        ].join('\n'));

        expect(blocks).toEqual([
            {
                type: 'blockquote',
                items: [
                    [{ styles: [], text: 'first line', url: null }],
                    [{ styles: [], text: 'second paragraph', url: null }],
                ],
            },
        ]);
    });

    it('parses strikethrough spans', () => {
        const blocks = parseMarkdownAst('before ~~removed~~ after');
        expect(blocks).toEqual([
            {
                type: 'text',
                content: [
                    { styles: [], text: 'before ', url: null },
                    { styles: ['strikethrough'], text: 'removed', url: null },
                    { styles: [], text: ' after', url: null },
                ],
            },
        ]);
    });
});
