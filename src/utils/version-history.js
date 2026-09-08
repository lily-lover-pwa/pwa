// 更新履歴のバージョンキーを扱う純粋関数。DOM・DBには触らない。
//
// キーは '1.58' のような「メジャー.通し番号」で、小数ではない。
// そのまま数値にすると 1.9 > 1.58 になってしまうため、区切りごとに数値で比べる。

/**
 * バージョンキーを比較する。a が新しければ正、古ければ負、同じなら 0。
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
export function compareVersionKeys(a, b) {
    const pa = String(a ?? '').split('.');
    const pb = String(b ?? '').split('.');
    const len = Math.max(pa.length, pb.length);
    for (let i = 0; i < len; i++) {
        const x = Number(pa[i] ?? 0);
        const y = Number(pb[i] ?? 0);
        // 数値として読めないキーは比較しない（並びを壊さないよう同値扱い）
        if (Number.isNaN(x) || Number.isNaN(y)) return 0;
        if (x !== y) return x - y;
    }
    return 0;
}

/**
 * バージョンキーを新しい順に並べ替える（元の配列は変更しない）。
 * @param {string[]} keys
 * @returns {string[]}
 */
export function sortVersionKeysDesc(keys) {
    return [...(keys || [])].sort((a, b) => compareVersionKeys(b, a));
}

/**
 * まだ見ていない更新項目を新しい順に取り出す。
 *
 * 通知に全部載せると、久しぶりに開いた人に何十件も出てしまうので limit で絞る。
 * 隠れたぶんは hiddenCount で数えて「ほか N 件」と案内できるようにする。
 *
 * @param {object} history VERSION_HISTORY（キー: バージョン, 値: 項目の配列）
 * @param {string|null} acknowledged 前回確認したバージョンキー。未確認なら null
 * @param {number} [limit] 取り出す最大件数
 * @returns {{latest: string|null, entries: Array<{version: string, items: string[]}>, hiddenCount: number}}
 */
export function getUnseenVersions(history, acknowledged, limit = 3) {
    const keys = sortVersionKeysDesc(Object.keys(history || {}));
    const latest = keys.length > 0 ? keys[0] : null;
    // 未確認（初回）のときは全件が対象。limit で先頭だけ取る
    const unseen = acknowledged
        ? keys.filter((k) => compareVersionKeys(k, acknowledged) > 0)
        : keys;
    const shown = unseen.slice(0, Math.max(0, limit));
    return {
        latest,
        entries: shown.map((version) => ({ version, items: history[version] || [] })),
        hiddenCount: Math.max(0, unseen.length - shown.length),
    };
}

/**
 * 更新履歴の全件を新しい順に返す（設定画面の一覧用）。
 * @param {object} history VERSION_HISTORY
 * @returns {Array<{version: string, items: string[]}>}
 */
export function listAllVersions(history) {
    return sortVersionKeysDesc(Object.keys(history || {}))
        .map((version) => ({ version, items: history[version] || [] }));
}
