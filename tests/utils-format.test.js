import { describe, it, expect, vi } from 'vitest';
import { sleep, interruptibleSleep, formatFileSize } from '../src/utils/format.js';

describe('formatFileSize', () => {
    it('0 バイトを "0 Bytes" で返す', () => {
        expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('各単位に変換する', () => {
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1024 * 1024)).toBe('1 MB');
        expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('小数第2位まで丸める', () => {
        expect(formatFileSize(1536)).toBe('1.5 KB');
        expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
});

describe('sleep', () => {
    it('指定時間後に resolve する', async () => {
        vi.useFakeTimers();
        let done = false;
        const p = sleep(1000).then(() => {
            done = true;
        });
        expect(done).toBe(false);
        await vi.advanceTimersByTimeAsync(1000);
        await p;
        expect(done).toBe(true);
        vi.useRealTimers();
    });
});

describe('interruptibleSleep', () => {
    it('正常に待機を完了する', async () => {
        const ac = new AbortController();
        await expect(interruptibleSleep(5, ac.signal)).resolves.toBeUndefined();
    });

    it('既に中断済みなら即座に AbortError で reject する', async () => {
        const ac = new AbortController();
        ac.abort();
        await expect(interruptibleSleep(1000, ac.signal)).rejects.toMatchObject({
            name: 'AbortError',
        });
    });

    it('待機中の中断で AbortError になる', async () => {
        const ac = new AbortController();
        const p = interruptibleSleep(10000, ac.signal);
        ac.abort();
        await expect(p).rejects.toMatchObject({ name: 'AbortError' });
    });
});
