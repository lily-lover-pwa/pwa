// HTML/CSS エスケープ用ユーティリティ。app.js から抽出（Phase 1）。挙動は変更していない。

export const htmlUtils = {
    // HTML要素内のテキストコンテンツ用エスケープ
    escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },

    // HTML属性値用エスケープ（より厳格）
    escapeAttr(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    // CSSセレクタ用の安全な文字列を生成
    escapeSelector(text) {
        if (text === null || text === undefined) return '';
        // CSS.escapeを使用（全ブラウザでサポート済み）
        return CSS.escape(String(text));
    },

    /**
     * Markdown を HTML 化し、DOMPurify でサニタイズして返す。
     * AI 応答・インポートされた履歴など信頼できない可能性のあるテキストを
     * innerHTML へ流し込む際は必ずこれを通すこと（XSS 対策）。
     *
     * - marked 未ロード時: HTML 化せずエスケープ（安全側）。
     * - DOMPurify 未ロード時: 生 HTML を描画せずエスケープ（安全側へフォールバック）。
     */
    renderMarkdownSafe(text) {
        const src = text == null ? '' : String(text);
        if (typeof marked === 'undefined') {
            return this.escapeHtml(src);
        }
        const rawHtml = marked.parse(src);
        if (typeof DOMPurify === 'undefined') {
            // サニタイザが無い環境では生 HTML を描画しない（テキスト扱い）。
            return this.escapeHtml(src);
        }
        // 既存レンダラが付与する target="_blank"（新規タブ表示）を維持するため ADD_ATTR で許可。
        // DOMPurify は既定で target を除去するため、これが無いとリンク挙動が退行する。
        return DOMPurify.sanitize(rawHtml, { ADD_ATTR: ['target'] });
    },
};
