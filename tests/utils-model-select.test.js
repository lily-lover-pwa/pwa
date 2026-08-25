import { describe, it, expect } from 'vitest';
import { isImageGenerationModel, moveUserDefinedGroupToEnd, resolveSelectedModel } from '../src/utils/model-select.js';

const ANTHROPIC = ['claude-opus-5', 'claude-opus-4-6', 'claude-sonnet-4-6'];

describe('resolveSelectedModel', () => {
    // 回帰: 再読み込みのたびに保存済みモデルが既定値へ化け、
    // モデルが変わることでプロンプトキャッシュも無駄に切れていた
    it('保存済みモデルが選べるならそれを使い、設定を書き換えない', () => {
        expect(resolveSelectedModel({
            savedModel: 'claude-opus-5',
            availableValues: ANTHROPIC,
            lastUsed: 'claude-opus-4-6',
            defaultModel: 'claude-sonnet-4-6',
        })).toEqual({ model: 'claude-opus-5', isFallback: false });
    });

    it('保存済みモデルが使えないときは最後に選んだモデルへ落とす', () => {
        expect(resolveSelectedModel({
            savedModel: 'gemini-2.5-pro',
            availableValues: ANTHROPIC,
            lastUsed: 'claude-opus-4-6',
            defaultModel: 'claude-sonnet-4-6',
        })).toEqual({ model: 'claude-opus-4-6', isFallback: true });
    });

    it('最後に選んだモデルも使えなければ既定値へ落とす', () => {
        expect(resolveSelectedModel({
            savedModel: 'gemini-2.5-pro',
            availableValues: ANTHROPIC,
            lastUsed: 'gpt-5',
            defaultModel: 'claude-sonnet-4-6',
        })).toEqual({ model: 'claude-sonnet-4-6', isFallback: true });
    });

    it('最後に選んだモデルが無くても既定値へ落とす', () => {
        expect(resolveSelectedModel({
            savedModel: 'gemini-2.5-pro',
            availableValues: ANTHROPIC,
            defaultModel: 'claude-sonnet-4-6',
        })).toEqual({ model: 'claude-sonnet-4-6', isFallback: true });
    });

    // 保存済みモデルが使えるのに書き戻すと、プロバイダー切替以外でも設定を触ってしまう
    it('保存済みモデルを使えたときは isFallback が false', () => {
        const r = resolveSelectedModel({ savedModel: 'claude-sonnet-4-6', availableValues: ANTHROPIC, defaultModel: 'claude-opus-5' });
        expect(r.isFallback).toBe(false);
        expect(r.model).toBe('claude-sonnet-4-6');
    });

    it('保存済みモデルが空でも落ちない', () => {
        expect(resolveSelectedModel({ availableValues: ANTHROPIC, defaultModel: 'claude-sonnet-4-6' }))
            .toEqual({ model: 'claude-sonnet-4-6', isFallback: true });
        expect(resolveSelectedModel({ savedModel: '', availableValues: ANTHROPIC, lastUsed: 'claude-opus-5', defaultModel: 'x' }))
            .toEqual({ model: 'claude-opus-5', isFallback: true });
    });

    it('選択肢が空・未指定でも既定値を返す', () => {
        expect(resolveSelectedModel({ savedModel: 'claude-opus-5', availableValues: [], defaultModel: 'd' }))
            .toEqual({ model: 'd', isFallback: true });
        expect(resolveSelectedModel({ savedModel: 'claude-opus-5', defaultModel: 'd' }))
            .toEqual({ model: 'd', isFallback: true });
        expect(resolveSelectedModel()).toEqual({ model: undefined, isFallback: true });
    });
});

// updateModelOptions と同じ手順でドロップダウンを組み立てる。
// 標準モデル以外は一度消されるので、追加モデルグループだけが select に残った
// 状態から再構築が始まる ＝ 何もしないと追加モデルが先頭に居座る。
function buildModelSelect() {
    const sel = document.createElement('select');
    const userDefined = document.createElement('optgroup');
    userDefined.label = '追加モデル';
    userDefined.id = 'user-defined-models-group';
    ['gemini-3-flash-preview', 'gemini-3.1-flash-lite'].forEach((id) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = `${id} (gemini)`;
        opt.dataset.userDefined = 'true';
        userDefined.appendChild(opt);
    });
    sel.appendChild(userDefined);
    return { sel, userDefined };
}

