import { describe, it, expect } from 'vitest';
import {
    compareVersionKeys,
    getUnseenVersions,
    listAllVersions,
    sortVersionKeysDesc,
} from '../src/utils/version-history.js';
import { VERSION_HISTORY } from '../src/constants.js';

describe('compareVersionKeys', () => {
    // キーは小数ではなく「メジャー.通し番号」。数値化すると 1.9 > 1.58 になってしまう
    it('通し番号として比較する（1.58 は 1.9 より新しい）', () => {
        expect(compareVersionKeys('1.58', '1.9')).toBeGreaterThan(0);
        expect(compareVersionKeys('1.9', '1.58')).toBeLessThan(0);
    });

    it('同じなら 0', () => {
        expect(compareVersionKeys('1.55', '1.55')).toBe(0);
    });

    it('桁数が違っても比較できる', () => {
        expect(compareVersionKeys('1.1', '1.14')).toBeLessThan(0);
        expect(compareVersionKeys('1.20', '1.2')).toBeGreaterThan(0);
    });

    it('壊れたキーでも落ちない', () => {
        expect(() => compareVersionKeys(null, '1.0')).not.toThrow();
        expect(() => compareVersionKeys('abc', '1.0')).not.toThrow();
    });
});

describe('sortVersionKeysDesc', () => {
    it('新しい順に並べ、元の配列は変えない', () => {
        const src = ['1.9', '1.58', '1.1', '1.20'];
        const sorted = sortVersionKeysDesc(src);
        expect(sorted).toEqual(['1.58', '1.20', '1.9', '1.1']);
        expect(src).toEqual(['1.9', '1.58', '1.1', '1.20']);
    });
});

const HISTORY = {
    '1.58': ['e'],
    '1.57': ['d'],
    '1.56': ['c'],
    '1.55': ['b'],
    '1.54': ['a'],
};

describe('getUnseenVersions', () => {
    it('確認済みより新しいものを新しい順に返す', () => {
        const r = getUnseenVersions(HISTORY, '1.56', 3);
        expect(r.entries.map((e) => e.version)).toEqual(['1.58', '1.57']);
        expect(r.latest).toBe('1.58');
        expect(r.hiddenCount).toBe(0);
    });

    // 久しぶりに開いた人に何十件も出さないための上限
    it('上限を超えたぶんは hiddenCount で数える', () => {
        const r = getUnseenVersions(HISTORY, '1.53', 3);
        expect(r.entries.map((e) => e.version)).toEqual(['1.58', '1.57', '1.56']);
        expect(r.hiddenCount).toBe(2);
    });

    it('未確認（初回）は最新から上限件数まで', () => {
        const r = getUnseenVersions(HISTORY, null, 3);
        expect(r.entries.map((e) => e.version)).toEqual(['1.58', '1.57', '1.56']);
        expect(r.hiddenCount).toBe(2);
    });

    it('最新まで確認済みなら何も返さない', () => {
        const r = getUnseenVersions(HISTORY, '1.58', 3);
        expect(r.entries).toEqual([]);
        expect(r.hiddenCount).toBe(0);
        expect(r.latest).toBe('1.58');
    });

    it('履歴が空でも落ちない', () => {
        const r = getUnseenVersions({}, '1.0', 3);
        expect(r).toEqual({ latest: null, entries: [], hiddenCount: 0 });
        expect(() => getUnseenVersions(null, null, 3)).not.toThrow();
    });

    it('項目の中身も一緒に返す', () => {
        const r = getUnseenVersions(HISTORY, '1.57', 3);
        expect(r.entries[0]).toEqual({ version: '1.58', items: ['e'] });
    });
});

describe('実際の VERSION_HISTORY', () => {
    // 回帰: 以前は APP_VERSION（'1.25' 固定）をキーに引いていたため、
    // 1.26 以降に書いた項目が一件も表示されていなかった
    it('最新は 1.25 より新しい（＝新しい項目が拾える）', () => {
        const { latest } = getUnseenVersions(VERSION_HISTORY, null, 3);
        expect(compareVersionKeys(latest, '1.25')).toBeGreaterThan(0);
    });

    it('1.25 まで見た人には、それ以降の更新が届く', () => {
        const r = getUnseenVersions(VERSION_HISTORY, '1.25', 3);
        expect(r.entries.length).toBe(3);
        expect(r.hiddenCount).toBeGreaterThan(0);
    });

    it('全件を新しい順に取り出せる（設定画面の一覧用）', () => {
        const all = listAllVersions(VERSION_HISTORY);
        expect(all.length).toBe(Object.keys(VERSION_HISTORY).length);
        expect(all[0].version).toBe(sortVersionKeysDesc(Object.keys(VERSION_HISTORY))[0]);
        // 各項目が文字列の配列になっていること
        for (const entry of all) {
            expect(Array.isArray(entry.items)).toBe(true);
        }
    });
});
