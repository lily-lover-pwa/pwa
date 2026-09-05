import { describe, it, expect } from 'vitest';
import { getPricing, isDeepSeekPeak, normalizeModelName, DEEPSEEK_V4_PRICE_CHANGE_AT, GEMINI_FLASH_PROMO_END_AT, DEEPSEEK_WEEKEND_OFFPEAK_AT, GPT_56_SOL_PRICE_CUT_AT } from '../src/utils/pricing.js';

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
        // 料金表に載せていないモデル（Sakana の fugu / Groq の Compound など）
        expect(getPricing('fugu-ultra', AFTER)).toBeNull();
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

    it('現行の 4.5 / 4.3 も引ける（キャッシュ単価だけ 4.6 と違う）', () => {
        expect(getPricing('grok-4.5', AFTER)).toMatchObject({ in: 2, out: 6, cr: 0.30 });
        expect(getPricing('grok-4.3', AFTER)).toMatchObject({ in: 1.25, out: 2.50, cr: 0.20 });
        expect(getPricing('grok-4.3', AFTER).longCtx).toMatchObject({ threshold: 200000, in: 2.50, out: 5, cr: 0.40 });
    });

    it('提供終了したGrokは料金表に無い', () => {
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

    // 'gemini-3-flash' は 'gemini-3-7-flash' などと前方一致で衝突しないこと
    it('Gemini 3 Flash（プレビュー）を引ける', () => {
        expect(getPricing('gemini-3-flash-preview', AFTER)).toMatchObject({ in: 0.50, out: 3, cr: 0.05 });
        expect(getPricing('gemini-3.7-flash', AFTER).in).not.toBe(0.50);
        expect(getPricing('gemini-3.1-flash-lite', AFTER)).toMatchObject({ in: 0.25, out: 1.50 });
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

describe('isDeepSeekPeak — 週末のピーク廃止（2026-08-23 00:00 北京時間〜）', () => {
    // 北京時間 = UTC+8。UTC 01:00-04:00 / 06:00-10:00 がピーク帯。
    // 2026-08-24(月) 02:00 UTC = 北京 10:00（平日・ピーク帯）
    const MON_PEAK = Date.UTC(2026, 7, 24, 2, 0, 0);
    // 2026-08-29(土) 02:00 UTC = 北京 10:00（週末・ピーク帯だが対象外になる）
    const SAT_PEAK_HOUR = Date.UTC(2026, 7, 29, 2, 0, 0);
    // 2026-08-30(日) 07:00 UTC = 北京 15:00（週末・ピーク帯だが対象外になる）
    const SUN_PEAK_HOUR = Date.UTC(2026, 7, 30, 7, 0, 0);

    it('改定後の平日はこれまでどおりピークになる', () => {
        expect(isDeepSeekPeak(MON_PEAK)).toBe(true);
    });

    it('改定後の週末はピーク帯の時刻でもオフピーク扱い', () => {
        expect(isDeepSeekPeak(SAT_PEAK_HOUR)).toBe(false);
        expect(isDeepSeekPeak(SUN_PEAK_HOUR)).toBe(false);
    });

    it('改定前の週末は従来どおりピークのまま（過去の請求額が変わらない）', () => {
        // 2026-08-15(土) 02:00 UTC = 北京 10:00。改定前なので peak のまま
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 15, 2, 0, 0))).toBe(true);
    });

    it('曜日は北京時間で判定する（UTCで見ると境界が8時間ずれる）', () => {
        // 2026-08-28(金) 17:00 UTC = 北京 8/29(土) 01:00 → 週末側。
        // ただし 17時UTC はそもそもピーク帯ではないので、境界の確認は下の平日側で行う。
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 28, 17, 0, 0))).toBe(false);
        // 2026-08-30(日) 16:00 UTC = 北京 8/31(月) 00:00 → 平日側に戻る。
        // 00時台はピーク帯外なので false だが、北京月曜の 10:00（=8/31 02:00 UTC）は true
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 31, 2, 0, 0))).toBe(true);
    });

    it('切替時刻ちょうど（北京 8/23 00:00 = 日曜）から週末オフピークが効く', () => {
        // 切替の1ミリ秒前は旧規則。ただし 16:00 UTC はピーク帯外なのでどちらも false。
        // 効き目が見えるのは同じ日曜のピーク帯 = 8/23 02:00 UTC（北京 10:00）
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 23, 2, 0, 0))).toBe(false);
        // その直前の日曜（8/16 02:00 UTC）は旧規則でピーク
        expect(isDeepSeekPeak(Date.UTC(2026, 7, 16, 2, 0, 0))).toBe(true);
        expect(DEEPSEEK_WEEKEND_OFFPEAK_AT).toBe(Date.UTC(2026, 7, 22, 16, 0, 0));
    });
});

describe('getPricing — GPT-5.6 Sol の値下げ（2026-08-21）', () => {
    const AFTER_CUT = GPT_56_SOL_PRICE_CUT_AT;
    const BEFORE_CUT = GPT_56_SOL_PRICE_CUT_AT - 1;

    it('値下げ後は新単価（入力$4／出力$20／キャッシュ$0.40）', () => {
        expect(getPricing('gpt-5.6-sol', AFTER_CUT)).toMatchObject({ in: 4, out: 20, cr: 0.40 });
    });

    // 回帰: 過去のチャットのコストが後から下がって見えないようにする
    it('値下げ前のメッセージは旧単価で計算する', () => {
        expect(getPricing('gpt-5.6-sol', BEFORE_CUT)).toMatchObject({ in: 5, out: 30, cr: 0.50 });
    });

    it('発表どおりの下げ幅（入力20%・出力33%）', () => {
        const before = getPricing('gpt-5.6-sol', BEFORE_CUT);
        const after = getPricing('gpt-5.6-sol', AFTER_CUT);
        expect(1 - after.in / before.in).toBeCloseTo(0.20, 2);
        expect(1 - after.out / before.out).toBeCloseTo(0.333, 2);
    });

    it('OpenRouter経由の表記でも切り替わる', () => {
        expect(getPricing('openai/gpt-5.6-sol', AFTER_CUT).out).toBe(20);
        expect(getPricing('openai/gpt-5.6-sol', BEFORE_CUT).out).toBe(30);
    });

    it('値下げの対象は Sol だけで、他のGPTは時刻で変わらない', () => {
        expect(getPricing('gpt-5.5', BEFORE_CUT)).toEqual(getPricing('gpt-5.5', AFTER_CUT));
        expect(getPricing('gpt-5', BEFORE_CUT)).toEqual(getPricing('gpt-5', AFTER_CUT));
    });
});

