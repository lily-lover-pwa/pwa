import { describe, it, expect } from 'vitest';
import { assessAnthropicCacheMiss, formatCacheMissMessage, CACHE_TTL_MS } from '../src/utils/cache-miss.js';

const NOW = Date.UTC(2026, 8, 25, 12, 0, 0);
const MIN = 60 * 1000;

// Opus 5.5: in $4, cw5m $5, cw1h $8 → 250万トークンなら 5m 書込で $12.50
const settings = (over = {}) => ({
    apiProvider: 'anthropic',
    modelName: 'claude-opus-5-5',
    anthropicCacheTTL: '5m',
    cacheMissAlertThresholdUsd: 0.5,
    ...over,
});
const last = (over = {}) => ({
    role: 'model',
    modelName: 'claude-opus-5-5',
    provider: 'anthropic',
    timestamp: NOW - 1 * MIN,
    usageMetadata: { promptTokenCount: 2_500_000 },
    ...over,
});

describe('assessAnthropicCacheMiss — 止めない場合', () => {
    it('同じモデルで TTL 内なら何も言わない', () => {
        expect(assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: last(), now: NOW })).toBeNull();
    });

    it('Anthropic 以外は対象外', () => {
        expect(assessAnthropicCacheMiss({ settings: settings({ apiProvider: 'gemini' }), lastModelMessage: last(), now: NOW })).toBeNull();
    });

    it('しきい値が 0 か未設定なら無効', () => {
        const stale = last({ timestamp: NOW - 10 * MIN });
        expect(assessAnthropicCacheMiss({ settings: settings({ cacheMissAlertThresholdUsd: 0 }), lastModelMessage: stale, now: NOW })).toBeNull();
        expect(assessAnthropicCacheMiss({ settings: settings({ cacheMissAlertThresholdUsd: undefined }), lastModelMessage: stale, now: NOW })).toBeNull();
        expect(assessAnthropicCacheMiss({ settings: settings({ cacheMissAlertThresholdUsd: -1 }), lastModelMessage: stale, now: NOW })).toBeNull();
    });

    // キャッシュを使っていなければ失うものが無い
    it('TTL が none なら何も言わない', () => {
        const stale = last({ timestamp: NOW - 10 * MIN });
        expect(assessAnthropicCacheMiss({ settings: settings({ anthropicCacheTTL: 'none' }), lastModelMessage: stale, now: NOW })).toBeNull();
    });

    it('直前の返事が無い（新規チャット）なら何も言わない', () => {
        expect(assessAnthropicCacheMiss({ settings: settings({ modelName: 'claude-sonnet-5' }), lastModelMessage: null, now: NOW })).toBeNull();
    });

    it('トークン数が残っていなければ見積もれないので何も言わない', () => {
        const noUsage = last({ usageMetadata: undefined, modelName: 'claude-sonnet-5' });
        expect(assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: noUsage, now: NOW })).toBeNull();
    });

    // 小さいチャットでいちいち止めると煩わしい
    it('見積もりがしきい値未満なら止めない', () => {
        const small = last({ modelName: 'claude-sonnet-5', usageMetadata: { promptTokenCount: 10_000 } });
        // 1万トークン × $5/M = $0.05 < $0.50
        expect(assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: small, now: NOW })).toBeNull();
    });
});

describe('assessAnthropicCacheMiss — 止める場合', () => {
    it('モデルが変わっていたら止める', () => {
        const r = assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: last({ modelName: 'claude-sonnet-5' }), now: NOW });
        expect(r).toMatchObject({ reason: 'model', prevModel: 'claude-sonnet-5', model: 'claude-opus-5-5', tokens: 2_500_000 });
        // 250万 × $5/M（5分書込）
        expect(r.estimatedUsd).toBeCloseTo(12.5, 5);
        // 1時間に切り替えた場合は × $8/M
        expect(r.estimatedUsd1h).toBeCloseTo(20, 5);
    });

    // 'claude-opus-5.5' と 'claude-opus-5-5' は同じモデル。表記ゆれで誤検知しない
    it('表記ゆれは同じモデルとして扱う', () => {
        const r = assessAnthropicCacheMiss({ settings: settings({ modelName: 'claude-opus-5.5' }), lastModelMessage: last(), now: NOW });
        expect(r).toBeNull();
    });

    it('プロバイダーが変わっていたら止める', () => {
        const r = assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: last({ provider: 'gemini', modelName: 'gemini-3.1-pro' }), now: NOW });
        expect(r?.reason).toBe('provider');
    });

    it('5分TTLで5分を超えて空いたら止める', () => {
        const r = assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: last({ timestamp: NOW - 6 * MIN }), now: NOW });
        expect(r?.reason).toBe('expired');
        expect(r.ttl).toBe('5m');
        expect(r.estimatedUsd1h).toBeCloseTo(20, 5);
    });

    it('1時間TTLなら1時間以内は止めない・超えたら止める', () => {
        const s = settings({ anthropicCacheTTL: '1h' });
        expect(assessAnthropicCacheMiss({ settings: s, lastModelMessage: last({ timestamp: NOW - 30 * MIN }), now: NOW })).toBeNull();
        const r = assessAnthropicCacheMiss({ settings: s, lastModelMessage: last({ timestamp: NOW - 61 * MIN }), now: NOW });
        expect(r?.reason).toBe('expired');
        // 1時間TTLの再書き込みは × $8/M
        expect(r.estimatedUsd).toBeCloseTo(20, 5);
        // すでに1時間なので「切り替え」の選択肢は無い
        expect(r.estimatedUsd1h).toBeNull();
    });

    // モデル変更と期限切れが同時なら、モデル変更のほうを理由にする（そちらが原因として明確）
    it('モデル変更と期限切れが重なったらモデル変更を理由にする', () => {
        const r = assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: last({ modelName: 'claude-sonnet-5', timestamp: NOW - 10 * MIN }), now: NOW });
        expect(r?.reason).toBe('model');
    });

    it('TTL の定数', () => {
        expect(CACHE_TTL_MS['5m']).toBe(5 * MIN);
        expect(CACHE_TTL_MS['1h']).toBe(60 * MIN);
    });
});

describe('formatCacheMissMessage', () => {
    it('モデル変更の文面に前後のモデルと金額が入る', () => {
        const r = assessAnthropicCacheMiss({ settings: settings(), lastModelMessage: last({ modelName: 'claude-sonnet-5' }), now: NOW });
        const m = formatCacheMissMessage(r);
        expect(m).toContain('claude-sonnet-5 から claude-opus-5-5');
        expect(m).toContain('$12.50');
        expect(m).toContain('2,500,000');
        expect(m).toContain('「1時間キャッシュに切り替えて送信」を選ぶと');
        expect(m).toContain('$20.00');
        // 5分のままとの差額と、以後も高くなることを明記する（安くなるように読ませない）
        expect(m).toContain('+$7.50');
        expect(m).toContain('書き込みが2倍');
    });

    it('1時間TTLの期限切れでは切り替えの案内を出さない', () => {
        const r = assessAnthropicCacheMiss({ settings: settings({ anthropicCacheTTL: '1h' }), lastModelMessage: last({ timestamp: NOW - 61 * MIN }), now: NOW });
        const m = formatCacheMissMessage(r);
        expect(m).toContain('1時間 以上空いた');
        expect(m).not.toContain('切り替えて送信');
    });

    it('null なら空文字', () => {
        expect(formatCacheMissMessage(null)).toBe('');
    });
});
