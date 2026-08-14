import { describe, it, expect } from 'vitest';
import { getPricing, isDeepSeekPeak, normalizeModelName, DEEPSEEK_V4_PRICE_CHANGE_AT, GEMINI_FLASH_PROMO_END_AT } from '../src/utils/pricing.js';

const BEFORE = DEEPSEEK_V4_PRICE_CHANGE_AT - 1;
const AFTER = DEEPSEEK_V4_PRICE_CHANGE_AT;

describe('getPricing', () => {
    it('モデル名の前方一致で単価を引く', () => {
        expect(getPricing('claude-opus-5', AFTER).out).toBe(25);
        expect(getPricing('claude-sonnet-4-5-20250929', AFTER).in).toBe(3);
    });

    it('大文字でも引ける', () => {
        expect(getPricing('Claude-Opus-5', AFTER).out).toBe(25);
    });

    // 前方一致なので、長いキーが短いキーより先に一致する必要がある
    it('より具体的なキーを優先する', () => {
        expect(getPricing('claude-opus-4-1', AFTER).in).toBe(15);
        expect(getPricing('claude-opus-4-8', AFTER).in).toBe(5);
        expect(getPricing('claude-haiku-4-5-20251001', AFTER).in).toBe(1);
    });

    it('知らないモデルは null', () => {
        expect(getPricing('mistral-large-latest', AFTER)).toBeNull();
        expect(getPricing('', AFTER)).toBeNull();
        expect(getPricing(undefined, AFTER)).toBeNull();
    });
});

describe('getPricing — DeepSeek V4の値上げ（2026-08-16 16:00 UTC）', () => {
    it('改定後は新料金を使う', () => {
        expect(getPricing('deepseek-v4-pro', AFTER)).toMatchObject({ in: 0.66, out: 1.98, cr: 0.022 });
        expect(getPricing('deepseek-v4-flash', AFTER)).toMatchObject({ in: 0.22, out: 0.66, cr: 0.007 });
    });

    // 回帰: 過去のチャットのコストが後から跳ね上がって見えないようにする
    it('改定前のメッセージは旧料金で計算する', () => {
        expect(getPricing('deepseek-v4-pro', BEFORE)).toMatchObject({ in: 0.435, out: 0.87, cr: 0.003625 });
        expect(getPricing('deepseek-v4-flash', BEFORE)).toMatchObject({ in: 0.14, out: 0.28, cr: 0.0028 });
    });

    it('境界のちょうどその時刻から新料金', () => {
        expect(getPricing('deepseek-v4-pro', DEEPSEEK_V4_PRICE_CHANGE_AT).in).toBe(0.66);
        expect(getPricing('deepseek-v4-pro', DEEPSEEK_V4_PRICE_CHANGE_AT - 1).in).toBe(0.435);
    });

    it('時刻が無い古いデータは旧料金として扱う', () => {
        expect(getPricing('deepseek-v4-pro').in).toBe(0.435);
        expect(getPricing('deepseek-v4-pro', 0).in).toBe(0.435);
    });

    it('値上げの対象はV4だけで、他のDeepSeekや他社は時刻で変わらない', () => {
        expect(getPricing('deepseek-chat', BEFORE)).toEqual(getPricing('deepseek-chat', AFTER));
        expect(getPricing('deepseek-reasoner', BEFORE)).toEqual(getPricing('deepseek-reasoner', AFTER));
        expect(getPricing('claude-opus-5', BEFORE)).toEqual(getPricing('claude-opus-5', AFTER));
    });

    it('ピーク倍率は改定の前後どちらも2倍', () => {
        expect(getPricing('deepseek-v4-pro', BEFORE).peakMul).toBe(2);
        expect(getPricing('deepseek-v4-pro', AFTER).peakMul).toBe(2);
    });

    it('改定後の値上げ幅（出力は約2.3倍）', () => {
        const pro = getPricing('deepseek-v4-pro', AFTER).out / getPricing('deepseek-v4-pro', BEFORE).out;
        const flash = getPricing('deepseek-v4-flash', AFTER).out / getPricing('deepseek-v4-flash', BEFORE).out;
        expect(pro).toBeCloseTo(2.276, 3);
        expect(flash).toBeCloseTo(2.357, 3);
    });
});

