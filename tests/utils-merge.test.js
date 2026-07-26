import { describe, it, expect } from 'vitest';
import { mergeByNewest } from '../src/utils/merge.js';

describe('mergeByNewest', () => {
    it('同じIDなら updatedAt が新しい方を採用する', () => {
        const cloud = [{ id: 1, name: 'cloud', updatedAt: 100 }];
        const local = [{ id: 1, name: 'local', updatedAt: 200 }];
        expect(mergeByNewest([cloud, local])).toEqual([{ id: 1, name: 'local', updatedAt: 200 }]);
    });

    it('クラウドの方が新しければクラウドを採用する', () => {
        const cloud = [{ id: 1, name: 'cloud', updatedAt: 300 }];
        const local = [{ id: 1, name: 'local', updatedAt: 200 }];
        expect(mergeByNewest([cloud, local])[0].name).toBe('cloud');
    });

    // 回帰: ローカルで設定を変更した直後に同期が走ると、クラウドの古いプロファイルに
    // 巻き戻って Effort 等が既定値へ戻っていた（クラウド先勝ちが原因）。
    it('updatedAtを持たない旧クラウドデータより、更新済みローカルを優先する', () => {
        const cloud = [{ id: 1, settings: { anthropicEffort: 'high' } }]; // updatedAt なし
        const local = [{ id: 1, settings: { anthropicEffort: '' }, updatedAt: 50 }];
        expect(mergeByNewest([cloud, local])[0].settings.anthropicEffort).toBe('');
    });

    it('どちらも updatedAt を持たない場合は先に渡した方（クラウド）を保持する', () => {
        const cloud = [{ id: 1, name: 'cloud' }];
        const local = [{ id: 1, name: 'local' }];
        expect(mergeByNewest([cloud, local])[0].name).toBe('cloud');
    });

    it('片方にしか無いIDは両方とも残す', () => {
        const cloud = [{ id: 1, updatedAt: 1 }];
        const local = [{ id: 2, updatedAt: 1 }];
        expect(mergeByNewest([cloud, local]).map((p) => p.id).sort()).toEqual([1, 2]);
    });

    it('null・undefined・IDなしの要素を安全に無視する', () => {
        expect(mergeByNewest([null, [null, { name: 'no id' }], undefined])).toEqual([]);
        expect(mergeByNewest(null)).toEqual([]);
    });

    it('キー名とタイムスタンプ名を指定できる', () => {
        const a = [{ profileId: 'x', v: 'old', savedAt: 1 }];
        const b = [{ profileId: 'x', v: 'new', savedAt: 2 }];
        const out = mergeByNewest([a, b], { key: 'profileId', timestamp: 'savedAt' });
        expect(out).toEqual([{ profileId: 'x', v: 'new', savedAt: 2 }]);
    });
});
