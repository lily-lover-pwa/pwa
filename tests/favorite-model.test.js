import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// index.html を実ファイルから読み、★お気に入り機能まわりの構造と
// 「先頭ピン留め」optgroup 挿入ロジック（lifecycle.js と同等）を検証する。
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const doc = new DOMParser().parseFromString(html, 'text/html');

describe('お気に入りモデル: index.html の構造', () => {
    it('★トグルボタンとモデル選択が同じ行に入り、行が正しく閉じている', () => {
        const favBtn = doc.getElementById('favorite-model-btn');
        const sel = doc.getElementById('model-name');
        const row = doc.querySelector('.model-name-row');
        expect(favBtn).toBeTruthy();
        expect(sel).toBeTruthy();
        expect(row).toBeTruthy();
        expect(row.contains(sel)).toBe(true);
        expect(row.contains(favBtn)).toBe(true);
        // 後続要素が行の外にある = ラッパ div が正しく閉じている
        const after = doc.getElementById('openrouter-model-input-container');
        expect(after && row.contains(after)).toBe(false);
    });
});

// lifecycle.js の挿入ロジックと同じ手順を関数化して検証する。
function insertFavoriteGroup(selectEl, favorites) {
    const existingOptions = Array.from(selectEl.querySelectorAll('option'));
    const favGroup = selectEl.ownerDocument.createElement('optgroup');
    favGroup.label = '★ お気に入り';
    favGroup.id = 'favorite-models-group';
    favorites.forEach((favId) => {
        const src = existingOptions.find((o) => o.value === favId);
        if (!src) return; // このプロバイダーに無いお気に入りは出さない
        const opt = selectEl.ownerDocument.createElement('option');
        opt.value = favId;
        opt.textContent = '★ ' + src.textContent;
        favGroup.appendChild(opt);
    });
    if (favGroup.children.length > 0) {
        selectEl.insertBefore(favGroup, selectEl.firstChild);
    }
    return favGroup;
}

describe('お気に入りモデル: 先頭ピン留めの挿入ロジック', () => {
    it('登録したお気に入りが★グループとして先頭に入る', () => {
        const sel = doc.getElementById('model-name').cloneNode(true);
        const favGroup = insertFavoriteGroup(sel, ['gemini-2.5-pro', 'gemini-2.5-flash']);
        expect(sel.firstElementChild.id).toBe('favorite-models-group');
        expect(favGroup.children.length).toBe(2);
        expect(favGroup.children[0].textContent.startsWith('★ ')).toBe(true);
    });

    it('一覧に無いお気に入りは表示しない（プロバイダーごとの範囲）', () => {
        const sel = doc.getElementById('model-name').cloneNode(true);
        const favGroup = insertFavoriteGroup(sel, ['does-not-exist-model']);
        expect(favGroup.children.length).toBe(0);
        expect(sel.querySelector('#favorite-models-group')).toBeNull();
    });
});

// OpenRouter は選択肢の作り方が違い（追加モデルのみ／標準リストを消す）、
// その削除で ★お気に入り グループごと消えていた回帰を防ぐ。
function openRouterCleanup(selectEl) {
    Array.from(selectEl.querySelectorAll('optgroup')).forEach((g) => {
        if (g.id !== 'user-defined-models-group') g.remove();
    });
    Array.from(selectEl.querySelectorAll('option:not([data-user-defined])')).forEach((o) => o.remove());
}

describe('お気に入りモデル: OpenRouter でも★が残る', () => {
    function buildOpenRouterSelect() {
        const sel = doc.getElementById('model-name').cloneNode(true);
        const grp = sel.querySelector('#user-defined-models-group');
        const opt = doc.createElement('option');
        opt.value = 'openrouter/ox-alpha';
        opt.textContent = 'openrouter/ox-alpha (openrouter)';
        opt.dataset.provider = 'openrouter';
        opt.dataset.userDefined = 'true';
        grp.appendChild(opt);
        return sel;
    }

    it('削除処理のあとに作り直せば★グループが先頭に残る', () => {
        const sel = buildOpenRouterSelect();
        openRouterCleanup(sel);
        const favGroup = insertFavoriteGroup(sel, ['openrouter/ox-alpha']);
        expect(favGroup.children.length).toBe(1);
        expect(sel.firstElementChild.id).toBe('favorite-models-group');
        expect(favGroup.children[0].value).toBe('openrouter/ox-alpha');
    });

    it('作り直さないと★は消えたまま（修正前の挙動）', () => {
        const sel = buildOpenRouterSelect();
        insertFavoriteGroup(sel, ['openrouter/ox-alpha']); // 先に作っても
        openRouterCleanup(sel);                            // 削除で消える
        expect(sel.querySelector('#favorite-models-group')).toBeNull();
    });
});
