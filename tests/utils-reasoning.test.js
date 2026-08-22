import { describe, it, expect } from 'vitest';
import { extractReasoningText } from '../src/utils/reasoning.js';

describe('extractReasoningText', () => {
    it('DeepSeek系の reasoning_content を取り出す', () => {
        expect(extractReasoningText({ reasoning_content: '考えた内容' })).toBe('考えた内容');
    });

    it('OpenRouterの reasoning を取り出す（これまで拾えず思考が出なかった項目）', () => {
        expect(extractReasoningText({ reasoning: 'let me think...' })).toBe('let me think...');
    });

    it('reasoning_details（構造化版）から text を連結する', () => {
        const message = {
            reasoning_details: [{ text: '一段目' }, { text: '二段目' }],
        };
        expect(extractReasoningText(message)).toBe('一段目\n二段目');
    });

    it('reasoning_details の summary も拾う', () => {
        expect(extractReasoningText({ reasoning_details: [{ summary: '要約された思考' }] })).toBe('要約された思考');
    });

    it('両方あるときは文字列項目を優先する', () => {
        const message = { reasoning: '本文', reasoning_details: [{ text: '詳細' }] };
        expect(extractReasoningText(message)).toBe('本文');
    });

    it('思考が無ければ空文字（本文だけの応答で誤って空の思考欄を出さない）', () => {
        expect(extractReasoningText({ content: 'こんにちは' })).toBe('');
        expect(extractReasoningText({ reasoning: '' })).toBe('');
        expect(extractReasoningText({ reasoning: '   ' })).toBe('');
        expect(extractReasoningText({ reasoning_details: [] })).toBe('');
        expect(extractReasoningText({ reasoning_details: [{}] })).toBe('');
    });

    it('壊れた入力でも落ちない', () => {
        expect(extractReasoningText(null)).toBe('');
        expect(extractReasoningText(undefined)).toBe('');
        expect(extractReasoningText('文字列')).toBe('');
        expect(extractReasoningText({ reasoning_details: '配列ではない' })).toBe('');
        expect(extractReasoningText({ reasoning_details: [null, 'x'] })).toBe('');
    });
});
