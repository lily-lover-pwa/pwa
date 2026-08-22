// OpenAI互換レスポンスから思考プロセス（reasoning）を取り出す純粋関数。
//
// 項目名がプロバイダーごとに違うため、ここで吸収する:
//   reasoning_content  … DeepSeek-R1 等
//   reasoning          … OpenRouter の主項目（reasoning_content は別名として扱われる）
//   reasoning_details  … OpenRouter の構造化版。文字列項目が無いモデルはこちらだけ返す
//
// 参照: https://openrouter.ai/docs/use-cases/reasoning-tokens

/**
 * message から思考プロセスのテキストを取り出す。
 * @param {object} message OpenAI互換の choices[].message
 * @returns {string} 思考プロセス。無ければ空文字
 */
export function extractReasoningText(message) {
    if (!message || typeof message !== 'object') return '';

    // 文字列で返る項目を優先（DeepSeek → OpenRouter の順で見る）
    for (const key of ['reasoning_content', 'reasoning']) {
        const v = message[key];
        if (typeof v === 'string' && v.trim()) return v;
    }

    // 構造化版。text / summary のどちらかに本文が入る
    if (Array.isArray(message.reasoning_details)) {
        const joined = message.reasoning_details
            .map((d) => (d && typeof d === 'object' ? d.text || d.summary || '' : ''))
            .filter((t) => typeof t === 'string' && t.trim())
            .join('\n');
        if (joined.trim()) return joined;
    }

    return '';
}
