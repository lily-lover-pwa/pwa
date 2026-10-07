import { describe, it, expect } from 'vitest';
import { getGeminiThinkingLevels, buildGeminiThinkingConfig, buildGeminiLightThinkingConfig, GEMINI_THINKING_LEVELS } from '../src/utils/gemini-thinking.js';

describe('getGeminiThinkingLevels', () => {
    it('minimal まで選べるモデル（公式表で minimal が載っているもの）', () => {
        for (const m of ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite']) {
            expect(getGeminiThinkingLevels(m)).toEqual(['minimal', 'low', 'medium', 'high']);
        }
    });

    // 回帰: 2026-10 の公式表で 3.5 Flash と 3 Flash（プレビュー）に minimal が載ったが、
    // アプリでは選べないままだった
    it('3.5 Flash と 3 Flash（プレビュー）でも minimal を選べる', () => {
        expect(getGeminiThinkingLevels('gemini-3.5-flash')).toContain('minimal');
        expect(getGeminiThinkingLevels('gemini-3-flash-preview')).toContain('minimal');
    });

    it('3.8 / 3.7 Flash、3.1 Pro は low / medium / high', () => {
        for (const m of ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.1-pro-preview']) {
            expect(getGeminiThinkingLevels(m)).toEqual(['low', 'medium', 'high']);
        }
    });

    it('2.5 系は low / medium / high', () => {
        for (const m of ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite']) {
            expect(getGeminiThinkingLevels(m)).toEqual(['low', 'medium', 'high']);
        }
    });

    // 公式表に無い 3.x は、対応外の値を送って 400 になるより共通部分に絞る
    it('公式表に無い 3.x は共通の3段階に絞る', () => {
        expect(getGeminiThinkingLevels('gemini-3.9-flash')).toEqual(['low', 'medium', 'high']);
    });

    // 今後のモデルは thinking_budget を受け付けず、thinking_level が唯一の指定方法になる。
    // 名前を知らないからといって隠すと、思考の深さを指定できなくなる
    it('今後出るモデルと -latest の別名にも共通の3段階を出す', () => {
        expect(getGeminiThinkingLevels('gemini-4-flash')).toEqual(['low', 'medium', 'high']);
        expect(getGeminiThinkingLevels('gemini-4.1-pro')).toEqual(['low', 'medium', 'high']);
        expect(getGeminiThinkingLevels('gemini-flash-latest')).toEqual(['low', 'medium', 'high']);
    });

    it('2.0 以前・画像生成・Gemini 以外は非対応', () => {
        expect(getGeminiThinkingLevels('gemini-2.0-flash')).toBeNull();
        expect(getGeminiThinkingLevels('gemini-3.1-flash-image')).toBeNull();
        expect(getGeminiThinkingLevels('claude-opus-5-5')).toBeNull();
        expect(getGeminiThinkingLevels('')).toBeNull();
        expect(getGeminiThinkingLevels(undefined)).toBeNull();
    });

    it('表示順の定数', () => {
        expect(GEMINI_THINKING_LEVELS).toEqual(['minimal', 'low', 'medium', 'high']);
    });
});

