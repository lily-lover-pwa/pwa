import { describe, it, expect } from 'vitest';
import { planTypewriterStep, DEFAULT_MAX_LAG_MS } from '../src/utils/typewriter.js';

describe('planTypewriterStep', () => {
    it('未表示がなければ何も送らない', () => {
        expect(planTypewriterStep({ backlog: 0, speedMs: 12 })).toEqual({ chars: 0, delayMs: 0 });
    });

    it('速度0なら文字送りせず全部そのまま出す', () => {
        expect(planTypewriterStep({ backlog: 500, speedMs: 0 })).toEqual({ chars: 500, delayMs: 0 });
        expect(planTypewriterStep({ backlog: 500, speedMs: -1 })).toEqual({ chars: 500, delayMs: 0 });
    });

    it('少量なら1文字ずつ滑らかに送る', () => {
        expect(planTypewriterStep({ backlog: 50, speedMs: 12 })).toEqual({ chars: 1, delayMs: 12 });
    });

    // 回帰: 素朴に1文字ずつ待つと、生成が終わっているのに表示だけ遅れ続ける
    it('溜まっていたらまとめて送り、遅れを許容範囲に収める', () => {
        const { chars, delayMs } = planTypewriterStep({ backlog: 3000, speedMs: 12, maxLagMs: 2000 });
        // 3000文字 × 12ms = 36秒かかるので、18文字ずつ送って2秒に収める
        expect(chars).toBe(18);
        expect(delayMs).toBe(12);
        // 実際にかかる時間が許容範囲であること
        expect((3000 / chars) * delayMs).toBeLessThanOrEqual(2000);
    });

    it('送る文字数が未表示ぶんを超えない', () => {
        const { chars } = planTypewriterStep({ backlog: 5, speedMs: 1000, maxLagMs: 100 });
        expect(chars).toBe(5);
    });

    it('既定の許容遅れを使う', () => {
        const withDefault = planTypewriterStep({ backlog: 3000, speedMs: 12 });
        const explicit = planTypewriterStep({ backlog: 3000, speedMs: 12, maxLagMs: DEFAULT_MAX_LAG_MS });
        expect(withDefault).toEqual(explicit);
    });

    it('おかしな入力でも落ちない', () => {
        expect(planTypewriterStep({ backlog: NaN, speedMs: 12 })).toEqual({ chars: 0, delayMs: 0 });
        expect(planTypewriterStep({ backlog: -5, speedMs: 12 })).toEqual({ chars: 0, delayMs: 0 });
        expect(planTypewriterStep({ backlog: 10, speedMs: NaN })).toEqual({ chars: 10, delayMs: 0 });
        expect(planTypewriterStep({ backlog: 10, speedMs: 12, maxLagMs: 0 }).chars).toBeGreaterThan(0);
    });

    // どんな組み合わせでも進むこと（0文字を返し続けると表示が止まる）
    it('未表示があるかぎり必ず1文字以上進む', () => {
        for (const backlog of [1, 7, 100, 9999]) {
            for (const speedMs of [1, 12, 200]) {
                expect(planTypewriterStep({ backlog, speedMs }).chars).toBeGreaterThanOrEqual(1);
            }
        }
    });
});
