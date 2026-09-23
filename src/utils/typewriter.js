// 文字送り（ストリーミング表示の間隔調整）。DOMにもタイマーにも触らない純粋関数。
//
// SSE のチャンクは数十文字がまとめて届き、次まで間が空く、という届き方をする。
// 受け取ったそばから描くと表示がガタつくので、1文字ずつ一定間隔で送り出して均す。
//
// ただし素朴に「1文字ずつ必ず待つ」と、生成より表示が遅れる。3000文字を
// 12ms/文字で送ると36秒かかり、生成が15秒で終わっていても残りは
// 「もう出来ているのに読めない」時間になる。そこで未表示の量に応じて
// 1回に送る文字数を増やし、遅れが maxLagMs を超えないようにする。

/** 表示の遅れをこの時間以内に収める（ミリ秒） */
export const DEFAULT_MAX_LAG_MS = 2000;

/**
 * 次の1回で何文字送るか、そのあと何ミリ秒待つかを決める。
 *
 * @param {object} params
 * @param {number} params.backlog 受信済みだがまだ表示していない文字数
 * @param {number} params.speedMs 1文字あたりの間隔。0以下で文字送りなし（即時表示）
 * @param {number} [params.maxLagMs] 許容する遅れ
 * @returns {{ chars: number, delayMs: number }}
 */
export function planTypewriterStep({ backlog, speedMs, maxLagMs = DEFAULT_MAX_LAG_MS }) {
    const remaining = Number.isFinite(backlog) ? Math.max(0, Math.floor(backlog)) : 0;
    if (remaining === 0) return { chars: 0, delayMs: 0 };

    const speed = Number.isFinite(speedMs) ? speedMs : 0;
    // 文字送りOFF。届いたぶんをそのまま出す（従来どおりの挙動）
    if (speed <= 0) return { chars: remaining, delayMs: 0 };

    const lag = Number.isFinite(maxLagMs) && maxLagMs > 0 ? maxLagMs : DEFAULT_MAX_LAG_MS;

    // 1文字ずつ送ると remaining * speed かかる。それが許容の遅れを超えるぶんだけ
    // まとめて送る。超えないうちは1文字ずつで滑らかに出す。
    const chars = Math.max(1, Math.ceil((remaining * speed) / lag));
    return { chars: Math.min(chars, remaining), delayMs: speed };
}
