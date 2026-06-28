// appLogic 機能モジュール: profile（Phase 3 で app-logic.js から分割）。挙動は不変。
import { IMPORT_PREFIX, MAX_PROFILES } from '../constants.js';
import { dbUtils } from '../db.js';
import { DebugLogger } from '../debug-logger.js';
import { elements } from '../dom-elements.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';

export const profileMethods = {

    async loadGlobalSettings() {
        try {
            console.log("[GlobalSettings] 共通設定の読み込みを開始します。");
            const storedBlob = await dbUtils.getSetting('backgroundImageBlob');
            if (storedBlob && storedBlob.value instanceof Blob) {
                state.settings.backgroundImageBlob = storedBlob.value;
                console.log("[GlobalSettings] 背景画像BlobをDBから読み込みました。");
            }
            const storedFetchedModels = await dbUtils.getSetting('fetchedModels');
            if (storedFetchedModels && storedFetchedModels.value) {
                state.settings.fetchedModels = storedFetchedModels.value;
                console.log("[GlobalSettings] API取得モデルをDBから読み込みました。");
            }
        } catch (error) {
            console.error("[GlobalSettings] 共通設定の読み込み中にエラーが発生しました:", error);
            // エラーが発生しても起動処理は続行する
        }
    },


    async loadProfiles() {
        try {
            console.log("[Profile] プロファイルの読み込みを開始します。");
            state.profiles = await dbUtils.getAllProfiles();
            const activeIdSetting = await dbUtils.getSetting('activeProfileId');
            state.activeProfileId = activeIdSetting ? activeIdSetting.value : null;

            if (state.profiles.length === 0) {
                console.warn("[Profile] プロファイルが見つかりません。最初のプロファイルを作成します。");
                const newProfile = {
                    name: "デフォルトプロファイル",
                    icon: null,
                    createdAt: Date.now(),
                    settings: { ...state.settings }
                };
                const newId = await dbUtils.addProfile(newProfile);
                await dbUtils.saveSetting('activeProfileId', newId);
                state.profiles = [await dbUtils.getProfile(newId)];
                state.activeProfileId = newId;
            }

            if (!state.activeProfileId || !state.profiles.some(p => p.id === state.activeProfileId)) {
                state.activeProfileId = state.profiles[0].id;
                await dbUtils.saveSetting('activeProfileId', state.activeProfileId);
                console.log(`[Profile] アクティブなプロファイルが無効でした。最初のプロファイル (ID: ${state.activeProfileId}) をアクティブに設定しました。`);
            }
            
            console.log(`[Profile] ${state.profiles.length}件のプロファイルを読み込みました。アクティブID: ${state.activeProfileId}`);
            this.applyActiveProfile();
            uiUtils.updateProfileSwitcherUI();

        } catch (error) {
            console.error("[Profile] プロファイルの読み込み中に致命的なエラーが発生しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの読み込みに失敗しました: ${error}`);
        }
    },


    applyActiveProfile() {
        state.activeProfile = state.profiles.find(p => p.id === state.activeProfileId);
        if (state.activeProfile) {
            console.log(`[Profile] プロファイル「${state.activeProfile.name}」(ID: ${state.activeProfile.id}) を適用します。`);
            
            // 1. アプリの最新のデフォルト設定をベースにする
            const newSettings = { ...window.state.settings };

            // 2. ロードしたプロファイルの設定で上書きする
            // fetchedModels はプロファイルではなくグローバル設定として管理されるため、
            // プロファイルマージ前に退避し、マージ後に復元する
            const globalFetchedModels = newSettings.fetchedModels;
            const loadedProfileSettings = state.activeProfile.settings || {};
            Object.assign(newSettings, loadedProfileSettings);
            newSettings.fetchedModels = globalFetchedModels;

            // 3. state.settings を更新する
            state.settings = newSettings;

            uiUtils.applySettingsToUI(); 
            uiUtils.updateProfileCardUI();

            // 4. プロファイル適用後にデバッグロガーを初期化/再設定する
            DebugLogger.init();
        } else {
            console.error(`[Profile] 適用すべきアクティブなプロファイル (ID: ${state.activeProfileId}) が見つかりません。`);
        }
    },



    async switchProfile(newProfileId) {
        newProfileId = Number(newProfileId);
        if (newProfileId === state.activeProfileId) return;
        
        console.log(`[Profile] プロファイルを ID: ${newProfileId} に切り替えます。`);
        await dbUtils.saveSetting('activeProfileId', newProfileId);
        state.activeProfileId = newProfileId;
        
        // プロファイル設定の適用とUI更新のみを行う
        this.applyActiveProfile();
        uiUtils.updateProfileSwitcherUI();
    },


    async saveNewProfile() {
        if (state.profiles.length >= MAX_PROFILES) {
            return uiUtils.showCustomAlert(`プロファイルの上限数（${MAX_PROFILES}個）に達しているため、新しいプロファイルを作成できません。`);
        }
        const profileName = await uiUtils.showCustomPrompt("新しいプロファイル名を入力してください:", "新規プロファイル");
        if (!profileName || !profileName.trim()) {
            console.log("[Profile] 新規保存をキャンセルしました。");
            return;
        }

        const currentSettings = this.getCurrentUiSettings();
        const newProfile = {
            name: profileName.trim(),
            icon: state.activeProfile?.icon || null,
            createdAt: Date.now(),
            settings: currentSettings
        };

        try {
            const newId = await dbUtils.addProfile(newProfile);
            const newlyAddedProfile = await dbUtils.getProfile(newId);
            state.profiles.push(newlyAddedProfile); // stateを更新
            
            await dbUtils.saveSetting('activeProfileId', newId); // activeProfileIdを更新
            state.activeProfileId = newId;
            
            this.markAsDirtyAndSchedulePush(true);
            this.applyActiveProfile();
            uiUtils.updateProfileSwitcherUI();
            await uiUtils.showCustomAlert(`プロファイル「${newProfile.name}」を保存しました。`);
        } catch (error) {
            console.error("[Profile] 新規プロファイルの保存に失敗しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの保存に失敗しました: ${error}`);
        }
    },


    async updateCurrentProfile() {
        if (!state.activeProfile) {
            await uiUtils.showCustomAlert("更新対象のプロファイルが選択されていません。");
            return;
        }
        
        const updatedProfile = { ...state.activeProfile };

        try {
            await dbUtils.updateProfile(updatedProfile);
            // state内のプロファイルリストも更新
            const index = state.profiles.findIndex(p => p.id === updatedProfile.id);
            if (index !== -1) {
                state.profiles[index] = updatedProfile;
            }
            // activeProfile は既に更新されているので再代入は不要

            this.markAsDirtyAndSchedulePush(true);
            
            console.log(`[Profile] プロファイル「${updatedProfile.name}」を更新しました。`);
            this.applyActiveProfile(); // UIに再適用
            uiUtils.updateProfileSwitcherUI();
        } catch (error) {
            console.error("[Profile] プロファイルの更新に失敗しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの更新に失敗しました: ${error.message}`);
        }
    },

    
    async deleteCurrentProfile() {
        if (!state.activeProfile) return;
        if (state.profiles.length <= 1) {
            await uiUtils.showCustomAlert("最後のプロファイルは削除できません。");
            return;
        }

        const confirmed = await uiUtils.showCustomConfirm(`本当にプロファイル「${state.activeProfile.name}」を削除しますか？`);
        if (!confirmed) return;

        try {
            const idToDelete = state.activeProfileId;
            await dbUtils.deleteProfile(idToDelete);
            this.markAsDirtyAndSchedulePush(true);
            
            // stateからも削除
            state.profiles = state.profiles.filter(p => p.id !== idToDelete);
            // アイコンURLキャッシュも削除
            if (state.profileIconUrls.has(idToDelete)) {
                URL.revokeObjectURL(state.profileIconUrls.get(idToDelete));
                state.profileIconUrls.delete(idToDelete);
            }

            // 削除後は残っているリストの最初のプロファイルに切り替える
            const newActiveId = state.profiles[0].id;
            await dbUtils.saveSetting('activeProfileId', newActiveId);
            state.activeProfileId = newActiveId;
            
            this.applyActiveProfile();
            uiUtils.updateProfileSwitcherUI();
            await uiUtils.showCustomAlert("プロファイルを削除しました。");
        } catch (error) {
            console.error("[Profile] プロファイルの削除に失敗しました:", error);
            await uiUtils.showCustomAlert(`プロファイルの削除に失敗しました: ${error}`);
        }
    },


    async editCurrentProfileName() {
        if (!state.activeProfile) return;
        const newName = await uiUtils.showCustomPrompt("新しいプロファイル名:", state.activeProfile.name);
        if (newName && newName.trim() && newName.trim() !== state.activeProfile.name) {
            state.activeProfile.name = newName.trim();
            await this.updateCurrentProfile(); // 更新処理を共通化
        }
    },


    handleProfileIconChange(file) {
        if (!file || !file.type.startsWith('image/')) return;

        // 1. 既存のアイコンURLキャッシュがあれば破棄する
        if (state.activeProfile && state.profileIconUrls.has(state.activeProfile.id)) {
            const oldUrl = state.profileIconUrls.get(state.activeProfile.id);
            URL.revokeObjectURL(oldUrl);
            state.profileIconUrls.delete(state.activeProfile.id);
            console.log(`[Profile] 古いアイコンキャッシュを破棄しました (ID: ${state.activeProfile.id})`);
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const blob = new Blob([e.target.result], { type: file.type });
            if (state.activeProfile) {
                state.activeProfile.icon = blob;
                await this.updateCurrentProfile(); // 更新処理を共通化
            }
        };
        reader.readAsArrayBuffer(file);
    },


    async resetProfileIcon() {
        if (!state.activeProfile) return;
        const confirmed = await uiUtils.showCustomConfirm("アイコンをデフォルトに戻しますか？");
        if (confirmed) {
            state.activeProfile.icon = null;
            if (state.profileIconUrls.has(state.activeProfile.id)) {
                URL.revokeObjectURL(state.profileIconUrls.get(state.activeProfile.id));
                state.profileIconUrls.delete(state.activeProfile.id);
            }
            await this.updateCurrentProfile();
        }
    },


    getCurrentUiSettings() {
        const settings = {};
        const stringKeys = ['apiProvider', 'apiKey', 'zaiApiKey', 'openrouterApiKey', 'bedrockAccessKey', 'bedrockSecretKey', 'bedrockRegion', 'openaiApiKey', 'anthropicApiKey', 'anthropicCacheTTL', 'anthropicEffort', 'novelaiApiKey', 'novelaiModel', 'groqApiKey', 'deepseekApiKey', 'xaiApiKey', 'mistralApiKey', 'sakanaApiKey', 'modelName', 'dummyUser', 'dummyModel', 'additionalModels', 'historySortOrder', 'fontFamily', 'proofreadingModelName', 'proofreadingSystemInstruction', 'googleSearchApiKey', 'googleSearchEngineId', 'headerColor', 'thoughtTranslationModel', 'summaryModelName', 'summarySystemPrompt'];
        const numberKeys = ['temperature', 'maxTokens', 'topK', 'topP', 'thinkingBudget', 'maxRetries', 'maxBackoffDelaySeconds', 'overlayOpacity', 'messageOpacity'];
        const booleanKeys = ['enterToSend', 'darkMode', 'geminiEnableGrounding', 'geminiEnableFunctionCalling', 'enableSwipeNavigation', 'enableProofreading', 'enableAutoRetry', 'useFixedRetryDelay', 'reverseDummyOrder', 'concatDummyModel', 'dummyEnabled', 'includeThoughts', 'enableThoughtTranslation', 'applyDummyToProofread', 'applyDummyToTranslate', 'forceFunctionCalling', 'autoScroll', 'enableWideMode', 'enableSummaryButton'];
        
        settings.systemPrompt = elements.systemPromptDefaultTextarea.value.trim();
        settings.fixedRetryDelaySeconds = parseFloat(elements.fixedRetryDelayInput.value) || null;
        settings.hideSystemPromptInChat = elements.hideSystemPromptToggle.checked;
        settings.floatingPanelBehavior = elements.floatingPanelBehaviorSelect.value;
        const allowUiChangesEl = document.getElementById('allow-prompt-ui-changes');
        if (allowUiChangesEl) {
            settings.allowPromptUiChanges = allowUiChangesEl.checked;
        }

        stringKeys.forEach(key => {
            // modelNameは特別処理（OpenRouter選択時はテキスト入力から取得）
            if (key === 'modelName') {
                const provider = settings.apiProvider || state.settings.apiProvider || 'gemini';
                if (provider === 'openrouter' && elements.openrouterModelInput) {
                    settings[key] = elements.openrouterModelInput.value.trim();
                } else if (elements.modelNameSelect) {
                    settings[key] = elements.modelNameSelect.value.trim();
                }
            } else {
                const element = elements[key + 'Input'] || elements[key + 'Select'] || elements[key + 'Textarea'];
                if (element) settings[key] = element.value.trim();
            }
        });
        
        numberKeys.forEach(key => {
            let element;
            if (key === 'overlayOpacity' || key === 'messageOpacity') {
                element = elements[key + 'Slider'];
            } else {
                element = elements[key + 'Input'];
            }
            
            if (element) {
                const value = (key === 'overlayOpacity' || key === 'messageOpacity') ? parseFloat(element.value) / 100 : parseFloat(element.value);
                settings[key] = isNaN(value) ? null : value;
            }
        });

        booleanKeys.forEach(key => {
            const element = elements[key + 'Checkbox'] || elements[key + 'Toggle'];
            if (element) settings[key] = element.checked;
        });

        console.log("[Profile] 現在のUIから設定を取得しました:", settings);
        return settings;
    },


    async exportProfile() {
        if (!state.activeProfile) {
            return uiUtils.showCustomAlert("エクスポートするプロファイルが選択されていません。");
        }
        
        // stateのデータを汚染しないようにディープコピーする
        const profileToExport = JSON.parse(JSON.stringify(state.activeProfile));
        
        // アイコンBlobがあればBase64に変換して埋め込む
        if (state.activeProfile.icon instanceof Blob) {
            try {
                const base64Icon = await this.fileToBase64(state.activeProfile.icon);
                profileToExport.icon = {
                    mimeType: state.activeProfile.icon.type,
                    data: base64Icon
                };
            } catch (error) {
                console.error("アイコンのBase64変換に失敗:", error);
                return uiUtils.showCustomAlert("アイコンのエクスポート処理に失敗しました。");
            }
        }

        delete profileToExport.id;

        const jsonString = JSON.stringify(profileToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safeName = profileToExport.name.replace(/[\\/:*?"<>|]/g, '_');
        a.href = url;
        a.download = `${safeName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },


    async importProfile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                if (state.profiles.length >= MAX_PROFILES) {
                    return uiUtils.showCustomAlert(`プロファイルの上限数（${MAX_PROFILES}個）に達しているため、プロファイルをインポートできません。`);
                }
                const importedData = JSON.parse(event.target.result);

                if (!importedData.name || !importedData.settings) {
                    throw new Error("無効なファイルです。'name'と'settings'プロパティが必要です。");
                }

                let newProfile = { ...importedData };
                
                if (newProfile.icon && newProfile.icon.data) {
                    try {
                        newProfile.icon = await this.base64ToBlob(newProfile.icon.data, newProfile.icon.mimeType);
                    } catch (error) {
                        console.error("インポート時のアイコン復元に失敗:", error);
                        newProfile.icon = null;
                    }
                }

                let finalName = newProfile.name;
                const existingNames = state.profiles.map(p => p.name);
                while (existingNames.includes(finalName)) {
                    finalName = `${IMPORT_PREFIX}${finalName}`;
                }
                newProfile.name = finalName;

                const newId = await dbUtils.addProfile(newProfile);
                const newlyAddedProfile = await dbUtils.getProfile(newId);
                state.profiles.push(newlyAddedProfile);
                await dbUtils.saveSetting('activeProfileId', newId);
                state.activeProfileId = newId;

                this.markAsDirtyAndSchedulePush(true);
                this.applyActiveProfile();
                uiUtils.updateProfileSwitcherUI();
                await uiUtils.showCustomAlert(`プロファイル「${finalName}」をインポートしました。`);

            } catch (error) {
                console.error("プロファイルのインポートに失敗:", error);
                await uiUtils.showCustomAlert(`プロファイルのインポートに失敗しました: ${error.message}`);
            }
        };
        reader.readAsText(file);
    }
};
