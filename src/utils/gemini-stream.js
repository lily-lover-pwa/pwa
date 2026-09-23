// streamGenerateContent で細切れに届く GenerateContentResponse を、
// 非ストリーミングの generateContent と同じ形にまとめ直す。
// ネットワークにもDOMにも触らない。
//
// 同じ形に戻すのが肝で、こうしておくと下流（パート解析・保存・推定コスト）は
// ストリーミングかどうかを知らずに済む。

/**
 * チャンクを順に受け取って1件のレスポンスに組み立てる。
 *
 * @returns {{
 *   addChunk: (chunk: object) => void,
 *   getText: () => string,
 *   hasContent: () => boolean,
 *   build: () => object
 * }}
 */
export function createGeminiStreamAssembler() {
    // パートは順序どおり全部ためる。下流は parts をなめて text を連結する作りなので、
    // 細切れのまま渡しても結果は変わらない。無理にくっつけると thought や
    // functionCall を持つパートを壊しかねないので、そのまま積む。
    const parts = [];

    let text = '';             // thought でないテキストだけ（画面に出す用）
    let usageMetadata = null;  // 最後に受け取ったものを採用する（後述）
    let finishReason = null;
    let safetyRatings = null;
    let groundingMetadata = null;
    let promptFeedback = null;
    let role = 'model';

    return {
        addChunk(chunk) {
            if (!chunk || typeof chunk !== 'object') return;

            if (chunk.promptFeedback) promptFeedback = chunk.promptFeedback;

            // usageMetadata が毎チャンク来るのか最終チャンクだけなのかは公式ドキュメントに
            // 明記が無い。累積で来ても最後だけ来ても正しくなるよう、
            // 「受け取るたびに上書きして最後の値を採用」にしてある。
            if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;

            const candidate = chunk.candidates?.[0];
            if (!candidate) return;

            if (candidate.finishReason) finishReason = candidate.finishReason;
            if (candidate.safetyRatings) safetyRatings = candidate.safetyRatings;
            if (candidate.groundingMetadata) groundingMetadata = candidate.groundingMetadata;
            if (candidate.content?.role) role = candidate.content.role;

            for (const part of candidate.content?.parts || []) {
                parts.push(part);
                if (part.text && part.thought !== true) text += part.text;
            }
        },

        getText() {
            return text;
        },

        // 途中で失敗したとき、保存する価値があるかの判定に使う
        hasContent() {
            return parts.length > 0;
        },

        build() {
            const candidate = { content: { parts, role } };
            if (finishReason) candidate.finishReason = finishReason;
            if (safetyRatings) candidate.safetyRatings = safetyRatings;
            if (groundingMetadata) candidate.groundingMetadata = groundingMetadata;

            const response = { candidates: [candidate] };
            if (usageMetadata) response.usageMetadata = usageMetadata;
            if (promptFeedback) response.promptFeedback = promptFeedback;
            return response;
        }
    };
}
