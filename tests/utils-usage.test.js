import { describe, it, expect } from 'vitest';
import { getUsageRange, calcMessageCost, summarizeUsage } from '../src/utils/usage.js';

// 料金改定後の時刻を使う（V4-Pro: in 0.66 / out 1.98 / cr 0.022、ピークは2倍）
const AFTER_OFFPEAK = Date.UTC(2026, 8, 20, 12, 0); // 2026-09-20 12:00 UTC = オフピーク
const AFTER_PEAK = Date.UTC(2026, 8, 21, 2, 0);     // 2026-09-21(月) 02:00 UTC = 北京10:00 ピーク
// ※ 週末(北京時間の土日)は終日オフピークになったため、ピークの検証には平日を使う

const msg = (overrides = {}) => ({
    role: 'model',
    modelName: 'deepseek-v4-pro',
    timestamp: AFTER_OFFPEAK,
    usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 1000 },
    ...overrides,
});

describe('getUsageRange', () => {
    const now = new Date(2026, 7, 13, 15, 0).getTime(); // 2026-08-13 15:00 ローカル

    it('今月は当月1日から', () => {
        const { from, to } = getUsageRange('thisMonth', now);
        expect(new Date(from).getMonth()).toBe(7);
        expect(new Date(from).getDate()).toBe(1);
        expect(to).toBe(Infinity);
    });

    it('先月は前月1日から当月1日まで', () => {
        const { from, to } = getUsageRange('lastMonth', now);
        expect(new Date(from).getMonth()).toBe(6);
        expect(new Date(to).getMonth()).toBe(7);
        expect(new Date(to).getDate()).toBe(1);
    });

    it('過去30日は now から30日前', () => {
        const { from } = getUsageRange('last30d', now);
        expect(now - from).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it('全期間は無制限', () => {
        expect(getUsageRange('all', now)).toEqual({ from: -Infinity, to: Infinity });
    });

    // 年をまたぐと前月が前年12月になる
    it('1月の先月は前年12月', () => {
        const jan = new Date(2027, 0, 5).getTime();
        const { from } = getUsageRange('lastMonth', jan);
        expect(new Date(from).getFullYear()).toBe(2026);
        expect(new Date(from).getMonth()).toBe(11);
    });
});

describe('calcMessageCost', () => {
    it('入力と出力から料金を出す', () => {
        expect(calcMessageCost(msg())).toBeCloseTo((1000 * 0.66 + 1000 * 1.98) / 1e6, 10);
    });

    it('ピーク時間帯は2倍', () => {
        expect(calcMessageCost(msg({ timestamp: AFTER_PEAK }))).toBeCloseTo(2 * (1000 * 0.66 + 1000 * 1.98) / 1e6, 10);
    });

    it('キャッシュヒット分は安い単価で計算する', () => {
        const cost = calcMessageCost(msg({
            usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 0, cacheReadInputTokens: 900 },
        }));
        expect(cost).toBeCloseTo((100 * 0.66 + 900 * 0.022) / 1e6, 10);
    });

    it('料金表に無いモデルは null', () => {
        expect(calcMessageCost(msg({ modelName: 'mistral-large-latest' }))).toBeNull();
        expect(calcMessageCost(msg({ modelName: '' }))).toBeNull();
    });

    // Grok 4.6 はプロンプトが200k以上だと単価が2倍になる
    it('Grokは200k未満なら通常単価', () => {
        const cost = calcMessageCost(msg({
            modelName: 'grok-4.6',
            usageMetadata: { promptTokenCount: 199_999, candidatesTokenCount: 1000 },
        }));
        expect(cost).toBeCloseTo((199_999 * 2 + 1000 * 6) / 1e6, 10);
    });

    it('Grokは200k以上だと2倍になる', () => {
        const cost = calcMessageCost(msg({
            modelName: 'grok-4.6',
            usageMetadata: { promptTokenCount: 200_000, candidatesTokenCount: 1000 },
        }));
        expect(cost).toBeCloseTo(2 * (200_000 * 2 + 1000 * 6) / 1e6, 10);
    });

    it('Gemini 2.5 Proは200k以上で入力2倍・出力1.5倍になる', () => {
        const cost = calcMessageCost(msg({
            modelName: 'gemini-2.5-pro',
            usageMetadata: { promptTokenCount: 200_000, candidatesTokenCount: 1000 },
        }));
        expect(cost).toBeCloseTo((200_000 * 2.50 + 1000 * 15) / 1e6, 10);
    });

    it('Geminiのキャッシュヒット（cachedContentTokenCount）を安い単価で計算する', () => {
        const cost = calcMessageCost(msg({
            modelName: 'gemini-2.5-flash',
            usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 0, cachedContentTokenCount: 800 },
        }));
        expect(cost).toBeCloseTo((200 * 0.30 + 800 * 0.03) / 1e6, 10);
    });

    it('キャッシュ書込に別料金の無いモデルは通常入力と同額で計算する', () => {
        const cost = calcMessageCost(msg({
            modelName: 'gpt-5',
            usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 0, cacheCreationInputTokens: 400 },
        }));
        expect(cost).toBeCloseTo(1000 * 1.25 / 1e6, 10);
    });

    it('Grokの長コンテキスト倍率はOpenRouter経由でも効く', () => {
        const cost = calcMessageCost(msg({
            modelName: 'x-ai/grok-4.6',
            usageMetadata: { promptTokenCount: 300_000, candidatesTokenCount: 0 },
        }));
        expect(cost).toBeCloseTo(2 * (300_000 * 2) / 1e6, 10);
    });

    it('長コンテキストでもキャッシュヒット分は安い単価のまま2倍される', () => {
        const cost = calcMessageCost(msg({
            modelName: 'grok-4.6',
            usageMetadata: { promptTokenCount: 250_000, candidatesTokenCount: 0, cacheReadInputTokens: 200_000 },
        }));
        expect(cost).toBeCloseTo(2 * (50_000 * 2 + 200_000 * 0.5) / 1e6, 10);
    });

    // DeepSeekのピーク倍率とGrokの長コンテキスト倍率が混線しないこと
    it('Grokにはピーク倍率がかからない', () => {
        const peak = calcMessageCost(msg({ modelName: 'grok-4.6', timestamp: AFTER_PEAK,
            usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 1000 } }));
        const off = calcMessageCost(msg({ modelName: 'grok-4.6', timestamp: AFTER_OFFPEAK,
            usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 1000 } }));
        expect(peak).toBe(off);
    });
});

