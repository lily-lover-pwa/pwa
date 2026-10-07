// Gemini に送る generationConfig を、モデルが受け付ける形に整える。
// DOMにもDBにも触らない純粋関数だけを置く。
//
// 2026-10 に Google から届いた告知（パラメータの非推奨化）:
//   - thinking_budget: Gemini 3 系では thinking_level に読み替えて受け付けているが、
//     今後発売されるモデルでは読み替えず 400 INVALID_ARGUMENT になる
//   - temperature / top_p / top_k: Gemini 3.6 Flash 以降は既定値に固定されていて、
//     送っても効かない。近日公開のモデルでは送るとエラーになる
//
// どちらも「受け付けると分かっているモデルにだけ送る」形にする。
// 名前を知らないモデル（今後出るモデルや gemini-flash-latest のような別名）には送らない。
// 送らなければエラーにならず、モデルの既定で動くだけで済む。

import { normalizeModelName } from './pricing.js';

/**
 * temperature / topP / topK が効くモデル（3.6 Flash より前の世代）。
 * 3.6 / 3.7 / 3.8 Flash は送っても効かないので、送らなくても何も変わらない。
 */
const SAMPLING_PARAMS_PREFIXES = [
    'gemini-2-5',
    'gemini-3-flash',
    'gemini-3-pro',
    'gemini-3-1-',
    'gemini-3-5-',
];

/**
 * thinking_budget を受け付けると分かっているモデル（告知の時点で出ていたもの）。
 * Gemini 3 系は thinking_level への読み替えで受け付けている。
 */
const THINKING_BUDGET_PREFIXES = [
    ...SAMPLING_PARAMS_PREFIXES,
    'gemini-3-6-',
    'gemini-3-7-',
    'gemini-3-8-',
];

const isGemini = (m) => m.startsWith('gemini');

/**
 * temperature / topP / topK を送ってよいか。
 * Gemini 以外（Gemma など）はこの告知の対象外なので true。
 * @param {string} model
 * @returns {boolean}
 */
export function geminiAcceptsSamplingParams(model) {
    const m = normalizeModelName(model);
    if (!isGemini(m)) return true;
    return SAMPLING_PARAMS_PREFIXES.some((p) => m.startsWith(p));
}

/**
 * thinking_budget を送ってよいか。
 * Gemini 以外はこの告知の対象外なので true。
 * @param {string} model
 * @returns {boolean}
 */
export function geminiAcceptsThinkingBudget(model) {
    const m = normalizeModelName(model);
    if (!isGemini(m)) return true;
    return THINKING_BUDGET_PREFIXES.some((p) => m.startsWith(p));
}

/**
 * generationConfig から、そのモデルに送ってはいけない項目を取り除いた新しいオブジェクトを返す。
 * 渡されたオブジェクトは変更しない。
 * @param {string} model
 * @param {object|null|undefined} generationConfig
 * @returns {object}
 */
export function sanitizeGeminiGenerationConfig(model, generationConfig) {
    const cfg = { ...(generationConfig || {}) };

    if (!geminiAcceptsSamplingParams(model)) {
        delete cfg.temperature;
        delete cfg.topP;
        delete cfg.topK;
    }

    if (cfg.thinkingConfig && !geminiAcceptsThinkingBudget(model)) {
        const rest = { ...cfg.thinkingConfig };
        delete rest.thinkingBudget;
        if (Object.keys(rest).length > 0) cfg.thinkingConfig = rest;
        else delete cfg.thinkingConfig;
    }

    return cfg;
}
