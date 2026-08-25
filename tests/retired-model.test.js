import { describe, it, expect, vi } from 'vitest';

// UI / DB は DOM・IndexedDB に依存するため、純粋ロジック検証では読み込ませない。
vi.mock('../src/ui.js', () => ({ uiUtils: {} }));
vi.mock('../src/db.js', () => ({ dbUtils: {} }));

import { isRetiredModelError, suggestSuccessor } from '../src/app-logic/retired-model.js';

describe('isRetiredModelError', () => {
    it('各社の「提供終了」系メッセージを検知する', () => {
        const retired = [
            'The model gemini-3-pro-preview is no longer available.',
            'This model has been deprecated.',
            'model_not_found',
            'gpt-foo does not exist',
            'is not a valid model id',
            'このモデルは存在しません',
        ];
        for (const msg of retired) {
            expect(isRetiredModelError(msg)).toBe(true);
        }
    });

    it('通常のエラーは検知しない（誤爆しない）', () => {
        const normal = [
            'APIキーが無効です',
            'HTTP 429: rate limit exceeded',
            'リクエストがキャンセルされました。',
            'ネットワークエラー',
            '',
            null,
            undefined,
        ];
        for (const msg of normal) {
            expect(isRetiredModelError(msg)).toBe(false);
        }
    });
});

describe('suggestSuccessor', () => {
    it('既知の廃止（マップ登録済み）は確実な後継を fromMap:true で返す', () => {
        expect(suggestSuccessor('gemini-3-pro-preview', 'gemini')).toEqual({
            model: 'gemini-3.1-pro-preview',
            fromMap: true,
        });
    });

    // 一覧から取り除いたモデルは、保存済み設定に残っていても後継へ案内できること
    it('一覧から外した各社の廃止モデルにも後継が登録されている', () => {
        const cases = [
            ['gemini-2.0-flash', 'gemini', 'gemini-3.5-flash'],
            ['gemini-2.0-flash-lite', 'gemini', 'gemini-3.1-flash-lite'],
            ['gemini-2.5-flash-image-preview', 'gemini', 'gemini-3.1-flash-image'],
            ['claude-3-5-sonnet-20241022', 'anthropic', 'claude-sonnet-4-6'],
            ['claude-3-5-haiku-20241022', 'anthropic', 'claude-haiku-4-5-20251001'],
            ['moonshotai/kimi-k2-instruct', 'groq', 'openai/gpt-oss-120b'],
            ['gemma2-9b-it', 'groq', 'openai/gpt-oss-20b'],
            ['grok-3', 'xai', 'grok-4.3'],
            ['grok-2-1212', 'xai', 'grok-4.6'],
        ];
        for (const [oldModel, provider, successor] of cases) {
            expect(suggestSuccessor(oldModel, provider)).toEqual({ model: successor, fromMap: true });
        }
    });

    it('未知の廃止はプロバイダーのデフォルトを fromMap:false で提案する', () => {
        const s = suggestSuccessor('gpt-4o-2024-05-13', 'openai');
        expect(s.fromMap).toBe(false);
        expect(typeof s.model).toBe('string');
        expect(s.model).not.toBe('gpt-4o-2024-05-13');
    });

    it('後継候補が無い（未知プロバイダー）場合は null を返す', () => {
        expect(suggestSuccessor('mystery-model', 'unknown-provider')).toBeNull();
    });
});
