// Gemini のセーフティ設定（センシティブフィルター）をまとめる。
//
// 以前は同じ内容が6箇所（チャット送信・思考プロセスの翻訳・要約/メモリ学習・
// タイトル生成・校正）にコピペされていた。片方だけ直して食い違うのを防ぐため、
// ここ一箇所で持つ。
//
// 公式ドキュメントで調整できるのは次の4カテゴリだけ。CIVIC_INTEGRITY / JAILBREAK は
// HarmCategory の列挙には出てくるが safetySettings では設定できないため、送ると
// 400 になる。増やさないこと。
// 児童安全など中核的な危害は設定に関係なく常にブロックされる（API側の固定）。
export const GEMINI_ADJUSTABLE_HARM_CATEGORIES = [
    'HARM_CATEGORY_HARASSMENT',
    'HARM_CATEGORY_HATE_SPEECH',
    'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    'HARM_CATEGORY_DANGEROUS_CONTENT',
];

// 'BLOCK_NONE' は「確率に関わらずブロックしない」。調整できる4カテゴリについては
// これで実質フィルターオフになる。
//
// 'OFF' という値もあるが、違いは「ブロックするか否か」ではなく safety ratings を
// 計算して返すかどうかで、通る内容は変わらない。一方 'OFF' は対応しないモデルが
// あり得るぶん扱いが増えるため、素直に 'BLOCK_NONE' を使う。
export const GEMINI_SAFETY_THRESHOLD = 'BLOCK_NONE';

/**
 * Gemini へ送る safetySettings を組み立てて返す。
 * @returns {Array<{category: string, threshold: string}>}
 */
export function getGeminiSafetySettings() {
    return GEMINI_ADJUSTABLE_HARM_CATEGORIES.map((category) => ({
        category,
        threshold: GEMINI_SAFETY_THRESHOLD,
    }));
}