describe('getPricing — Claude Sonnet 5 / Fable / Mythos', () => {
    // 回帰: 専用の行が無く 'claude-sonnet' の前方一致で $3/$15 が当たっていたため、
    // Sonnet 5 の推定コストが実際の1.5倍に出ていた
    it('Sonnet 5 は 4.6/4.5 より安い（$2/$10）', () => {
        expect(getPricing('claude-sonnet-5', AFTER)).toMatchObject({ in: 2, out: 10, cw5m: 2.50, cw1h: 4, cr: 0.20 });
        expect(getPricing('claude-sonnet-4-6', AFTER)).toMatchObject({ in: 3, out: 15 });
        expect(getPricing('claude-sonnet-4-5-20250929', AFTER)).toMatchObject({ in: 3, out: 15 });
    });

    // 導入価格が正価になり値上げは行われないと明記されたので、期間で分けない
    it('Sonnet 5 は時期によらず同じ単価', () => {
        expect(getPricing('claude-sonnet-5', BEFORE).in).toBe(2);
        expect(getPricing('claude-sonnet-5', Date.UTC(2027, 0, 1)).in).toBe(2);
    });

    it('Fable / Mythos を引ける（5.1 はキャッシュヒットが 0.025 倍）', () => {
        expect(getPricing('claude-fable-5-1', AFTER)).toMatchObject({ in: 10, out: 50, cr: 0.25 });
        expect(getPricing('claude-mythos-5-1', AFTER)).toMatchObject({ in: 10, out: 50, cr: 0.25 });
        expect(getPricing('claude-fable-5', AFTER)).toMatchObject({ in: 10, out: 50, cr: 1 });
        expect(getPricing('claude-mythos-5', AFTER)).toMatchObject({ in: 10, out: 50, cr: 1 });
    });

    // '5.1' が 'claude-fable-5' に先に当たると、キャッシュヒットが4倍で計算される
    it('5.1 が 5 より先に一致する', () => {
        expect(getPricing('claude-fable-5.1', AFTER).cr).toBe(0.25);
        expect(getPricing('claude-mythos-5.1', AFTER).cr).toBe(0.25);
    });
});

describe('getPricing — Groq / Mistral / Z.ai', () => {
    it('Groq の GPT-OSS を引ける（ベンダー接頭辞つきでも）', () => {
        expect(getPricing('openai/gpt-oss-120b', AFTER)).toMatchObject({ in: 0.15, out: 0.60 });
        expect(getPricing('gpt-oss-120b', AFTER)).toMatchObject({ in: 0.15, out: 0.60 });
        expect(getPricing('openai/gpt-oss-20b', AFTER)).toMatchObject({ in: 0.075, out: 0.30 });
        expect(getPricing('qwen/qwen3.6-27b', AFTER)).toMatchObject({ in: 0.60, out: 3 });
    });

    // 接頭辞を外した名前が OpenAI の gpt-5 系と混ざらないこと
    it('GPT-OSS が OpenAI の GPT-5 系と取り違えられない', () => {
        expect(getPricing('openai/gpt-oss-120b', AFTER).out).not.toBe(20);
        // Sol は値下げ後の単価で比べる（AFTER は値下げより前の時刻のため）
        expect(getPricing('gpt-5.6-sol', GPT_56_SOL_PRICE_CUT_AT)).toMatchObject({ in: 4, out: 20 });
    });

    it('Mistral を -latest 付きで引ける', () => {
        expect(getPricing('mistral-large-latest', AFTER)).toMatchObject({ in: 0.50, out: 1.50 });
        expect(getPricing('mistral-medium-latest', AFTER)).toMatchObject({ in: 1.50, out: 7.50 });
        expect(getPricing('mistral-small-latest', AFTER)).toMatchObject({ in: 0.15, out: 0.60 });
        expect(getPricing('codestral-latest', AFTER)).toMatchObject({ in: 0.30, out: 0.90 });
    });

    it('Z.ai の GLM を引ける（4.5 Flash は無料）', () => {
        expect(getPricing('glm-4.6', AFTER)).toMatchObject({ in: 0.60, out: 2.20, cr: 0.11 });
        expect(getPricing('glm-4.5-Air', AFTER)).toMatchObject({ in: 0.20, out: 1.10, cr: 0.03 });
        expect(getPricing('glm-4.5-flash', AFTER)).toMatchObject({ in: 0, out: 0, cr: 0 });
    });

    // 単価が公表されていないものは載せない（推測で金額を出さない）
    it('単価が非公表のモデルは null のまま', () => {
        expect(getPricing('groq/compound', AFTER)).toBeNull();
        expect(getPricing('minimaxai/minimax-m2.7', AFTER)).toBeNull();
        expect(getPricing('open-mistral-nemo', AFTER)).toBeNull();
    });
});
