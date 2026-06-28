// 汎用ユーティリティ関数（純粋・副作用なし）。
// app.js から抽出（Phase 1）。挙動は変更していない。

/** 指定ミリ秒待機する */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 中断可能なsleep関数
 * @param {number} ms - 待機する時間 (ミリ秒)
 * @param {AbortSignal} signal - 中断を監視するためのAbortSignal
 * @returns {Promise<void>} 待機が完了するとresolveし、中断されるとrejectするPromise
 */
export function interruptibleSleep(ms, signal) {
    return new Promise((resolve, reject) => {
        // 待機開始前にもし既に中断されていたら、即座にエラーを投げる
        if (signal.aborted) {
            const error = new Error('Sleep aborted');
            error.name = 'AbortError';
            return reject(error);
        }

        let timeoutId;

        // 中断信号を受け取った時の処理
        const onAbort = () => {
            clearTimeout(timeoutId); // タイマーをクリア
            const error = new Error('Sleep aborted');
            error.name = 'AbortError';
            reject(error); // Promiseをエラーで終了させる
        };

        // 指定時間後にPromiseを成功させるタイマーを設定
        timeoutId = setTimeout(() => {
            signal.removeEventListener('abort', onAbort); // 成功したので中断リスナーは不要
            resolve();
        }, ms);

        // 中断イベントを監視開始
        signal.addEventListener('abort', onAbort, { once: true });
    });
}

/** ファイルサイズを読みやすい形式にフォーマット */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** Base64文字列をBlobオブジェクトに変換 (Promise) */
export function base64ToBlob(base64, mimeType) {
    return fetch(`data:${mimeType};base64,${base64}`).then((res) => res.blob());
}
