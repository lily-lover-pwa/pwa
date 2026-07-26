// 同期マージ用の純粋関数。
//
// Dropbox同期でローカルとクラウドの同じレコードがぶつかったとき、どちらを採用するかの規則。
// 「新しい方（updatedAt が大きい方）を優先」する。これを守らないと、ローカルでの変更が
// クラウドの古い内容に巻き戻る（設定が既定値に戻る等）。

/**
 * 複数のリストをキー単位でマージし、タイムスタンプが新しい方を採用する。
 *
 * 同点（どちらも updatedAt を持たない旧データ等）の場合は「先に渡したリスト」が残るため、
 * 引数の順序でタイブレークを制御できる。
 *
 * @param {Array<Array<object>>} lists - マージ対象のリスト（先に渡すほど同点時に優先）
 * @param {{key?: string, timestamp?: string}} [options]
 * @returns {object[]} マージ結果
 */
export function mergeByNewest(lists, { key = 'id', timestamp = 'updatedAt' } = {}) {
    const map = new Map();
    for (const list of lists || []) {
        for (const item of list || []) {
            if (!item) continue;
            const k = item[key];
            if (k === undefined || k === null) continue;
            const existing = map.get(k);
            if (!existing || (item[timestamp] || 0) > (existing[timestamp] || 0)) {
                map.set(k, item);
            }
        }
    }
    return Array.from(map.values());
}
