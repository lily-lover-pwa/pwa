// 「このまま送るとプロンプトキャッシュが効かず、丸ごと再書き込みになる」送信を
// 送信前に見つける。DOMにもDBにも触らない純粋関数だけを置く。
//
// 対象は Anthropic のみ。Claude のキャッシュは前方一致で、次のときに丸ごと外れる:
//   - モデル（またはプロバイダー）が前の返事と違う（キャッシュはモデル単位）
//   - 前の返事から TTL（5分/1時間）を超えて時間が空いた（キャッシュが消えている）
//
// 250万トークンのチャットでこれが起きると、1通で数ドル〜十数ドルになる。
// 普段は何も出さず、見積もりがしきい値を超えたときだけ止めるための判定。

import { getPricing, normalizeModelName } from './pricing.js';

export const CACHE_TTL_MS = {
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
};

/**
 * @param {object} params
 * @param {object} params.settings state.settings（apiProvider / modelName / anthropicCacheTTL / cacheMissAlertThresholdUsd）
 * @param {object|null} params.lastModelMessage 直前のモデルの返事（modelName / provider / timestamp / usageMetadata）
 * @param {number} params.now 現在時刻（ms）
 * @returns {null | {
 *   reason: 'provider' | 'model' | 'expired',
 *   prevModel: string, model: string, ttl: string,
 *   tokens: number, estimatedUsd: number, estimatedUsd1h: number|null
 * }} 止める必要が無ければ null
 */
export function assessAnthropicCacheMiss({ settings, lastModelMessage, now }) {
    if (!settings || settings.apiProvider !== 'anthropic') return null;

    const threshold = Number(settings.cacheMissAlertThresholdUsd);
    // 0 や未設定は無効。負の値も無効扱いにする
    if (!Number.isFinite(threshold) || threshold <= 0) return null;

    const ttl = settings.anthropicCacheTTL || '5m';
    // キャッシュを使っていないなら、失うものが無いので何も言わない
    if (!CACHE_TTL_MS[ttl]) return null;

    // 直前の返事が無い（新規チャット）か、トークン数が残っていなければ見積もれない
    const tokens = lastModelMessage?.usageMetadata?.promptTokenCount || 0;
    if (tokens <= 0) return null;

    const model = settings.modelName || '';
    const prevModel = lastModelMessage.modelName || '';
    const prevProvider = lastModelMessage.provider || 'anthropic';

    let reason = null;
    if (prevProvider !== 'anthropic') {
        reason = 'provider';
    } else if (prevModel && normalizeModelName(prevModel) !== normalizeModelName(model)) {
        reason = 'model';
    } else if (Number.isFinite(lastModelMessage.timestamp)
        && now - lastModelMessage.timestamp > CACHE_TTL_MS[ttl]) {
        reason = 'expired';
    }
    if (!reason) return null;

    const pricing = getPricing(model, now);
    if (!pricing) return null;

    // 再書き込みなので単価はキャッシュ書き込み（cw5m / cw1h）。無いモデルは入力単価で代用
    const perMillion = (ttl === '1h' ? pricing.cw1h : pricing.cw5m) ?? pricing.in;
    const estimatedUsd = (tokens * perMillion) / 1_000_000;
    if (estimatedUsd < threshold) return null;

    // 「1時間に切り替えて送る」を選んだ場合のこの1通の額。5分TTLのときだけ意味がある
    const estimatedUsd1h = (ttl === '5m' && pricing.cw1h != null)
        ? (tokens * pricing.cw1h) / 1_000_000
        : null;

    return { reason, prevModel, model, ttl, tokens, estimatedUsd, estimatedUsd1h };
}

/**
 * 判定結果を確認ダイアログ用の文面にする。
 * @param {ReturnType<typeof assessAnthropicCacheMiss>} info
 * @returns {string}
 */
export function formatCacheMissMessage(info) {
    if (!info) return '';
    const usd = (v) => `$${v.toFixed(2)}`;
    const tokens = info.tokens.toLocaleString('en-US');

    let head;
    if (info.reason === 'provider') {
        head = `プロバイダーが変わっています（前の返事は ${info.prevModel || '別のプロバイダー'}）。`;
    } else if (info.reason === 'model') {
        head = `モデルが ${info.prevModel} から ${info.model} に変わっています。`;
    } else {
        const ttlLabel = info.ttl === '1h' ? '1時間' : '5分';
        head = `前の返事から ${ttlLabel} 以上空いたため、プロンプトキャッシュが消えています。`;
    }

    let body = `キャッシュが効かないため、この送信は約 ${usd(info.estimatedUsd)} かかります（${tokens} トークンを再書き込み）。`;
    if (info.estimatedUsd1h != null) {
        // 1時間TTLは書き込み単価が2倍（5分は1.25倍）なので、切り替えると今回も以後も高くなる。
        // それを伏せて「以後は再書き込みが起きない」だけ書くと、安くなるように読めてしまう。
        const extra = info.estimatedUsd1h - info.estimatedUsd;
        body += `\n\n「1時間キャッシュに切り替えて送信」を選ぶと:`
            + `\n・この1通は約 ${usd(info.estimatedUsd1h)}（5分のままより +${usd(extra)}）`
            + `\n・以後、返事のたびに増えるぶんの書き込みが2倍（5分は1.25倍）になります`
            + `\n・そのかわり、1時間以内なら間が空いても再書き込みは起きません`;
    }
    return `${head}\n${body}`;
}
