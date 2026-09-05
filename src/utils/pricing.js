// 料金テーブルと単価の選択。DB・DOMには触らない純粋関数だけを置く。
// 単位はいずれも USD / 100万トークン。in=入力(キャッシュミス), out=出力,
// cw5m/cw1h=キャッシュ書込, cr=キャッシュ読込(ヒット)。

export const MODEL_PRICING = {
    // Claude — https://platform.claude.com/docs/en/about-claude/pricing
    // Fable/Mythos 5.1 はキャッシュヒットが基本入力の0.025倍（他モデルは0.1倍）。
    'claude-fable-5-1':  { in: 10, out: 50, cw5m: 12.50, cw1h: 20, cr: 0.25 },
    'claude-mythos-5-1': { in: 10, out: 50, cw5m: 12.50, cw1h: 20, cr: 0.25 },
    'claude-fable-5':    { in: 10, out: 50, cw5m: 12.50, cw1h: 20, cr: 1    },
    'claude-mythos-5':   { in: 10, out: 50, cw5m: 12.50, cw1h: 20, cr: 1    },
    // Claude 5系 / 4系 (claude-opus-5, claude-opus-4-x, claude-sonnet-4-x, claude-haiku-4-x)
    'claude-opus-5':   { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
    'claude-opus-4-8': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
    'claude-opus-4-7': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
    'claude-opus-4-6': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
    'claude-opus-4-5': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
    'claude-opus-4-1': { in: 15,   out: 75,  cw5m: 18.75, cw1h: 30,   cr: 1.50 },
    'claude-opus-4':   { in: 15,   out: 75,  cw5m: 18.75, cw1h: 30,   cr: 1.50 },
    // Sonnet 5 は 4.6/4.5 より安い（$2/$10）。'claude-sonnet-4' より前に置くこと。
    // 発表時は 2026-08-31 までの導入価格とされていたが、その後この額が正価になり、
    // 予定されていた $3/$15 への値上げは行われないと明記された（＝期間で分ける必要なし）。
    'claude-sonnet-5': { in: 2,    out: 10,  cw5m: 2.50,  cw1h: 4,    cr: 0.20 },
    'claude-sonnet-4': { in: 3,    out: 15,  cw5m: 3.75,  cw1h: 6,    cr: 0.30 },
    'claude-haiku-4':  { in: 1,    out: 5,   cw5m: 1.25,  cw1h: 2,    cr: 0.10 },
    // Claude 3系 (旧モデル)
    'claude-opus-3':   { in: 15,   out: 75,  cw5m: 18.75, cw1h: 30,   cr: 1.50 },
    'claude-opus':     { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
    'claude-sonnet':   { in: 3,    out: 15,  cw5m: 3.75,  cw1h: 6,    cr: 0.30 },
    'claude-haiku':    { in: 0.80, out: 4,   cw5m: 1.00,  cw1h: 1.60, cr: 0.08 },
    // DeepSeek（in=キャッシュミス入力, cr=キャッシュヒット入力）。価格は「通常（オフピーク）」基準。
    // peakMul があるモデルは、ピーク時間帯のメッセージのみ料金を peakMul 倍にする。
    // V4系は 2026-08-16 の改定後の価格。
    'deepseek-reasoner': { in: 0.55,  out: 2.19, cw5m: 0.55,  cw1h: 0.55,  cr: 0.14 },
    'deepseek-chat':     { in: 0.27,  out: 1.10, cw5m: 0.27,  cw1h: 0.27,  cr: 0.07 },
    'deepseek-v4-pro':   { in: 0.66,  out: 1.98, cw5m: 0.66,  cw1h: 0.66,  cr: 0.022,    peakMul: 2 },
    'deepseek-v4-flash': { in: 0.22,  out: 0.66, cw5m: 0.22,  cw1h: 0.22,  cr: 0.007,    peakMul: 2 },
    'deepseek-':         { in: 0.27,  out: 1.10, cw5m: 0.27,  cw1h: 0.27,  cr: 0.07 },

    // 以下は cw5m/cw1h を持たない。キャッシュ書き込みに別料金が無く、通常入力と同額のため
    // （calcMessageCost が in にフォールバックする）。
    // longCtx があるモデルは、プロンプトが threshold 以上のとき単価がそちらへ切り替わる。

    // xAI Grok — https://docs.x.ai/developers/pricing
    'grok-4-6': { in: 2,    out: 6,    cr: 0.50, longCtx: { threshold: 200_000, in: 4,    out: 12,   cr: 1    } },
    'grok-4-5': { in: 2,    out: 6,    cr: 0.30, longCtx: { threshold: 200_000, in: 4,    out: 12,   cr: 0.60 } },
    'grok-4-3': { in: 1.25, out: 2.50, cr: 0.20, longCtx: { threshold: 200_000, in: 2.50, out: 5,    cr: 0.40 } },

    // Groq — https://console.groq.com/docs/models
    // 'openai/gpt-oss-120b' はベンダー接頭辞が外れて 'gpt-oss-120b' になる。
    // キャッシュ割引の記載が無いので cr は入力と同額にしてある。
    // Compound（groq/compound・compound-mini）は内部で複数モデルを使う仕組みで
    // 単体の単価表記が無く、Llama 3.3 70B / 3.1 8B と MiniMax M2.7 は
    // Enterprise（要問い合わせ）扱いのため、いずれも載せていない。
    'gpt-oss-120b': { in: 0.15,  out: 0.60, cr: 0.15  },
    'gpt-oss-20b':  { in: 0.075, out: 0.30, cr: 0.075 },
    'qwen3-6-27b':  { in: 0.60,  out: 3,    cr: 0.60  },

    // Mistral — https://mistral.ai/pricing/api
    // '-latest' が付くので前方一致で引く。open-mistral-nemo は料金表から消えたため無し。
    'mistral-large':  { in: 0.50, out: 1.50, cr: 0.50 },
    'mistral-medium': { in: 1.50, out: 7.50, cr: 1.50 },
    'mistral-small':  { in: 0.15, out: 0.60, cr: 0.15 },
    'codestral':      { in: 0.30, out: 0.90, cr: 0.30 },
    'ministral-3-14b': { in: 0.20, out: 0.20, cr: 0.20 },
    'ministral-3-8b':  { in: 0.15, out: 0.15, cr: 0.15 },
    'ministral-3-3b':  { in: 0.10, out: 0.10, cr: 0.10 },

    // Z.ai GLM — https://docs.z.ai/guides/overview/pricing
    // 4.5 Flash は入出力とも無料。'glm-4-5-air' は 'glm-4-5' で始まるので順序に注意。
    'glm-4-6':       { in: 0.60, out: 2.20, cr: 0.11 },
    'glm-4-5-air':   { in: 0.20, out: 1.10, cr: 0.03 },
    'glm-4-5-flash': { in: 0,    out: 0,    cr: 0    },

    // OpenAI — https://developers.openai.com/api/docs/pricing
    // 前方一致のため、より具体的なキーを先に置くこと（'gpt-5-mini' は 'gpt-5' より前）。
    'gpt-5-6-sol':   { in: 4,    out: 20,   cr: 0.40 },  // 2026-08-21 値下げ（少なくとも11/21まで）
    'gpt-5-6-terra': { in: 2,    out: 12,   cr: 0.20 },
    'gpt-5-6-luna':  { in: 0.20, out: 1.20, cr: 0.02 },
    'gpt-5-5-pro':   { in: 30,   out: 180,  cr: 30 },    // キャッシュ割引の提供なし
    'gpt-5-5':       { in: 5,    out: 30,   cr: 0.50 },
    'gpt-5-4-mini':  { in: 0.75, out: 4.50, cr: 0.075 },
    'gpt-5-4-nano':  { in: 0.20, out: 1.25, cr: 0.02 },
    'gpt-5-4-pro':   { in: 30,   out: 180,  cr: 30 },    // 同上
    'gpt-5-4':       { in: 2.50, out: 15,   cr: 0.25 },
    'gpt-5-2':       { in: 1.75, out: 14,   cr: 0.175 },
    'gpt-5-1':       { in: 1.25, out: 10,   cr: 0.125 },
    'gpt-5-mini':    { in: 0.25, out: 2,    cr: 0.025 },
    'gpt-5':         { in: 1.25, out: 10,   cr: 0.125 },
    'gpt-4-1-mini':  { in: 0.40, out: 1.60, cr: 0.10 },
    'gpt-4-1-nano':  { in: 0.10, out: 0.40, cr: 0.025 },
    'gpt-4-1':       { in: 2,    out: 8,    cr: 0.50 },
    'o4-mini':       { in: 1.10, out: 4.40, cr: 0.275 },
    'o3-mini':       { in: 1.10, out: 4.40, cr: 0.55 },
    'o3-pro':        { in: 20,   out: 80,   cr: 20 },    // 同上
    'o3':            { in: 2,    out: 8,    cr: 0.50 },

    // Google Gemini — https://ai.google.dev/gemini-api/docs/pricing
    // '-flash-lite' は '-flash' より前に置くこと（前方一致のため）。
    // 3.7 / 3.6 Flash は 2026-12-31 まで半額。ここには割引終了後の通常単価を置き、
    // 割引期間中は MODEL_PRICING_GEMINI_FLASH_PROMO を優先して引く。
    'gemini-3-7-flash':      { in: 1.50, out: 7.50, cr: 0.15 },
    'gemini-3-6-flash':      { in: 1.50, out: 7.50, cr: 0.15 },
    'gemini-3-5-flash-lite': { in: 0.30, out: 2.50, cr: 0.03 },
    'gemini-3-5-flash':      { in: 1.50, out: 9,    cr: 0.15 },
    // 3.1 Pro も 200k 超で単価が上がる（入力2倍・出力1.5倍・キャッシュ2倍）
    'gemini-3-1-pro':        { in: 2,    out: 12,   cr: 0.20,  longCtx: { threshold: 200_000, in: 4, out: 18, cr: 0.40 } },
    'gemini-3-1-flash-lite': { in: 0.25, out: 1.50, cr: 0.025 },
    // 3 Flash（プレビュー）。'gemini-3-7-flash' 等とは前方一致で衝突しない
    'gemini-3-flash':        { in: 0.50, out: 3,    cr: 0.05 },
    // 2.5 Pro は 200k 超で入力2倍・出力1.5倍と倍率が異なるため、上位段の単価をそのまま持つ
    'gemini-2-5-pro':        { in: 1.25, out: 10,   cr: 0.125, longCtx: { threshold: 200_000, in: 2.50, out: 15, cr: 0.25 } },
    'gemini-2-5-flash-lite': { in: 0.10, out: 0.40, cr: 0.01 },
    'gemini-2-5-flash':      { in: 0.30, out: 2.50, cr: 0.03 },
};

// DeepSeek V4 の値上げ時刻（2026-08-16 16:00 UTC = 日本時間 8/17 01:00）。
export const DEEPSEEK_V4_PRICE_CHANGE_AT = Date.UTC(2026, 7, 16, 16, 0, 0);

// 改定前の V4 料金。過去のメッセージを当時の単価で計算するために残してある。
export const MODEL_PRICING_BEFORE_V4_CHANGE = {
    'deepseek-v4-pro':   { in: 0.435, out: 0.87, cw5m: 0.435, cw1h: 0.435, cr: 0.003625, peakMul: 2 },
    'deepseek-v4-flash': { in: 0.14,  out: 0.28, cw5m: 0.14,  cw1h: 0.14,  cr: 0.0028,   peakMul: 2 },
};

// GPT-5.6 Sol の値下げ日（2026-08-21）。入力20%・出力33%の引き下げで、
// OpenAI は「少なくとも 2026-11-21 まで」の特別価格としている（終了日は未定のため上限は設けない）。
// 発表に時刻の明記が無いため UTC の 0時で切り替える。
export const GPT_56_SOL_PRICE_CUT_AT = Date.UTC(2026, 7, 21, 0, 0, 0);

// 値下げ前の GPT-5.6 Sol 料金。過去のメッセージを当時の単価で計算するために残してある。
export const MODEL_PRICING_BEFORE_SOL_CUT = {
    'gpt-5-6-sol': { in: 5, out: 30, cr: 0.50 },
};

// Gemini 3.7 / 3.6 Flash の期間限定割引の終了時刻。
// 料金ページの表記は「$0.75 through December 31, 2026. $1.50 starting January 1, 2027.」で
// タイムゾーンの明記が無いため UTC 基準で切り替える（日本時間では1/1 09:00に通常単価へ）。
export const GEMINI_FLASH_PROMO_END_AT = Date.UTC(2027, 0, 1, 0, 0, 0);

// 割引期間中の Gemini Flash 料金（通常単価のちょうど半額）。
export const MODEL_PRICING_GEMINI_FLASH_PROMO = {
    'gemini-3-7-flash': { in: 0.75, out: 3.75, cr: 0.075 },
    'gemini-3-6-flash': { in: 0.75, out: 3.75, cr: 0.075 },
};

/**
 * OpenRouter形式のモデル名を料金表のキーに合わせて整える。
 * 例: 'anthropic/claude-opus-4.5:beta' → 'claude-opus-4-5'
 * OpenRouterは提供元の価格をほぼそのまま通すため、上流の単価で概算できる
 * （クレジット購入時の手数料ぶんだけ実際の請求は少し高くなる）。
 * @param {string} modelName
 * @returns {string} 正規化した名前（小文字）
 */
export function normalizeModelName(modelName) {
    if (typeof modelName !== 'string') return '';
    return modelName
        .toLowerCase()
        .trim()
        .replace(/^[^/]+\//, '')  // 'anthropic/' などのベンダー接頭辞を外す
        .replace(/:.*$/, '')      // ':free' ':beta' などのバリアント指定を外す
        .replace(/(\d)\.(\d)/g, '$1-$2'); // 'claude-opus-4.5' → 'claude-opus-4-5'
}

/**
 * モデル名から単価を引く。料金表のキーはすべて正規化済みの表記なので、
 * 引く側も必ず正規化してから前方一致させる。
 * 生の名前のまま引くと 'gpt-5.6-sol' が（'gpt-5-6-sol' ではなく）'gpt-5' に
 * 先に一致してしまうため、正規化を挟むこと自体が正しさの条件になっている。
 * @param {string} modelName
 * @param {number} [timestamp] メッセージの生成時刻(epoch ms)。値上げ前後の切り替えに使う
 * @returns {object|null} 単価。該当が無ければ null
 */
export function getPricing(modelName, timestamp) {
    if (!modelName) return null;
    const m = normalizeModelName(modelName);
    if (!m) return null;
    // 時刻を持たないのは改定前の古いデータなので、旧料金として扱う
    if (!timestamp || timestamp < DEEPSEEK_V4_PRICE_CHANGE_AT) {
        for (const [key, price] of Object.entries(MODEL_PRICING_BEFORE_V4_CHANGE)) {
            if (m.startsWith(key)) return price;
        }
    }
    // GPT-5.6 Sol の値下げ前のメッセージは当時の単価で計算する
    if (!timestamp || timestamp < GPT_56_SOL_PRICE_CUT_AT) {
        for (const [key, price] of Object.entries(MODEL_PRICING_BEFORE_SOL_CUT)) {
            if (m.startsWith(key)) return price;
        }
    }
    // Gemini Flash の期間限定割引。割引終了より前のメッセージは半額で計算する
    // （時刻が無い古いデータも、割引開始より前に存在しえないので割引期間として扱う）
    if (!timestamp || timestamp < GEMINI_FLASH_PROMO_END_AT) {
        for (const [key, price] of Object.entries(MODEL_PRICING_GEMINI_FLASH_PROMO)) {
            if (m.startsWith(key)) return price;
        }
    }
    for (const [key, price] of Object.entries(MODEL_PRICING)) {
        if (m.startsWith(key)) return price;
    }
    return null;
}

// 週末のピーク料金が廃止される時刻（2026-08-23 00:00 北京時間 = 2026-08-22 16:00 UTC）。
// これ以降、北京時間の土日は終日オフピーク単価になる。平日は従来どおり。
export const DEEPSEEK_WEEKEND_OFFPEAK_AT = Date.UTC(2026, 7, 22, 16, 0, 0);

// 北京時間は UTC+8。曜日判定に使う。
const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * DeepSeek のピーク時間帯かどうか（UTC 01:00-04:00 / 06:00-10:00 = 日本時間 10-13時 / 15-19時）。
 * タイムゾーンに依存しないよう UTC 時刻で判定する。
 *
 * 2026-08-23 00:00（北京時間）以降は、北京時間の土日が終日オフピークになる。
 * 改定前のメッセージは当時の規則のまま計算するため、時刻で切り替える。
 * @param {number} timestamp モデル応答生成時刻(epoch ms)
 */
export function isDeepSeekPeak(timestamp) {
    if (!timestamp) return false;
    if (timestamp >= DEEPSEEK_WEEKEND_OFFPEAK_AT) {
        // 曜日は「北京時間で」判定する（UTCで見ると境界が8時間ずれる）
        const beijingDay = new Date(timestamp + BEIJING_OFFSET_MS).getUTCDay(); // 0=日, 6=土
        if (beijingDay === 0 || beijingDay === 6) return false;
    }
    const h = new Date(timestamp).getUTCHours();
    return (h >= 1 && h < 4) || (h >= 6 && h < 10);
}
