import { describe, it, expect } from 'vitest';
import { resolveSelectedModel } from '../src/utils/model-select.js';

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
