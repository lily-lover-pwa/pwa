// Server-Sent Events (SSE) のパース。ネットワークにもDOMにも触らない純粋関数だけを置く。
//
// ストリーミング応答は TCP の都合で任意の位置に切れて届く。1チャンクの途中で
// 切れることも、1チャンクに複数イベントが入ることもあるため、受信したテキストを
// バッファに足しながら「完結したイベントだけ」を取り出す必要がある。

/**
 * 受信バッファから完結した SSE イベントを取り出す。
 *
 * イベントの区切りは空行（\n\n または \r\n\r\n）。最後の区切り以降は未完なので
 * rest として返し、次の受信ぶんと連結して再度渡すこと。
 *
 * @param {string} buffer 受信済みテキスト（前回の rest + 今回届いたぶん）
 * @returns {{ events: string[], rest: string }} events は各イベントの data 値
 */
export function parseSSEBuffer(buffer) {
    if (typeof buffer !== 'string' || buffer === '') {
        return { events: [], rest: '' };
    }

    const events = [];
    let rest = buffer;

    // 区切りは \n\n か \r\n\r\n。どちらで来るかはサーバー次第なので両方見る。
    const separator = /\r?\n\r?\n/;

    for (;;) {
        const match = separator.exec(rest);
        if (!match) break;

        const rawEvent = rest.slice(0, match.index);
        rest = rest.slice(match.index + match[0].length);

        const data = extractData(rawEvent);
        if (data !== null) events.push(data);
    }

    return { events, rest };
}

/**
 * ひとつの SSE イベントから data 値を取り出す。
 *
 * data 行が複数ある場合は改行で連結する（SSE の仕様）。':' で始まる行はコメント、
 * 'event:' や 'id:' などの他フィールドはここでは使わないので無視する。
 *
 * @param {string} rawEvent 空行で区切られたイベント1件ぶんのテキスト
 * @returns {string|null} data 値。data 行が無ければ null
 */
export function extractData(rawEvent) {
    const dataLines = [];

    for (const line of rawEvent.split(/\r?\n/)) {
        if (line === '' || line.startsWith(':')) continue;

        const colon = line.indexOf(':');
        const field = colon === -1 ? line : line.slice(0, colon);
        if (field !== 'data') continue;

        // 'data: value' の値。コロン直後の空白1個だけを落とす（仕様どおり）。
        let value = colon === -1 ? '' : line.slice(colon + 1);
        if (value.startsWith(' ')) value = value.slice(1);
        dataLines.push(value);
    }

    return dataLines.length > 0 ? dataLines.join('\n') : null;
}
