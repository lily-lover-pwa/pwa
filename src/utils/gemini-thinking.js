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
import { geminiAcceptsThinkingBudget } from './gemini-params.js';

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

    // minimal まで選べるもの（公式表で minimal が載っているモデル）。
    // 2026-10 の公式表で、3.5 Flash と 3 Flash（プレビュー）にも minimal が載った。
    // 'gemini-3-5-flash' は 3.5 Flash-Lite も含む（どちらも minimal 可）。
    // 3.1 Flash-Lite は 2026-10 の表から消えたが、以前の表では minimal 可だったので残す。
    if (m.startsWith('gemini-3-6-flash')
        || m.startsWith('gemini-3-5-flash')
        || m.startsWith('gemini-3-flash')
        || m.startsWith('gemini-3-1-flash-lite')) {
        return ['minimal', 'low', 'medium', 'high'];
    }

    // 3系のそれ以外（3.8 / 3.7 Flash、3.1 Pro など）と 2.5 系は low / medium / high。
    // 公式表に無い 3 以降のモデル（今後出るもの）と、gemini-flash-latest のような別名も、
    // 全モデル共通のこの3つに絞る。今後のモデルは thinking_budget を受け付けず、
    // thinking_level が唯一の指定方法になるため、隠してしまうと指定できなくなる。
    const major = /^gemini-(\d+)(?:-(\d+))?/.exec(m);
    if (major) {
        const v = Number(major[1]);
        if (v >= 3) return ['low', 'medium', 'high'];
        if (v === 2 && major[2] === '5') return ['low', 'medium', 'high'];
        // 2.0 以前は thinking_level 非対応
        return null;
    }
    if (m.endsWith('-latest')) return ['low', 'medium', 'high'];

    return null;
}

/**
 * Gemini へ送る thinkingConfig を組み立てる。
 *
 * - thinking_level が選ばれていればそれを送り、thinking_budget は送らない（両方は 400）
 * - 選ばれていなければ、従来どおり thinking_budget（>0 のときだけ）。
 *   ただし thinking_budget を受け付けないモデル（今後出るモデル）には送らない（400 になる）
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
    } else if (Number.isFinite(thinkingBudget) && thinkingBudget > 0
        && geminiAcceptsThinkingBudget(model)) {
        cfg.thinkingBudget = thinkingBudget;
    }

    if (includeThoughts) cfg.includeThoughts = true;

    return Object.keys(cfg).length > 0 ? cfg : null;
}

/**
 * 翻訳のような軽い用途向けに、思考をいちばん軽くする thinkingConfig を返す。
 *
 * - thinking_budget を受け付けるモデルは、これまでどおり thinkingBudget: 0
 * - 受け付けないモデル（今後出るモデル）は、選べる段階のうちいちばん軽いもの
 * - どちらも無ければ null（モデルの既定）
 *
 * @param {string} model
 * @returns {object|null}
 */
export function buildGeminiLightThinkingConfig(model) {
    if (geminiAcceptsThinkingBudget(model)) return { thinkingBudget: 0 };
    const levels = getGeminiThinkingLevels(model);
    if (levels && levels.length > 0) return { thinkingLevel: levels[0].toUpperCase() };
    return null;
}