describe('normalizeModelName', () => {
    it('ベンダー接頭辞を外す', () => {
        expect(normalizeModelName('anthropic/claude-opus-5')).toBe('claude-opus-5');
        expect(normalizeModelName('deepseek/deepseek-v4-pro')).toBe('deepseek-v4-pro');
    });

    it('バリアント指定（:free など）を外す', () => {
        expect(normalizeModelName('deepseek/deepseek-chat:free')).toBe('deepseek-chat');
    });

    it('バージョンのドットをハイフンに直す', () => {
        expect(normalizeModelName('anthropic/claude-opus-4.5')).toBe('claude-opus-4-5');
    });

    it('直接APIの名前はそのまま（小文字化のみ）', () => {
        expect(normalizeModelName('claude-haiku-4-5-20251001')).toBe('claude-haiku-4-5-20251001');
    });

    it('非文字列は空文字', () => {
        expect(normalizeModelName(null)).toBe('');
    });
});

describe('getPricing — OpenRouter経由', () => {
    // 回帰: ベンダー接頭辞つきの名前だと前方一致せず、金額が出せなかった
    it('ベンダー接頭辞つきでも単価を引ける', () => {
        expect(getPricing('anthropic/claude-opus-5', AFTER).out).toBe(25);
        expect(getPricing('deepseek/deepseek-v4-pro', AFTER).out).toBe(1.98);
    });

    it('ドット区切りのバージョンでも引ける', () => {
        expect(getPricing('anthropic/claude-opus-4.5', AFTER).in).toBe(5);
        expect(getPricing('anthropic/claude-sonnet-4.5:beta', AFTER).in).toBe(3);
    });

    it('OpenRouter経由でも値上げの前後を正しく切り替える', () => {
        expect(getPricing('deepseek/deepseek-v4-pro', BEFORE).out).toBe(0.87);
        expect(getPricing('deepseek/deepseek-v4-pro', AFTER).out).toBe(1.98);
    });

    it('料金表に無いモデルは接頭辞を外しても null', () => {
        expect(getPricing('google/gemma-3-27b-it', AFTER)).toBeNull();
        expect(getPricing('meta-llama/llama-3.3-70b-instruct', AFTER)).toBeNull();
    });
});

describe('getPricing — Grok', () => {
    // xAI は 'grok-4.6'、OpenRouter は 'x-ai/grok-4.6' の形で来る
    it('直接APIでもOpenRouter経由でも引ける', () => {
        expect(getPricing('grok-4.6', AFTER)).toMatchObject({ in: 2, out: 6, cr: 0.5 });
        expect(getPricing('x-ai/grok-4.6', AFTER)).toMatchObject({ in: 2, out: 6, cr: 0.5 });
    });

    it('200k以上の上位段の単価を持つ', () => {
        expect(getPricing('grok-4.6', AFTER).longCtx).toMatchObject({ threshold: 200000, in: 4, out: 12, cr: 1 });
    });

    it('4.6以外のGrokは料金表に無い', () => {
        expect(getPricing('grok-4', AFTER)).toBeNull();
        expect(getPricing('grok-3-mini', AFTER)).toBeNull();
    });
});

