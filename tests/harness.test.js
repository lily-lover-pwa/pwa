import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';

/**
 * Phase 0 のサニティテスト。
 *
 * 目的はテスト基盤（jsdom + fake-indexeddb）が正しく動作することの確認のみ。
 * app.js は現状モジュール化されておらず（グローバルスクリプト）、純粋関数を
 * import できないため、本格的なユニットテストは Phase 1 でモジュール分割した
 * 後に tests/ 配下へ追加していく。
 *
 * 追加対象の候補（Phase 1 で import 化後にテストを書く）:
 *   - utils: formatFileSize, base64ToBlob, htmlUtils.escapeHtml/escapeAttr
 *   - api  : convertGeminiToOpenAIFormat, convertOpenAIToGeminiFormat, mapFinishReason
 *   - db   : openDB / マイグレーション（fake-indexeddb 上で）
 */
describe('test harness', () => {
    it('jsdom environment provides a DOM', () => {
        const el = document.createElement('div');
        el.textContent = 'hello';
        expect(el.textContent).toBe('hello');
    });

    it('fake-indexeddb provides indexedDB', () => {
        expect(typeof indexedDB).toBe('object');
        expect(typeof indexedDB.open).toBe('function');
    });
});
