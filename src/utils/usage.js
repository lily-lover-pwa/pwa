// 全チャットを横断した使用量の集計。DB・DOMには触らない純粋関数だけを置く。
import { getPricing, isDeepSeekPeak } from './pricing.js';

/**
 * 期間の開始時刻(epoch ms)を返す。終了は「今」なので呼び出し側では扱わない。
 * @param {string} range 'thisMonth' | 'lastMonth' | 'last30d' | 'all'
 * @param {number} now 基準時刻(epoch ms)
 * @returns {{from: number, to: number}} from <= t < to
 */
export function getUsageRange(range, now) {
    const base = new Date(now);
    switch (range) {
        case 'thisMonth': {
            const from = new Date(base.getFullYear(), base.getMonth(), 1).getTime();
            return { from, to: Infinity };
        }
        case 'lastMonth': {
            const from = new Date(base.getFullYear(), base.getMonth() - 1, 1).getTime();
            const to = new Date(base.getFullYear(), base.getMonth(), 1).getTime();
            return { from, to };
        }
        case 'last30d':
            return { from: now - 30 * 24 * 60 * 60 * 1000, to: Infinity };
        default:
            return { from: -Infinity, to: Infinity };
    }
}

/** 1メッセージ分の料金を計算する。単価が無ければ null（＝金額不明）。 */
export function calcMessageCost(msg) {
    const pricing = getPricing(msg?.modelName, msg?.timestamp);
    if (!pricing) return null;
    const u = msg.usageMetadata || {};
    const prompt = u.promptTokenCount || 0;
    // cachedContentTokenCount は Gemini がキャッシュヒット分を返すときのフィールド名
    const cr = u.cacheReadInputTokens ?? u.cachedContentTokenCount ?? 0;
    const cw = u.cacheCreationInputTokens || 0;
    const cw5m = u.cacheCreation5mInputTokens ?? cw;
    const cw1h = u.cacheCreation1hInputTokens || 0;
    const out = u.candidatesTokenCount || 0;
    const regular = Math.max(0, prompt - cr - cw);

    // 長いプロンプトで単価が変わるモデル（Grok 4.6 / Gemini 2.5 Pro）は上位段の単価に差し替える
    const rate = (pricing.longCtx && prompt >= pricing.longCtx.threshold)
        ? { ...pricing, ...pricing.longCtx }
        : pricing;
    // キャッシュ書き込み・読み込みに別料金が無いモデルは通常入力と同額で計算する。
    // cr を undefined のままにすると 0 * undefined = NaN になり、合計金額ごと壊れる。
    const cwRate5m = rate.cw5m ?? rate.in;
    const cwRate1h = rate.cw1h ?? rate.in;
    const crRate = rate.cr ?? rate.in;
    // DeepSeek はピーク時間帯に単価が倍になる
    const mul = (pricing.peakMul && isDeepSeekPeak(msg.timestamp)) ? pricing.peakMul : 1;

    return mul * (regular * rate.in + cw5m * cwRate5m + cw1h * cwRate1h + cr * crRate + out * rate.out) / 1_000_000;
}

/**
 * 全チャットのメッセージをモデル別に集計する。
 * 料金表に無いモデル（Gemini/OpenAI など）はトークンだけ数え、cost は null にする。
 * @param {Array} chats dbUtils.getAllChats() の戻り値
 * @param {{from?: number, to?: number}} [period] 集計期間（メッセージのtimestampで絞る）
 * @returns {{byModel: Array, totalCost: number, totalInput: number, totalOutput: number,
 *            totalMessages: number, hasUnpriced: boolean, peakCost: number}}
 */
export function summarizeUsage(chats, period = {}) {
    const from = period.from ?? -Infinity;
    const to = period.to ?? Infinity;
    const models = new Map();
    let totalCost = 0, totalInput = 0, totalOutput = 0, totalMessages = 0;
    let hasUnpriced = false;
    let peakCost = 0;

    for (const chat of Array.isArray(chats) ? chats : []) {
        for (const msg of chat?.messages || []) {
            if (!msg || !msg.usageMetadata) continue;
            // 時刻の無い古いメッセージは期間で絞れないため、全期間のときだけ数える
            const ts = msg.timestamp;
            if (!ts ? from !== -Infinity : (ts < from || ts >= to)) continue;

            const u = msg.usageMetadata;
            const input = u.promptTokenCount || 0;
            const output = u.candidatesTokenCount || 0;
            const name = msg.modelName || '(不明)';
            const cost = calcMessageCost(msg);

            const entry = models.get(name) || { model: name, messages: 0, input: 0, output: 0, cost: 0, priced: false };
            entry.messages += 1;
            entry.input += input;
            entry.output += output;
            if (cost === null) {
                hasUnpriced = true;
            } else {
                entry.priced = true;
                entry.cost += cost;
                totalCost += cost;
                if (isDeepSeekPeak(ts) && getPricing(name, ts)?.peakMul) peakCost += cost;
            }
            models.set(name, entry);

            totalMessages += 1;
            totalInput += input;
            totalOutput += output;
        }
    }

    // 金額の大きい順。金額が無いものは末尾へ（トークン数の多い順）
    const byModel = [...models.values()].sort((a, b) => {
        if (a.priced !== b.priced) return a.priced ? -1 : 1;
        if (a.priced) return b.cost - a.cost;
        return (b.input + b.output) - (a.input + a.output);
    });

    return { byModel, totalCost, totalInput, totalOutput, totalMessages, hasUnpriced, peakCost };
}