describe('getPricing — OpenAI / Gemini', () => {
    it('GPT-5系を引ける', () => {
        expect(getPricing('gpt-5.6-sol', AFTER)).toMatchObject({ in: 5, out: 30, cr: 0.5 });
        expect(getPricing('gpt-5.4-mini', AFTER)).toMatchObject({ in: 0.75, out: 4.5 });
        expect(getPricing('gpt-5', AFTER)).toMatchObject({ in: 1.25, out: 10 });
    });

    // 前方一致なので、具体的なキーを先に置かないと 'gpt-5' が先に当たってしまう
    it('より具体的なキーが優先される', () => {
        expect(getPricing('gpt-5-mini', AFTER).in).toBe(0.25);
        expect(getPricing('gpt-5.5-pro', AFTER).in).toBe(30);
        expect(getPricing('gpt-5.5', AFTER).in).toBe(5);
        expect(getPricing('gpt-4.1-nano', AFTER).in).toBe(0.10);
        expect(getPricing('gpt-4.1', AFTER).in).toBe(2);
        expect(getPricing('o3-mini', AFTER).in).toBe(1.10);
        expect(getPricing('o3', AFTER).in).toBe(2);
    });

    it('Geminiを引ける', () => {
        // 3.6 Flash は 2026-12-31 まで半額のため、AFTER（2026-08）時点では割引単価になる
        expect(getPricing('gemini-3.6-flash', AFTER)).toMatchObject({ in: 0.75, out: 3.75, cr: 0.075 });
        expect(getPricing('gemini-2.5-pro', AFTER)).toMatchObject({ in: 1.25, out: 10 });
    });

    // 'gemini-2-5-flash-lite' は 'gemini-2-5-flash' で始まるため順序が効く
    it('flash-lite が flash より優先される', () => {
        expect(getPricing('gemini-2.5-flash-lite', AFTER).in).toBe(0.10);
        expect(getPricing('gemini-2.5-flash', AFTER).in).toBe(0.30);
        expect(getPricing('gemini-3.5-flash-lite', AFTER).in).toBe(0.30);
        expect(getPricing('gemini-3.5-flash', AFTER).in).toBe(1.50);
    });

    // アプリのモデル一覧では 'gemini-3.1-pro-preview' として選ぶ
    it('Gemini 3.1 Pro を preview 付きの正式名で引ける', () => {
        expect(getPricing('gemini-3.1-pro-preview', AFTER)).toMatchObject({ in: 2, out: 12, cr: 0.20 });
        expect(getPricing('gemini-3.1-pro-preview-customtools', AFTER).in).toBe(2);
        expect(getPricing('gemini-3.1-pro-preview', AFTER).longCtx).toMatchObject({ threshold: 200000, in: 4, out: 18, cr: 0.40 });
    });

    it('Gemini 2.5 Pro は上位段で入力2倍・出力1.5倍', () => {
        expect(getPricing('gemini-2.5-pro', AFTER).longCtx).toMatchObject({ threshold: 200000, in: 2.50, out: 15, cr: 0.25 });
    });

    it('日付サフィックス付きやOpenRouter経由でも引ける', () => {
        expect(getPricing('gemini-2.5-flash-preview-09-2025', AFTER).in).toBe(0.30);
        expect(getPricing('openai/gpt-5.4', AFTER).in).toBe(2.50);
        expect(getPricing('google/gemini-2.5-pro', AFTER).in).toBe(1.25);
    });
});

describe('isDeepSeekPeak', () => {
    const at = (utcHour) => Date.UTC(2026, 7, 20, utcHour, 30, 0);

    it('UTC 01:00-04:00 はピーク（日本時間 10-13時）', () => {
        expect(isDeepSeekPeak(at(1))).toBe(true);
        expect(isDeepSeekPeak(at(3))).toBe(true);
    });

    it('UTC 06:00-10:00 はピーク（日本時間 15-19時）', () => {
        expect(isDeepSeekPeak(at(6))).toBe(true);
        expect(isDeepSeekPeak(at(9))).toBe(true);
    });

    it('境界の外はオフピーク', () => {
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 20, 0, 59))).toBe(false);
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 20, 4, 0))).toBe(false);
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 20, 5, 59))).toBe(false);
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 20, 10, 0))).toBe(false);
    });

    it('時刻が無ければオフピーク扱い', () => {
        expect(isDeepSeekPeak(undefined)).toBe(false);
        expect(isDeepSeekPeak(0)).toBe(false);
    });
});

describe('getPricing — Gemini Flash の期間限定割引（2026-12-31まで半額）', () => {
    const DURING = GEMINI_FLASH_PROMO_END_AT - 1; // 2026-12-31 23:59:59.999 UTC
    const AFTER_PROMO = GEMINI_FLASH_PROMO_END_AT; // 2027-01-01 00:00 UTC

    it('割引期間中の 3.7 Flash は半額', () => {
        const p = getPricing('gemini-3.7-flash', DURING);
        expect(p.in).toBe(0.75);
        expect(p.out).toBe(3.75);
        expect(p.cr).toBe(0.075);
    });

    it('割引終了後の 3.7 Flash は通常単価（ちょうど2倍）', () => {
        const p = getPricing('gemini-3.7-flash', AFTER_PROMO);
        expect(p.in).toBe(1.50);
        expect(p.out).toBe(7.50);
        expect(p.cr).toBe(0.15);
    });

    it('3.6 Flash も同じ割引対象', () => {
        expect(getPricing('gemini-3.6-flash', DURING).in).toBe(0.75);
        expect(getPricing('gemini-3.6-flash', AFTER_PROMO).in).toBe(1.50);
    });

    it('時刻を持たない古いデータは割引価格で計算する', () => {
        expect(getPricing('gemini-3.7-flash').in).toBe(0.75);
    });

    it('OpenRouter経由の表記でも割引が効く', () => {
        expect(getPricing('google/gemini-3.7-flash', DURING).in).toBe(0.75);
    });

    it('割引対象外の Gemini は影響を受けない', () => {
        expect(getPricing('gemini-3.5-flash', DURING).in).toBe(1.50);
        expect(getPricing('gemini-2.5-flash', DURING).in).toBe(0.30);
    });
});
