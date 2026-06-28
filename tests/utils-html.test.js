import { describe, it, expect } from 'vitest';
import { htmlUtils } from '../src/utils/html.js';

describe('htmlUtils.escapeHtml', () => {
    it('null/undefined を空文字にする', () => {
        expect(htmlUtils.escapeHtml(null)).toBe('');
        expect(htmlUtils.escapeHtml(undefined)).toBe('');
    });

    it('HTML 特殊文字をエスケープする', () => {
        expect(htmlUtils.escapeHtml('<b>&"</b>')).toBe('&lt;b&gt;&amp;"&lt;/b&gt;');
    });
});

describe('htmlUtils.escapeAttr', () => {
    it('null/undefined を空文字にする', () => {
        expect(htmlUtils.escapeAttr(null)).toBe('');
    });

    it('属性値用に厳格にエスケープする', () => {
        expect(htmlUtils.escapeAttr(`<a href="x" id='y'>&`)).toBe(
            '&lt;a href=&quot;x&quot; id=&#39;y&#39;&gt;&amp;'
        );
    });
});

describe('htmlUtils.renderMarkdownSafe', () => {
    it('null/undefined を空文字にする', () => {
        expect(htmlUtils.renderMarkdownSafe(null)).toBe('');
        expect(htmlUtils.renderMarkdownSafe(undefined)).toBe('');
    });

    // テスト環境では marked/DOMPurify 未ロードのため、安全側フォールバック
    // （生 HTML を描画せずエスケープ）になることを検証する。
    it('サニタイザ未ロード時は生HTMLを描画せずエスケープする', () => {
        const out = htmlUtils.renderMarkdownSafe('<img src=x onerror="alert(1)">');
        // 実行可能な生タグが残らない（< がエスケープされている）こと
        expect(out).not.toContain('<img');
        expect(out).toContain('&lt;img');
        expect(out).not.toContain('onerror="alert(1)">');
    });
});

describe('htmlUtils.escapeSelector', () => {
    it('null/undefined を空文字にする', () => {
        expect(htmlUtils.escapeSelector(null)).toBe('');
    });

    // CSS.escape は jsdom に存在しない場合があるため、存在する時のみ検証
    it.skipIf(typeof CSS === 'undefined' || !CSS.escape)(
        'CSS.escape を用いてエスケープする',
        () => {
            expect(htmlUtils.escapeSelector('a.b#c')).toBe(CSS.escape('a.b#c'));
        }
    );
});
