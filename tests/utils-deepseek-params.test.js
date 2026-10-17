import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { deepseekThinkingOffParams } from '../src/utils/deepseek-params.js';
import { DEEPSEEK_MODELS, DEFAULT_DEEPSEEK_MODEL, RETIRED_MODEL_MAP } from '../src/constants.js';

const read = (p) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('deepseekThinkingOffParams', () => {
    it('DeepSeek のモデルには thinking: disabled を足す', () => {
        expect(deepseekThinkingOffParams('deepseek-flash')).toEqual({ thinking: { type: 'disabled' } });
        expect(deepseekThinkingOffParams('deepseek-v4-pro')).toEqual({ thinking: { type: 'disabled' } });
    });

    it('DeepSeek 以外と空は null', () => {
        expect(deepseekThinkingOffParams('gemini-3.8-flash')).toBeNull();
        expect(deepseekThinkingOffParams('deepseek/deepseek-chat')).toBeNull(); // OpenRouter 経由の名前
        expect(deepseekThinkingOffParams('')).toBeNull();
        expect(deepseekThinkingOffParams(undefined)).toBeNull();
    });
});

// deepseek-chat / deepseek-reasoner は 2026-07-24 に廃止（公式の変更履歴 2026-04-24 の告知）
describe('DeepSeek の旧名の廃止', () => {
    it('一覧から外れ、既定は deepseek-flash', () => {
        const values = DEEPSEEK_MODELS.map((m) => m.value);
        expect(values).not.toContain('deepseek-chat');
        expect(values).not.toContain('deepseek-reasoner');
        expect(DEFAULT_DEEPSEEK_MODEL).toBe('deepseek-flash');
    });

    it('保存済みの設定は deepseek-flash へ移る', () => {
        expect(RETIRED_MODEL_MAP['deepseek-chat']).toBe('deepseek-flash');
        expect(RETIRED_MODEL_MAP['deepseek-reasoner']).toBe('deepseek-flash');
    });

    it('翻訳用・要約用の固定の選択肢にも残っていない', () => {
        const html = read('index.html');
        expect(html).not.toContain('<option value="deepseek-chat">');
        expect(html).not.toContain('<option value="deepseek-reasoner">');
    });

    it('新しく使い始めた人の追加モデルの初期値にも入れていない', () => {
        expect(read('src/app.js')).not.toContain("deepseek: 'deepseek-chat, deepseek-reasoner'");
    });
});

describe('短い作業では DeepSeek の思考を止める配線', () => {
    // 回帰: 既定で思考する deepseek-flash に替わると、200 トークンを思考で使い切ってタイトルが空になりうる
    it('タイトル生成', () => {
        expect(read('src/app-logic/chat.js')).toContain('...(deepseekThinkingOffParams(titleModel) || {})');
    });

    it('思考の翻訳', () => {
        expect(read('src/api.js')).toContain('...(deepseekThinkingOffParams(modelToUse) || {}),');
    });

    it('メモリ学習だけ止め、要約（ユーザーが選んだモデル）は止めない', () => {
        const mem = read('src/app-logic/memory.js');
        expect(mem).toContain("if (provider === 'deepseek' && lightweight) {");
        expect((mem.match(/lightweight: true,/g) || []).length).toBe(1);
        expect(mem).toContain("deepseek: 'deepseek-flash',");
    });
});
