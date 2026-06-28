// appLogic 機能モジュール: lifecycle（Phase 3 で app-logic.js から分割）。挙動は不変。
import { registerServiceWorker, setupBroadcastChannel, updateMessageMaxWidthVar } from '../app.js';
import { ANTHROPIC_MODELS, APP_VERSION, BEDROCK_MODELS, DEEPSEEK_MODELS, DEFAULT_ANTHROPIC_MODEL, DEFAULT_BEDROCK_MODEL, DEFAULT_DEEPSEEK_MODEL, DEFAULT_GROQ_MODEL, DEFAULT_MISTRAL_MODEL, DEFAULT_MODEL, DEFAULT_OPENAI_MODEL, DEFAULT_OPENROUTER_MODEL, DEFAULT_SAKANA_MODEL, DEFAULT_XAI_MODEL, DEFAULT_ZAI_MODEL, GEMINI_MODELS, GROQ_MODELS, IMAGE_STORE, MISTRAL_MODELS, OPENAI_MODELS, SAKANA_MODELS, SETTINGS_STORE, SWIPE_THRESHOLD, VERSION_ACK_STORAGE_KEY, VERSION_HISTORY, VERSION_LEGACY_STORAGE_KEY, VERSION_NOTICE_SESSION_KEY, XAI_MODELS, ZAI_MODELS, ZOOM_THRESHOLD } from '../constants.js';
import { dbUtils } from '../db.js';
import { DebugLogger } from '../debug-logger.js';
import { elements } from '../dom-elements.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';
import { appLogic } from '../app-logic.js';

