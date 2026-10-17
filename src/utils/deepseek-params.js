// DeepSeek に送るパラメータの判定。DOMにもDBにも触らない純粋関数だけを置く。
//
// 2026-07-24 に旧名の deepseek-chat（思考なし）/ deepseek-reasoner（思考あり）が廃止され、
// 今のモデル（deepseek-flash / deepseek-v4-pro）は何も指定しないと思考が ON（強さ high）で動く
// （https://api-docs.deepseek.com/guides/thinking_mode ）。
// タイトル生成・翻訳・メモリ学習のような短い作業で思考させると、遅く高くなるうえ、
// 小さい max_tokens を思考で使い切って本文が空になりうる。以前は思考しない deepseek-chat を
// 使っていたので、同じ振る舞いになるよう明示的に止める。

/**
 * 思考を止めるために足すパラメータ。DeepSeek 以外なら null。
 * OpenAI 形式（Chat Completions）では { thinking: { type: 'disabled' } }。
 * @param {string} model
 * @returns {object|null}
 */
export function deepseekThinkingOffParams(model) {
    if (typeof model !== 'string' || !model.toLowerCase().startsWith('deepseek-')) return null;
    return { thinking: { type: 'disabled' } };
}