function appendStandardModels(sel) {
    ['gemini-2.5-pro', 'gemini-2.5-flash'].forEach((id) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = id;
        sel.appendChild(opt);
    });
    const preview = document.createElement('optgroup');
    preview.label = 'プレビュー版';
    sel.appendChild(preview);
}

function appendFetchedGroup(sel) {
    const fetched = document.createElement('optgroup');
    fetched.label = 'API取得モデル';
    sel.appendChild(fetched);
}

function groupLabelsInOrder(sel) {
    return Array.from(sel.children).map((el) => (el.tagName === 'OPTGROUP' ? el.label : el.value));
}

describe('moveUserDefinedGroupToEnd', () => {
    // 回帰: 「既に select の子なら何もしない」という条件が付いていたため
    // 追加モデルが一覧の先頭（標準モデルより前）に表示され続けていた
    it('追加モデルを標準モデルのあと・API取得モデルの直前に置く', () => {
        const { sel, userDefined } = buildModelSelect();
        appendStandardModels(sel);
        moveUserDefinedGroupToEnd(sel, userDefined);
        appendFetchedGroup(sel);

        expect(groupLabelsInOrder(sel)).toEqual([
            'gemini-2.5-pro',
            'gemini-2.5-flash',
            'プレビュー版',
            '追加モデル',
            'API取得モデル',
        ]);
    });

    it('移動しても追加モデルの中身は失われない', () => {
        const { sel, userDefined } = buildModelSelect();
        appendStandardModels(sel);
        moveUserDefinedGroupToEnd(sel, userDefined);

        const moved = sel.querySelector('#user-defined-models-group');
        expect(moved).toBe(userDefined);
        expect(Array.from(moved.children).map((o) => o.value))
            .toEqual(['gemini-3-flash-preview', 'gemini-3.1-flash-lite']);
    });

    it('何度呼んでも末尾のまま・重複しない', () => {
        const { sel, userDefined } = buildModelSelect();
        appendStandardModels(sel);
        moveUserDefinedGroupToEnd(sel, userDefined);
        moveUserDefinedGroupToEnd(sel, userDefined);

        expect(sel.querySelectorAll('#user-defined-models-group').length).toBe(1);
        expect(sel.lastElementChild).toBe(userDefined);
    });

    it('追加モデルグループが無い場合は何もしない', () => {
        const sel = document.createElement('select');
        appendStandardModels(sel);
        const before = groupLabelsInOrder(sel);
        expect(() => moveUserDefinedGroupToEnd(sel, null)).not.toThrow();
        expect(() => moveUserDefinedGroupToEnd(null, null)).not.toThrow();
        expect(groupLabelsInOrder(sel)).toEqual(before);
    });
});

describe('isImageGenerationModel', () => {
    // 回帰: Nano Banana を名指ししていたため、後継の -image モデルを選ぶと
    // 画像生成として扱われなかった
    it('後継の画像生成モデルを認識する', () => {
        for (const m of ['gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image', 'gemini-3-pro-image']) {
            expect(isImageGenerationModel(m)).toBe(true);
        }
    });

    it('提供終了した Nano Banana も引き続き認識する（過去のチャットのため）', () => {
        expect(isImageGenerationModel('gemini-2.5-flash-image-preview')).toBe(true);
    });

    it('imagen / image-generation 系も認識する', () => {
        expect(isImageGenerationModel('imagen-4.0-generate-001')).toBe(true);
        expect(isImageGenerationModel('gemini-2.0-flash-image-generation')).toBe(true);
    });

    it('テキストモデルは誤検知しない', () => {
        for (const m of ['gemini-3.5-flash', 'gemini-2.5-pro', 'claude-opus-5', 'grok-4.6', 'openai/gpt-oss-120b']) {
            expect(isImageGenerationModel(m)).toBe(false);
        }
    });

    it('空・非文字列でも落ちない', () => {
        expect(isImageGenerationModel('')).toBe(false);
        expect(isImageGenerationModel(null)).toBe(false);
        expect(isImageGenerationModel(undefined)).toBe(false);
        expect(isImageGenerationModel(123)).toBe(false);
    });
});
