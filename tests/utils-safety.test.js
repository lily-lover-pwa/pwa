import { describe, it, expect } from 'vitest';
import {
    GEMINI_ADJUSTABLE_HARM_CATEGORIES,
    GEMINI_SAFETY_THRESHOLD,
    getGeminiSafetySettings,
} from '../src/utils/safety.js';

describe('getGeminiSafetySettings', () => {
    it('調整できる4カテゴリすべてを BLOCK_NONE で返す', () => {
        expect(getGeminiSafetySettings()).toEqual([
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]);
    });

    // safetySettings で設定できるのはこの4つだけ。CIVIC_INTEGRITY / JAILBREAK は
    // HarmCategory の列挙にはあるが safetySettings では受け付けず、足すと 400 になる
    it('調整できないカテゴリを含めない', () => {
        expect(GEMINI_ADJUSTABLE_HARM_CATEGORIES).not.toContain('HARM_CATEGORY_CIVIC_INTEGRITY');
        expect(GEMINI_ADJUSTABLE_HARM_CATEGORIES).not.toContain('HARM_CATEGORY_JAILBREAK');
        expect(GEMINI_ADJUSTABLE_HARM_CATEGORIES).toHaveLength(4);
    });

    it('閾値はブロックしない設定になっている', () => {
        expect(GEMINI_SAFETY_THRESHOLD).toBe('BLOCK_NONE');
        expect(getGeminiSafetySettings().every((s) => s.threshold === GEMINI_SAFETY_THRESHOLD)).toBe(true);
    });

    // 呼び出し側が受け取った配列を書き換えても、次の呼び出しに影響しないこと
    it('呼ぶたびに新しい配列を返す', () => {
        const a = getGeminiSafetySettings();
        const b = getGeminiSafetySettings();
        expect(a).not.toBe(b);
        a[0].threshold = 'BLOCK_LOW_AND_ABOVE';
        expect(getGeminiSafetySettings()[0].threshold).toBe('BLOCK_NONE');
    });
});
