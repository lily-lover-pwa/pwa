// モデル選択の決定ロジック。DOM・DBには触らない純粋関数だけを置く。

/**
 * ドロップダウンを作り直したあとに選ぶべきモデルを決める。
 *
 * 保存済みのモデル（settings.modelName）を最優先する。
 * DOMの現在値を優先すると、ページ再読み込み直後は index.html の静的な既定値
 * （gemini-2.5-pro）が入っているため「このプロバイダーには無い」と誤判定され、
 * 保存済みのモデルが既定値で上書きされてしまう。
 *
 * @param {object} params
 * @param {string} [params.savedModel] 保存済みのモデル（settings.modelName）
 * @param {string[]} [params.availableValues] このプロバイダーで選べるモデルID
 * @param {string} [params.lastUsed] このプロバイダーで最後に選んだモデル
 * @param {string} [params.defaultModel] どれも使えないときの既定値
 * @returns {{model: string, isFallback: boolean}}
 *   isFallback が true のときだけ、保存済みの設定を書き換えてよい
 */
/**
 * 画像生成モデルかどうかを判定する。
 *
 * 以前は 'gemini-2.5-flash-image-preview'（Nano Banana）だけを名指ししていたが、
 * そのモデルは 2026-01-15 に提供終了し、後継は gemini-3.1-flash-image /
 * gemini-3-pro-image のように「-image」で終わる名前になった。名指しのままだと
 * 後継を選んでも通常のテキストモデル扱いになってしまうため、名前の形で判定する。
 *
 * @param {string} model モデルID
 * @returns {boolean}
 */
export function isImageGenerationModel(model) {
    if (typeof model !== 'string' || !model) return false;
    const m = model.toLowerCase();
    // '-image' で終わる / '-image-' を含む（例: -image-preview）
    if (/(^|-)image(-|$)/.test(m)) return true;
    return m.includes('image-generation') || m.includes('imagen');
}

/**
 * 「追加モデル」グループを選択肢の末尾へ移動する。
 *
 * index.html では #user-defined-models-group が静的に置かれているため、
 * 何もしないと標準モデルより前（＝一覧の途中）に表示されてしまう。
 * 既に select の子であっても appendChild で付け直して末尾へ送る。
 * 呼び出し側はこの直後に「API取得モデル」グループを追加するので、
 * 最終的な並びは 標準モデル → 追加モデル → API取得モデル になる。
 *
 * @param {Element} modelSelect モデル選択の select 要素
 * @param {Element} [userDefinedGroup] 追加モデルの optgroup（無ければ何もしない）
 */
export function moveUserDefinedGroupToEnd(modelSelect, userDefinedGroup) {
    if (!modelSelect || !userDefinedGroup) return;
    modelSelect.appendChild(userDefinedGroup);
}

export function resolveSelectedModel({ savedModel, availableValues, lastUsed, defaultModel } = {}) {
    const values = Array.isArray(availableValues) ? availableValues : [];
    if (savedModel && values.includes(savedModel)) {
        return { model: savedModel, isFallback: false };
    }
    // プロバイダーを切り替えた直後など、保存済みモデルが使えない場合だけ落とす
    if (lastUsed && values.includes(lastUsed)) {
        return { model: lastUsed, isFallback: true };
    }
    return { model: defaultModel, isFallback: true };
}
