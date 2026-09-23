import { describe, it, expect } from 'vitest';
import { parseSSEBuffer, extractData } from '../src/utils/sse.js';

describe('parseSSEBuffer', () => {
    it('完結したイベントを取り出し、余りを rest に残す', () => {
        const { events, rest } = parseSSEBuffer('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"');
        expect(events).toEqual(['{"a":1}', '{"b":2}']);
        expect(rest).toBe('data: {"c"');
    });

    it('\\r\\n\\r\\n 区切りでも取り出せる', () => {
        const { events, rest } = parseSSEBuffer('data: {"a":1}\r\n\r\ndata: {"b":2}\r\n\r\n');
        expect(events).toEqual(['{"a":1}', '{"b":2}']);
        expect(rest).toBe('');
    });

    // 回帰: チャンクの途中で切れたぶんを捨てるとJSONが壊れる
    it('途中で切れたイベントは次の受信ぶんと連結して復元できる', () => {
        const first = parseSSEBuffer('data: {"text":"こん');
        expect(first.events).toEqual([]);

        const second = parseSSEBuffer(first.rest + 'にちは"}\n\n');
        expect(second.events).toEqual(['{"text":"こんにちは"}']);
        expect(second.rest).toBe('');
    });

    it('1回の受信に複数イベントが入っていても全部取れる', () => {
        const { events } = parseSSEBuffer('data: 1\n\ndata: 2\n\ndata: 3\n\n');
        expect(events).toEqual(['1', '2', '3']);
    });

    it('空文字や非文字列でも落ちない', () => {
        expect(parseSSEBuffer('')).toEqual({ events: [], rest: '' });
        expect(parseSSEBuffer(null)).toEqual({ events: [], rest: '' });
        expect(parseSSEBuffer(undefined)).toEqual({ events: [], rest: '' });
    });

    it('区切りが無ければ何も取り出さない', () => {
        const { events, rest } = parseSSEBuffer('data: {"a":1}');
        expect(events).toEqual([]);
        expect(rest).toBe('data: {"a":1}');
    });
});

describe('extractData', () => {
    it('コロン直後の空白1個だけを落とす', () => {
        expect(extractData('data: hello')).toBe('hello');
        expect(extractData('data:hello')).toBe('hello');
        // 2個目以降の空白は値の一部
        expect(extractData('data:  hello')).toBe(' hello');
    });

    it('data 行が複数あれば改行で連結する', () => {
        expect(extractData('data: line1\ndata: line2')).toBe('line1\nline2');
    });

    it('コメント行と他フィールドは無視する', () => {
        expect(extractData(': keep-alive\nevent: message\nid: 7\ndata: ok')).toBe('ok');
    });

    it('data 行が無ければ null', () => {
        expect(extractData(': keep-alive')).toBeNull();
        expect(extractData('event: done')).toBeNull();
    });
});