export const lifecycleMethods = {
    _setupEventListenersCallCount: 0,


    timerManager: {
        timers: {}, // { timer_name: { timerId: 123, endTime: 167... } }
        
        start(name, minutes) {
            if (this.timers[name]) {
                clearTimeout(this.timers[name].timerId);
                console.log(`タイマー「${name}」は上書きされました。`);
            }
            
            const durationMs = minutes * 60 * 1000;
            const endTime = Date.now() + durationMs;

            const timerId = setTimeout(() => {
                console.log(`タイマー「${name}」が時間切れになりました。自動応答をトリガーします。`);
                // 実行中のタイマーリストから削除
                delete this.timers[name];
                // 自動応答をトリガー
                appLogic.triggerTimerExpiredResponse(name);
            }, durationMs);

            this.timers[name] = { timerId, endTime };
            
            const message = `タイマー「${name}」を${minutes}分で開始しました。`;
            console.log(`[Timer] ${message}`);
            return { success: true, message: message };
        },

        check(name) {
            if (!this.timers[name]) {
                return { success: false, message: `タイマー「${name}」はセットされていません。` };
            }
            const remainingMs = this.timers[name].endTime - Date.now();
            if (remainingMs <= 0) {
                return { success: true, status: "expired", message: `タイマー「${name}」は既に時間切れです。` };
            }
            const remainingMinutes = Math.floor(remainingMs / 60000);
            const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
            const message = `タイマー「${name}」の残り時間は約${remainingMinutes}分${remainingSeconds}秒です。`;
            console.log(`[Timer] ${message}`);
            return { success: true, status: "running", remaining_time: message };
        },

        stop(name) {
            if (!this.timers[name]) {
                return { success: false, message: `タイマー「${name}」はセットされていません。` };
            }
            clearTimeout(this.timers[name].timerId);
            delete this.timers[name];
            const message = `タイマー「${name}」を停止しました。`;
            console.log(`[Timer] ${message}`);
            return { success: true, message: message };
        },
    },


        /**
     * タイマー時間切れ時にAIに応答を促す関数
     * @param {string} timerName - 時間切れになったタイマーの名前
     */
    async triggerTimerExpiredResponse(timerName) {
        // 現在送信中の場合は何もしない
        if (state.isSending) {
            console.warn("タイマーが切れましたが、現在送信中のため自動応答をスキップします。");
            return;
        }
        console.log(`タイマー「${timerName}」の時間切れ応答を生成します。`);

        // ユーザーには見えない内部的な指示メッセージを作成
        const systemInstructionForTimer = `[システムメモ]
タイマー「${timerName}」が時間切れになりました。
この事実を踏まえて、現在の会話の文脈に沿った自然な応答を生成してください。
例えば、「そういえば、約束の時間だね」「時間切れだ！イベントが発生する」のように、会話を続けてください。
このシステムメモ自体は応答に含めないでください。`;

        const userMessage = { 
            role: 'user', 
            content: systemInstructionForTimer, 
            timestamp: Date.now(),
            attachments: [],
            isHidden: true,
            isAutoTrigger: true
        };

        // 履歴にこの内部メッセージを追加
        state.currentMessages.push(userMessage);
        
        // UIにもメッセージ要素を追加するが、即座に非表示にする
        const messageIndex = state.currentMessages.length - 1;
        uiUtils.appendMessage(userMessage.role, userMessage.content, messageIndex);
        const messageElement = elements.messageContainer.querySelector(`.message[data-index="${messageIndex}"]`);
        if (messageElement) {
            messageElement.style.display = 'none';
        }

        // 裏でhandleSendを呼び出す (第3引数 isAutoTrigger を true に設定)
        await this.handleSend(false, -1, true);
    },


    applyWideMode() {
        document.body.classList.toggle('wide-mode-enabled', state.settings.enableWideMode);
        // ワイドモードの有効/無効が切り替わった際に、メッセージ幅を再計算する
        updateMessageMaxWidthVar();
    },


    getVisibleMessages() {
        const visibleMessages = [];
        const processedGroupIds = new Set();

        state.currentMessages.forEach((msg) => {
            if (msg.isHidden) return; // isHiddenフラグを持つメッセージは表示しない

            if (msg.isCascaded && msg.siblingGroupId) {
                // 同じグループは一度しか処理しない
                if (!processedGroupIds.has(msg.siblingGroupId)) {
                    const siblings = state.currentMessages.filter(m => m.siblingGroupId === msg.siblingGroupId && !m.isHidden);
                    // 選択されているものを探す。なければ最後のものを採用
                    const selectedSibling = siblings.find(m => m.isSelected) || siblings[siblings.length - 1];
                    if (selectedSibling) {
                        visibleMessages.push(selectedSibling);
                    }
                    processedGroupIds.add(msg.siblingGroupId);
                }
            } else {
                // カスケードでないメッセージはそのまま追加
                visibleMessages.push(msg);
            }
        });
        return visibleMessages;
    },


    _updateApiUsageCount: async function(profileId) {
        if (!profileId) return;
    
        const profileToUpdate = state.profiles.find(p => p.id === profileId);
        if (!profileToUpdate) return;
    
        const now = new Date();
        const getPacificDate = (date) => {
            const options = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
            const formatter = new Intl.DateTimeFormat('en-CA', options);
            return formatter.format(date);
        };
        const todayPacific = getPacificDate(now);
    
        // プロファイルにapiUsageオブジェクトがなければ初期化
        if (!profileToUpdate.apiUsage || profileToUpdate.apiUsage.date !== todayPacific) {
            profileToUpdate.apiUsage = { date: todayPacific, count: 0 };
        }
    
        profileToUpdate.apiUsage.count++;
    
        try {
            // 更新されたプロファイル情報をDBに保存
            await dbUtils.updateProfile(profileToUpdate);
            console.log(`[API Count] Profile ${profileId} の使用回数を更新しました。 Count for ${todayPacific}: ${profileToUpdate.apiUsage.count}`);
            
            // UIを更新
            this.updateApiUsageUI();
            uiUtils.updateProfileSwitcherUI();
        } catch (error) {
            console.error(`[API Count] プロファイルID ${profileId} の使用回数保存に失敗:`, error);
        }
    },


    
    _checkAndResetApiUsage: async function() {
        console.log("[API Count] 全プロファイルのAPI使用回数リセットチェックを開始します...");
        
        const now = new Date();
        const getPacificDate = (date) => {
            const options = { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' };
            const formatter = new Intl.DateTimeFormat('en-CA', options);
            return formatter.format(date);
        };
        const todayPacific = getPacificDate(now);
    
        let profilesWereUpdated = false;
    
        for (const profile of state.profiles) {
            if (profile.apiUsage && profile.apiUsage.date !== todayPacific) {
                console.log(`[API Count] プロファイル「${profile.name}」(ID: ${profile.id}) の日付が古いため (${profile.apiUsage.date})、使用回数をリセットします。`);
                // apiUsageオブジェクトごと削除する
                delete profile.apiUsage;
                
                try {
                    // 更新されたプロファイルをDBに保存
                    await dbUtils.updateProfile(profile);
                    profilesWereUpdated = true;
                } catch (error) {
                    console.error(`[API Count] プロファイルID ${profile.id} のリセット保存に失敗:`, error);
                }
            }
        }
    
        if (profilesWereUpdated) {
            console.log("[API Count] 1つ以上のプロファイルが更新されたため、UIを再描画します。");
            // state.activeProfileも更新されている可能性があるので再適用
            this.applyActiveProfile(); 
            uiUtils.updateProfileSwitcherUI();
        } else {
            console.log("[API Count] リセットが必要なプロファイルはありませんでした。");
        }
    },



    updateApiUsageUI: function() {
        const profile = state.activeProfile;
        const usageContainer = document.getElementById('api-usage-container');
        const usageText = document.getElementById('api-usage-text');
        
        if (!usageContainer || !usageText || !profile) {
            if(usageContainer) usageContainer.classList.add('hidden');
            return;
        }
    
        const usage = profile.apiUsage || { count: 0 };
    
        if (state.settings.modelName === 'gemini-2.5-pro' && state.settings.apiProvider === 'gemini') {
            usageText.textContent = `gemini-2.5-pro 本日の使用回数: ${usage.count} 回 (日本時間16/17時リセット)`;
            usageContainer.classList.remove('hidden');
        } else {
            usageContainer.classList.add('hidden');
        }
    },


    // プロバイダー変更時のUI更新
    updateProviderUI(provider) {
        const isGemini = provider === 'gemini';
        const isZai = provider === 'zai';
        const isOpenRouter = provider === 'openrouter';
        const isBedrock = provider === 'bedrock';
        const isOpenAI = provider === 'openai';
        const isAnthropic = provider === 'anthropic';
        const isGroq = provider === 'groq';
        const isDeepSeek = provider === 'deepseek';
        const isXAI = provider === 'xai';
        const isMistral = provider === 'mistral';
        const isSakana = provider === 'sakana';

        // APIキー入力欄の表示/非表示
        const containers = [
            [elements.geminiApiKeyContainer, isGemini],
            [elements.zaiApiKeyContainer, isZai],
            [elements.openrouterApiKeyContainer, isOpenRouter],
            [elements.bedrockApiKeyContainer, isBedrock],
            [elements.openaiApiKeyContainer, isOpenAI],
            [elements.anthropicApiKeyContainer, isAnthropic],
            [elements.groqApiKeyContainer, isGroq],
            [elements.deepseekApiKeyContainer, isDeepSeek],
            [elements.xaiApiKeyContainer, isXAI],
            [elements.mistralApiKeyContainer, isMistral],
            [elements.sakanaApiKeyContainer, isSakana],
        ];
        containers.forEach(([el, show]) => {
            if (el) el.classList.toggle('hidden', !show);
        });

        // モデル選択UIの表示/非表示（OpenRouterはテキスト入力、その他はセレクトボックス）
        if (elements.modelNameLabel) {
            elements.modelNameLabel.classList.toggle('hidden', isOpenRouter);
        }
        if (elements.modelNameSelect) {
            elements.modelNameSelect.classList.toggle('hidden', isOpenRouter);
        }
        if (elements.openrouterModelInputContainer) {
            elements.openrouterModelInputContainer.classList.toggle('hidden', !isOpenRouter);
        }
    },


    // プロバイダーに応じたモデルリストの更新
    updateModelOptions(provider) {
        // OpenRouterの場合はテキスト入力を使用するためセレクトボックスの更新は不要
        if (provider === 'openrouter') {
            // テキストボックスに現在のモデル名を設定
            if (elements.openrouterModelInput) {
                const currentModel = state.settings.modelName || DEFAULT_OPENROUTER_MODEL;
                elements.openrouterModelInput.value = currentModel;
            }
            // モデル警告メッセージとAPI使用状況の更新
            uiUtils.updateModelWarningMessage();
            this.updateApiUsageUI();
            return;
        }
        
        const modelSelect = elements.modelNameSelect;
        if (!modelSelect) return;
        
        // 既存のオプションをクリア（ユーザー指定モデルグループを除く）
        const userDefinedGroup = elements.userDefinedModelsGroup;
        const currentValue = modelSelect.value;
        
        // すべてのoptgroupとoptionを削除（ユーザー指定グループを除く）
        const optgroups = Array.from(modelSelect.querySelectorAll('optgroup'));
        optgroups.forEach(group => {
            if (group.id !== 'user-defined-models-group') {
                group.remove();
            }
        });
        
        const options = Array.from(modelSelect.querySelectorAll('option:not([data-user-defined])'));
        options.forEach(option => option.remove());
        
        // プロバイダーに応じたモデルリストを追加
        let models;
        if (provider === 'zai') {
            models = ZAI_MODELS;
        } else if (provider === 'bedrock') {
            models = BEDROCK_MODELS;
        } else if (provider === 'openai') {
            models = OPENAI_MODELS;
        } else if (provider === 'anthropic') {
            models = ANTHROPIC_MODELS;
        } else if (provider === 'groq') {
            models = GROQ_MODELS;
        } else if (provider === 'deepseek') {
            models = DEEPSEEK_MODELS;
        } else if (provider === 'xai') {
            models = XAI_MODELS;
        } else if (provider === 'mistral') {
            models = MISTRAL_MODELS;
        } else if (provider === 'sakana') {
            models = SAKANA_MODELS;
        } else {
            models = GEMINI_MODELS;
        }
        
        const groups = {};
        
        models.forEach(model => {
            if (model.group) {
                // グループ化されたモデル
                if (!groups[model.group]) {
                    const optgroup = document.createElement('optgroup');
                    optgroup.label = model.group;
                    modelSelect.appendChild(optgroup);
                    groups[model.group] = optgroup;
                }
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label;
                groups[model.group].appendChild(option);
            } else {
                // 通常のモデル
                const option = document.createElement('option');
                option.value = model.value;
                option.textContent = model.label;
                modelSelect.appendChild(option);
            }
        });
        
        // ユーザー指定モデルグループを最後に追加
        if (userDefinedGroup && userDefinedGroup.parentNode !== modelSelect) {
            modelSelect.appendChild(userDefinedGroup);
        }

        // ユーザー指定グループを再構築（手動追加 + API取得）
        const standardValues = models.map(m => m.value);
        if (userDefinedGroup) {
            userDefinedGroup.innerHTML = '';
            userDefinedGroup.disabled = false;
            const customText = (state.settings && state.settings.customModelsText) || {};
            const fetchedModels = (state.settings && state.settings.fetchedModels) || {};

            // 手動追加モデル
            const manualIds = (customText[provider] || '').split(',').map(s => s.trim()).filter(Boolean);
            manualIds.forEach(id => {
                if (!standardValues.includes(id)) {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.textContent = id;
                    opt.dataset.provider = provider;
                    opt.dataset.userDefined = 'true';
                    userDefinedGroup.appendChild(opt);
                }
            });

            // API取得モデル（標準・手動追加と重複しないもの）
            const allExisting = new Set([...standardValues, ...manualIds]);
            const fetchedIds = (fetchedModels[provider] || []).filter(id => !allExisting.has(id));
            if (fetchedIds.length > 0) {
                const fetchedGroup = document.createElement('optgroup');
                fetchedGroup.label = 'API取得モデル';
                fetchedIds.forEach(id => {
                    const opt = document.createElement('option');
                    opt.value = id;
                    opt.textContent = id;
                    opt.dataset.provider = provider;
                    fetchedGroup.appendChild(opt);
                });
                modelSelect.appendChild(fetchedGroup);
            }
        }

        // 現在の値が新しいリストに含まれているか確認（標準・手動追加・API取得モデルすべて）
        const allAvailableValues = Array.from(modelSelect.querySelectorAll('option')).map(o => o.value);
        if (allAvailableValues.includes(currentValue)) {
            modelSelect.value = currentValue;
        } else {
            // プロバイダーごとに最後に選んだモデルを優先、なければハードコードのデフォルト
            const lastUsed = state.settings.lastModelPerProvider?.[provider];
            let defaultModel;
            if (lastUsed && allAvailableValues.includes(lastUsed)) {
                defaultModel = lastUsed;
            } else if (provider === 'zai') {
                defaultModel = DEFAULT_ZAI_MODEL;
            } else if (provider === 'openrouter') {
                defaultModel = DEFAULT_OPENROUTER_MODEL;
            } else if (provider === 'bedrock') {
                defaultModel = DEFAULT_BEDROCK_MODEL;
            } else if (provider === 'openai') {
                defaultModel = DEFAULT_OPENAI_MODEL;
            } else if (provider === 'anthropic') {
                defaultModel = DEFAULT_ANTHROPIC_MODEL;
            } else if (provider === 'groq') {
                defaultModel = DEFAULT_GROQ_MODEL;
            } else if (provider === 'deepseek') {
                defaultModel = DEFAULT_DEEPSEEK_MODEL;
            } else if (provider === 'xai') {
                defaultModel = DEFAULT_XAI_MODEL;
            } else if (provider === 'mistral') {
                defaultModel = DEFAULT_MISTRAL_MODEL;
            } else if (provider === 'sakana') {
                defaultModel = DEFAULT_SAKANA_MODEL;
            } else {
                defaultModel = DEFAULT_MODEL;
            }
            modelSelect.value = defaultModel;
            state.settings.modelName = defaultModel;
        }
        
        // モデル警告メッセージを更新
        uiUtils.updateModelWarningMessage();
        this.updateApiUsageUI();
    },


    // アプリ初期化
    async initializeApp() {
        // isSyncReloadフラグはメッセージの切り替えにのみ使用
        const isSyncReload = sessionStorage.getItem('isSyncReload') === 'true';
        // 条件分岐の外で必ずダイアログを表示する
        uiUtils.showProgressDialog(isSyncReload ? 'データベースを準備中...' : '初期化処理を開始中...');

        setupBroadcastChannel();
        let versionNoticeData = null;
    
        // --- ステップ0: バージョンアップ通知 ---
        try {
            const pendingNoticeRaw = sessionStorage.getItem(VERSION_NOTICE_SESSION_KEY);
            if (pendingNoticeRaw) {
                try {
                    versionNoticeData = JSON.parse(pendingNoticeRaw);
                    console.log(`[VersionNotice] ペンディング通知を検出しました。version=${versionNoticeData.version}`);
                } catch (parseError) {
                    console.error("[VersionNotice] ペンディング通知の解析に失敗しました。削除して再生成します。", parseError);
                    sessionStorage.removeItem(VERSION_NOTICE_SESSION_KEY);
                    versionNoticeData = null;
                }
            }

            if (!versionNoticeData) {
                const acknowledgedVersion = localStorage.getItem(VERSION_ACK_STORAGE_KEY);
                const legacyVersion = localStorage.getItem(VERSION_LEGACY_STORAGE_KEY);
                const currentVersion = APP_VERSION;
                console.log(`[VersionNotice] バージョンチェック開始。ack=${acknowledgedVersion ?? 'none'}, legacy=${legacyVersion ?? 'none'}, current=${currentVersion}`);

                const shouldShowNotice =
                    !acknowledgedVersion ||
                    acknowledgedVersion !== currentVersion ||
                    (legacyVersion && legacyVersion !== currentVersion);

                if (shouldShowNotice) {
                    const newFeatures = VERSION_HISTORY[currentVersion];
                    let message = `アプリがバージョン ${currentVersion} にアップデートされました。`;
    
                    if (newFeatures && newFeatures.length > 0) {
                        message += "\n\n主な更新内容:\n- " + newFeatures.join("\n- ");
                    }
                    versionNoticeData = {
                        version: currentVersion,
                        message,
                        shouldPersist: true
                    };
                    sessionStorage.setItem(VERSION_NOTICE_SESSION_KEY, JSON.stringify(versionNoticeData));
                    console.log(`[VersionNotice] 新しいバージョン通知を作成しました。(ack=${acknowledgedVersion ?? 'none'}, legacy=${legacyVersion ?? 'none'})`);
                } else {
                    console.log("[VersionNotice] 既に最新バージョンが確認済みのため通知をスキップします。");
                }
            }
        } catch (e) {
            console.error("バージョンチェック処理中にエラー:", e);
        }
        // --- ステップ1: 最初にDB接続を一度だけ確立する ---
        try {
            if (isSyncReload) uiUtils.updateProgressMessage('データベースを準備中...');
    
            await dbUtils.openDB();
        } catch (dbError) {
            console.error("初期化中のDBオープンに失敗:", dbError);
            const shouldReload = await uiUtils.showCustomConfirm(
                `データベースの起動に失敗しました: ${dbError.message}\n\nハードリロードを実行しますか？\n（チャット履歴などのデータは保持されます）`
            );
            if (shouldReload) {
                console.log("ユーザーがリロードを選択しました。");
                window.location.reload(true);
            } else {
                elements.appContainer.innerHTML = `<p style="padding: 20px; text-align: center; color: red;">アプリの起動に失敗しました。</p>`;
            }
            return;
        }
    
        // --- 孤児画像データのクリーンアップ処理 (一度だけ実行) ---
        try {
            const cleanupFlag = await dbUtils.getSetting('imageStoreCleanup_v1_complete');
            if (!cleanupFlag || !cleanupFlag.value) {
                console.log("[Cleanup] 孤児画像データのクリーンアップ処理を開始します...");
                
                // 1. 全チャットから有効な画像IDをすべて収集
                const allChats = await dbUtils.getAllChats();
                const activeImageIds = new Set();
                allChats.forEach(chat => {
                    (chat.messages || []).forEach(message => {
                        (message.imageIds || []).forEach(id => activeImageIds.add(id));
                    });
                });
                console.log(`[Cleanup] ${activeImageIds.size}件の有効な画像IDを検出しました。`);
    
                // 2. image_storeに存在するすべての画像IDを取得
                const allStoredImageIds = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(IMAGE_STORE);
                    const request = store.getAllKeys(); // キーのみを取得
                    request.onsuccess = () => resolve(new Set(request.result));
                    request.onerror = (e) => reject(e.target.error);
                });
                console.log(`[Cleanup] image_storeには ${allStoredImageIds.size}件の画像が存在します。`);
    
                // 3. 孤児IDを特定 (存在するIDのうち、有効でないもの)
                const orphanImageIds = [];
                allStoredImageIds.forEach(storedId => {
                    if (!activeImageIds.has(storedId)) {
                        orphanImageIds.push(storedId);
                    }
                });
    
                // 4. 孤児データを削除
                if (orphanImageIds.length > 0) {
                    console.log(`[Cleanup] ${orphanImageIds.length}件の孤児画像を削除します。`, orphanImageIds);
                    const tx = state.db.transaction(IMAGE_STORE, 'readwrite');
                    const store = tx.objectStore(IMAGE_STORE);
                    orphanImageIds.forEach(id => store.delete(id));
                    
                    await new Promise((resolve, reject) => {
                        tx.oncomplete = resolve;
                        tx.onerror = () => reject(tx.error);
                    });
                    console.log("[Cleanup] 孤児画像の削除が完了しました。");
                } else {
                    console.log("[Cleanup] 孤児画像は見つかりませんでした。");
                }
    
                // 5. 処理完了フラグを立てる
                await dbUtils.saveSetting('imageStoreCleanup_v1_complete', true);
                console.log("[Cleanup] クリーンアップ処理が正常に完了しました。");
            } else {
                console.log("[Cleanup] 孤児画像データのクリーンアップは既に完了しています。");
            }
        } catch (error) {
            console.error("[Cleanup] 孤児画像データのクリーンアップ中にエラーが発生しました:", error);
            // このエラーはアプリの起動を妨げない
        }
    
        // --- ステップ2: Dropbox OAuthコールバック処理 ---
        const handleAuthCallback = async () => {
            console.log("[SYNC_DEBUG] handleAuthCallback: 開始");
            const urlParams = new URLSearchParams(window.location.search);
            const authCode = urlParams.get('code');
    
            if (authCode) {
                const newUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
    
                uiUtils.showProgressDialog('Dropboxと連携中...');
                try {
                    const REDIRECT_URI = window.location.origin + window.location.pathname;
                    const codeVerifier = sessionStorage.getItem('dropboxCodeVerifier');
    
                    if (!codeVerifier) {
                        throw new Error("認証セッションが見つかりません。もう一度お試しください。");
                    }
    
                    await window.dropboxApi.getAccessToken(authCode, REDIRECT_URI, codeVerifier);
                    
                    console.log("Dropbox連携に成功し、トークンを保存しました。");
    
                    await this.updateDropboxUIState();
                    
                    console.log("[SYNC_DEBUG] handleAuthCallback: 初回連携のため、handlePull(true)を呼び出します。");
                    await this.handlePull(true);
    
                    console.log("[SYNC_DEBUG] handleAuthCallback: handlePullが完了しました。");
    
                } catch (error) {
                    console.error("Dropboxのトークン取得に失敗:", error);
                    uiUtils.hideProgressDialog();
                    await uiUtils.showCustomAlert(`連携に失敗しました: ${error.message}`);
                } finally {
                    sessionStorage.removeItem('dropboxCodeVerifier');
                }
            }
        };
        
        await handleAuthCallback();
    
        // --- ステップ3: メイン初期化処理 ---
        
        // ライブラリと基本設定
        if (typeof marked !== 'undefined') {
            const renderer = new marked.Renderer();
            // marked v8以降 sanitizeオプションは廃止され無視されるため、自前で無害化する。
            // 生HTML（<img onerror=...>等）をエスケープしないと、共有ログのインポートや
            // AI応答経由のXSSでIndexedDB内のAPIキーが盗まれる恐れがある。
            const escapeHtmlText = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            renderer.html = (token) => escapeHtmlText(typeof token === 'object' && token !== null ? token.text : token);
            const originalLinkRenderer = renderer.link;
            renderer.link = (href, title, text) => {
                const rawHref = (href && typeof href === 'object') ? href.href : href;
                if (typeof rawHref === 'string' && /^\s*(javascript|vbscript|data)\s*:/i.test(rawHref)) {
                    const label = (href && typeof href === 'object') ? href.text : text;
                    return escapeHtmlText(label || rawHref);
                }
                const html = originalLinkRenderer.call(renderer, href, title, text);
                return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
            };
            marked.setOptions({ renderer, breaks: true, gfm: true, smartypants: false });
        } else {
            console.error("Marked.jsライブラリが読み込まれていません！");
        }
        elements.appVersionSpan.textContent = APP_VERSION;
        window.addEventListener('beforeinstallprompt', (e) => e.preventDefault());
        
        // デバッグ用ヘルパー
        window.debug = {
            getState: () => console.log(state),
            getMemory: () => console.log(state.currentPersistentMemory),
            getChat: async (id) => console.log(await dbUtils.getChat(id || state.currentChatId))
        };
        
        // Service Worker登録
        registerServiceWorker();
        
        // Observerの初期化
        this.imageObserver = new IntersectionObserver(async (entries, observer) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const imageId = img.dataset.imageId;
                    observer.unobserve(img);
                    const imageData = await this.getImageBlobById(imageId);
                    if (imageData && imageData.blob) {
                        if (imageData.width && imageData.height) {
                            img.width = imageData.width;
                            img.height = imageData.height;
                        }
                        const objectURL = URL.createObjectURL(imageData.blob);
                        img.src = objectURL;
                        img.alt = '生成された画像';
                    } else {
                        img.alt = '画像の読み込みに失敗しました';
                        img.classList.add('load-error');
                    }
                }
            }
        }, { rootMargin: '200px' });
    
        const mutationObserver = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach(node => {
                        const imagesToRevoke = [];
                        if (node.tagName === 'IMG' && node.src.startsWith('blob:')) {
                            imagesToRevoke.push(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('img[src^="blob:"]').forEach(img => imagesToRevoke.push(img));
                        }
                        imagesToRevoke.forEach(img => {
                            console.log(`[Memory] DOMから削除された画像のURLを解放します: ${img.src}`);
                            URL.revokeObjectURL(img.src);
                        });
                    });
                }
            }
        });
        mutationObserver.observe(elements.messageContainer, { childList: true, subtree: true });
    
        try {
            // --- ステップ4: データ読み込みとUI更新 ---
            if (isSyncReload) uiUtils.updateProgressMessage('各種設定を読み込み中...');
            await this.loadGlobalSettings();
            if (isSyncReload) uiUtils.updateProgressMessage('プロファイル情報を読み込み中...');
            await this.loadProfiles();

            await this._checkAndResetApiUsage();
            this.updateApiUsageUI();
            await this.initializeSyncState();
            await this.updateDropboxUIState();
    
            const tokenData = await dbUtils.getSetting('dropboxTokens');
            let recoveryFlowExecuted = false; // リカバリーフローが実行されたかどうかのフラグ
            if (tokenData && tokenData.value) {
                const lockData = await window.dropboxApi.checkLockFile();
                if (lockData && lockData.operation) {
                    recoveryFlowExecuted = true;
                    console.warn(`[Sync Recovery] 同期ロックファイルを検出。中断された操作: ${lockData.operation}`);
                    this.updateSyncStatusUI('syncing', `中断された${lockData.operation === 'push' ? '同期' : '復元'}を再開中...`);
    
                    if (lockData.operation === 'push') {
                        // isDirtyフラグを強制的に立ててからPushを実行
                        state.sync.isDirty = true;
                        await this.handlePush(false);
                    } else if (lockData.operation === 'pull') {
                        await this.handlePull(false);
                    }
                } else if (lockData) {
                    // 旧形式のロックファイル、または内容が不正な場合
                    recoveryFlowExecuted = true;
                    console.warn("[Sync Recovery] 操作タイプ不明のロックファイルを検出。ユーザーに選択を促します。");
                    const choice = await this.showRecoveryDialog();
                    if (choice === 'pull') {
                        await this.handlePull(true);
                    } else if (choice === 'push') {
                        state.sync.isDirty = true;
                        await this.handlePush(true);
                    } else {
                        await window.dropboxApi.deleteLockFile();
                    }
                }
            }
    
            // 起動時にPull処理を実行 (OAuthコールバックがなく、リカバリーフローも実行されなかった場合)
            if (!new URLSearchParams(window.location.search).has('code') && !recoveryFlowExecuted) {
                console.log("[SYNC_DEBUG] initializeApp: 通常起動のため、handlePull(false)を呼び出します。");
                await this.handlePull(false);
            } else {
                console.log("[SYNC_DEBUG] initializeApp: OAuthコールバックまたは復旧フローが実行されたため、通常のPullはスキップします。");
            }
    
            await this.updateDropboxUIState();
    
            const profiles = await dbUtils.getAllProfiles();
            if (profiles.length === 0) {
                const oldSettingsArray = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(SETTINGS_STORE);
                    const request = store.getAll();
                    request.onsuccess = () => resolve(request.result.filter(s => s.key !== 'dropboxTokens'));
                    request.onerror = (e) => reject(e.target.error);
                });
    
                if (oldSettingsArray.length > 0) {
                    console.log("[Migration] プロファイルが存在せず、古い設定データが見つかったため移行処理を実行します。");
                    const oldSettingsObject = {};
                    oldSettingsArray.forEach(item => { oldSettingsObject[item.key] = item.value; });
                    const initialProfileSettings = { ...state.settings, ...oldSettingsObject };
                    delete initialProfileSettings.backgroundImageBlob;
                    const defaultProfile = { name: "デフォルトプロファイル", icon: null, createdAt: Date.now(), settings: initialProfileSettings };
                    const newId = await dbUtils.addProfile(defaultProfile);
                    await new Promise((resolve, reject) => {
                        const store = dbUtils._getStore(SETTINGS_STORE, 'readwrite');
                        store.clear().onsuccess = () => resolve();
                        store.transaction.onerror = () => reject(store.transaction.error);
                    });
                    await dbUtils.saveSetting('activeProfileId', newId);
                    console.log("[Migration] データ移行が完了しました。");
                    await this.loadProfiles();
                }
            }
    
            if (isSyncReload) uiUtils.updateProgressMessage('チャット履歴を読み込み中...');
    
            const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
            if (chats && chats.length > 0) {
                await this.loadChat(chats[0].id);
            } else {
                this.startNewChat();
            }
    
        } catch (error) {
            console.error("初期化中のデータ処理で失敗:", error);
            const shouldReload = await uiUtils.showCustomConfirm(
                `データの読み込みに失敗しました: ${error.message}\n\nハードリロードを実行しますか？\n（チャット履歴などのデータは保持されます）`
            );
            if (shouldReload) {
                console.log("ユーザーがリロードを選択しました。");
                window.location.reload(true);
                return; // リロード後は処理を終了
            }
        } finally {
            // --- ステップ5: 最終的なUI設定と表示 ---
            if (isSyncReload) uiUtils.updateProgressMessage('画面を描画中...');
            elements.chatScreen.style.transform = 'translateX(0)';
            elements.historyScreen.style.transform = 'translateX(-100%)';
            elements.settingsScreen.style.transform = 'translateX(100%)';
            uiUtils.showScreen('chat', true);
            history.replaceState({ screen: 'chat' }, '', '#chat');
            state.currentScreen = 'chat';
            
            updateMessageMaxWidthVar();
            this.setupEventListeners();
            this.updateZoomState();
            uiUtils.adjustTextareaHeight();
            uiUtils.setSendingState(false);
            this.updateAssetCount();
            this.toggleSummaryButtonVisibility();
            this.scrollToBottom();
            this.applyFloatingPanelBehavior();
            
            // finallyブロックで必ずダイアログを閉じる
            uiUtils.hideProgressDialog();
            sessionStorage.removeItem('isSyncReload');

            if (versionNoticeData && versionNoticeData.message) {
                try {
                    console.log(`[VersionNotice] 通知を表示します。version=${versionNoticeData.version}`);
                    await uiUtils.showCustomAlert(versionNoticeData.message);
                    console.log("[VersionNotice] 通知がユーザーによって確認されました。");
                    if (versionNoticeData.shouldPersist) {
                        localStorage.setItem(VERSION_ACK_STORAGE_KEY, versionNoticeData.version);
                        localStorage.setItem(VERSION_LEGACY_STORAGE_KEY, versionNoticeData.version);
                        console.log(`[VersionNotice] バージョン ${versionNoticeData.version} をACK/LEGACYキーに保存しました。`);
                    }
                } catch (versionAlertError) {
                    console.error("[VersionNotice] 通知の表示に失敗しました:", versionAlertError);
                } finally {
                    sessionStorage.removeItem(VERSION_NOTICE_SESSION_KEY);
                }
            }
        }
    },


    // イベントリスナーを設定
    setupEventListeners() {
        if (!this._popstateBound) {
            window.addEventListener('popstate', this.handlePopState.bind(this));
            this._popstateBound = true;
        }
    
        this._setupEventListenersCallCount++;
    
        // --- 画面遷移 ---
        elements.gotoHistoryBtn.addEventListener('click', () => uiUtils.showScreen('history'));
        elements.gotoSettingsBtn.addEventListener('click', () => uiUtils.showScreen('settings'));
        elements.backToChatFromHistoryBtn.addEventListener('click', () => uiUtils.showScreen('chat'));
        elements.backToChatFromSettingsBtn.addEventListener('click', () => uiUtils.showScreen('chat'));

        // クラウドから復元ボタン（Dropbox接続済みかつ履歴が空の場合に表示）
        const restoreFromCloudBtn = document.getElementById('restore-from-cloud-btn');
        if (restoreFromCloudBtn && !restoreFromCloudBtn._bound) {
            restoreFromCloudBtn._bound = true;
            restoreFromCloudBtn.addEventListener('click', async () => {
                restoreFromCloudBtn.disabled = true;
                restoreFromCloudBtn.textContent = '復元中...';
                try {
                    await this.forceRestoreFromCloud();
                } finally {
                    restoreFromCloudBtn.disabled = false;
                    restoreFromCloudBtn.textContent = '☁️ クラウドから復元';
                }
            });
        }
    
        // --- チャット関連 ---
        elements.newChatBtn.addEventListener('click', () => this.confirmStartNewChat());
        elements.sendButton.addEventListener('click', () => {
            if (state.isSending) {
                this.abortRequest();
            } else {
                this.handleSend();
            }
        });
        elements.userInput.addEventListener('input', () => uiUtils.adjustTextareaHeight());
        elements.userInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (!elements.sendButton.disabled) this.handleSend();
                return;
            }
            if (state.settings.enterToSend && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                if (!elements.sendButton.disabled) this.handleSend();
            }
        });
    
        // --- システムプロンプト ---
        elements.systemPromptDetails.addEventListener('toggle', (event) => {
            if (event.target.open) {
                this.startEditSystemPrompt();
            } else if (state.isEditingSystemPrompt) {
                this.cancelEditSystemPrompt();
            }
        });
        elements.saveSystemPromptBtn.addEventListener('click', () => this.saveCurrentSystemPrompt());
        elements.cancelSystemPromptBtn.addEventListener('click', () => this.cancelEditSystemPrompt());
    
        // --- プロファイルメニューの表示/非表示 ---
        elements.profileCardHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            uiUtils.toggleProfileMenu('header');
        });
        elements.profileCardHeaderSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            uiUtils.toggleProfileMenu('settings');
        });
    
        document.addEventListener('click', (e) => {
            const target = e.target;
            const isHeaderCardClicked = elements.profileCardHeader.contains(target);
            const isSettingsCardClicked = elements.profileCardHeaderSettings.contains(target);
            const isHeaderMenuClicked = elements.headerProfileMenu.contains(target);
            const isSettingsMenuClicked = elements.headerProfileMenuSettings.contains(target);
    
            if (!isHeaderCardClicked && !isSettingsCardClicked && !isHeaderMenuClicked && !isSettingsMenuClicked) {
                elements.headerProfileMenu.classList.add('hidden');
                elements.headerProfileMenuSettings.classList.add('hidden');
            }
        });
    
        // --- プロファイル編集 ---
        elements.profileEditNameBtn.addEventListener('click', () => this.editCurrentProfileName());
        elements.profileIconInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleProfileIconChange(file);
            }
            e.target.value = null;
        });
        elements.profileResetIconBtn.addEventListener('click', () => this.resetProfileIcon());
        elements.profileSaveNewBtn.addEventListener('click', () => this.saveNewProfile());
        elements.profileDeleteBtn.addEventListener('click', () => this.deleteCurrentProfile());
        elements.profileExportBtn.addEventListener('click', () => this.exportProfile());
        elements.profileImportBtn.addEventListener('click', () => elements.profileImportInput.click());
        elements.profileImportInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.importProfile(file);
            e.target.value = null;
        });

        // カウンターリセットボタンの処理
        document.getElementById('reset-api-count-btn').addEventListener('click', async () => {
            const confirmed = await uiUtils.showCustomConfirm("API使用回数のカウントを0にリセットしますか？");
            if (confirmed) {
                const profile = state.activeProfile;
                if (profile) {
                    if (profile.apiUsage) {
                        delete profile.apiUsage;
                        try {
                            await dbUtils.updateProfile(profile);
                            this.markAsDirtyAndSchedulePush('structural');
                            console.log(`[API Count] カウンターが手動でリセットされました (Profile ID: ${profile.id})`);
                            this.updateApiUsageUI();
                            uiUtils.updateProfileSwitcherUI();
                        } catch (error) {
                            console.error(`[API Count] カウンターリセットの保存に失敗:`, error);
                        }
                    }
                }
            }
        });

        // --- データ同期 (エラークリア) ---
        document.getElementById('clear-sync-error-btn').addEventListener('click', () => {
            state.sync.lastError = null;
            dbUtils.saveSetting('syncLastError', null);
            // isDirtyがtrueならdirtyに、そうでなければidleに戻す
            const newStatus = state.sync.isDirty ? 'dirty' : 'idle';
            this.updateSyncStatusUI(newStatus);
        });
    
        // --- 設定項目（即時保存） ---
        const setupInstantSave = (element, key, eventType = 'change', onUpdate = null, getValue = null) => { // getValue関数を追加
            if (element) {
                element.addEventListener(eventType, async () => {
                    if (!state.activeProfile) return;
                    let value;
                    
                    // getValue関数が提供されている場合はそれを使用
                    if (getValue) {
                        value = getValue();
                    } else {
                        switch (element.type) {
                            case 'checkbox':
                                value = element.checked;
                                break;
                            case 'range':
                                value = parseFloat(element.value) / 100;
                                break;
                            case 'number':
                            case 'select-one': {
                                const rawValue = element.value;
                                value = parseFloat(rawValue);
                                if (isNaN(value)) {
                                    // 空文字列の場合はnullに、それ以外の文字列（selectなど）はそのまま
                                    value = rawValue === '' ? null : rawValue;
                                }
                                break;
                            }
                            default:
                                value = element.value;
                                break;
                        }
                    }
                    
                    state.settings[key] = value;
                    state.activeProfile.settings[key] = value;
                    
                    await dbUtils.updateProfile(state.activeProfile);
                    appLogic.markAsDirtyAndSchedulePush('structural');
                    
                    if (onUpdate) {
                        onUpdate(value);
                    }
                });
            } else {
                console.warn(`❌ [Debug Settings] '${key}' に対応するDOM要素が見つかりません。`);
            }
        };


        
        const settingsMap = {
            apiProvider: {
                element: elements.apiProviderSelect,
                event: 'change',
                onUpdate: (value) => {
                    this.updateProviderUI(value);
                    this.updateModelOptions(value);
                }
            },
            apiKey: { element: elements.apiKeyInput, event: 'input' },
            zaiApiKey: { element: elements.zaiApiKeyInput, event: 'input' },
            openrouterApiKey: { element: elements.openrouterApiKeyInput, event: 'input' },
            bedrockAccessKey: { element: elements.bedrockAccessKeyInput, event: 'input' },
            bedrockSecretKey: { element: elements.bedrockSecretKeyInput, event: 'input' },
            bedrockRegion: { element: elements.bedrockRegionSelect, event: 'change' },
            openaiApiKey: { element: elements.openaiApiKeyInput, event: 'input' },
            anthropicApiKey: { element: elements.anthropicApiKeyInput, event: 'input' },
            anthropicCacheTTL: { element: elements.anthropicCacheTTLSelect, event: 'change', getValue: () => elements.anthropicCacheTTLSelect ? elements.anthropicCacheTTLSelect.value : '5m' },
            anthropicEffort: { element: elements.anthropicEffortSelect, event: 'change', getValue: () => elements.anthropicEffortSelect ? elements.anthropicEffortSelect.value : 'high' },
            novelaiApiKey: { element: elements.novelaiApiKeyInput, event: 'input' },
            novelaiModel: { element: elements.novelaiModelSelect, event: 'change', getValue: () => elements.novelaiModelSelect ? elements.novelaiModelSelect.value : 'nai-diffusion-4-5-curated' },
            groqApiKey: { element: elements.groqApiKeyInput, event: 'input' },
            deepseekApiKey: { element: elements.deepseekApiKeyInput, event: 'input' },
            xaiApiKey: { element: elements.xaiApiKeyInput, event: 'input' },
            mistralApiKey: { element: elements.mistralApiKeyInput, event: 'input' },
            sakanaApiKey: { element: elements.sakanaApiKeyInput, event: 'input' },
            modelName: {
                element: elements.modelNameSelect,
                event: 'change',
                onUpdate: () => {
                    uiUtils.updateModelWarningMessage();
                    this.updateApiUsageUI();
                    // ユーザー指定モデルを選択した場合、プロバイダーを自動切り替え
                    const sel = elements.modelNameSelect;
                    if (sel) {
                        const opt = sel.options[sel.selectedIndex];
                        if (opt && opt.dataset.provider && opt.dataset.provider !== state.settings.apiProvider) {
                            const newProvider = opt.dataset.provider;
                            state.settings.apiProvider = newProvider;
                            if (elements.apiProviderSelect) {
                                elements.apiProviderSelect.value = newProvider;
                                elements.apiProviderSelect.dispatchEvent(new Event('change'));
                            }
                        }
                    }
                },
                getValue: () => {
                    // OpenRouter選択時はテキスト入力から取得
                    const provider = state.settings.apiProvider || 'gemini';
                    if (provider === 'openrouter' && elements.openrouterModelInput) {
                        return elements.openrouterModelInput.value.trim();
                    }
                    return elements.modelNameSelect ? elements.modelNameSelect.value.trim() : '';
                }
            },
            systemPrompt: { element: elements.systemPromptDefaultTextarea, event: 'input' },
            temperature: { element: elements.temperatureInput, event: 'input' },
            maxTokens: { element: elements.maxTokensInput, event: 'input' },
            topK: { element: elements.topKInput, event: 'input' },
            topP: { element: elements.topPInput, event: 'input' },
            thinkingBudget: { element: elements.thinkingBudgetInput, event: 'input' },
            includeThoughts: { element: elements.includeThoughtsToggle, event: 'change' },
            enableThoughtTranslation: { element: elements.enableThoughtTranslationCheckbox, event: 'change' },
            thoughtTranslationModel: { element: elements.thoughtTranslationModelSelect, event: 'change' },
            dummyUser: { element: elements.dummyUserInput, event: 'input' },
            dummyEnabled: { element: elements.dummyEnabledToggle, event: 'change' },
            applyDummyToProofread: { element: elements.applyDummyToProofreadCheckbox, event: 'change' },
            applyDummyToTranslate: { element: elements.applyDummyToTranslateCheckbox, event: 'change' },
            dummyModel: { element: elements.dummyModelInput, event: 'input' },
            reverseDummyOrder: { element: elements.reverseDummyOrderCheckbox, event: 'change' },
            concatDummyModel: { element: elements.concatDummyModelCheckbox, event: 'change' },
            additionalModels: { element: elements.additionalModelsTextarea, event: 'input' },
            enterToSend: { element: elements.enterToSendCheckbox, event: 'change' },
            historySortOrder: { element: elements.historySortOrderSelect, event: 'change' },
            darkMode: { element: elements.darkModeToggle, event: 'change', onUpdate: () => uiUtils.applyDarkMode() },
            debugMode: { element: elements.debugModeToggle, event: 'change', onUpdate: (value) => {
                DebugLogger.init();
                this.toggleDebugLogButtonVisibility(value);
            }},
            fontFamily: { element: elements.fontFamilyInput, event: 'input', onUpdate: () => uiUtils.applyFontFamily() },
            hideSystemPromptInChat: { element: elements.hideSystemPromptToggle, event: 'change', onUpdate: () => uiUtils.toggleSystemPromptVisibility() },
            geminiEnableGrounding: { element: elements.geminiEnableGroundingToggle, event: 'change' },
            geminiEnableFunctionCalling: { element: elements.geminiEnableFunctionCallingToggle, event: 'change' },
            enableSwipeNavigation: { element: elements.swipeNavigationToggle, event: 'change' },
            enableProofreading: { element: elements.enableProofreadingCheckbox, event: 'change' },
            proofreadingModelName: { element: elements.proofreadingModelNameSelect, event: 'change' },
            proofreadingSystemInstruction: { element: elements.proofreadingSystemInstructionTextarea, event: 'input' },
            enableAutoRetry: { element: elements.enableAutoRetryCheckbox, event: 'change' },
            maxRetries: { element: elements.maxRetriesInput, event: 'input' },
            useFixedRetryDelay: { element: elements.useFixedRetryDelayCheckbox, event: 'change' },
            fixedRetryDelaySeconds: { element: elements.fixedRetryDelayInput, event: 'input' },
            maxBackoffDelaySeconds: { element: elements.maxBackoffDelayInput, event: 'input' },
            enableApiTimeout: { element: elements.enableApiTimeoutCheckbox, event: 'change' },
            apiTimeoutSeconds: { element: elements.apiTimeoutSecondsInput, event: 'input' },
            googleSearchApiKey: { element: elements.googleSearchApiKeyInput, event: 'input' },
            googleSearchEngineId: { element: elements.googleSearchEngineIdInput, event: 'input' },
            overlayOpacity: { element: elements.overlayOpacitySlider, event: 'input', onUpdate: () => uiUtils.applyOverlayOpacity() },
            messageOpacity: { element: elements.messageOpacitySlider, event: 'input', onUpdate: (value) => document.documentElement.style.setProperty('--message-bubble-opacity', String(value)) },
            headerColor: { element: elements.headerColorInput, event: 'input', onUpdate: () => uiUtils.applyHeaderColor() },
            forceFunctionCalling: { element: elements.forceFunctionCallingToggle, event: 'change' },
            autoScroll: { element: elements.autoScrollToggle, event: 'change' },
            enableWideMode: { element: elements.enableWideModeToggle, event: 'change', onUpdate: () => this.applyWideMode() },
            enableMemory: { element: elements.enableMemoryToggle, event: 'change', onUpdate: (value) => this.toggleMemoryOptions(value) },
            memoryAutoSaveInterval: { element: elements.memoryAutoSaveIntervalSelect, event: 'change' },
            headerAutoHide: { element: elements.headerAutoHideToggle, event: 'change', onUpdate: (value) => document.body.classList.toggle('header-auto-hide', value) },
            dropboxSyncFrequency: { element: elements.dropboxSyncFrequencySelect, event: 'change' },
            summaryModelName: { element: elements.summaryModelNameSelect, event: 'change' },
            summarySystemPrompt: { element: elements.summarySystemPromptTextarea, event: 'input' },
            enableSummaryButton: { element: elements.enableSummaryButtonToggle, event: 'change', onUpdate: () => this.toggleSummaryButtonVisibility() },
            floatingPanelBehavior: { element: elements.floatingPanelBehaviorSelect, event: 'change', onUpdate: () => this.applyFloatingPanelBehavior() },
            sdApiUrl: { element: elements.sdApiUrlInput, event: 'input' },
            sdApiUser: { element: elements.sdApiUserInput, event: 'input' },
            sdApiPassword: { element: elements.sdApiPasswordInput, event: 'input' },
            sdEnableQualityChecker: { 
                element: elements.sdEnableQualityCheckerCheckbox, 
                event: 'change', 
                onUpdate: (value) => {
                    elements.sdQualityCheckerOptionsDiv.classList.toggle('hidden', !value);
                } 
            },
            sdQcModel: { element: elements.sdQcModelSelect, event: 'change' },
            sdQcPrompt: { element: elements.sdQcPromptTextarea, event: 'input' },
            sdQcRetries: { element: elements.sdQcRetriesInput, event: 'input' },
            sdPromptImproveModel: { element: elements.sdPromptImproveModelSelect, event: 'change' },
            sdPromptImproveSystemPrompt: { element: elements.sdPromptImproveSystemPromptTextarea, event: 'input' }
        };
    
        for (const key in settingsMap) {
            const { element, event, onUpdate, getValue } = settingsMap[key];
            setupInstantSave(element, key, event, onUpdate, getValue);
        }

    
        // --- OpenRouterモデル名テキストボックスのイベントリスナー ---
        if (elements.openrouterModelInput) {
            elements.openrouterModelInput.addEventListener('input', async () => {
                if (!state.activeProfile) return;
                const value = elements.openrouterModelInput.value.trim();
                state.settings.modelName = value;
                state.activeProfile.settings.modelName = value;
                await dbUtils.updateProfile(state.activeProfile);
                appLogic.markAsDirtyAndSchedulePush('structural');
            });
        }
    
        // --- 追加モデルのblurイベントリスナー（モデル一覧の即時更新用） ---
        if (elements.additionalModelsTextarea) {
            elements.additionalModelsTextarea.addEventListener('blur', () => {
                uiUtils.updateUserModelOptions();
            });
        }
    
        // --- メモリ機能の個別イベントリスナー ---
        elements.memoryToggleBtn.addEventListener('click', () => this.toggleChatMemory());
        elements.manageMemoryBtn.addEventListener('click', () => this.openMemoryManagementDialog());
        elements.closeMemoryDialogBtn.addEventListener('click', () => elements.memoryManagementDialog.close());
        elements.addMemoryBtn.addEventListener('click', () => this.addMemoryItem());
        elements.deleteAllMemoryBtn.addEventListener('click', () => this.confirmDeleteAllMemory());

        elements.characterProfileBtn.addEventListener('click', () => this.openCharacterProfileDialog());
        elements.closeProfileDialogBtn.addEventListener('click', () => elements.characterProfileDialog.close());
        elements.profileBackBtn.addEventListener('click', () => {
            elements.characterProfileDialog.classList.remove('details-visible');
        });

        // スライダーの数値表示をリアルタイムで更新するリスナー
        elements.overlayOpacitySlider.addEventListener('input', (event) => {
            elements.overlayOpacityValue.textContent = `${event.target.value}%`;
        });
        elements.messageOpacitySlider.addEventListener('input', (event) => {
            elements.messageOpacityValue.textContent = `${event.target.value}%`;
        });

        // --- その他 ---
        elements.importHistoryBtn.addEventListener('click', () => elements.importHistoryInput.click());
        elements.importHistoryInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) this.handleHistoryImport(file);
            event.target.value = null;
        });
    
        elements.includeThoughtsToggle.addEventListener('change', () => {
            const isEnabled = elements.includeThoughtsToggle.checked;
            elements.thoughtTranslationOptionsDiv.classList.toggle('hidden', !isEnabled);
        });
        
        elements.enableApiTimeoutCheckbox.addEventListener('change', () => {
            uiUtils.updateApiTimeoutOptionsVisibility();
        });
        
        elements.updateAppBtn.addEventListener('click', () => this.updateApp());
        elements.clearDataBtn.addEventListener('click', () => this.confirmClearAllData());
    
        elements.enableProofreadingCheckbox.addEventListener('change', () => {
            const isEnabled = elements.enableProofreadingCheckbox.checked;
            elements.proofreadingOptionsDiv.classList.toggle('hidden', !isEnabled);
        });
    
        elements.uploadBackgroundBtn.addEventListener('click', () => elements.backgroundImageInput.click());
        elements.backgroundImageInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) this.handleBackgroundImageUpload(file);
            event.target.value = null;
        });
        elements.deleteBackgroundBtn.addEventListener('click', () => this.confirmDeleteBackgroundImage());
        
        elements.resetHeaderColorBtn.addEventListener('click', () => {
            state.settings.headerColor = '';
            elements.headerColorInput.value = state.settings.darkMode ? '#908675' : '#908675';
            const event = new Event('input', { bubbles: true });
            elements.headerColorInput.dispatchEvent(event);
        });
        
        elements.messageContainer.addEventListener('click', (event) => {
            if (event.target.tagName === 'IMG' && event.target.closest('.message-content')) {
                const modalOverlay = document.getElementById('image-modal-overlay');
                const modalImg = document.getElementById('image-modal-img');
                
                if (modalOverlay && modalImg) {
                    modalImg.src = event.target.src;
                    modalOverlay.classList.remove('hidden');
                }
            }
        });
    
        document.body.addEventListener('click', (event) => {
            if (!elements.messageContainer.contains(event.target)) {
                const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                if (currentlyShown) {
                    currentlyShown.classList.remove('show-actions');
                }
            }
        }, true); 
    
        if ('visualViewport' in window) {
            window.visualViewport.addEventListener('resize', this.updateZoomState.bind(this));
            window.visualViewport.addEventListener('scroll', this.updateZoomState.bind(this));
        } else {
            console.warn("VisualViewport API is not supported in this browser.");
        }
        
        elements.attachFileBtn.addEventListener('click', () => uiUtils.showFileUploadDialog());
    
        elements.selectFilesBtn.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.multiple = true;
            fileInput.style.display = 'none';

            fileInput.addEventListener('change', (event) => {
                this.handleFileSelection(event.target.files);
                document.body.removeChild(fileInput);
            });

            document.body.appendChild(fileInput);
            fileInput.click();
        });

        elements.confirmAttachBtn.addEventListener('click', () => this.confirmAttachment());
        elements.cancelAttachBtn.addEventListener('click', () => this.cancelAttachment());
        elements.fileUploadDialog.addEventListener('close', () => {
            if (elements.fileUploadDialog.returnValue !== 'ok') {
                this.cancelAttachment();
            }
        });
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (button && !button.disabled) {
                this.createRipple(e, button);
            }
        });
    
        const chatScreen = elements.chatScreen;
    
        chatScreen.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!state.isSending) {
                chatScreen.classList.add('drag-over');
            }
        });
    
        chatScreen.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.relatedTarget === null || !chatScreen.contains(event.relatedTarget)) {
                chatScreen.classList.remove('drag-over');
            }
        });
    
        chatScreen.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            chatScreen.classList.remove('drag-over');
    
            if (state.isSending) return;
    
            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
                console.log(`${files.length}個のファイルがドロップされました。`);
                this.handleFileSelection(files);
                uiUtils.showFileUploadDialog();
            }
        });
    
        const fileUploadDialog = elements.fileUploadDialog;
    
        fileUploadDialog.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    
        fileUploadDialog.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    
        fileUploadDialog.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
    
            if (state.isSending) return;
    
            const files = event.dataTransfer.files;
            if (files && files.length > 0) {
                console.log(`${files.length}個のファイルがダイアログにドロップされました。`);
                this.handleFileSelection(files);
                uiUtils.updateSelectedFilesUI();
            }
        });
    
        const modalOverlay = document.getElementById('image-modal-overlay');
        const modalCloseBtn = document.getElementById('image-modal-close');
        
        if (modalOverlay && modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                modalOverlay.classList.add('hidden');
            });
            
            modalOverlay.addEventListener('click', (event) => {
                if (event.target === modalOverlay) {
                    modalOverlay.classList.add('hidden');
                }
            });
        }
        elements.enableAutoRetryCheckbox.addEventListener('change', () => {
            elements.autoRetryOptionsDiv.classList.toggle('hidden', !elements.enableAutoRetryCheckbox.checked);
        });
        elements.useFixedRetryDelayCheckbox.addEventListener('change', () => {
            const useFixed = elements.useFixedRetryDelayCheckbox.checked;
            elements.fixedRetryDelayContainer.classList.toggle('hidden', !useFixed);
            elements.maxBackoffDelayContainer.classList.toggle('hidden', useFixed);
        });
    
        elements.modelNameSelect.addEventListener('change', () => {
            uiUtils.updateModelWarningMessage();
        });
        window.addEventListener('beforeunload', () => {
            const revokeUrls = (cache, name) => {
                if (cache.size > 0) {
                    console.log(`[Memory] ページ離脱のため、${cache.size}個の${name}URLを解放します。`);
                    for (const url of cache.values()) {
                        if (url.startsWith('blob:')) {
                            URL.revokeObjectURL(url);
                        }
                    }
                    cache.clear();
                }
            };
            
            revokeUrls(state.profileIconUrls, 'アイコン');
            revokeUrls(state.videoUrlCache, '動画');
            revokeUrls(state.imageUrlCache, 'チャット画像');
        });

        elements.assetExportBtn.addEventListener('click', () => this.handleAssetExport());
        elements.assetImportBtn.addEventListener('click', () => elements.assetImportInput.click());
        elements.assetImportInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) this.handleAssetImport(file);
            event.target.value = null;
        });

        elements.manageAssetsBtn.addEventListener('click', () => this.openAssetManagementDialog());
        elements.closeAssetDialogBtn.addEventListener('click', () => elements.assetManagementDialog.close());

        elements.deleteAllAssetsBtn.addEventListener('click', () => this.confirmDeleteAllAssets());

        elements.floatingPanelBehaviorSelect.addEventListener('change', () => {
            state.settings.floatingPanelBehavior = elements.floatingPanelBehaviorSelect.value;
            this.updateCurrentProfile();
            // 新しい挙動を即座に適用
            this.applyFloatingPanelBehavior();
        });

        // --- Chat Stats ---
        elements.chatStatsBtn.addEventListener('click', () => this.showChatStats());
        elements.chatStatsCloseBtn.addEventListener('click', () => elements.chatStatsDialog.close());

        // --- History Summary ---
        elements.summarizeHistoryBtn.addEventListener('click', () => this.startSummaryProcess());
        elements.summaryCancelBtn.addEventListener('click', () => elements.summaryDialog.close('cancel'));
        elements.summaryRegenerateBtn.addEventListener('click', () => this.regenerateSummary());
        elements.summaryConfirmBtn.addEventListener('click', () => this.confirmSummary());

        // --- Floating Action Panel & Scroll ---
        const mainContent = elements.chatScreen.querySelector('.main-content');

        // スクロールイベントからはパネル表示ロジックを削除し、ボタンの状態更新のみ残す
        mainContent.addEventListener('scroll', () => {
            this.updateScrollButtonsState();
        });

        // クリックイベントをトグル方式に変更
        mainContent.addEventListener('click', (event) => {
            // 設定が 'on-click' でない場合は何もしない
            if (state.settings.floatingPanelBehavior !== 'on-click') return;

            const interactiveElements = 'A, BUTTON, INPUT, TEXTAREA, SELECT, DETAILS, SUMMARY, IMG, PRE, CODE';
            // 操作可能な要素やパネル自体をクリックした場合は反応しない
            if (event.target.closest(interactiveElements) || event.target.closest('.floating-action-panel')) {
                return;
            }

            const panel = elements.floatingActionPanel;
            // パネルが表示されている場合は、タイマーを止めて非表示にする
            if (panel.classList.contains('visible')) {
                clearTimeout(state.panelFadeOutTimer);
                panel.classList.remove('visible');
            } else {
                // パネルが非表示の場合は、表示する (既存のロジックを呼び出す)
                this.showActionPanel();
            }
        });

        elements.floatingActionPanel.addEventListener('mouseenter', () => clearTimeout(state.panelFadeOutTimer));
        elements.floatingActionPanel.addEventListener('mouseleave', () => this.showActionPanel());
        
        elements.scrollToTopBtn.addEventListener('click', () => this.scrollToTop());
        elements.scrollToBottomBtn.addEventListener('click', () => this.scrollToBottom(true));
        if (elements.scrollBottomFab) {
            elements.scrollBottomFab.addEventListener('click', () => this.scrollToBottom(true));
        }

        // 入力欄にフォーカス中は「最下部へ」ボタンを隠す（入力欄への被り防止）
        if (elements.userInput) {
            elements.userInput.addEventListener('focus', () => document.body.classList.add('input-focused'));
            elements.userInput.addEventListener('blur', () => document.body.classList.remove('input-focused'));
        }

        // --- 範囲画像保存モード ---
        if (elements.rangeImageSaveBtn) {
            elements.rangeImageSaveBtn.addEventListener('click', () => this.enterRangeImageMode());
        }
        if (elements.rangeImageCancelBtn) {
            elements.rangeImageCancelBtn.addEventListener('click', () => this.exitRangeImageMode());
        }
        if (elements.rangeImageSaveConfirmBtn) {
            elements.rangeImageSaveConfirmBtn.addEventListener('click', () => this.confirmRangeImageSave());
        }
        // 選択モード中はメッセージのタップを範囲選択に使う（内部ボタンは発火させない）。
        if (elements.messageContainer) {
            elements.messageContainer.addEventListener(
                'click',
                (event) => {
                    if (!state.rangeImageSelect?.active) return;
                    const messageEl = event.target.closest?.('.message[data-index]');
                    if (!messageEl || !elements.messageContainer.contains(messageEl)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    const index = parseInt(messageEl.dataset.index, 10);
                    if (!Number.isNaN(index)) this.handleRangeMessageSelect(index);
                },
                true // capture: 内部の編集/削除ボタン等より先に処理する
            );
        }

        // --- Header Auto-Hide Event Listeners ---
        let headerHideTimer = null;

        // --- オンライン復帰時の自動同期 ---
        window.addEventListener('online', () => {
            console.log("[Network] オンライン状態に復帰しました。同期状態を確認します。");
            // isDirtyフラグがtrue、またはエラー状態の場合に同期を試みる
            if (state.sync.isDirty || state.sync.lastError) {
                console.log("[Sync] 同期が必要な変更、またはエラーが検出されたため、自動Pushを実行します。");
                this.handlePush();
            }
        });

        // --- データ同期 (OAuth) ---
        elements.dropboxAuthBtn.addEventListener('click', async () => {
            try {
                const APP_KEY = 'nb8btcpivs6ba9u';
                // 重要: このURIはDropbox App Consoleで設定したものと完全に一致させる必要があります
                const REDIRECT_URI = window.location.origin + window.location.pathname;

                const codeVerifier = appLogic._generateCodeVerifier();
                const codeChallenge = await appLogic._generateCodeChallenge(codeVerifier);

                // 次のステップでトークンを取得するためにverifierを保存
                sessionStorage.setItem('dropboxCodeVerifier', codeVerifier);

                const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&token_access_type=offline&code_challenge=${codeChallenge}&code_challenge_method=S256`;

                // Dropboxの認証ページにリダイレクト
                window.location.href = authUrl;

            } catch (error) {
                console.error("Dropbox認証の開始に失敗:", error);
                uiUtils.showCustomAlert("認証処理の開始に失敗しました。");
            }
        });

        elements.dropboxSyncBtn.addEventListener('click', async () => {
            console.log("手動同期ボタンがクリックされました。");

            if (state.sync.isSyncing) {
                uiUtils.showCustomAlert("現在、別の同期処理が実行中です。");
                return;
            }
        
            const tokenData = await dbUtils.getSetting('dropboxTokens');
            if (!tokenData || !tokenData.value) {
                // このケースはUI上起こらないはずだが、念のため
                return;
            }
            
            // --- 新しい手動同期ロジック ---
            state.sync.isSyncing = true;
            this.updateSyncStatusUI('syncing', 'クラウドの状態を確認中...');
            uiUtils.showProgressDialog('クラウドの状態を確認中...');
        
            try {
                // Step 1: クラウドのメタデータを取得
                const cloudMetadataString = await window.dropboxApi.downloadMetadata();
        
                // クラウドにデータがない場合 -> 初回Pushの可能性
                if (!cloudMetadataString) {
                    console.log("[Manual Sync] クラウドにデータがありません。Push処理を実行します。");
                    uiUtils.updateProgressMessage('初回データをクラウドに保存中...');
                    state.sync.isSyncing = false; // _doPushを呼ぶ前にリセット
                    await this._doPush(true); // isManual=trueで実行
                    return;
                }
        
                const cloudData = JSON.parse(cloudMetadataString);
                const cloudSyncId = cloudData.syncId;
                const localSyncId = state.sync.lastSyncId;
        
                console.log(`[Manual Sync] Cloud syncId: ${cloudSyncId}, Local syncId: ${localSyncId}`);
        
                // Step 2: syncIdを比較
                // syncIdが異なる -> 他のデバイスが更新した可能性 -> Pullを実行
                if (cloudSyncId !== localSyncId) {
                    console.log("[Manual Sync] syncIdが異なります。Pull処理を実行します。");
                    uiUtils.updateProgressMessage('他のブラウザのデータの変更を同期中...');
                    state.sync.isSyncing = false; // handlePullを呼ぶ前にリセット
                    await this.handlePull(true);
                    return;
                }
        
                // Step 3: syncIdが一致する場合 -> アセットの不整合やローカルの変更をチェック
                console.log("[Manual Sync] syncIdは一致しています。アセットの整合性を確認します。");
                uiUtils.updateProgressMessage('アセットの整合性を確認中...');
        
                const { localAssets } = await this._prepareExportData();
                const cloudAssetsList = await window.dropboxApi.listAssets();
                
                const localAssetCount = localAssets.size;
                const cloudAssetCount = cloudAssetsList.length;
        
                console.log(`[Manual Sync] Local asset count: ${localAssetCount}, Cloud asset count: ${cloudAssetCount}`);
        
                // アセット数が異なるか、ローカルに変更がある(isDirty)場合 -> Pushで調整
                if (localAssetCount !== cloudAssetCount || state.sync.isDirty) {
                     if (state.sync.isDirty) {
                        console.log("[Manual Sync] ローカルに変更（isDirty=true）があるため、Push処理を実行します。");
                        uiUtils.updateProgressMessage('ローカルの変更を同期中...');
                    } else {
                        console.log("[Manual Sync] アセット数が一致しないため、Push処理でクラウドの状態を調整します。");
                        uiUtils.updateProgressMessage('クラウドの状態を調整中...');
                    }
                    state.sync.isSyncing = false; // _doPushを呼ぶ前にリセット
                    await this._doPush(true);
                    return;
                }
        
                // Step 4: syncIdもアセット数も一致 -> 本当に差分なし
                console.log("[Manual Sync] syncIdとアセット数が一致しており、差分はありません。");
                this.updateSyncStatusUI('idle');
                uiUtils.hideProgressDialog();
                await uiUtils.showCustomAlert("データは既に最新の状態です。");
        
            } catch (error) {
                const errorMessage = error.message || '不明なエラーが発生しました。';
                this.updateSyncStatusUI('error', errorMessage);
                console.error("[Manual Sync] 手動同期処理中にエラーが発生しました:", error);
                uiUtils.hideProgressDialog();
                await uiUtils.showCustomAlert(`同期に失敗しました: ${errorMessage}`);
            } finally {
                state.sync.isSyncing = false;
            }
        });


        elements.syncStatusHeaderIcon.addEventListener('click', () => {
            uiUtils.showScreen('settings').then(() => {
                const syncGroup = document.getElementById('data-sync-group');
                if (syncGroup) {
                    syncGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        elements.dropboxRestoreBtn.addEventListener('click', async () => {
            const confirmed = await uiUtils.showCustomConfirm("クラウドのデータでローカルを上書きします。ローカルの変更は失われます。続けますか？");
            if (!confirmed) return;
            try {
                await appLogic.forceRestoreFromCloud();
            } catch (error) {
                console.error("クラウドから復元に失敗:", error);
                await uiUtils.showCustomAlert(`復元に失敗しました: ${error.message}`);
            }
        });

        elements.dropboxDisconnectBtn.addEventListener('click', async () => {
            const confirmed = await uiUtils.showCustomConfirm("Dropboxとの連携を解除しますか？同期されなくなります。");
            if (confirmed) {
                try {
                    await window.dropboxApi.disconnect();
                    await appLogic.updateDropboxUIState();
                    await uiUtils.showCustomAlert("連携を解除しました。");
                } catch (error) {
                    console.error("Dropbox連携解除に失敗:", error);
                    await uiUtils.showCustomAlert(`連携解除に失敗しました: ${error.message}`);
                }
            }
        });

        // --- PC (Mouse Hover) Logic ---
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            const showHeaderPC = () => {
                if (state.settings.headerAutoHide) {
                    clearTimeout(headerHideTimer);
                    document.body.classList.add('header-force-show');
                }
            };
            const hideHeaderPC = () => {
                if (state.settings.headerAutoHide) {
                    headerHideTimer = setTimeout(() => {
                        document.body.classList.remove('header-force-show');
                    }, 200);
                }
            };
            elements.headerTriggerArea.addEventListener('mouseenter', showHeaderPC);
            elements.appHeader.addEventListener('mouseenter', showHeaderPC);
            elements.headerTriggerArea.addEventListener('mouseleave', hideHeaderPC);
            elements.appHeader.addEventListener('mouseleave', hideHeaderPC);
        }

        // --- Smartphone (Touch) Logic ---
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            // メインコンテンツエリアのタップで表示をトグル ＆ 5秒タイマーを開始
            const mainContent = elements.chatScreen.querySelector('.main-content');
            mainContent.addEventListener('click', (event) => {
                if (state.settings.headerAutoHide) {
                    const interactiveElements = 'A, BUTTON, INPUT, TEXTAREA, SELECT, DETAILS, SUMMARY, IMG, PRE, CODE';
                    if (!event.target.closest(interactiveElements)) {
                        clearTimeout(headerHideTimer);
                        const body = document.body;
                        const isVisible = body.classList.contains('header-force-show');

                        if (isVisible) {
                            body.classList.remove('header-force-show');
                        } else {
                            body.classList.add('header-force-show');
                            headerHideTimer = setTimeout(() => {
                                body.classList.remove('header-force-show');
                            }, 5000); // 5秒後に自動で隠す
                        }
                    }
                }
            });

            // ヘッダーに触れている間は、自動で隠れるタイマーをキャンセルする
            elements.appHeader.addEventListener('touchstart', () => {
                if (state.settings.headerAutoHide) {
                    clearTimeout(headerHideTimer);
                }
            }, { passive: true }); // スクロール性能を阻害しないようにする
        }

        // 画面遷移時に表示状態をリセット
        const resetHeaderVisibility = () => {
            document.body.classList.remove('header-force-show');
        };
        elements.gotoHistoryBtn.addEventListener('click', resetHeaderVisibility);
        elements.gotoSettingsBtn.addEventListener('click', resetHeaderVisibility);
        elements.backToChatFromHistoryBtn.addEventListener('click', resetHeaderVisibility);
        elements.backToChatFromSettingsBtn.addEventListener('click', resetHeaderVisibility);

        // --- 古い履歴の一括削除 ---
        const deleteOldChatsBtn = document.getElementById('delete-old-chats-btn');
        if (deleteOldChatsBtn) {
            deleteOldChatsBtn.addEventListener('click', async () => {
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                const allChats = await dbUtils.getAllChats();
                const chatsToDelete = allChats.filter(chat => chat.updatedAt < sevenDaysAgo);

                if (chatsToDelete.length === 0) {
                    await uiUtils.showCustomAlert("削除対象の古いチャットはありません。");
                    return;
                }

                const confirmed = await uiUtils.showCustomConfirm(
                    `${chatsToDelete.length}件の古いチャット（7日以上更新なし）を削除しますか？\nこの操作は元に戻せません。`
                );

                if (confirmed) {
                    uiUtils.showProgressDialog('古いチャットを削除中...');
                    try {
                        for (const chat of chatsToDelete) {
                            // 現在開いているチャットは削除しない
                            if (chat.id !== state.currentChatId) {
                                await dbUtils.deleteChat(chat.id);
                            }
                        }
                        this.markAsDirtyAndSchedulePush('structural');
                        await uiUtils.showCustomAlert(`${chatsToDelete.length}件の古いチャットを削除しました。`);
                        await uiUtils.renderHistoryList(); // リストを再描画
                    } catch (error) {
                        console.error("古いチャットの一括削除エラー:", error);
                        await uiUtils.showCustomAlert(`削除中にエラーが発生しました: ${error.message}`);
                    } finally {
                        uiUtils.hideProgressDialog();
                    }
                }
            });
        }
        elements.sdTestConnectionBtn.addEventListener('click', async () => {
            const url = elements.sdApiUrlInput.value.trim().replace(/\/$/, '');
            if (!url) {
                return uiUtils.showCustomAlert("先にWebUIのURLを入力してください。");
            }
            const endpoint = `${url}/sdapi/v1/progress`;
            const headers = {};
            if (elements.sdApiUserInput.value && elements.sdApiPasswordInput.value) {
                headers['Authorization'] = 'Basic ' + btoa(`${elements.sdApiUserInput.value}:${elements.sdApiPasswordInput.value}`);
            }

            try {
                const response = await fetch(endpoint, { headers: headers });
                if (response.ok) {
                    await uiUtils.showCustomAlert("接続に成功しました！");
                } else {
                    throw new Error(`サーバーからの応答が不正です (ステータス: ${response.status})`);
                }
            } catch (error) {
                console.error("SD接続テストエラー:", error);
                await uiUtils.showCustomAlert(`接続に失敗しました。\nURL、認証情報、Forge/Reforgeの起動オプション(--listen)を確認してください。\nエラー: ${error.message}`);
            }
        });

        elements.sdEnableQualityCheckerCheckbox.addEventListener('change', (event) => {
            elements.sdQualityCheckerOptionsDiv.classList.toggle('hidden', !event.target.checked);
        });

        // タブがアクティブになった時にカウンターのリセットをチェック
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this._checkAndResetApiUsage();
            }
        });
        
        // --- デバッグログ関連 ---
        elements.debugLogBtn.addEventListener('click', () => this.openLogDialog());
        elements.closeLogDialogBtn.addEventListener('click', () => elements.debugLogDialog.close());
        elements.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        elements.copyLogsBtn.addEventListener('click', () => this.copyLogsToClipboard());
            
    },



    // popstateイベントハンドラ (戻るボタン/ジェスチャー)
    handlePopState(event) {
    const targetScreen = event.state?.screen || 'chat';
    if (targetScreen === state.currentScreen) {
      console.log(`[popstate] same screen -> ignore: ${targetScreen}`);
      return;
    }
    console.log(`popstate event fired: Navigating to screen '${targetScreen}' from history state.`);
    // showScreenを呼び出す (fromPopState = true を渡して履歴操作を抑制)
    uiUtils.showScreen(targetScreen, true);
    },


    // ズーム状態を更新
    updateZoomState() {
        if ('visualViewport' in window) {
            // スケールが閾値より大きい場合をズームとみなす
            const newZoomState = window.visualViewport.scale > ZOOM_THRESHOLD;
            if (state.isZoomed !== newZoomState) {
                state.isZoomed = newZoomState;
                console.log(`Zoom state updated: ${state.isZoomed}`);
                // ズーム状態に応じてbodyにクラスを追加/削除
                document.body.classList.toggle('zoomed', state.isZoomed);
            }
        }
    },



    // --- スワイプ処理 (ズーム対応) ---
    handleTouchStart(event) {
        if (!state.settings.enableSwipeNavigation) return;
        
        // マルチタッチ(ピンチ操作など)やズーム中はスワイプ開始点を記録しない
        if (event.touches.length > 1 || state.isZoomed) {
            state.touchStartX = 0; // 開始点をリセットしてスワイプ判定を無効化
            state.touchStartY = 0;
            state.isSwiping = false;
            return;
        }
        state.touchStartX = event.touches[0].clientX;
        state.touchStartY = event.touches[0].clientY;
        state.isSwiping = false; // スワイプ開始時はフラグをリセット
        state.touchEndX = state.touchStartX; // touchendで使えるように初期化
        state.touchEndY = state.touchStartY;
    },


    handleTouchMove(event) {
        if (!state.settings.enableSwipeNavigation) return;
        
        // 開始点がない、マルチタッチ、ズーム中は処理しない
        if (!state.touchStartX || event.touches.length > 1 || state.isZoomed) {
            return;
        }

        const currentX = event.touches[0].clientX;
        const currentY = event.touches[0].clientY;
        const diffX = state.touchStartX - currentX;
        const diffY = state.touchStartY - currentY;

        // 横方向の移動が縦方向より大きい場合にスワイプと判定
        // isSwipingフラグを立てるのは閾値を超えたときではなく、横移動が優位な場合
        if (Math.abs(diffX) > Math.abs(diffY)) {
            state.isSwiping = true;
            // 横スワイプ(画面遷移の可能性)中はデフォルトの縦スクロールを抑制
            // これにより、意図しない縦スクロールと画面遷移の競合を防ぐ
            event.preventDefault();
        } else {
            // 縦方向の移動が大きい場合はスワイプフラグを解除
            state.isSwiping = false;
        }
        // 現在位置を記録 (touchendで使うため)
        state.touchEndX = currentX;
        state.touchEndY = currentY;
    },


    handleTouchEnd(event) {
         if (!state.settings.enableSwipeNavigation) {
             this.resetSwipeState(); // 状態はリセットしておく
             return;
         }

         // ズーム状態を最終確認 (touchendまでに変わる可能性もあるため)
         this.updateZoomState();
         if (state.isZoomed) {
             console.log("Zoomed state detected on touchend, skipping swipe navigation.");
             this.resetSwipeState();
             return;
         }

         // スワイプ中でない、または開始点がない場合はリセットして終了
         if (!state.isSwiping || !state.touchStartX) {
             this.resetSwipeState();
             return;
         }

        const diffX = state.touchStartX - state.touchEndX;
        const diffY = state.touchStartY - state.touchEndY; // 縦移動量も一応計算

        // スワイプ距離が閾値を超えているか、かつ横移動が縦移動より大きいか
        if (Math.abs(diffX) > SWIPE_THRESHOLD && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) { // 左スワイプ (右から左へ) -> 設定画面へ
                console.log("左スワイプ検出 -> 設定画面へ");
                uiUtils.showScreen('settings'); // showScreenが履歴操作を行う
            } else { // 右スワイプ (左から右へ) -> 履歴画面へ
                console.log("右スワイプ検出 -> 履歴画面へ");
            }
        } else {
            // 閾値未満または縦移動が大きい場合は何もしない
            console.log("スワイプ距離不足 or 縦移動大");
        }

        this.resetSwipeState(); // スワイプ状態をリセット
    },


    resetSwipeState() {
        state.touchStartX = 0;
        state.touchStartY = 0;
        state.touchEndX = 0;
        state.touchEndY = 0;
        state.isSwiping = false;
    },

     // -------------------------------

    // アプリを更新 (キャッシュクリア)
    async updateApp() {
        if (!('serviceWorker' in navigator)) {
            const doReload = await uiUtils.showCustomConfirm("お使いのブラウザはService Workerをサポートしていません。\nページを強制リロードして最新版を取得しますか？");
            if (doReload) window.location.reload(true);
            return;
        }

        const confirmed = await uiUtils.showCustomConfirm("アプリのキャッシュをクリアして最新版を再取得しますか？ (ページがリロードされます)");
        if (!confirmed) return;

        try {
            // 全キャッシュを削除
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));

            // Service Worker を完全に登録解除（次回アクセス時に最新sw.jsを取得させる）
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map(r => r.unregister()));

            window.location.reload(true);
        } catch (error) {
            console.error("Service Workerの処理中にエラー:", error);
            window.location.reload(true);
        }
    },


    // 全データ削除の確認と実行
    async confirmClearAllData() {
        const confirmed = await uiUtils.showCustomConfirm("本当にすべてのデータ（チャット履歴、プロファイル、アセット、設定）を削除しますか？この操作は元に戻せません。");
        if (confirmed) {
            try {
                uiUtils.revokeExistingObjectUrl();
                await dbUtils.clearAllData();
                await uiUtils.showCustomAlert("すべてのデータが削除されました。アプリをリセットします。");

                // ページをリロードして、完全にクリーンな状態で再起動するのが最も確実
                window.location.reload();

            } catch (error) {
                await uiUtils.showCustomAlert(`データ削除中にエラーが発生しました: ${error}`);
            }
        }
    },


    createRipple(event, button) {
        // 既存のrippleを削除
        const existingRipple = button.querySelector(".ripple");
        if(existingRipple) {
            existingRipple.remove();
        }

        const circle = document.createElement("span");
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        
        const rect = button.getBoundingClientRect();
        circle.style.left = `${event.clientX - rect.left - radius}px`;
        circle.style.top = `${event.clientY - rect.top - radius}px`;
        circle.classList.add("ripple");

        button.appendChild(circle);

        // アニメーション終了後に要素を削除
        setTimeout(() => {
            if (circle.parentElement) {
                circle.remove();
            }
        }, 600); // animation-durationと合わせる
    },


    // --- Function Calling用ヘルパー ---
    async updateOpacitySettings(opacitySettings) {
        let settingsChanged = false;
        const changedItems = [];

        if (typeof opacitySettings.overlay === 'number' && opacitySettings.overlay >= 0 && opacitySettings.overlay <= 1) {
            state.settings.overlayOpacity = opacitySettings.overlay;
            await dbUtils.saveSetting('overlayOpacity', state.settings.overlayOpacity);
            document.documentElement.style.setProperty('--overlay-opacity-value', state.settings.overlayOpacity);
            changedItems.push(`オーバーレイの濃さを${Math.round(opacitySettings.overlay * 100)}%に`);
            settingsChanged = true;
        }
        if (typeof opacitySettings.message_bubble === 'number' && opacitySettings.message_bubble >= 0.1 && opacitySettings.message_bubble <= 1) {
            state.settings.messageOpacity = opacitySettings.message_bubble;
            await dbUtils.saveSetting('messageOpacity', state.settings.messageOpacity);
            changedItems.push(`メッセージバブルの濃さを${Math.round(opacitySettings.message_bubble * 100)}%に`);
            settingsChanged = true;
        }

        if (settingsChanged) {
            uiUtils.applySettingsToUI();
            const message = `${changedItems.join('、')}変更しました。`;
            return { success: true, message: message };
        } else {
            return { success: false, message: "有効な値が指定されなかったため、UIは変更されませんでした。" };
        }
    },


    applyFloatingPanelBehavior() {
        const behavior = state.settings.floatingPanelBehavior;
        const panel = elements.floatingActionPanel;

        // 既存のタイマーがあればクリア
        clearTimeout(state.panelFadeOutTimer);

        if (behavior === 'always') {
            panel.classList.add('visible');
        } else if (behavior === 'hidden') {
            panel.classList.remove('visible');
        } else { // 'on-click'
            // on-clickの場合は、最初は非表示にしておく
            panel.classList.remove('visible');
        }
    },


    showActionPanel() {
        const behavior = state.settings.floatingPanelBehavior;
        const panel = elements.floatingActionPanel;

        // 'always' または 'hidden' の場合は何もしない
        if (behavior === 'always' || behavior === 'hidden') {
            return;
        }

        // 'on-click' の場合の挙動
        clearTimeout(state.panelFadeOutTimer);
        panel.classList.add('visible');
        state.panelFadeOutTimer = setTimeout(() => {
            panel.classList.remove('visible');
        }, 5000); // 5秒後にフェードアウト
    },


    updateScrollButtonsState() {
        const mainContent = elements.chatScreen.querySelector('.main-content');
        if (!mainContent) return;

        const isAtTop = mainContent.scrollTop < 50;
        const isAtBottom = mainContent.scrollHeight - mainContent.scrollTop - mainContent.clientHeight < 50;

        elements.scrollToTopBtn.disabled = isAtTop;
        elements.scrollToBottomBtn.disabled = isAtBottom;

        // 右下FAB: 最下部にいるときは非表示
        if (elements.scrollBottomFab) {
            elements.scrollBottomFab.classList.toggle('hidden', isAtBottom);
        }
    },


    scrollToTop() {
        const mainContent = elements.chatScreen.querySelector('.main-content');
        if (!mainContent) return;

        const startY = mainContent.scrollTop;
        const endY = 0;
        const distance = endY - startY;
        const duration = 300; // 300ミリ秒で完了
        let startTime = null;

        if (distance === 0) return;

        const step = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / duration, 1);
            // easeOutCubic イージング関数で滑らかな動きに
            const easedT = 1 - Math.pow(1 - t, 3);

            mainContent.scrollTop = startY + (distance * easedT);

            if (elapsed < duration) {
                requestAnimationFrame(step);
            } else {
                // アニメーション終了後、確実に最終位置に設定
                mainContent.scrollTop = endY;
            }
        };

        requestAnimationFrame(step);
    },




    scrollToBottom(force = false) {
        const mainContent = elements.chatScreen.querySelector('.main-content');
        if (!mainContent) return;

        if (!state.settings.autoScroll && !force) {
            return;
        }

        const startY = mainContent.scrollTop;
        const duration = 300; // 300ミリ秒で完了
        let startTime = null;

        const step = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const elapsed = currentTime - startTime;
            
            // アニメーションの各フレームでscrollHeightを再取得
            const endY = mainContent.scrollHeight - mainContent.clientHeight;
            const distance = endY - startY;

            const t = Math.min(elapsed / duration, 1);
            const easedT = 1 - Math.pow(1 - t, 3);

            mainContent.scrollTop = startY + (distance * easedT);

            if (elapsed < duration) {
                requestAnimationFrame(step);
            } else {
                // アニメーション終了後、その時点での最新のscrollHeightを使って確実に最下部に設定
                mainContent.scrollTop = mainContent.scrollHeight;
            }
        };

        requestAnimationFrame(step);
    },


        // --- デバッグログUI関連 ---
        toggleDebugLogButtonVisibility(isEnabled) {
            elements.debugLogBtn.classList.toggle('hidden', !isEnabled);
        },

    
        openLogDialog() {
            this.renderLogDialogContent();
            elements.debugLogDialog.showModal();
        },

    
        renderLogDialogContent() {
            const logs = DebugLogger.getLogs();
            const container = elements.logContainer;
            const fragment = document.createDocumentFragment();
            const LOG_TRUNCATE_THRESHOLD = 200; // 省略を開始する文字数
    
            if (logs.length === 0) {
                container.innerHTML = '<div class="log-entry">ログはありません。</div>';
                return;
            }
    
            logs.forEach(log => {
                const entryDiv = document.createElement('div');
                entryDiv.classList.add('log-entry', `log-type-${log.type}`);
    
                const timestampSpan = document.createElement('span');
                timestampSpan.className = 'log-timestamp';
                timestampSpan.textContent = log.timestamp.toLocaleTimeString('ja-JP', { hour12: false });
    
                const typeSpan = document.createElement('span');
                typeSpan.className = 'log-type';
                typeSpan.textContent = `[${log.type}]`;
                
                entryDiv.appendChild(timestampSpan);
                entryDiv.appendChild(typeSpan);
    
                const messageText = log.args.join(' ');
    
                if (messageText.length > LOG_TRUNCATE_THRESHOLD) {
                    entryDiv.classList.add('collapsible');
    
                    const summarySpan = document.createElement('span');
                    summarySpan.className = 'log-summary';
                    summarySpan.textContent = messageText.substring(0, LOG_TRUNCATE_THRESHOLD) + '... (クリックして展開)';
                    
                    const fullSpan = document.createElement('span');
                    fullSpan.className = 'log-full hidden';
                    fullSpan.textContent = messageText;
    
                    entryDiv.appendChild(summarySpan);
                    entryDiv.appendChild(fullSpan);
    
                    entryDiv.addEventListener('click', () => {
                        summarySpan.classList.toggle('hidden');
                        fullSpan.classList.toggle('hidden');
                    });
    
                } else {
                    const messageNode = document.createTextNode(messageText);
                    entryDiv.appendChild(messageNode);
                }
                
                fragment.appendChild(entryDiv);
            });
            
            container.innerHTML = ''; // 一旦クリア
            container.appendChild(fragment);
            // ダイアログを開いたときに最下部にスクロール
            container.scrollTop = container.scrollHeight;
        },

    
    
        clearLogs() {
            DebugLogger.clearLogs();
            this.renderLogDialogContent(); // UIを更新
        },

    
        async copyLogsToClipboard() {
            const logs = DebugLogger.getLogs();
            if (logs.length === 0) {
                await uiUtils.showCustomAlert("コピーするログがありません。");
                return;
            }
            const textToCopy = logs.map(log => {
                const time = log.timestamp.toISOString();
                const message = log.args.join(' ');
                return `${time} [${log.type}] ${message}`;
            }).join('\n');
    
            try {
                await navigator.clipboard.writeText(textToCopy);
                await uiUtils.showCustomAlert("ログをクリップボードにコピーしました。");
            } catch (err) {
                console.error('クリップボードへのコピーに失敗:', err);
                await uiUtils.showCustomAlert("クリップボードへのコピーに失敗しました。");
            }
        }
};
