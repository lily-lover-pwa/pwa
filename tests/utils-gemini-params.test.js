import { describe, it, expect } from 'vitest';
import { geminiAcceptsSamplingParams, geminiAcceptsThinkingBudget, sanitizeGeminiGenerationConfig } from '../src/utils/gemini-params.js';

// 2026-10 に Google から届いた告知:
//   - thinking_budget は今後のモデルで 400 INVALID_ARGUMENT
//   - temperature / top_p / top_k は 3.6 Flash 以降で効かず、近日公開のモデルではエラー

describe('geminiAcceptsSamplingParams', () => {
    it('3.6 Flash より前の世代には送る', () => {
        for (const m of ['gemini-2.5-pro', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.5-flash-lite']) {
            expect(geminiAcceptsSamplingParams(m)).toBe(true);
        }
    });

    it('3.6 Flash 以降には送らない（送っても効かない）', () => {
        for (const m of ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash']) {
            expect(geminiAcceptsSamplingParams(m)).toBe(false);
        }
    });

    // 名前を知らないモデルは今後のモデルとみなす。送らなければモデルの既定で動くだけで済む
    it('今後出るモデルと -latest の別名には送らない', () => {
        expect(geminiAcceptsSamplingParams('gemini-4-flash')).toBe(false);
        expect(geminiAcceptsSamplingParams('gemini-3.9-flash')).toBe(false);
        expect(geminiAcceptsSamplingParams('gemini-flash-latest')).toBe(false);
    });

    // 3.1 と 3.10 を取り違えない
    it('前方一致で別の版に当たらない', () => {
        expect(geminiAcceptsSamplingParams('gemini-3.10-flash')).toBe(false);
    });

    it('Gemini 以外（Gemma など）は対象外', () => {
        expect(geminiAcceptsSamplingParams('gemma-3-27b-it')).toBe(true);
    });
});

describe('geminiAcceptsThinkingBudget', () => {
    it('告知の時点で出ていたモデル（3.8 Flash まで）は受け付ける', () => {
        for (const m of ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash']) {
            expect(geminiAcceptsThinkingBudget(m)).toBe(true);
        }
    });

    it('今後出るモデルと -latest の別名は受け付けない扱い', () => {
        expect(geminiAcceptsThinkingBudget('gemini-4-flash')).toBe(false);
        expect(geminiAcceptsThinkingBudget('gemini-3.9-flash')).toBe(false);
        expect(geminiAcceptsThinkingBudget('gemini-flash-latest')).toBe(false);
    });
});

describe('sanitizeGeminiGenerationConfig', () => {
    const full = {
        temperature: 0.9, topP: 0.95, topK: 40, maxOutputTokens: 1000,
        thinkingConfig: { thinkingBudget: 5000, includeThoughts: true },
    };

    it('3.5 Flash ではそのまま', () => {
        expect(sanitizeGeminiGenerationConfig('gemini-3.5-flash', full)).toEqual(full);
    });

    it('3.8 Flash では temperature / topP / topK だけ落とす', () => {
        expect(sanitizeGeminiGenerationConfig('gemini-3.8-flash', full)).toEqual({
            maxOutputTokens: 1000,
            thinkingConfig: { thinkingBudget: 5000, includeThoughts: true },
        });
    });

    it('今後のモデルでは thinkingBudget も落とし、残りの思考設定は残す', () => {
        expect(sanitizeGeminiGenerationConfig('gemini-4-flash', full)).toEqual({
            maxOutputTokens: 1000,
            thinkingConfig: { includeThoughts: true },
        });
    });

    it('thinkingConfig が thinkingBudget だけなら thinkingConfig ごと落とす', () => {
        expect(sanitizeGeminiGenerationConfig('gemini-4-flash', { thinkingConfig: { thinkingBudget: 0 } })).toEqual({});
    });

    it('thinkingLevel は落とさない', () => {
        expect(sanitizeGeminiGenerationConfig('gemini-4-flash', { thinkingConfig: { thinkingLevel: 'HIGH' } }))
            .toEqual({ thinkingConfig: { thinkingLevel: 'HIGH' } });
    });

    it('渡したオブジェクトは変更しない', () => {
        const input = { temperature: 0.5, thinkingConfig: { thinkingBudget: 100 } };
        sanitizeGeminiGenerationConfig('gemini-4-flash', input);
        expect(input).toEqual({ temperature: 0.5, thinkingConfig: { thinkingBudget: 100 } });
    });

    it('null / undefined でも空オブジェクト', () => {
        expect(sanitizeGeminiGenerationConfig('gemini-4-flash', null)).toEqual({});
        expect(sanitizeGeminiGenerationConfig('gemini-4-flash', undefined)).toEqual({});
    });
});
