// Gemini の思考の深さ（thinking_level）と、旧方式の thinking_budget の組み立て。
// DOMにもDBにも触らない純粋関数だけを置く。
//
// 現在の公式は thinking_level（minimal / low / medium / high）で制御する形で、
// thinking_budget は「後方互換で動くが移行を推奨」という扱い。
// 両方を同じリクエストで送ると 400 になるため、ここで必ず片方に絞る。
//
// REST での表記は Google 公式 SDK（@google/genai）の型定義で確認した:
//   generationConfig.thinkingConfig.thinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH'
// 値は大文字。設定には小文字で持ち、送るときに変換する。

import { normalizeModelName } from './pricing.js';

/** 設定画面に出す順（弱い → 強い） */
export const GEMINI_THINKING_LEVELS = ['minimal', 'low', 'medium', 'high'];

/**
 * 選択中の Gemini モデルで選べる thinking_level を返す。
 *
 * 表は公式ドキュメント（thinking / gemini-3 ガイド）のモデル別対応表から。
 * 載っていないモデルは、全モデルに共通する low / medium / high に絞る
 * （対応外の値を送って 400 になるより、選べないほうがまし）。
 *
 * @param {string} model モデル名（正規化前でよい）
 * @returns {string[]|null} 選べる値。null は thinking_level 非対応（項目を隠す）
 */
export function getGeminiThinkingLevels(model) {
    const m = normalizeModelName(model);
    if (!m.startsWith('gemini')) return null;

    // 画像生成・埋め込み・Live などは思考の深さの対象外
    if (/-image|embedding|-live|-tts|robotics/.test(m)) return null;

    // minimal まで選べるもの（公式表で minimal が載っているモデル）
    if (m.startsWith('gemini-3-6-flash')
        || m.startsWith('gemini-3-5-flash-lite')
        || m.startsWith('gemini-3-1-flash-lite')) {
        return ['minimal', 'low', 'medium', 'high'];
    }

    // 3系のそれ以外（3.8 / 3.7 Flash、3.1 Pro、3 Flash など）と 2.5 系は low / medium / high。
    // 公式表に無い 3.x（3.5 Flash など）も、共通部分のこの3つに絞る。
    if (m.startsWith('gemini-3') || m.startsWith('gemini-2-5')) {
        return ['low', 'medium', 'high'];
    }

    // 2.0 以前は thinking_level 非対応
    return null;
}

/**
 * Gemini へ送る thinkingConfig を組み立てる。
 *
 * - thinking_level が選ばれていればそれを送り、thinking_budget は送らない（両方は 400）
 * - 選ばれていなければ、従来どおり thinking_budget（>0 のときだけ）
 * - includeThoughts は独立して付ける
 * - 何も無ければ null（thinkingConfig 自体を付けない＝モデルの既定）
 *
 * @param {object} params
 * @param {string} params.model
 * @param {string} [params.thinkingLevel] 'minimal' | 'low' | 'medium' | 'high' | ''（既定）
 * @param {number|null} [params.thinkingBudget]
 * @param {boolean} [params.includeThoughts]
 * @returns {object|null}
 */
export function buildGeminiThinkingConfig({ model, thinkingLevel, thinkingBudget, includeThoughts }) {
    const cfg = {};

    const level = typeof thinkingLevel === 'string' ? thinkingLevel.trim().toLowerCase() : '';
    const allowed = getGeminiThinkingLevels(model);
    if (level && allowed && allowed.includes(level)) {
        cfg.thinkingLevel = level.toUpperCase();
    } else if (Number.isFinite(thinkingBudget) && thinkingBudget > 0) {
        cfg.thinkingBudget = thinkingBudget;
    }

    if (includeThoughts) cfg.includeThoughts = true;

    return Object.keys(cfg).length > 0 ? cfg : null;
}
