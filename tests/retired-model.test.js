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