describe('summarizeUsage', () => {
    const chats = [
        { id: 1, messages: [msg(), msg({ modelName: 'claude-opus-5' })] },
        { id: 2, messages: [msg({ modelName: 'mistral-large-latest' })] },
    ];

    it('モデルごとにまとめる', () => {
        const r = summarizeUsage(chats);
        expect(r.byModel.map(m => m.model).sort()).toEqual(['claude-opus-5', 'deepseek-v4-pro', 'mistral-large-latest']);
        expect(r.totalMessages).toBe(3);
        expect(r.totalInput).toBe(3000);
        expect(r.totalOutput).toBe(3000);
    });

    it('同じモデルは合算する', () => {
        const r = summarizeUsage([{ messages: [msg(), msg(), msg()] }]);
        expect(r.byModel).toHaveLength(1);
        expect(r.byModel[0].messages).toBe(3);
        expect(r.byModel[0].input).toBe(3000);
    });

    // 料金表に無いモデルもトークンは数えるが、金額には混ぜない
    it('料金不明のモデルはトークンだけ数えてフラグを立てる', () => {
        const r = summarizeUsage(chats);
        const unpriced = r.byModel.find(m => m.model === 'mistral-large-latest');
        expect(unpriced.priced).toBe(false);
        expect(unpriced.cost).toBe(0);
        expect(unpriced.input).toBe(1000);
        expect(r.hasUnpriced).toBe(true);
    });

    it('合計金額は料金の分かるモデルだけを足す', () => {
        const r = summarizeUsage(chats);
        const expected = (1000 * 0.66 + 1000 * 1.98) / 1e6 + (1000 * 5 + 1000 * 25) / 1e6;
        expect(r.totalCost).toBeCloseTo(expected, 10);
    });

    it('金額の大きい順に並び、料金不明は末尾', () => {
        const r = summarizeUsage(chats);
        expect(r.byModel[0].model).toBe('claude-opus-5'); // $0.030 > $0.00264
        expect(r.byModel[r.byModel.length - 1].model).toBe('mistral-large-latest');
    });

    it('ピーク時間帯にかかった分を別途集計する', () => {
        const r = summarizeUsage([{ messages: [msg({ timestamp: AFTER_PEAK }), msg()] }]);
        expect(r.peakCost).toBeCloseTo(2 * (1000 * 0.66 + 1000 * 1.98) / 1e6, 10);
        expect(r.peakCost).toBeLessThan(r.totalCost);
    });

    it('期間で絞り込む', () => {
        const old = msg({ timestamp: Date.UTC(2026, 0, 1, 12, 0) });
        const r = summarizeUsage([{ messages: [old, msg()] }], { from: Date.UTC(2026, 8, 1) });
        expect(r.totalMessages).toBe(1);
    });

    // 期間指定つきで時刻の無いメッセージを含めると、いつのぶんか分からないまま加算されてしまう
    it('時刻の無いメッセージは全期間のときだけ数える', () => {
        const noTs = msg({ timestamp: undefined });
        expect(summarizeUsage([{ messages: [noTs] }]).totalMessages).toBe(1);
        expect(summarizeUsage([{ messages: [noTs] }], { from: 0 }).totalMessages).toBe(0);
    });

    it('usageMetadataが無いメッセージ（ユーザー発言など）は数えない', () => {
        const r = summarizeUsage([{ messages: [{ role: 'user', content: 'hi', timestamp: AFTER_OFFPEAK }] }]);
        expect(r.totalMessages).toBe(0);
    });

    it('空・不正な入力でも落ちない', () => {
        expect(summarizeUsage([]).totalMessages).toBe(0);
        expect(summarizeUsage(null).byModel).toEqual([]);
        expect(summarizeUsage([{}, { messages: null }]).totalMessages).toBe(0);
    });
});
