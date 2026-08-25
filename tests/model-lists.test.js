import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
    ANTHROPIC_MODELS,
    BEDROCK_MODELS,
    DEEPSEEK_MODELS,
    DEFAULT_ANTHROPIC_MODEL,
    DEFAULT_BEDROCK_MODEL,
    DEFAULT_DEEPSEEK_MODEL,
    DEFAULT_GROQ_MODEL,
    DEFAULT_MISTRAL_MODEL,
    DEFAULT_MODEL,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_SAKANA_MODEL,
    DEFAULT_XAI_MODEL,
    DEFAULT_ZAI_MODEL,
    GEMINI_MODELS,
    GROQ_MODELS,
    MISTRAL_MODELS,
    OPENAI_MODELS,
    RETIRED_MODEL_MAP,
    SAKANA_MODELS,
    XAI_MODELS,
    ZAI_MODELS,
} from '../src/constants.js';

// 各社が提供を終了したモデル。一覧に残っているとユーザーが選べてしまい、
// 送信して初めてエラーになる（＝原因が分かりにくい）ので、選択肢から外れていること。
const RETIRED_MODELS = [
    // Gemini（2026-06-01 / 2026-03-31 / 2026-01-15 提供終了）
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-pro-exp-02-05',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-2.5-flash-preview-09-2025',
    'gemini-2.5-flash-lite-preview-09-2025',
    'gemini-2.5-flash-image-preview',
    'gemini-3-pro-preview',
    // Claude API（2025-10-28 / 2026-02-19 ほか）
    'claude-3-5-sonnet-20241022',
    'claude-3-5-sonnet-20240620',
    'claude-3-5-haiku-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
    'claude-3-7-sonnet-20250219',
    'claude-opus-4-1-20250805',
    // Bedrock（ARN付きID）
    'anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'anthropic.claude-3-opus-20240229-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    // Groq
    'moonshotai/kimi-k2-instruct',
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'qwen/qwen3-32b',
    'gemma2-9b-it',
    // xAI（2026-05-15 提供終了）
    'grok-4',
    'grok-4-0709',
    'grok-3',
    'grok-3-mini',
    'grok-2-1212',
];

const ALL_LISTS = {
    GEMINI_MODELS,
    ANTHROPIC_MODELS,
    BEDROCK_MODELS,
    OPENAI_MODELS,
    GROQ_MODELS,
    DEEPSEEK_MODELS,
    XAI_MODELS,
    MISTRAL_MODELS,
    SAKANA_MODELS,
    ZAI_MODELS,
};

describe('モデル一覧に提供終了したモデルが残っていない', () => {
    for (const [name, list] of Object.entries(ALL_LISTS)) {
        it(`${name}`, () => {
            const values = list.map((m) => m.value);
            const stale = values.filter((v) => RETIRED_MODELS.includes(v));
            expect(stale).toEqual([]);
        });
    }

    it('index.html の静的な選択肢にも残っていない', () => {
        const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // 追加モデルの入力例（placeholder）も含めて確認したいので value 属性だけでなく本文も見る
        const values = Array.from(doc.querySelectorAll('#model-name option, #summary-model-name option'))
            .map((o) => o.value);
        const stale = values.filter((v) => RETIRED_MODELS.includes(v));
        expect(stale).toEqual([]);
    });
});

describe('各プロバイダーの既定モデルが一覧に存在する', () => {
    const cases = [
        ['gemini', DEFAULT_MODEL, GEMINI_MODELS],
        ['anthropic', DEFAULT_ANTHROPIC_MODEL, ANTHROPIC_MODELS],
        ['bedrock', DEFAULT_BEDROCK_MODEL, BEDROCK_MODELS],
        ['openai', DEFAULT_OPENAI_MODEL, OPENAI_MODELS],
        ['groq', DEFAULT_GROQ_MODEL, GROQ_MODELS],
        ['deepseek', DEFAULT_DEEPSEEK_MODEL, DEEPSEEK_MODELS],
        ['xai', DEFAULT_XAI_MODEL, XAI_MODELS],
        ['mistral', DEFAULT_MISTRAL_MODEL, MISTRAL_MODELS],
        ['sakana', DEFAULT_SAKANA_MODEL, SAKANA_MODELS],
        ['zai', DEFAULT_ZAI_MODEL, ZAI_MODELS],
    ];
    // 回帰: 既定が廃止モデル（groq の kimi-k2 / xai の grok-4）のままだと、
    // 初回起動やプロバイダー切替の直後にいきなりエラーになる
    for (const [provider, def, list] of cases) {
        it(`${provider}: ${def}`, () => {
            expect(list.map((m) => m.value)).toContain(def);
            expect(RETIRED_MODELS).not.toContain(def);
        });
    }
});

describe('RETIRED_MODEL_MAP の後継が有効', () => {
    it('後継として、それ自体が廃止済みのモデルを指していない', () => {
        const bad = Object.entries(RETIRED_MODEL_MAP)
            .filter(([, successor]) => RETIRED_MODELS.includes(successor))
            .map(([oldModel, successor]) => `${oldModel} → ${successor}`);
        expect(bad).toEqual([]);
    });

    it('後継が自分自身を指していない（無限ループ防止）', () => {
        const selfRef = Object.entries(RETIRED_MODEL_MAP)
            .filter(([oldModel, successor]) => oldModel === successor)
            .map(([oldModel]) => oldModel);
        expect(selfRef).toEqual([]);
    });
});
