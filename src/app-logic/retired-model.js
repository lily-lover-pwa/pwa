// appLogic 機能モジュール: retired-model（提供終了モデルの検知と後継への案内）。
//
// 目的: モデルが提供終了しても「要約の生成に失敗しました」等で黙って詰まらず、
//       誰が使っても現行の生きたモデルへ復帰できるようにする（保守が離れても壊れにくく）。
//
// 方針:
//  - 既知の廃止（constants.js の RETIRED_MODEL_MAP に登録済み）は後継へ自動切替し、事後通知のみ。
//  - 未知の廃止は「そのプロバイダーのデフォルトモデル」を提案し、必ずユーザーに確認する
//    （勝手に別モデル＝想定外の課金へ切り替えない）。
import {
    RETIRED_MODEL_MAP,
    DEFAULT_MODEL,
    DEFAULT_OPENAI_MODEL,
    DEFAULT_ANTHROPIC_MODEL,
    DEFAULT_DEEPSEEK_MODEL,
    DEFAULT_GROQ_MODEL,
    DEFAULT_XAI_MODEL,
    DEFAULT_MISTRAL_MODEL,
    DEFAULT_ZAI_MODEL,
    DEFAULT_SAKANA_MODEL,
    DEFAULT_OPENROUTER_MODEL,
} from '../constants.js';
import { dbUtils } from '../db.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';

// プロバイダー → 現行のデフォルト（生きている）モデル。未知の廃止時の後継候補に使う。
const PROVIDER_DEFAULT_MODEL = {
    gemini: DEFAULT_MODEL,
    openai: DEFAULT_OPENAI_MODEL,
    anthropic: DEFAULT_ANTHROPIC_MODEL,
    deepseek: DEFAULT_DEEPSEEK_MODEL,
    groq: DEFAULT_GROQ_MODEL,
    xai: DEFAULT_XAI_MODEL,
    mistral: DEFAULT_MISTRAL_MODEL,
    zai: DEFAULT_ZAI_MODEL,
    sakana: DEFAULT_SAKANA_MODEL,
    openrouter: DEFAULT_OPENROUTER_MODEL,
};

// エラーメッセージが「モデルが提供終了/存在しない」ことを示すか判定する。
// 各社で文言が違うため、代表的な言い回しを広めに拾う。
export function isRetiredModelError(errorMessage) {
    if (!errorMessage) return false;
    return /no longer (available|supported)|has been (deprecated|retired|removed|sunset|decommissioned)|model[_ ]not[_ ]found|is not (a valid|found|available|supported)|does not exist|unknown model|invalid model|not a valid model|不明なモデル|存在しません|廃止/i.test(
        String(errorMessage)
    );
}

// 廃止モデルの後継候補を返す。{ model, fromMap } または null。
// - fromMap: true  … RETIRED_MODEL_MAP に定義された確実な後継（自動切替してよい）
// - fromMap: false … プロバイダーのデフォルトへのフォールバック（要ユーザー確認）
export function suggestSuccessor(deadModel, provider) {
    if (deadModel && RETIRED_MODEL_MAP[deadModel]) {
        return { model: RETIRED_MODEL_MAP[deadModel], fromMap: true };
    }
    const fallback = PROVIDER_DEFAULT_MODEL[provider];
    if (fallback && fallback !== deadModel) {
        return { model: fallback, fromMap: false };
    }
    return null;
}

// 設定値を書き換え、DB・プロファイル・UIへ反映する。
async function applyModelSwitch(settingKey, newModel) {
    state.settings[settingKey] = newModel;
    if (state.activeProfile && state.activeProfile.settings) {
        state.activeProfile.settings[settingKey] = newModel;
    }
    try {
        await dbUtils.saveSetting(settingKey, newModel);
    } catch (e) {
        console.error('[RetiredModel] 設定の保存に失敗:', e);
    }
    try {
        if (state.activeProfile) await dbUtils.updateProfile(state.activeProfile);
    } catch (e) {
        console.error('[RetiredModel] プロファイルの保存に失敗:', e);
    }
    try {
        uiUtils.applySettingsToUI();
    } catch {
        /* UI未初期化などは無視 */
    }
}

// 廃止モデルに当たったときの解決フロー。
//   deadModel : 失敗したモデルID
//   provider  : そのモデルのプロバイダー（'gemini' 等）
//   settingKey: 書き換える設定キー（'modelName' / 'summaryModelName' / 'proofreadingModelName'）
// 戻り値: 切り替え後の新モデルID（切り替えた場合）／null（候補なし・ユーザーが拒否）。
export async function resolveRetiredModel({ deadModel, provider, settingKey }) {
    const suggestion = suggestSuccessor(deadModel, provider);
    if (!suggestion) return null;

    if (!suggestion.fromMap) {
        // 未知の廃止 → 勝手に切り替えず必ず確認する。
        const ok = await uiUtils.showCustomConfirm(
            `モデル「${deadModel}」は提供終了しているようです。\n\n` +
                `代わりに「${suggestion.model}」に切り替えますか？\n` +
                `（設定のモデル選択で後からいつでも変更できます）`
        );
        if (!ok) return null;
        await applyModelSwitch(settingKey, suggestion.model);
        return suggestion.model;
    }

    // 既知の廃止 → 自動で切り替え、事後通知のみ。
    await applyModelSwitch(settingKey, suggestion.model);
    uiUtils.showCustomAlert(
        `「${deadModel}」は提供終了のため「${suggestion.model}」に自動で切り替えました。`
    );
    return suggestion.model;
}
