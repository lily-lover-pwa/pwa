// appLogic 機能モジュール: sync（Phase 3 で app-logic.js から分割）。挙動は不変。
import { broadcastChannel } from '../app.js';
import { CHATS_STORE, SETTINGS_STORE } from '../constants.js';
import { dbUtils } from '../db.js';
import { elements } from '../dom-elements.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';

export const syncMethods = {

    
    // 復旧ダイアログを表示するヘルパー関数
    async showRecoveryDialog() {
        const pullConfirm = await uiUtils.showCustomConfirm(
            "【同期エラーの復旧】\n\n" +
            "前回の同期が正常に完了しなかったようです。\n\n" +
            "クラウドのデータで現在のブラウザのデータを上書き復元しますか？ (推奨)\n\n" +
            "※「キャンセル」を押すと、ローカルのデータでクラウドを上書きする選択肢が表示されます。"
        );
        if (pullConfirm) {
            return 'pull';
        }

        const pushConfirm = await uiUtils.showCustomConfirm(
            "【同期エラーの復旧】\n\n" +
            "現在のブラウザのデータで、クラウド上のデータを強制的に上書きしますか？\n\n" +
            "※ 他のデバイスで行った変更が失われる可能性があります。"
        );
        if (pushConfirm) {
            return 'push';
        }

        return 'cancel';
    },


    /**
     * 同期関連の初期化処理
     */
    async initializeSyncState() {
        const [lastSyncIdSetting, isDirtySetting, lastErrorSetting] = await Promise.all([
            dbUtils.getSetting('lastSyncId'),
            dbUtils.getSetting('syncIsDirty'),
            dbUtils.getSetting('syncLastError')
        ]);

        state.sync.lastSyncId = lastSyncIdSetting ? lastSyncIdSetting.value : null;
        state.sync.isDirty = isDirtySetting ? isDirtySetting.value : false;
        state.sync.lastError = lastErrorSetting ? lastErrorSetting.value : null;
        
        console.log(`[Sync] 同期状態を初期化しました。lastSyncId: ${state.sync.lastSyncId}, isDirty: ${state.sync.isDirty}, lastError:`, state.sync.lastError);
    },


    /**
     * ローカルデータに変更があったことを記録し、設定に応じてPush処理をスケジュールする
     * @param {boolean} [forcePush=false] - trueの場合、同期頻度の設定を無視して即時Pushを実行する
     */
    markAsDirtyAndSchedulePush(type = 'message') {
        const timestamp = new Date().toLocaleTimeString();
        const normalizedType = type === true ? 'structural' : type;

        console.log(`[SYNC_DEBUG ${timestamp}] markAsDirtyAndSchedulePush called. type=${normalizedType}, isSending=${state.isSending}, isSyncing=${state.sync.isSyncing}, isDirty=${state.sync.isDirty}`);

        const tokenDataPromise = dbUtils.getSetting('dropboxTokens');
        if (!tokenDataPromise) {
            console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: Dropbox not connected.`);
            return;
        }

        if (state.sync.isSyncing) {
            console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: Already syncing.`);
            return;
        }

        if (!state.sync.isDirty) {
            state.sync.isDirty = true;
            dbUtils.saveSetting('syncIsDirty', true);
            console.log(`[SYNC_DEBUG ${timestamp}] -> State set to DIRTY.`);
        }
        this.updateSyncStatusUI('dirty');

        if (normalizedType === 'message' && state.isSending) {
            console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: AI is responding (isSending=true).`);
            return;
        }

        const frequency = state.settings.dropboxSyncFrequency;

        if (frequency === 'manual') {
            if (normalizedType === 'message') {
                console.log(`[SYNC_DEBUG ${timestamp}] -> SKIPPED: Manual sync mode for message update.`);
                return;
            }
            console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Structural change detected in manual sync mode. Forcing push.`);
            this.handlePush();
            return;
        }

        // 構造的な変更は常に即時Push
        if (normalizedType !== 'message') {
            console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Non-message change detected. Triggering push immediately.`);
            this.handlePush();
            return;
        }

        // メッセージターンの完了をカウント
        state.syncMessageCounter++;
        console.log(`[SYNC_DEBUG ${timestamp}] Message counter incremented to: ${state.syncMessageCounter}`);

        // 既存の予約があればクリア
        if (state.sync.pushTimeoutId) {
            clearTimeout(state.sync.pushTimeoutId);
            state.sync.pushTimeoutId = null;
        }

        if (frequency === 'instant') {
            console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Instant mode, pushing immediately.`);
            this.handlePush();
            state.syncMessageCounter = 0;
            return;
        }

        const threshold = parseInt(frequency, 10);
        if (!isNaN(threshold)) {
            if (state.syncMessageCounter >= threshold) {
                console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Threshold (${threshold}) reached. Triggering push immediately.`);
                this.handlePush();
                state.syncMessageCounter = 0;
            } else {
                console.log(`[SYNC_DEBUG ${timestamp}] -> WAITING: Threshold (${threshold}) not reached yet.`);
            }
            return;
        }

        // その他の設定値の場合は安全のため即時実行
        console.log(`[SYNC_DEBUG ${timestamp}] -> EXECUTING: Unrecognized frequency '${frequency}'. Triggering push as fallback.`);
        this.handlePush();
        state.syncMessageCounter = 0;
    },




    /**
     * 同期競合時の3択ダイアログ（マージ / クラウドで上書き / キャンセル）
     * @private
     */
    _showSyncConflictDialog(isDirty) {
        return new Promise(resolve => {
            const dialog = document.createElement('dialog');
            dialog.style.cssText = 'padding:20px;max-width:420px;width:90%;border-radius:12px;border:1px solid var(--border-primary);background:var(--bg-secondary);color:var(--text-primary);font-family:inherit;';
            const subMsg = isDirty ? 'このデバイスには未同期の変更があります。' : 'このデバイスにもローカルのデータが存在します。';
            dialog.innerHTML = `
                <div style="font-weight:bold;margin-bottom:10px;font-size:1.05em;">【データの競合】</div>
                <p style="font-size:0.9em;margin-bottom:16px;line-height:1.6;">クラウドに別のデバイスで更新されたデータがあります。<br>${subMsg}</p>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <button data-result="merge" style="padding:10px 14px;background:#2196a8;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.9em;text-align:left;line-height:1.5;">
                        両方残す（推奨）<br><span style="font-size:0.8em;opacity:0.85;">両デバイスのチャット・プロジェクトをまとめる</span>
                    </button>
                    <button data-result="overwrite" style="padding:10px 14px;background:#c62828;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.9em;text-align:left;line-height:1.5;">
                        クラウドに合わせる<br><span style="font-size:0.8em;opacity:0.85;">⚠️ このブラウザのログは全て消えます</span>
                    </button>
                    <button data-result="cancel" style="padding:10px 14px;background:transparent;color:var(--text-primary);border:1px solid var(--border-primary);border-radius:8px;cursor:pointer;font-size:0.9em;">キャンセル</button>
                </div>`;
            document.body.appendChild(dialog);
            dialog.showModal();
            const cleanup = (result) => { dialog.close(); document.body.removeChild(dialog); resolve(result); };
            dialog.addEventListener('click', e => { const btn = e.target.closest('[data-result]'); if (btn) cleanup(btn.dataset.result); });
            dialog.addEventListener('cancel', () => cleanup('cancel'));
        });
    },


    /**
     * ローカルとクラウドのデータをマージしてインポートし、マージ結果をCloudにPushする
     * @private
     */
    async _mergeAndSyncWithCloud(cloudMetadataString, isManual) {
        const cloudParsed = JSON.parse(cloudMetadataString);
        if (cloudParsed.version !== "2.0" || !cloudParsed.data) throw new Error("クラウドデータの形式が無効です。");
        const cloudData = cloudParsed.data;

        if (isManual) uiUtils.showProgressDialog('ローカルデータを収集中...');
        const { metadataJson } = await this._prepareExportData();
        const localData = JSON.parse(metadataJson).data;

        if (isManual) uiUtils.updateProgressMessage('データをマージ中...');

        // チャット: ID単位でマージ、updatedAtが新しい方を優先
        const chatMap = new Map();
        [...(localData.chats || []), ...(cloudData.chats || [])].forEach(chat => {
            const existing = chatMap.get(chat.id);
            if (!existing || (chat.updatedAt || 0) > (existing.updatedAt || 0)) chatMap.set(chat.id, chat);
        });

        // プロジェクト: ID単位でマージ、新しい方を優先
        const projectMap = new Map();
        [...(localData.projects || []), ...(cloudData.projects || [])].forEach(p => {
            const existing = projectMap.get(p.id);
            if (!existing || (p.updatedAt || 0) > (existing.updatedAt || 0)) projectMap.set(p.id, p);
        });

        // メモリ: profileId単位でマージ、itemsを統合
        const memoryMap = new Map();
        [...(localData.memories || []), ...(cloudData.memories || [])].forEach(m => {
            const existing = memoryMap.get(m.profileId);
            if (!existing) { memoryMap.set(m.profileId, { ...m }); }
            else { existing.items = [...new Set([...(existing.items || []), ...(m.items || [])])]; }
        });

        // プロファイル: ID単位でマージ（クラウド優先で初期設定を保持）
        const profileMap = new Map();
        [...(cloudData.profiles || []), ...(localData.profiles || [])].forEach(p => {
            if (!profileMap.has(p.id)) profileMap.set(p.id, p);
        });

        // アセット: union
        const assetMap = new Map();
        [...(cloudData.assets || []), ...(localData.assets || [])].forEach(a => {
            if (a.assetId && !assetMap.has(a.assetId)) assetMap.set(a.assetId, a);
        });

        // 設定: ローカルを維持（デバイス固有の設定を守る）
        const mergedMetadata = {
            version: "2.0",
            exportedAt: new Date().toISOString(),
            syncId: 'sync_merge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
            data: {
                profiles: Array.from(profileMap.values()),
                chats: Array.from(chatMap.values()),
                memories: Array.from(memoryMap.values()),
                projects: Array.from(projectMap.values()),
                assets: Array.from(assetMap.values()),
                settings: localData.settings
            }
        };

        if (isManual) uiUtils.updateProgressMessage('マージデータをインポート中...');
        await this.importDataFromString(JSON.stringify(mergedMetadata));

        // _doPushの競合検知を通過させるため、lastSyncIdをクラウドのsyncIdに合わせる
        state.sync.lastSyncId = cloudParsed.syncId;
        await dbUtils.saveSetting('lastSyncId', cloudParsed.syncId);
        state.sync.isDirty = true;
        await dbUtils.saveSetting('syncIsDirty', true);
        state.sync.isSyncing = false;

        if (isManual) uiUtils.showProgressDialog('マージ結果をクラウドにアップロード中...');
        await this._doPush(isManual);

        await dbUtils.saveSetting('activeProjectId', null);
        if (isManual) {
            sessionStorage.setItem('isSyncReload', 'true');
            const localCnt = (localData.chats || []).length;
            const cloudCnt = (cloudData.chats || []).length;
            await uiUtils.showCustomAlert(
                `マージが完了しました。\n\nローカル ${localCnt}件 + クラウド ${cloudCnt}件 → ${chatMap.size}件のチャット\n\nアプリを再起動します。`
            );
            window.location.reload();
        } else {
            console.log(`[Sync Merge] 自動マージ完了。ローカル${(localData.chats||[]).length}件 + クラウド${(cloudData.chats||[]).length}件 → ${chatMap.size}件。ソフトリロードします。`);
            await this._softReloadAfterMerge();
        }
    },


    async _softReloadAfterMerge() {
        try {
            this.updateSyncStatusUI('syncing', 'データを更新中...');
            // activeProjectId をリセット（DBはすでにnullに設定済み）
            if (window.state) window.state.activeProjectId = null;
            const projSelect = document.getElementById('header-project-select');
            if (projSelect) projSelect.value = '';
            await this.loadProfiles();
            // マージ後のDB内容でprojectsCacheを再構築
            if (window.dbUtils.getAllProjects) {
                window.projectsCache = await window.dbUtils.getAllProjects();
            }
            const getAllUnfiltered = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
            const chats = await getAllUnfiltered();
            if (chats && chats.length > 0) {
                const targetId = state.currentChatId && chats.some(c => c.id === state.currentChatId)
                    ? state.currentChatId
                    : chats[0].id;
                await this.loadChat(targetId);
            } else {
                this.startNewChat();
            }
            if (state.currentScreen === 'history') {
                await this.renderHistoryList();
            }
            this.updateSyncStatusUI('success', '同期完了');
            console.log('[Sync Merge] ソフトリロード完了。');
        } catch (e) {
            console.error('[Sync Merge] ソフトリロード中にエラーが発生しました:', e);
            this.updateSyncStatusUI('error', '更新エラー');
        }
    },


    /**
     * [V2 Core Push] 実際にアップロード処理を行うコア関数
     * @private
     */
     async _doPush(isManual = false) {
        console.log(`[SYNC_DEBUG] _doPush: 開始。isManual = ${isManual}`);

        if (state.sync.isSyncing) {
            console.log("[Sync Core Push V2] 既に別の同期処理が実行中のため、今回の要求はスキップします。");
            return;
        }
        state.sync.isSyncing = true;
        const updateProgress = (message) => {
            console.log(`[SYNC_DEBUG] updateProgress: isManual=${isManual}, message="${message}"`);
            this.updateSyncStatusUI('syncing', message);
            if (isManual) {
                console.log(`[SYNC_DEBUG] updateProgress: isManual=trueのため、updateProgressMessageを呼び出します。`);
                uiUtils.updateProgressMessage(message);
            }
        };

        updateProgress('同期準備中...');

        try {
            // 操作タイプ 'push' を渡す
            await window.dropboxApi.uploadLockFile('push');

            // --- Step 1: 競合検知 ---
            updateProgress('クラウドの状態を確認中...');
            const cloudMetadataString = await window.dropboxApi.downloadMetadata();
            
            if (cloudMetadataString) {
                const cloudData = JSON.parse(cloudMetadataString);
                if (cloudData.syncId !== state.sync.lastSyncId) {
                    // 競合時は自動マージ（Pushを止めてPull→マージ→Pushの流れへ）
                    console.warn(`[Sync Push] 競合を検出。自動マージのためPullに切り替えます。Local: ${state.sync.lastSyncId}, Cloud: ${cloudData.syncId}`);
                    state.sync.isSyncing = false;
                    await window.dropboxApi.deleteLockFile();
                    await this._mergeAndSyncWithCloud(cloudMetadataString, isManual);
                    return;
                }
            }

            // --- Step 2: データ準備 ---
            await window.dropboxApi.ensureAssetsFolderExists();

            updateProgress('ローカルデータを準備中...');
            const { metadataJson, localAssets } = await this._prepareExportData();
            const localAssetIds = new Set(localAssets.keys());

            // --- 安全チェック: ローカルが空なのにクラウドにデータがある場合は上書きを拒否 ---
            if (cloudMetadataString) {
                const cloudDataForCheck = JSON.parse(cloudMetadataString);
                const cloudChatCount = (cloudDataForCheck.data && cloudDataForCheck.data.chats) ? cloudDataForCheck.data.chats.length : 0;
                const localMetaObj = JSON.parse(metadataJson);
                const localChatCount = (localMetaObj.data && localMetaObj.data.chats) ? localMetaObj.data.chats.length : 0;
                if (localChatCount === 0 && cloudChatCount > 0) {
                    console.error(`[Sync Push] 安全チェック失敗: ローカルチャット数=${localChatCount}, クラウドチャット数=${cloudChatCount}。クラウドの上書きを中止します。`);
                    state.sync.isSyncing = false;
                    this.updateSyncStatusUI('error', 'ローカルデータが空のため同期を中断しました');
                    if (isManual) {
                        uiUtils.hideProgressDialog();
                        await uiUtils.showCustomAlert('安全のため同期を中断しました。\n\nローカルのチャット履歴が空ですが、クラウドにはデータが存在します。\nクラウドからデータを復元してから再試行してください。');
                    }
                    await window.dropboxApi.deleteLockFile();
                    return;
                }
            }

            const cloudAssetsList = await window.dropboxApi.listAssets();
            const cloudAssetIds = new Set(cloudAssetsList.map(asset => asset.name));

            const assetsToUploadArray = Array.from(localAssets.entries())
                .filter(([assetId]) => !cloudAssetIds.has(assetId))
                .map(([assetId, asset]) => ({ assetId, asset }));
                
            const assetsToDelete = Array.from(cloudAssetIds).filter(id => !localAssetIds.has(id));

            // --- Step 3: アセットのアップロード（バッチ処理） ---
            if (assetsToUploadArray.length > 0) {
                console.log(`[Sync Core Push V2] ${assetsToUploadArray.length}個のアセットをバッチアップロードします。`);
                const progressCallback = (current, total) => {
                    updateProgress(`アセットをアップロード中 (${current}/${total})`);
                };
                await window.dropboxApi.uploadAssetsInBatches(assetsToUploadArray, progressCallback);
            } else {
                console.log("[Sync Core Push V2] アップロードする新規アセットはありません。");
            }

            // --- Step 4: 不要なアセットの削除 ---
            // 安全のため、ローカルにないかつメタデータにも参照されていないアセットのみ削除する。
            // ローカルDBが空・不完全な状態でPushしても正常なアセットを誤削除しない。
            const metadataObj = JSON.parse(metadataJson);
            const referencedAssetIds = new Set();
            (metadataObj.data.profiles || []).forEach(p => { if (p.iconAssetId) referencedAssetIds.add(p.iconAssetId); });
            (metadataObj.data.assets || []).forEach(a => { if (a.assetId) referencedAssetIds.add(a.assetId); });
            (metadataObj.data.chats || []).forEach(c => {
                (c.messages || []).forEach(m => {
                    if (m.imageIds) m.imageIds.forEach(id => { if (id) referencedAssetIds.add(id); });
                    if (m.attachments) m.attachments.forEach(att => { if (att.assetId) referencedAssetIds.add(att.assetId); });
                });
            });
            const safeToDelete = assetsToDelete.filter(id => !referencedAssetIds.has(id));
            if (safeToDelete.length > 0) {
                console.log(`[Sync Core Push V2] ${safeToDelete.length}個の不要なアセットを削除します。`);
                updateProgress(`${safeToDelete.length}個の不要アセットを削除中...`);
                await window.dropboxApi.deleteAssets(safeToDelete);
            }
            if (assetsToDelete.length !== safeToDelete.length) {
                console.warn(`[Sync Core Push V2] ${assetsToDelete.length - safeToDelete.length}個のアセットはローカルにないがメタデータに参照されているため削除をスキップしました。`);
            }

            // --- Step 5: メタデータのアップロード ---
            updateProgress('最終データを保存中...');
            const parsedMetadata = JSON.parse(metadataJson);

            await window.dropboxApi.uploadMetadata(metadataJson);

            // --- Step 6: 状態の更新 ---
            const syncTimestamp = new Date(parsedMetadata.exportedAt).getTime();
            state.sync.lastSyncId = parsedMetadata.syncId;
            state.sync.isDirty = false;
            state.sync.lastError = null;
            await Promise.all([
                dbUtils.saveSetting('lastSyncId', parsedMetadata.syncId),
                dbUtils.saveSetting('syncIsDirty', false),
                dbUtils.saveSetting('syncLastError', null),
                dbUtils.saveSetting('lastSyncTimestamp', syncTimestamp)
            ]);

            if (broadcastChannel) {
                broadcastChannel.postMessage({
                    type: 'SYNC_COMPLETED',
                    newSyncId: parsedMetadata.syncId,
                    sourceTabId: state.tabId
                });
            }
            
            this.updateSyncStatusUI('idle');
            await this.updateDropboxUIState();
            console.log(`[Sync Core Push V2] Push成功。新しいsyncId: ${parsedMetadata.syncId}`);
            if (isManual) {
                uiUtils.hideProgressDialog();
            }

        } catch (error) {
            const errorMessage = error.message || '不明なアップロードエラーが発生しました。';
            this.updateSyncStatusUI('error', errorMessage);
            console.error("[Sync Core Push V2] Push処理中にエラーが発生しました:", error);
            if (isManual) {
                uiUtils.hideProgressDialog();
                uiUtils.showCustomAlert(`同期に失敗しました: ${errorMessage}`);
            }
        } finally {
            state.sync.isSyncing = false;
            await window.dropboxApi.deleteLockFile();
            console.log(`[SYNC_DEBUG] _doPush: 終了。`);
        }
    },


    /**
     * [Push Gatekeeper] ローカルの変更をDropboxにアップロードする処理の呼び出しを管理する
     */
    handlePush(isManual = false) {
        if (state.sync.isSyncing || !state.sync.isDirty) {
            return;
        }
        dbUtils.getSetting('dropboxTokens').then(tokenData => {
            if (!tokenData || !tokenData.value) {
                return;
            }
            // 手動実行の場合はプログレスダイアログを表示
            if (isManual) {
                uiUtils.showProgressDialog('同期を開始しています...');
            }
            this._doPush(isManual).catch(error => { // isManualフラグを渡す
                console.error("[Sync Push] バックグラウンドPush処理でエラー:", error);
                if (isManual) {
                    uiUtils.hideProgressDialog();
                    uiUtils.showCustomAlert(`同期に失敗しました: ${error.message}`);
                }
            });
        });
    },


    /**
     * 「クラウドから復元」ボタン専用: sync状態を無視してDropboxから強制取得・インポートする
     */
    async forceRestoreFromCloud() {
        const tokenData = await dbUtils.getSetting('dropboxTokens');
        if (!tokenData || !tokenData.value) {
            await uiUtils.showCustomAlert('Dropboxが接続されていません。設定画面で連携してください。');
            return;
        }

        uiUtils.showProgressDialog('クラウドからデータを取得中...');
        try {
            const cloudMetadataString = await window.dropboxApi.downloadMetadata();
            if (!cloudMetadataString) {
                uiUtils.hideProgressDialog();
                await uiUtils.showCustomAlert('クラウドにデータが見つかりませんでした。\nDropboxの接続状態を確認してください。');
                return;
            }

            const importResult = await this.importDataFromString(cloudMetadataString);

            await Promise.all([
                dbUtils.saveSetting('lastSyncId', importResult.syncId),
                dbUtils.saveSetting('syncIsDirty', false),
                dbUtils.saveSetting('syncLastError', null),
            ]);

            uiUtils.hideProgressDialog();
            await uiUtils.showCustomAlert('クラウドからデータを復元しました。再起動します。');
            await dbUtils.saveSetting('activeProjectId', null);
            sessionStorage.setItem('isSyncReload', 'true');
            window.location.reload();
        } catch (error) {
            uiUtils.hideProgressDialog();
            console.error('[ForceRestore] エラー:', error);
            await uiUtils.showCustomAlert(`復元に失敗しました: ${error.message}`);
        }
    },


    /**
     * [V2 Pull] Dropboxからデータをダウンロードして同期する
     */
     async handlePull(isManual = false) {
        console.log(`[SYNC_DEBUG] handlePull: 開始。isManual = ${isManual}`);

        if (state.sync.isSyncing) {
            console.log(`[Sync Pull] スキップしました (isSyncing: ${state.sync.isSyncing})`);
            return;
        }

        const tokenData = await dbUtils.getSetting('dropboxTokens');
        if (!tokenData || !tokenData.value) {
            console.log("[Sync Pull] Dropbox未連携のためスキップしました。");
            return;
        }

        console.log("[Sync Pull V2] Pull処理を開始します。");
        state.sync.isSyncing = true;
        this.updateSyncStatusUI('syncing', 'クラウドと通信中...');
        if (isManual) {
            console.log("[SYNC_DEBUG] handlePull: isManual=trueのため、showProgressDialogを呼び出します。");
            uiUtils.showProgressDialog('クラウドと通信中...');
        }

        try {
            await window.dropboxApi.uploadLockFile('pull');

            const cloudMetadataString = await window.dropboxApi.downloadMetadata();

            if (cloudMetadataString === null) {
                console.log("[Sync Pull V2] クラウドにファイルが見つかりません。");
                const getAllUnfiltered2 = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
                const localChats = await getAllUnfiltered2();
                if (localChats.length > 0 || state.sync.isDirty) {
                    console.log("[Sync Pull V2] ローカルにデータが存在するため、初回Pushを実行します。");
                    if (isManual) {
                        console.log("[SYNC_DEBUG] handlePull: isManual=trueのため、updateProgressMessageを呼び出します。");
                        uiUtils.updateProgressMessage('初回データをクラウドに保存中...');
                    }
                    
                    state.sync.isSyncing = false; 

                    await window.dropboxApi.deleteLockFile();
                    console.log(`[SYNC_DEBUG] handlePull: _doPushを呼び出します。isManual = ${isManual}`);
                    await this._doPush(isManual);
                } else {
                    console.log("[Sync Pull V2] ローカルもクラウドも空のため、同期処理は不要です。");
                    this.updateSyncStatusUI('idle');
                    if (isManual) uiUtils.hideProgressDialog();
                }
                return;
            }

            const cloudData = JSON.parse(cloudMetadataString);

            const cloudSyncId = cloudData.syncId;

            console.log(`[Sync Pull V2] Cloud syncId: ${cloudSyncId}, Local lastSyncId: ${state.sync.lastSyncId}`);

            if (cloudSyncId !== state.sync.lastSyncId) {
                // フィルターなしで確認しないとプロジェクトフィルターで0件に見えてしまう
                const getAllUnfiltered = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
                const localChats = await getAllUnfiltered();
                const localHasData = localChats.length > 0;
                if (state.sync.isDirty || localHasData) {
                    // 競合時は自動マージ（ダイアログなし）
                    console.log("[Sync Pull] 競合を検出。自動マージを実行します。");
                    if (isManual) uiUtils.showProgressDialog('データをマージ中...');
                    await this._mergeAndSyncWithCloud(cloudMetadataString, isManual);
                    return;
                }

                const importResult = await this.importDataFromString(cloudMetadataString);
                const removedAssetInfo = importResult.removedAssetInfo;

                state.sync.lastSyncId = importResult.syncId;
                state.sync.isDirty = false;
                state.sync.lastError = null;
                
                const syncTimestamp = new Date(importResult.exportedAt).getTime();
                await Promise.all([
                    dbUtils.saveSetting('lastSyncId', importResult.syncId),
                    dbUtils.saveSetting('syncIsDirty', false),
                    dbUtils.saveSetting('syncLastError', null),
                    dbUtils.saveSetting('lastSyncTimestamp', syncTimestamp)
                ]);

                if (broadcastChannel) {
                    broadcastChannel.postMessage({
                        type: 'SYNC_COMPLETED',
                        newSyncId: importResult.syncId,
                        sourceTabId: state.tabId
                    });
                }

                this.updateSyncStatusUI('idle');
                if (isManual) uiUtils.hideProgressDialog();

                await dbUtils.saveSetting('activeProjectId', null);

                if (isManual) {
                    sessionStorage.setItem('isSyncReload', 'true');
                    let finalMessage = "クラウドからデータを同期しました。アプリを再起動します。";
                    if (removedAssetInfo && Object.keys(removedAssetInfo).length > 0) {
                        let cleanupDetails = "\n\n【通知】\nクラウド上で実体が見つからなかったため、以下のチャットから画像添付の記録を削除しました：\n";
                        for (const chatTitle in removedAssetInfo) {
                            cleanupDetails += `・「${chatTitle}」から ${removedAssetInfo[chatTitle].length} 件\n`;
                        }
                        finalMessage += cleanupDetails;
                    }
                    await uiUtils.showCustomAlert(finalMessage);
                    window.location.reload();
                } else {
                    console.log("[Sync Pull] クラウドから自動インポート完了。ソフトリロードします。");
                    await this._softReloadAfterMerge();
                }

            } else {
                console.log("[Sync Pull V2] ローカルは既に最新です。同期は不要です。");
                await dbUtils.saveSetting('lastSyncTimestamp', Date.now());
                this.updateSyncStatusUI('idle');
                await this.updateDropboxUIState();
                if (isManual) {
                    uiUtils.hideProgressDialog();
                }
            }

        } catch (error) {
            const errorMessage = error.message || '不明な同期エラーが発生しました。';
            this.updateSyncStatusUI('error', errorMessage);
            console.error("[Sync Pull V2] Pull処理中にエラーが発生しました:", error);
            if (isManual) {
                uiUtils.hideProgressDialog();
                await uiUtils.showCustomAlert(`同期に失敗しました: ${errorMessage}`);
            }
        } finally {
            state.sync.isSyncing = false;
            await window.dropboxApi.deleteLockFile();
            console.log(`[SYNC_DEBUG] handlePull: 終了。`);
        }
    },


    /**
     * [V2] 同期用にメタデータとアセットリストを分離して準備する
     * @param {boolean} isManual - 手動実行かどうか
     * @returns {Promise<{metadataJson: string, localAssets: Map<string, {blob: Blob, hash: string}>}>}
     */
     async _prepareExportData() {
        try {
            // ディープコピーの対象を、Blobを含まないメタデータのみに限定する
            const [profiles, chats, memories, projects, allSettings] = await Promise.all([
                dbUtils.getAllProfiles().then(data => JSON.parse(JSON.stringify(data))),
                (window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils))().then(data => JSON.parse(JSON.stringify(data))),
                dbUtils.getAllMemories().then(data => JSON.parse(JSON.stringify(data))),
                window.dbUtils.getAllProjects().then(data => JSON.parse(JSON.stringify(data))),
                new Promise((res, rej) => {
                    const store = dbUtils._getStore(SETTINGS_STORE);
                    const request = store.getAll();
                    request.onsuccess = () => res(JSON.parse(JSON.stringify(request.result)));
                    request.onerror = (e) => rej(e.target.error);
                })
            ]);
            // Blobを含むアセットは、後で直接DBから読み込む
            const imageAssets = await dbUtils.getAllAssets();
            const chatImages = await new Promise((res, rej) => {
                const store = dbUtils._getStore('image_store');
                const request = store.getAll();
                request.onsuccess = () => res(request.result);
                request.onerror = (e) => rej(e.target.error);
            });

            const settingsForExport = allSettings.filter(setting => 
                !['dropboxTokens', 'syncIsDirty', 'syncLastError', 'lastSyncId'].includes(setting.key)
            );

            const localAssets = new Map();
            const addAsset = (assetId, blob) => {
                if (!assetId || !blob) return;
                localAssets.set(assetId, { blob, hash: null });
            };

            for (const profile of profiles) {
                const originalProfile = await dbUtils.getProfile(profile.id);
                if (originalProfile && originalProfile.icon instanceof Blob) {
                    const assetId = `profile_${profile.id}_icon.webp`;
                    addAsset(assetId, originalProfile.icon);
                    profile.iconAssetId = assetId;
                }
                delete profile.icon;
            }
            for (const asset of imageAssets) {
                if (asset.blob) { // Blobが存在することを確認
                    if (!asset.assetId) {
                        const safeName = asset.name.replace(/[^a-zA-Z0-9]/g, '_');
                        asset.assetId = `asset_${safeName}_${new Date(asset.createdAt).getTime()}.webp`;
                        asset._needsUpdate = true;
                    }
                    addAsset(asset.assetId, asset.blob);
                }
            }
            for (const image of chatImages) {
                if (image.id && image.blob) {
                    addAsset(image.id, image.blob);
                }
            }

            console.log("[Data Export V2] チャット履歴内の添付ファイルのアセット化とデータクレンジングを開始します...");
            const blobsToSaveToImageStore = [];

            // DBから直接読み込んだデータを操作し、stateを汚染しないようにする
            const allDbChats = await dbUtils.getAllChats();
            for (const chat of allDbChats) {
                if (chat.messages) {
                    for (const message of chat.messages) {
                        if (message.imageIds && Array.isArray(message.imageIds)) {
                            message.imageIds = message.imageIds.filter(id => id && typeof id === 'string' && id.trim() !== '');
                        }

                        if (message.attachments && message.attachments.length > 0) {
                            const newImageIdsForMessage = [];
                            for (const attachment of message.attachments) {
                                if (!attachment.assetId && attachment.base64Data) {
                                    attachment.assetId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                                    if (!chat._needsUpdate) chat._needsUpdate = true;
                                    
                                    try {
                                        const blob = await this.base64ToBlob(attachment.base64Data, attachment.mimeType);
                                        addAsset(attachment.assetId, blob);
                                        newImageIdsForMessage.push(attachment.assetId);
                                        blobsToSaveToImageStore.push({ id: attachment.assetId, blob: blob });
                                    } catch (e) {
                                        console.error(`[Data Export V2] 新規添付ファイルのアセット化に失敗:`, e);
                                    }
                                } 
                                else if (attachment.assetId) {
                                    const imgData = chatImages.find(img => img.id === attachment.assetId);
                                    if (imgData && imgData.blob) {
                                        addAsset(attachment.assetId, imgData.blob);
                                    } else {
                                        console.warn(`[Data Export V2] 既存アセット(ID: ${attachment.assetId})のBlobがimage_storeに見つかりません。`);
                                    }
                                }
                            }
                            if (newImageIdsForMessage.length > 0) {
                                if (!message.imageIds) message.imageIds = [];
                                message.imageIds.push(...newImageIdsForMessage);
                            }
                        }
                    }
                }
            }
            console.log("[Data Export V2] アセット化とクレンジングが完了しました。");

            if (blobsToSaveToImageStore.length > 0) {
                console.log(`[Data Export V2] ${blobsToSaveToImageStore.length}件の新規アセットBlobをimage_storeに永続化します。`);
                const tx = state.db.transaction('image_store', 'readwrite');
                const store = tx.objectStore('image_store');
                for (const item of blobsToSaveToImageStore) {
                    store.put(item);
                }
            }

            const assetsToUpdate = imageAssets.filter(a => a._needsUpdate);
            if (assetsToUpdate.length > 0) {
                console.log(`[Data Export V2] ${assetsToUpdate.length}件のimage_assetsにassetIdを永続化します。`);
                const tx = state.db.transaction('image_assets', 'readwrite');
                const store = tx.objectStore('image_assets');
                for (const asset of assetsToUpdate) {
                    delete asset._needsUpdate;
                    store.put(asset);
                }
            }
            const chatsToUpdate = allDbChats.filter(c => c._needsUpdate);
            if (chatsToUpdate.length > 0) {
                console.log(`[Data Export V2] ${chatsToUpdate.length}件のチャットにattachmentのassetIdを永続化します。`);
                const tx = state.db.transaction(CHATS_STORE, 'readwrite');
                const store = tx.objectStore(CHATS_STORE);
                for (const chat of chatsToUpdate) {

                    // DBに保存する前にディープコピーを作成し、コピーからbase64Dataを削除する
                    const chatForDb = JSON.parse(JSON.stringify(chat));
                    chatForDb.messages.forEach(msg => {
                        if (msg.attachments) {
                            msg.attachments.forEach(att => delete att.base64Data);
                        }
                    });
                    delete chatForDb._needsUpdate;
                    store.put(chatForDb);

                    // メモリ上のstate.currentMessagesは、base64Dataが削除されていない元のchatオブジェクトで更新する
                    if (chat.id === state.currentChatId) {
                        state.currentMessages = chat.messages;
                    }
                }
            }

            // エクスポート用の `chats` 配列（DBから取得した全チャットデータ）に対して、
            // 添付ファイルのbase64Dataを復元する処理を追加
            for (const chat of chats) {
                if (chat.messages) {
                    for (const message of chat.messages) {
                        if (message.attachments && message.attachments.length > 0) {
                            for (const attachment of message.attachments) {
                                // base64Dataがなく、assetIdがある場合に復元を試みる
                                if (!attachment.base64Data && attachment.assetId) {
                                    const assetBlobData = localAssets.get(attachment.assetId);
                                    if (assetBlobData && assetBlobData.blob) {
                                        try {
                                            // fileToBase64 を使って Blob から Base64 文字列を生成
                                            attachment.base64Data = await this.fileToBase64(assetBlobData.blob);
                                        } catch (e) {
                                            console.error(`[Data Export V2] エクスポート中に assetId: ${attachment.assetId} から base64Data の復元に失敗しました。`, e);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const syncId = 'sync_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            const metadata = {
                version: "2.0",
                exportedAt: new Date().toISOString(),
                syncId: syncId,
                data: {
                    profiles,
                    chats,
                    memories,
                    projects,
                    assets: imageAssets.map(a => ({ name: a.name, assetId: a.assetId, createdAt: a.createdAt })),
                    settings: settingsForExport
                }
            };

            
            console.log(`[Data Export V2] データ準備完了。syncId: ${syncId}, アセット数: ${localAssets.size}`);

            return {
                metadataJson: JSON.stringify(metadata),
                localAssets: localAssets
            };

        } catch (error) {
            console.error("[Data Export V2] エクスポート準備中にエラー:", error);
            throw new Error("データのエクスポート準備に失敗しました。");
        }
    },






    async importDataFromString(jsonString) {
        console.log("[Data Import V2] 文字列からのデータインポートを開始します。");
        uiUtils.showProgressDialog('インポートデータを準備中...');
    
        try {
            const parsedData = JSON.parse(jsonString);
            if (parsedData.version !== "2.0" || !parsedData.data) {
                throw new Error("インポートデータの形式が無効か、バージョンが古いです。");
            }
            
            const cloudData = parsedData.data;

            const localAssetsBeforeClear = new Map();
            const localImageAssets = await dbUtils.getAllAssets();
            localImageAssets.forEach(asset => {
                if(asset.assetId && asset.blob) localAssetsBeforeClear.set(asset.assetId, asset.blob);
            });
            const localChatImages = await new Promise((res, rej) => {
                const store = dbUtils._getStore('image_store');
                const request = store.getAll();
                request.onsuccess = () => res(request.result);
                request.onerror = (e) => rej(e.target.error);
            });
            localChatImages.forEach(image => {
                if(image.id && image.blob) localAssetsBeforeClear.set(image.id, image.blob);
            });
            console.log(`[Sync Pull] ローカルに存在するアセットBlob: ${localAssetsBeforeClear.size}件をメモリに保持しました。`);

            const requiredAssetIds = new Set();
            (cloudData.profiles || []).forEach(p => { if (p.iconAssetId) requiredAssetIds.add(p.iconAssetId); });
            (cloudData.assets || []).forEach(a => { if (a.assetId) requiredAssetIds.add(a.assetId); });
            (cloudData.chats || []).forEach(c => {
                (c.messages || []).forEach(m => {
                    if (m.imageIds) m.imageIds.forEach(id => { if(id) requiredAssetIds.add(id); });
                });
            });
            console.log(`[Sync Pull] クラウドが必要とするアセットID: ${requiredAssetIds.size}件`);

            const assetsToDownloadIds = [...requiredAssetIds].filter(id => !localAssetsBeforeClear.has(id));
            console.log(`[Sync Pull] ダウンロードが必要なアセットID: ${assetsToDownloadIds.length}件`);

            const downloadedAssets = new Map();
            if (assetsToDownloadIds.length > 0) {
                for (let i = 0; i < assetsToDownloadIds.length; i++) {
                    const assetId = assetsToDownloadIds[i];
                    uiUtils.updateProgressMessage(`アセットをダウンロード中 (${i + 1}/${assetsToDownloadIds.length})`);
                    try {
                        const blob = await window.dropboxApi.downloadAsset(assetId);
                        if (blob) {
                            downloadedAssets.set(assetId, blob);
                        } else {
                            console.warn(`[Sync Pull] アセット(ID: ${assetId})のダウンロードに失敗、またはクラウドに存在しませんでした。`);
                        }
                    } catch (downloadError) {
                        console.error(`[Sync Pull] アセット(ID: ${assetId})のダウンロード中にエラーが発生しました:`, downloadError);
                    }
                }
            }

            // clearAndImportDataからの戻り値を受け取る
            const { removedAssetInfo } = await dbUtils.clearAndImportData(cloudData, localAssetsBeforeClear, downloadedAssets, requiredAssetIds);
    
            console.log("[Data Import V2] データのインポートに成功しました。");
            
            // 戻り値にクレンジング情報とメタデータを両方含める
            return {
                ...parsedData, // syncId, exportedAtなどを含む
                removedAssetInfo: removedAssetInfo // クレンジング情報を追加
            };
    
        } catch (error) {
            console.error("[Data Import V2] インポート処理中にエラーが発生しました:", error);
            uiUtils.hideProgressDialog();
            if (error && error.missingAssetInfo) {
                const detailLines = Object.entries(error.missingAssetInfo)
                    .map(([chatTitle, ids]) => `・${chatTitle}: ${ids.length}件の画像が不足`)
                    .join('\n');
                const message = [
                    "必要な画像アセットが不足しているため同期を中止しました。",
                    "ネットワーク状況またはDropbox上のアセット状態を確認し、再度同期をお試しください。",
                    "不足している画像一覧:",
                    detailLines
                ].join('\n');
                const wrappedError = new Error(message);
                wrappedError.missingAssetInfo = error.missingAssetInfo;
                wrappedError.code = error.code || 'MISSING_ASSETS';
                throw wrappedError;
            }
            throw new Error(`データのインポートに失敗しました: ${error.message}`);
        }
    },



    /**
     * [PKCE] code_verifierを生成する
     * @returns {string} ランダムな文字列
     */
     _generateCodeVerifier() {
        const randomBytes = new Uint8Array(32);
        window.crypto.getRandomValues(randomBytes);
        return btoa(String.fromCharCode.apply(null, randomBytes))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },


    /**
     * [PKCE] code_verifierからcode_challengeを生成する
     * @param {string} verifier - code_verifier
     * @returns {Promise<string>} SHA-256でハッシュ化されたチャレンジ文字列
     */
    async _generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },

    
    async updateDropboxUIState() {
        const tokenData = await dbUtils.getSetting('dropboxTokens');
        const isAuthenticated = tokenData && tokenData.value && tokenData.value.access_token;

        elements.syncStatusHeaderIcon.style.display = isAuthenticated ? 'block' : 'none';
        
        if (isAuthenticated) {
            document.body.classList.add('dropbox-connected');
            elements.dropboxAuthState.classList.add('hidden');
            elements.dropboxConnectedState.classList.remove('hidden');
            
            // 最終同期日時を取得して表示
            const lastSyncSetting = await dbUtils.getSetting('lastSyncTimestamp');
            if (lastSyncSetting && lastSyncSetting.value) {
                const date = new Date(lastSyncSetting.value);
                elements.lastSyncTimeDisplay.textContent = `最終同期: ${date.toLocaleString('ja-JP')}`;
            } else {
                elements.lastSyncTimeDisplay.textContent = `最終同期: なし`;
            }

            try {
                const accountInfo = await window.dropboxApi.testConnection();
                elements.dropboxUserName.textContent = accountInfo.name.display_name;
                this.updateSyncStatusUI(state.sync.isDirty ? 'dirty' : 'idle');
            } catch (error) {
                console.error("Dropboxユーザー情報の取得に失敗:", error);
                elements.dropboxUserName.textContent = '不明なユーザー';
                this.updateSyncStatusUI('error', 'アカウント情報取得失敗');
            }
        } else {
            document.body.classList.remove('dropbox-connected');
            elements.dropboxAuthState.classList.remove('hidden');
            elements.dropboxConnectedState.classList.add('hidden');
            elements.lastSyncTimeDisplay.textContent = ''; // 未連携時は非表示
            this.updateSyncStatusUI('not-connected');
        }
    },


    /**
     * 同期ステータスUIを更新する
     * @param {string} status - 'idle', 'dirty', 'pushing', 'pulling', 'error'
     * @param {string} [message] - 表示するカスタムメッセージ
     */
    updateSyncStatusUI(status, message) {
        console.log(`[Sync UI] updateSyncStatusUI called with status: "${status}", message: "${message || ''}"`);

        if (status === 'error' && message) {
            state.sync.lastError = {
                message: message,
                timestamp: new Date().toISOString()
            };
        }

        const errorDisplay = document.getElementById('sync-error-display');
        const errorMessageEl = document.getElementById('sync-error-message');
        const errorTimestampEl = document.getElementById('sync-error-timestamp');

        if (state.sync.lastError) {
            errorMessageEl.textContent = state.sync.lastError.message;
            errorTimestampEl.textContent = `発生日時: ${new Date(state.sync.lastError.timestamp).toLocaleString('ja-JP')}`;
            errorDisplay.classList.remove('hidden');
        } else {
            errorDisplay.classList.add('hidden');
        }

        const indicators = [
            elements.syncStatusHeaderIcon,
            elements.syncStatusSettingsIcon, // 設定画面のアイコンを追加
            elements.syncProgressText 
        ].filter(Boolean);

        const statusMap = {
            'not-connected': { text: '未連携', icon: 'cloud_off' },
            'idle': { text: '同期済み', icon: 'cloud_done' },
            'dirty': { text: '要同期', icon: 'cloud_upload' },
            'syncing': { text: '同期中...', icon: 'cloud_sync' },
            'error': { text: '同期エラー', icon: 'cloud_alert' }
        };

        const newStatus = statusMap[status] ? status : 'error';
        const statusInfo = statusMap[newStatus];

        indicators.forEach(element => {
            element.dataset.status = newStatus;
            
            if (element.classList.contains('sync-status-header-icon')) { // 共通クラスで判定
                element.textContent = statusInfo.icon;
                element.title = message || statusInfo.text;
            } else if (element.id === 'sync-progress-text') {
                if (newStatus === 'syncing') {
                    element.textContent = `(${message || statusInfo.text})`;
                } else {
                    element.textContent = '';
                }
            }
        });
    }
};