describe('buildGeminiThinkingConfig', () => {
    const model = 'gemini-3.8-flash';

    // REST の値は大文字（@google/genai の ThinkingLevel enum で確認）
    it('thinking_level は大文字で送る', () => {
        expect(buildGeminiThinkingConfig({ model, thinkingLevel: 'low' })).toEqual({ thinkingLevel: 'LOW' });
        expect(buildGeminiThinkingConfig({ model, thinkingLevel: 'High' })).toEqual({ thinkingLevel: 'HIGH' });
    });

    // 両方送ると 400
    it('thinking_level があれば thinking_budget は送らない', () => {
        const cfg = buildGeminiThinkingConfig({ model, thinkingLevel: 'medium', thinkingBudget: 5000 });
        expect(cfg).toEqual({ thinkingLevel: 'MEDIUM' });
        expect(cfg).not.toHaveProperty('thinkingBudget');
    });

    it('thinking_level が未指定なら従来どおり thinking_budget', () => {
        expect(buildGeminiThinkingConfig({ model, thinkingLevel: '', thinkingBudget: 5000 })).toEqual({ thinkingBudget: 5000 });
    });

    it('thinking_budget が 0 / null / 未設定なら送らない', () => {
        expect(buildGeminiThinkingConfig({ model, thinkingBudget: 0 })).toBeNull();
        expect(buildGeminiThinkingConfig({ model, thinkingBudget: null })).toBeNull();
        expect(buildGeminiThinkingConfig({ model })).toBeNull();
    });

    it('includeThoughts は独立して付く', () => {
        expect(buildGeminiThinkingConfig({ model, includeThoughts: true })).toEqual({ includeThoughts: true });
        expect(buildGeminiThinkingConfig({ model, thinkingLevel: 'low', includeThoughts: true }))
            .toEqual({ thinkingLevel: 'LOW', includeThoughts: true });
        expect(buildGeminiThinkingConfig({ model, thinkingBudget: 800, includeThoughts: true }))
            .toEqual({ thinkingBudget: 800, includeThoughts: true });
    });

    // モデルが対応していない値（3.8 Flash に minimal）を送ると 400 になりうる
    it('そのモデルで選べない level は無視して thinking_budget に落とす', () => {
        expect(buildGeminiThinkingConfig({ model: 'gemini-3.8-flash', thinkingLevel: 'minimal', thinkingBudget: 2000 }))
            .toEqual({ thinkingBudget: 2000 });
        expect(buildGeminiThinkingConfig({ model: 'gemini-3.8-flash', thinkingLevel: 'minimal' })).toBeNull();
    });

    it('thinking_level 非対応のモデルでは level を送らない', () => {
        // 2.0 は提供終了済みで thinking_budget の受け付けも確認できないので、何も送らない
        expect(buildGeminiThinkingConfig({ model: 'gemini-2.0-flash', thinkingLevel: 'high', thinkingBudget: 1000 })).toBeNull();
    });

    // 2026-10 の告知: 今後のモデルは thinking_budget を読み替えず 400 を返す
    it('今後出るモデルには thinking_budget を送らない', () => {
        expect(buildGeminiThinkingConfig({ model: 'gemini-4-flash', thinkingBudget: 5000 })).toBeNull();
        expect(buildGeminiThinkingConfig({ model: 'gemini-flash-latest', thinkingBudget: 5000 })).toBeNull();
        // 思考の深さは送れる
        expect(buildGeminiThinkingConfig({ model: 'gemini-4-flash', thinkingLevel: 'high', thinkingBudget: 5000 }))
            .toEqual({ thinkingLevel: 'HIGH' });
    });

    it('告知の時点で出ていたモデルには、これまでどおり thinking_budget を送る', () => {
        for (const m of ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash']) {
            expect(buildGeminiThinkingConfig({ model: m, thinkingBudget: 2000 })).toEqual({ thinkingBudget: 2000 });
        }
    });
});

describe('buildGeminiLightThinkingConfig（翻訳用）', () => {
    it('thinking_budget を受け付けるモデルはこれまでどおり 0', () => {
        expect(buildGeminiLightThinkingConfig('gemini-3.8-flash')).toEqual({ thinkingBudget: 0 });
        expect(buildGeminiLightThinkingConfig('gemini-2.5-flash-lite')).toEqual({ thinkingBudget: 0 });
    });

    it('今後出るモデルは選べる段階のうちいちばん軽いもの', () => {
        expect(buildGeminiLightThinkingConfig('gemini-4-flash')).toEqual({ thinkingLevel: 'LOW' });
    });

    it('思考の指定ができないモデルは null', () => {
        expect(buildGeminiLightThinkingConfig('gemini-2.0-flash')).toBeNull();
    });
});
