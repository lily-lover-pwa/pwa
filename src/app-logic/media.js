// appLogic 機能モジュール: media（Phase 3 で app-logic.js から分割）。挙動は不変。
import { GEMINI_API_BASE_URL, IMAGE_STORE } from '../constants.js';
import { dbUtils } from '../db.js';
import { elements } from '../dom-elements.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';
import { htmlUtils } from '../utils/html.js';
import { createMessageImageFilename, createRangeImageFilename, messageElementToPngBlob, messagesRangeToPngBlobs } from '../utils/message-image.js';

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const mediaMethods = {
    async saveMessageAsImage(messageElement) {
        try {
            const blob = await messageElementToPngBlob(messageElement);
            triggerDownload(blob, createMessageImageFilename(messageElement));
        } catch (error) {
            console.error('メッセージ画像の保存に失敗:', error);
            await uiUtils.showCustomAlert(`メッセージ画像の保存に失敗しました。\n${error.message}`);
            throw error;
        }
    },

    // ===== 範囲画像保存（複数メッセージをまとめて画像化） =====

    // フローティングパネルの「範囲を画像保存」から呼ばれ、選択モードに入る。
    enterRangeImageMode() {
        state.rangeImageSelect = { active: true, startIndex: null, endIndex: null };
        elements.messageContainer?.classList.add('range-select-mode');
        uiUtils.updateRangeImageSelectionUI();
    },

    exitRangeImageMode() {
        state.rangeImageSelect = { active: false, startIndex: null, endIndex: null };
        elements.messageContainer?.classList.remove('range-select-mode');
        uiUtils.clearRangeImageHighlight();
        uiUtils.updateRangeImageSelectionUI();
    },

    // 選択モード中にメッセージがタップされたときの処理。
    // 1タップ目=始点。2タップ目以降は終点を更新し、範囲を伸縮できる
    // （始点を変えたい場合はキャンセルしてやり直す）。表示上の前後関係は
    // 描画時に min/max で正規化する。
    handleRangeMessageSelect(index) {
        const sel = state.rangeImageSelect;
        if (!sel.active) return;
        if (sel.startIndex === null) {
            sel.startIndex = index;
            sel.endIndex = null;
        } else {
            sel.endIndex = index;
        }
        uiUtils.updateRangeImageSelectionUI();
    },

    // 確認バーの「保存」から呼ばれる。
    async confirmRangeImageSave() {
        const sel = state.rangeImageSelect;
        if (!sel.active || sel.startIndex === null) return;
        const start = sel.startIndex;
        const end = sel.endIndex === null ? sel.startIndex : sel.endIndex;
        try {
            await this.saveMessagesRangeAsImage(start, end);
            this.exitRangeImageMode();
        } catch (error) {
            console.error('範囲画像の保存に失敗:', error);
            await uiUtils.showCustomAlert(`範囲画像の保存に失敗しました。\n${error.message}`);
        }
    },

    // start..end のメッセージ要素をまとめて画像化して保存する。
    // 複数枚に分割された場合は JSZip でまとめて1ファイル（zip）としてダウンロード。
    async saveMessagesRangeAsImage(startIndex, endIndex) {
        const [a, b] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
        const container = elements.messageContainer;
        const elementsInRange = [];
        for (let i = a; i <= b; i++) {
            const el = container?.querySelector(`.message[data-index="${i}"]`);
            if (el) elementsInRange.push(el);
        }
        if (elementsInRange.length === 0) {
            throw new Error('保存対象のメッセージが見つかりません。');
        }

        const blobs = await messagesRangeToPngBlobs(elementsInRange);
        const now = new Date();

        if (blobs.length === 1) {
            triggerDownload(blobs[0], createRangeImageFilename(now));
            return;
        }

        // 複数枚: iOS では複数ダウンロードが不安定なため zip にまとめる。
        if (typeof JSZip === 'undefined') {
            // フォールバック: zip が使えない場合は1枚ずつ（PC想定）。
            blobs.forEach((blob, idx) => triggerDownload(blob, createRangeImageFilename(now, idx + 1, blobs.length)));
            return;
        }
        const zip = new JSZip();
        blobs.forEach((blob, idx) => {
            zip.file(createRangeImageFilename(now, idx + 1, blobs.length), blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, `PWA-lily_range_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.zip`);
    },





    /**
     * 画像Blobを受け取り、WebPに変換してimage_storeに保存し、新しいIDを返す
     * @param {Blob} blob - 保存対象の画像Blob
     * @returns {Promise<string>} 保存された画像のユニークID
     */
     async saveImageBlob(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(async (webpBlob) => {
                        if (!webpBlob) {
                            console.warn("WebPへの変換に失敗しました。元の形式で保存します。");
                            webpBlob = blob;
                        }
                        
                        const imageId = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        const imageData = {
                            id: imageId,
                            blob: webpBlob,
                            width: img.naturalWidth,  // 幅を追加
                            height: img.naturalHeight, // 高さを追加
                            createdAt: new Date()
                        };

                        try {
                            await dbUtils.openDB();
                            const store = dbUtils._getStore(IMAGE_STORE, 'readwrite');
                            const request = store.put(imageData);
                            request.onsuccess = () => resolve(imageId);
                            request.onerror = (event) => reject(event.target.error);
                        } catch (dbError) {
                            reject(dbError);
                        }
                    }, 'image/webp', 0.9);
                };
                img.onerror = () => reject(new Error("画像データの読み込みに失敗しました。"));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error("FileReaderでBlobの読み込みに失敗しました。"));
            reader.readAsDataURL(blob);
        });
    },



    imageObserver: null,


    /**
     * IDを指定してimage_storeから画像Blobを取得する
     * @param {string} id - 取得する画像のID
     * @returns {Promise<Blob|null>} 画像のBlobオブジェクト、またはnull
     */
    async getImageBlobById(id) {
        try {
            await dbUtils.openDB();
            const store = dbUtils._getStore(IMAGE_STORE, 'readonly');
            return new Promise((resolve, reject) => {
                const request = store.get(id);
                request.onsuccess = (event) => {
                    resolve(event.target.result || null); // オブジェクト全体を返す
                };
                request.onerror = (event) => reject(event.target.error);
            });
        } catch (error) {
            console.error(`ID(${id})の画像Blob取得エラー:`, error);
            return null;
        }
    },




    /**
     * 古い形式の画像データ（チャット履歴埋め込み）を新しいimage_storeに移行する
     * @param {IDBTransaction} transaction - onupgradeneededから渡されるトランザクション
     */
    async migrateImageData() {
        console.log("[DB Migration] v11データ移行処理のチェックを開始します...");
        try {
            const migrationFlag = await dbUtils.getSetting('v11_migration_complete');
            if (migrationFlag && migrationFlag.value) {
                console.log("[DB Migration] v11データ移行は既に完了しています。");
                return;
            }

            console.log("[DB Migration] v11データ移行を開始します...");
            const allChats = await dbUtils.getAllChats();
            let migratedImageCount = 0;

            for (const chat of allChats) {
                let chatModified = false;
                if (!chat.messages) continue;

                for (const message of chat.messages) {
                    if (message.generated_images && message.generated_images.length > 0) {
                        message.imageIds = message.imageIds || [];
                        for (const imgData of message.generated_images) {
                            try {
                                const imageBlob = await this.base64ToBlob(imgData.data, imgData.mimeType);
                                const newImageId = await this.saveImageBlob(imageBlob);
                                message.imageIds.push(newImageId);
                                migratedImageCount++;
                            } catch (error) {
                                console.error(`[DB Migration] チャット(id:${chat.id})の画像移行中にエラー:`, error);
                            }
                        }
                        // 移行が完了したら古いキーは削除
                        delete message.generated_images;
                        chatModified = true;
                    }
                }

                if (chatModified) {
                    console.log(`[DB Migration] チャット(id:${chat.id})を更新します。`);
                    await dbUtils.saveChat(chat.title, chat);
                }
            }

            console.log(`[DB Migration] v11データ移行が完了しました。合計 ${migratedImageCount} 枚の画像を移行しました。`);
            await dbUtils.saveSetting('v11_migration_complete', true);

        } catch (error) {
            console.error("[DB Migration] v11データ移行処理中に致命的なエラーが発生しました:", error);
        }
    },

    updateAssetCount: async function() {
        try {
            const assets = await dbUtils.getAllAssets();
            elements.assetCountDisplay.textContent = `現在 ${assets.length} 枚のアセットが保存されています。`;
        } catch (error) {
            console.error("アセット数の更新に失敗:", error);
            elements.assetCountDisplay.textContent = "アセット数の取得に失敗しました。";
        }
    },


    convertBlobToWebP: function(originalBlob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob((webpBlob) => {
                        if (webpBlob) {
                            console.log(`[WebP Converter] 変換成功: ${originalBlob.size} bytes -> ${webpBlob.size} bytes`);
                            resolve(webpBlob);
                        } else {
                            console.warn("[WebP Converter] WebPへの変換に失敗。元の形式を使用します。");
                            resolve(originalBlob);
                        }
                    }, 'image/webp', 0.9);
                };
                img.onerror = () => {
                    console.error("[WebP Converter] 画像データの読み込み失敗。");
                    resolve(originalBlob);
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                console.error("[WebP Converter] FileReader失敗。");
                resolve(originalBlob);
            };
            reader.readAsDataURL(originalBlob);
        });
    },


    handleAssetExport: async function() {
        uiUtils.showProgressDialog('エクスポート準備中...');
        try {
            const assets = await dbUtils.getAllAssets();
            if (assets.length === 0) {
                uiUtils.hideProgressDialog();
                return uiUtils.showCustomAlert("エクスポートするアセットがありません。");
            }

            uiUtils.updateProgressMessage('Zipファイルを生成中...');

            const zip = new JSZip();
            const manifest = [];
            const usedFileNames = new Set();

            const sanitizeFileName = (name) => {
                return name.replace(/[\\/:*?"<>|]/g, '_');
            };

            for (const asset of assets) {
                let baseName = sanitizeFileName(asset.name);
                let fileName = `${baseName}.webp`;
                let count = 1;
                while (usedFileNames.has(fileName)) {
                    count++;
                    fileName = `${baseName}_${count}`;
                }
                usedFileNames.add(fileName);
                
                manifest.push({ asset_name: asset.name, file_name: fileName });
                zip.file(fileName, asset.blob);
            }

            zip.file("manifest.json", JSON.stringify(manifest, null, 2));

            const content = await zip.generateAsync({ type: "blob" });
            
            uiUtils.updateProgressMessage('ファイルをダウンロード中...');
            const a = document.createElement("a");
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
            a.download = `Gemini_PWA_Assets_${date}.zip`;
            a.href = URL.createObjectURL(content);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);

        } catch (error) {
            console.error("アセットのエクスポートに失敗:", error);
            await uiUtils.showCustomAlert(`エクスポート中にエラーが発生しました: ${error.message}`);
        } finally {
            uiUtils.hideProgressDialog();
        }
    },


    handleAssetImport: async function(file) {
        if (!file) return;
        if (typeof JSZip === 'undefined') {
            return uiUtils.showCustomAlert("Zip処理ライブラリが読み込まれていません。");
        }

        uiUtils.showProgressDialog('Zipファイルを展開中...');
        console.log(`[Import] インポート処理開始: ${file.name}`);

        try {
            const zip = await JSZip.loadAsync(file);
            const manifestFileEntry = Object.values(zip.files).find(
                entry => !entry.dir && entry.name.endsWith('manifest.json')
            );

            const assetsToImport = [];
            const assetNameMap = new Map();

            if (manifestFileEntry) {
                console.log(`[Import] ${manifestFileEntry.name} を発見。通常モードで処理します。`);
                try {
                    const manifest = JSON.parse(await manifestFileEntry.async("string"));
                    manifest.forEach(item => assetNameMap.set(item.file_name, item.asset_name));
                    console.log(`[Import] manifestから ${assetNameMap.size} 件のアセット定義を読み込みました。`);
                } catch (e) {
                    console.error("[Import] manifest.jsonのパースに失敗しました。", e);
                    await uiUtils.showCustomAlert("manifest.jsonの形式が正しくありません。簡易モードで続行します。");
                }
            } else {
                console.log("[Import] manifest.jsonが見つかりません。簡易モードで処理します。");
            }

            const imageFilePromises = [];
            zip.forEach((relativePath, zipEntry) => {
                if (!zipEntry.dir && /\.(webp|png|jpe?g|gif)$/i.test(relativePath)) {
                    const baseName = relativePath.split('/').pop();
                    const assetName = assetNameMap.get(baseName) || baseName.replace(/\.[^/.]+$/, "");
                    console.log(`[Import] ファイルを発見: '${relativePath}' -> アセット名: '${assetName}'`);
                    imageFilePromises.push({ name: assetName, file: zipEntry });
                }
            });

            assetsToImport.push(...imageFilePromises);

            if (assetsToImport.length === 0) {
                uiUtils.hideProgressDialog();
                return uiUtils.showCustomAlert("Zipファイル内にインポート可能な画像が見つかりませんでした。");
            }
            console.log(`[Import] ${assetsToImport.length}件のインポート対象画像をリストアップしました。`);

            let conflictChoice = null;
            let applyToAll = false;
            let importedCount = 0;

            for (let i = 0; i < assetsToImport.length; i++) {
                const item = assetsToImport[i];
                let assetName = item.name;
                uiUtils.updateProgressMessage(`アセットを処理中 (${i + 1}/${assetsToImport.length}): ${assetName}`);

                const existingAsset = await dbUtils.getAsset(assetName);
                
                if (existingAsset) {
                    console.log(`[Import] 競合を検出: アセット「${assetName}」は既に存在します。`);
                    if (!applyToAll) {
                        uiUtils.hideProgressDialog(); // 確認ダイアログ表示のため一時的に隠す
                        const userDecision = await this.showAssetConflictDialog(assetName);
                        uiUtils.showProgressDialog(`アセットを処理中 (${i + 1}/${assetsToImport.length}): ${assetName}`); // 再表示
                        conflictChoice = userDecision.choice;
                        applyToAll = userDecision.applyToAll;
                        console.log(`[Import] ユーザーの選択: ${conflictChoice}, 全てに適用: ${applyToAll}`);
                    }

                    if (conflictChoice === 'skip') {
                        console.log(`[Import] 「${assetName}」をスキップしました。`);
                        continue;
                    }
                    if (conflictChoice === 'rename') {
                        let newName;
                        let count = 2;
                        do {
                            newName = `${assetName} (${count})`;
                            count++;
                        } while (await dbUtils.getAsset(newName));
                        console.log(`[Import] 「${assetName}」の名前を「${newName}」に変更しました。`);
                        assetName = newName;
                    }
                }

                const blob = await item.file.async("blob");
                const webpBlob = await this.convertBlobToWebP(blob);
                
                await dbUtils.saveAsset({ name: assetName, blob: webpBlob, createdAt: new Date() });
                console.log(`[Import] アセット「${assetName}」をDBに保存しました。`);
                importedCount++;
            }
            
            uiUtils.hideProgressDialog();
            await uiUtils.showCustomAlert(`${importedCount}件のアセットのインポート処理が完了しました。`);
            await this.updateAssetCount();

            if (importedCount > 0) {
                this.markAsDirtyAndSchedulePush(true);
            }

        } catch (error) {
            console.error("アセットのインポートに失敗:", error);
            await uiUtils.showCustomAlert(`インポート中にエラーが発生しました: ${error.message}`);
        } finally {
            uiUtils.hideProgressDialog();
        }
    },



    async openAssetManagementDialog() {
        try {
            const assets = await dbUtils.getAllAssets();
            const container = elements.assetListContainer;
            container.innerHTML = ''; // コンテナをクリア

            if (assets.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">保存されているアセットはありません。</p>';
                elements.assetManagementDialog.showModal();
                return;
            }

            // URLを解放するためのリスト
            const objectUrls = [];

            assets.forEach(asset => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'asset-item';

                const url = URL.createObjectURL(asset.blob);
                objectUrls.push(url); // URLをリストに追加

                const thumbnail = document.createElement('img');
                thumbnail.className = 'asset-thumbnail';
                thumbnail.src = url;
                thumbnail.alt = asset.name;

                const infoDiv = document.createElement('div');
                infoDiv.className = 'asset-info';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'asset-name';
                nameSpan.textContent = asset.name;
                nameSpan.title = asset.name;

                const detailsSpan = document.createElement('span');
                detailsSpan.className = 'asset-details';
                const createdDate = new Date(asset.createdAt).toLocaleString('ja-JP');
                detailsSpan.textContent = `追加日: ${createdDate}`;

                infoDiv.appendChild(nameSpan);
                infoDiv.appendChild(detailsSpan);

                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'asset-actions-item';
                
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
                deleteBtn.title = "削除";
                deleteBtn.onclick = () => this.confirmDeleteAsset(asset.name);

                actionsDiv.appendChild(deleteBtn);
                
                itemDiv.appendChild(thumbnail);
                itemDiv.appendChild(infoDiv);
                itemDiv.appendChild(actionsDiv);
                
                container.appendChild(itemDiv);
            });

            // ダイアログが閉じられたらURLを解放するイベントリスナー
            elements.assetManagementDialog.addEventListener('close', () => {
                objectUrls.forEach(url => URL.revokeObjectURL(url));
                console.log(`${objectUrls.length}個のアセット用オブジェクトURLを解放しました。`);
            }, { once: true }); // 一度だけ実行

            elements.assetManagementDialog.showModal();

        } catch (error) {
            console.error("アセット管理ダイアログの表示に失敗:", error);
            await uiUtils.showCustomAlert("アセットの読み込みに失敗しました。");
        }
    },


    // --- Character Profile Dialog Functions ---
    updateCharacterProfileButtonVisibility() {
        const memory = state.currentPersistentMemory || {};
        const hasCharacterData = Object.keys(memory).some(key => key.startsWith('character_memory_'));
        
        elements.characterProfileBtn.disabled = !hasCharacterData;
        if (!hasCharacterData) {
            elements.characterProfileBtn.title = "キャラクターデータがありません";
        } else {
            elements.characterProfileBtn.title = "キャラクタープロファイル";
        }
    },


    async openCharacterProfileDialog() {
        const memory = state.currentPersistentMemory || {};
        const characterKeys = Object.keys(memory).filter(key => key.startsWith('character_memory_'));

        if (characterKeys.length === 0) return;

        // ダイアログの状態をリセット
        elements.characterProfileDialog.classList.remove('details-visible');
        state.characterProfileVisibleCharacter = null;
        elements.characterDetailPane.innerHTML = '';


        const listContainer = elements.characterListPane;
        listContainer.innerHTML = '';
        
        const characterNames = characterKeys.map(key => key.replace('character_memory_', ''));
        
        characterNames.forEach(name => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'profile-character-item';
            itemDiv.textContent = name;
            itemDiv.dataset.characterName = name;
            itemDiv.onclick = () => {
                this.renderCharacterDetails(name);
                // for Mobile
                if (window.innerWidth < 600) {
                    elements.characterProfileDialog.classList.add('details-visible');
                }
            };
            listContainer.appendChild(itemDiv);
        });

        // PC表示の場合のみ、最初のキャラクターをデフォルトで表示する
        if (window.innerWidth >= 600) {
            this.renderCharacterDetails(characterNames[0]);
        }

        elements.characterProfileDialog.showModal();
    },



    renderCharacterDetails(characterName) {
        state.characterProfileVisibleCharacter = characterName;

        // リストのアクティブ表示を更新
        document.querySelectorAll('.profile-character-item').forEach(item => {
            item.classList.toggle('active', item.dataset.characterName === characterName);
        });

        const detailPane = elements.characterDetailPane;
        const memoryKey = `character_memory_${characterName}`;
        const data = state.currentPersistentMemory[memoryKey] || {};

        // 汎用的なフィールド更新関数
        const createFieldUpdater = (fieldPath) => {
            return (event) => {
                const newValue = event.target.value;
                this.handleProfileFieldUpdate(characterName, fieldPath, newValue);
            };
        };

        detailPane.innerHTML = `
            <div class="profile-detail-section">
                <label for="profile-status">状態</label>
                <input type="text" id="profile-status" value="${htmlUtils.escapeAttr(data.status || '')}">
            </div>
            <div class="profile-detail-section">
                <label for="profile-location">現在地</label>
                <input type="text" id="profile-location" value="${htmlUtils.escapeAttr(data.current_location || '')}">
            </div>
            <div class="profile-detail-section">
                <label for="profile-summary">概要</label>
                <textarea id="profile-summary">${htmlUtils.escapeHtml(data.summary || '')}</textarea>
            </div>
            <div class="profile-detail-section">
                <label for="profile-goal">短期目標</label>
                <textarea id="profile-goal">${htmlUtils.escapeHtml(data.short_term_goal || '')}</textarea>
            </div>
            <div class="profile-detail-section">
                <div class="profile-detail-section-header">
                    <label>他キャラクターとの関係</label>
                    <button id="add-relationship-btn" class="add-relationship-btn">＋ 追加</button>
                </div>
                <div id="profile-relationships-grid" class="profile-relationships-grid">
                    ${Object.keys(data.relationships || {}).map((targetName, index) => {
                        const escapedNameHtml = htmlUtils.escapeHtml(targetName);
                        const escapedContext = htmlUtils.escapeHtml(data.relationships[targetName].context || '');
                        const affinity = data.relationships[targetName].affinity || 0;
                        return `
                        <div class="profile-relationship-card" data-rel-index="${index}">
                            <div class="profile-relationship-card-header">
                                <h5>${escapedNameHtml}</h5>
                                <button class="delete-relationship-btn" data-target-name="${htmlUtils.escapeAttr(targetName)}" title="この関係性を削除">
                                    <span class="material-symbols-outlined">delete</span>
                                </button>
                            </div>
                            <label for="affinity-${index}">親密度</label>
                            <input type="number" id="affinity-${index}" value="${affinity}">
                            <label for="context-${index}" style="margin-top:10px;">関係性の文脈</label>
                            <textarea id="context-${index}">${escapedContext}</textarea>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="profile-detail-section profile-delete-character-section">
                <button id="delete-character-btn" class="delete-character-btn">
                    <span class="material-symbols-outlined">person_remove</span>
                    このキャラクターを削除
                </button>
            </div>
        `;

        // イベントリスナーを設定
        detailPane.querySelector('#profile-status').addEventListener('blur', createFieldUpdater(['status']));
        detailPane.querySelector('#profile-location').addEventListener('blur', createFieldUpdater(['current_location']));
        detailPane.querySelector('#profile-summary').addEventListener('blur', createFieldUpdater(['summary']));
        detailPane.querySelector('#profile-goal').addEventListener('blur', createFieldUpdater(['short_term_goal']));
        
        detailPane.querySelector('#add-relationship-btn').addEventListener('click', () => this.addRelationship(characterName));
        detailPane.querySelector('#delete-character-btn').addEventListener('click', () => this.confirmDeleteCharacter(characterName)); // 追加

        Object.keys(data.relationships || {}).forEach((targetName, index) => {
            const card = detailPane.querySelector(`.profile-relationship-card[data-rel-index="${index}"]`);
            if (!card) {
                console.warn(`関係性カードが見つかりません: index=${index}, name=${targetName}`);
                return;
            }
            card.querySelector(`#affinity-${index}`).addEventListener('blur', createFieldUpdater(['relationships', targetName, 'affinity']));
            card.querySelector(`#context-${index}`).addEventListener('blur', createFieldUpdater(['relationships', targetName, 'context']));
            card.querySelector('.delete-relationship-btn').addEventListener('click', (e) => {
                const targetNameFromBtn = e.currentTarget.dataset.targetName;
                this.deleteRelationship(characterName, targetNameFromBtn);
            });
        });
    },




    async handleProfileFieldUpdate(characterName, fieldPath, newValue) {
        const memoryKey = `character_memory_${characterName}`;
        const memory = state.currentPersistentMemory[memoryKey];
        if (!memory) return;

        // パスに基づいて値を更新
        let current = memory;
        for (let i = 0; i < fieldPath.length - 1; i++) {
            current = current[fieldPath[i]];
        }
        const finalKey = fieldPath[fieldPath.length - 1];
        
        // affinityは数値に変換
        if (finalKey === 'affinity') {
            newValue = parseInt(newValue, 10) || 0;
        }

        if (current[finalKey] === newValue) return; // 変更がなければ何もしない

        console.log(`Updating profile for ${characterName}: ${fieldPath.join('.')} = ${newValue}`);
        current[finalKey] = newValue;

        try {
            await dbUtils.saveChat();
        } catch (error) {
            console.error("キャラクタープロファイルの自動保存に失敗:", error);
        }
    },


    async addRelationship(characterName) {
        const targetName = await uiUtils.showCustomPrompt("関係を追加する相手のキャラクター名を入力してください:");
        if (!targetName || !targetName.trim()) return;

        const memoryKey = `character_memory_${characterName}`;
        const memory = state.currentPersistentMemory[memoryKey];
        if (!memory) return;
        if (!memory.relationships) memory.relationships = {};

        if (memory.relationships[targetName]) {
            await uiUtils.showCustomAlert(`キャラクター「${targetName}」との関係は既に存在します。`);
            return;
        }

        // 新しい空の関係を追加
        memory.relationships[targetName] = { affinity: 0, context: "" };
        
        try {
            await dbUtils.saveChat();
            // UIを再描画して新しいカードを表示
            this.renderCharacterDetails(characterName);
        } catch (error) {
            console.error("関係性の追加に失敗:", error);
        }
    },


    async deleteRelationship(characterName, targetName) {
        const confirmed = await uiUtils.showCustomConfirm(`「${characterName}」から「${targetName}」への関係性を削除しますか？`);
        if (!confirmed) return;

        const memoryKey = `character_memory_${characterName}`;
        const memory = state.currentPersistentMemory[memoryKey];
        if (memory && memory.relationships && memory.relationships[targetName]) {
            delete memory.relationships[targetName];
            try {
                await dbUtils.saveChat();
                // UIを再描画してカードを消す
                this.renderCharacterDetails(characterName);
            } catch (error) {
                console.error("関係性の削除に失敗:", error);
            }
        }
    },


    async confirmDeleteCharacter(characterName) {
        const confirmed = await uiUtils.showCustomConfirm(`キャラクター「${characterName}」のすべてのデータを削除しますか？\nこの操作は元に戻せません。`);
        if (!confirmed) return;

        const normalizedCharName = window.normalizeCharacterName(characterName);
        let keyToDelete = null;

        // 正規化された名前で一致するキーを探す
        for (const key in state.currentPersistentMemory) {
            if (key.startsWith('character_memory_')) {
                const existingName = key.replace('character_memory_', '');
                if (window.normalizeCharacterName(existingName) === normalizedCharName) {
                    keyToDelete = key;
                    break;
                }
            }
        }

        if (keyToDelete && state.currentPersistentMemory[keyToDelete]) {
            delete state.currentPersistentMemory[keyToDelete];
            try {
                await dbUtils.saveChat();
                console.log(`キャラクター「${characterName}」のデータを削除しました。`);
                
                // ダイアログを再オープンしてリストを更新
                this.openCharacterProfileDialog();
                // フローティングボタンの状態も更新
                this.updateCharacterProfileButtonVisibility();

            } catch (error) {
                console.error("キャラクターデータの削除に失敗:", error);
                await uiUtils.showCustomAlert("キャラクターデータの削除に失敗しました。");
            }
        } else {
            console.warn(`削除対象のキャラクター「${characterName}」が見つかりませんでした。`);
        }
    },


    async confirmDeleteAsset(assetName) {
        const confirmed = await uiUtils.showCustomConfirm(`アセット「${assetName}」を削除しますか？\nこの操作は元に戻せません。`);
        if (confirmed) {
            try {
                await dbUtils.deleteAsset(assetName);
                console.log(`アセット「${assetName}」を削除しました。`);
                
                // UIを再描画
                this.openAssetManagementDialog();
                // 設定画面のカウント表示も更新
                this.updateAssetCount();

            } catch (error) {
                console.error(`アセット「${assetName}」の削除に失敗:`, error);
                await uiUtils.showCustomAlert("アセットの削除に失敗しました。");
            }
        }
    },


    async confirmDeleteAllAssets() {
        const assets = await dbUtils.getAllAssets();
        if (assets.length === 0) {
            await uiUtils.showCustomAlert("削除するアセットはありません。");
            return;
        }

        const confirmed = await uiUtils.showCustomConfirm(`保存されている ${assets.length} 個のすべてのアセットを削除しますか？\nこの操作は元に戻せません。`);
        if (confirmed) {
            try {
                await new Promise((resolve, reject) => {
                    const request = state.db.transaction('image_assets', 'readwrite').objectStore('image_assets').clear();
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
                console.log("すべてのアセットを削除しました。");
                // 併せて image_store の孤児Blobをクリーンアップ
                try {
                    const activeChats = await dbUtils.getAllChats();
                    const activeImageIds = new Set();
                    (activeChats || []).forEach(chat => {
                        (chat.messages || []).forEach(msg => {
                            (msg.imageIds || []).forEach(id => activeImageIds.add(id));
                        });
                    });

                    await new Promise((resolve, reject) => {
                        const tx = state.db.transaction(IMAGE_STORE, 'readwrite');
                        const store = tx.objectStore(IMAGE_STORE);
                        const getAllKeysReq = store.getAllKeys();
                        getAllKeysReq.onsuccess = () => {
                            const keys = getAllKeysReq.result || [];
                            const orphanIds = keys.filter(id => !activeImageIds.has(id));
                            orphanIds.forEach(id => store.delete(id));
                            tx.oncomplete = resolve;
                            tx.onerror = () => reject(tx.error);
                        };
                        getAllKeysReq.onerror = () => reject(getAllKeysReq.error);
                    });
                    console.log("image_store の孤児Blobをクリーンアップしました。");
                } catch (cleanupErr) {
                    console.warn("image_store クリーンアップ中にエラー:", cleanupErr);
                }
                
                // UIを再描画
                this.openAssetManagementDialog();
                // 設定画面のカウント表示も更新
                this.updateAssetCount();

            } catch (error) {
                console.error("すべてのアセットの削除に失敗:", error);
                await uiUtils.showCustomAlert("すべてのアセットの削除に失敗しました。");
            }
        }
    },



    showAssetConflictDialog: function(assetName) {
        return new Promise(resolve => {
            const dialog = elements.assetConflictDialog;
            elements.assetConflictMessage.textContent = `アセット「${assetName}」は既に存在します。どうしますか？`;
            elements.assetConflictApplyAll.checked = false; // チェックボックスをリセット

            const actionArea = dialog.querySelector('.dialog-actions-main');

            const listener = (event) => {
                const button = event.target.closest('button');
                if (!button) return; // ボタン以外がクリックされた場合は何もしない

                const choice = button.value;
                if (choice) {
                    dialog.close(); // ダイアログを閉じる
                    // リスナーを削除
                    actionArea.removeEventListener('click', listener);
                    // 結果を返す
                    resolve({
                        choice: choice,
                        applyToAll: elements.assetConflictApplyAll.checked
                    });
                }
            };
            
            // 既存のリスナーがあれば念のため削除
            // (dialog.close()で消えるはずだが、安全のため)
            const oldListener = actionArea._listener;
            if (oldListener) {
                actionArea.removeEventListener('click', oldListener);
            }

            actionArea.addEventListener('click', listener);
            actionArea._listener = listener; // リスナーを記憶させておく

            dialog.showModal();
        });
    },


    // --- Stable Diffusion連携機能の本体ロジック ---
    handleStableDiffusionGeneration: async function(args, responseText = '') {
        if (!state.settings.sdApiUrl) {
            return { error: "Stable Diffusion WebUIのURLが設定されていません。" };
        }

        let currentPrompt = args.prompt;
        let generatedImageBlob = null;
        let qualityCheckResult = null;
        const isQcEnabled = state.settings.sdEnableQualityChecker;
        const maxRetries = isQcEnabled ? (state.settings.sdQcRetries || 0) : 0;

        try {
            for (let i = 0; i <= maxRetries; i++) {
                if (i > 0) {
                    uiUtils.setLoadingIndicatorText(`プロンプト改善中... (${i}/${maxRetries})`);
                    currentPrompt = await this._improveSdPrompt(args.prompt, currentPrompt, qualityCheckResult.reason);
                }
                
                uiUtils.setLoadingIndicatorText('SDで画像生成中...');
                const payload = { ...args, prompt: currentPrompt };
                generatedImageBlob = await this.callStableDiffusionApi(payload);

                if (!isQcEnabled) {
                    break;
                }

                uiUtils.setLoadingIndicatorText('品質チェック中...');
                qualityCheckResult = await this.runQualityChecker(generatedImageBlob, currentPrompt, responseText);

                // runQualityCheckerの実行直後に、その結果をログに出力する
                console.log(`[Quality Check Cycle ${i + 1}/${maxRetries + 1}] 判定: ${qualityCheckResult.result}。理由: ${qualityCheckResult.reason || 'N/A'}`);

                if (qualityCheckResult.result === 'OK') {
                    break; 
                } else {
                    if (i >= maxRetries) {
                        throw new Error(`品質チェックが上限回数(${maxRetries}回)に達しました。最後のNG理由: ${qualityCheckResult.reason}`);
                    }
                }
            }

            const imageId = await this.saveImageBlob(generatedImageBlob);

            return {
                success: true,
                message: "Stable Diffusionによる画像の生成と保存に成功しました。",
                _internal_ui_action: {
                    type: "display_generated_images",
                    imageIds: [imageId]
                },
                meta: { ...args, finalPrompt: currentPrompt, qualityCheckResult }
            };

        } catch (error) {
            console.error("[Stable Diffusion] 画像生成プロセスでエラー:", error);
            return { success: false, error: { message: `画像生成エラー: ${error.message}` } };
        }
    },


    async _improveSdPrompt(originalPrompt, failedPrompt, ngReason) {
        const model = state.settings.sdPromptImproveModel;
        const systemPrompt = state.settings.sdPromptImproveSystemPrompt;

        const userPrompt = `元のプロンプト: ${originalPrompt}\n失敗したプロンプト: ${failedPrompt}\n失敗理由: ${ngReason}`;

        const requestBody = {
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { temperature: 0.5 }
        };

        const endpoint = `${GEMINI_API_BASE_URL}${model}:generateContent`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.settings.apiKey },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`プロンプト改善APIエラー (${response.status})`);

        const data = await response.json();
        const improvedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!improvedPrompt) throw new Error("プロンプト改善APIから有効な応答が得られませんでした。");
        
        console.log("[SD Prompt Improver] 改善されたプロンプト:", improvedPrompt);
        return improvedPrompt;
    },


    callStableDiffusionApi: async function(args) {
        const apiUrl = state.settings.sdApiUrl.trim().replace(/\/$/, '');
        const endpoint = `${apiUrl}/sdapi/v1/txt2img`;

        // advanced_params を分離し、残りを mainArgs として受け取る
        const { advanced_params, ...mainArgs } = args;

        // 1. デフォルト値を設定
        // 2. mainArgs で上書き
        // 3. advanced_params でさらに上書き (これにより、どんなパラメータも渡せる)
        const payload = {
            negative_prompt: "",
            seed: -1,
            steps: 25,
            cfg_scale: 7,
            width: 1024,
            height: 1024,
            ...mainArgs,
            ...advanced_params
        };

        // 必須パラメータのチェック
        if (!payload.prompt) {
            throw new Error("必須パラメータ 'prompt' が指定されていません。");
        }

        // Hires. fixが有効な場合のdenoising_strengthのフォールバック処理
        if (payload.enable_hr === true && payload.denoising_strength === undefined) {
            payload.denoising_strength = 0.7;
            console.log("[Stable Diffusion] Hires. fixが有効ですがdenoising_strengthが未指定のため、デフォルト値の0.7を設定しました。");
        }
        
        // sd_model_checkpoint を override_settings に移動する後処理
        if (payload.sd_model_checkpoint) {
            if (!payload.override_settings) {
                payload.override_settings = {};
            }
            if (!payload.override_settings.sd_model_checkpoint) {
                payload.override_settings.sd_model_checkpoint = payload.sd_model_checkpoint;
            }
            delete payload.sd_model_checkpoint; // トップレベルのキーは削除
        }

        const headers = { 'Content-Type': 'application/json' };
        if (state.settings.sdApiUser && state.settings.sdApiPassword) {
            headers['Authorization'] = 'Basic ' + btoa(`${state.settings.sdApiUser}:${state.settings.sdApiPassword}`);
        }

        console.log("[Stable Diffusion] APIリクエスト送信:", endpoint, payload);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMsg = `APIエラー (${response.status})`;
            try {
                const errorJson = await response.json();
                errorMsg += `: ${errorJson.detail || JSON.stringify(errorJson)}`;
            } catch (e) { /* ignore */ }
            throw new Error(errorMsg);
        }

        const result = await response.json();
        if (!result.images || result.images.length === 0) {
            throw new Error("APIからの応答に画像データが含まれていませんでした。");
        }

        const base64Image = result.images[0];
        return await this.base64ToBlob(base64Image, 'image/png');
    },


    handleNovelAIGeneration: async function(args) {
        if (!state.settings.novelaiApiKey) {
            return { error: "NovelAI APIトークンが設定されていません。設定画面で追加してください。" };
        }
        try {
            uiUtils.setLoadingIndicatorText('NovelAIで画像生成中...');
            const imageBlob = await this.callNovelAIApi(args);
            const imageId = await this.saveImageBlob(imageBlob);
            return {
                success: true,
                message: "NovelAIによる画像の生成と保存に成功しました。",
                _internal_ui_action: { type: "display_generated_images", imageIds: [imageId] }
            };
        } catch (error) {
            console.error("[NovelAI] 画像生成エラー:", error);
            const msg = error.message || String(error);
            await uiUtils.showCustomAlert(`NovelAI画像生成エラー:\n${msg}`);
            return { success: false, error: { message: `NovelAI画像生成エラー: ${msg}` } };
        }
    },


    callNovelAIApi: async function(args) {
        const endpoint = 'https://image.novelai.net/ai/generate-image';
        const model = state.settings.novelaiModel || 'nai-diffusion-4-5-curated';
        // v4/v4.5モデルはparams_version:3が必要
        const isV4 = model.includes('4');
        const qualityPrefix = '{{masterpiece}}, {{best quality}}, {{highres}}, extremely detailed, anime style 2026, vibrant colors, sharp lines, highly detailed, 8k, ultra-detailed, intricate details, professional, detailed skin texture, individual hair strands, realistic cloth folds, glistening sweat droplets, volumetric lighting, cinematic lighting, rim light, dramatic shadows, atmospheric, beautiful face, detailed eyes with glossy highlights';
        const finalPrompt = args.prompt ? `${qualityPrefix}, ${args.prompt}` : qualityPrefix;
        const negPrompt = args.negative_prompt || 'worst quality, lowres, blurry, deformed, ugly, mutated hands, extra limbs, poorly drawn face, bad anatomy, watermark, text, signature';
        const payload = {
            input: finalPrompt,
            model: model,
            action: 'generate',
            parameters: {
                params_version: isV4 ? 3 : 1,
                width: args.width || 832,
                height: args.height || 1216,
                scale: 5.0,
                sampler: 'k_euler_ancestral',
                steps: 28,
                n_samples: 1,
                ucPreset: 0,
                qualityToggle: isV4 ? true : false,
                sm: false,
                sm_dyn: false,
                dynamic_thresholding: false,
                cfg_rescale: 0,
                noise_schedule: isV4 ? 'karras' : 'native',
                legacy: false,
                legacy_v3_extend: false,
                negative_prompt: negPrompt,
                seed: Math.floor(Math.random() * 4294967295),
                reference_image_multiple: [],
                reference_strength_multiple: [],
                ...(isV4 ? {
                    v4_prompt: {
                        caption: { base_caption: finalPrompt, char_captions: [] },
                        use_coords: false,
                        use_order: true
                    },
                    v4_negative_prompt: {
                        caption: { base_caption: negPrompt, char_captions: [] },
                        use_coords: false,
                        use_order: true
                    },
                    characterPrompts: [],
                    prefer_brownian: true,
                    deliberate_euler_ancestral_bug: false,
                    add_original_image: true,
                    reference_information_extracted_multiple: []
                } : {})
            }
        };
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.settings.novelaiApiKey}`
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            let errorMsg = `NovelAI APIエラー (${response.status})`;
            try { const j = await response.json(); errorMsg += `: ${j.message || JSON.stringify(j)}`; } catch {}
            throw new Error(errorMsg);
        }
        // レスポンスはZIPファイル → JSZipで展開
        const zipBlob = await response.blob();
        if (!window.JSZip) {
            await new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                s.onload = resolve; s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        const zip = await window.JSZip.loadAsync(zipBlob);
        const files = Object.values(zip.files).filter(f => !f.dir);
        if (files.length === 0) throw new Error("ZIPファイルに画像が見つかりませんでした。");
        return await files[0].async('blob');
    },


    runQualityChecker: async function(imageBlob, prompt, responseText = '') {
        const qcModel = state.settings.sdQcModel;
        const qcSystemPrompt = state.settings.sdQcPrompt
            .replace('{prompt}', prompt || '(プロンプトなし)')
            .replace('{response_text}', responseText || '(応答文なし)');
        
        const imageBase64 = await this.fileToBase64(imageBlob);

        const requestBody = {
            contents: [{
                parts: [
                    { text: qcSystemPrompt },
                    { inlineData: { mimeType: 'image/png', data: imageBase64 } }
                ]
            }],
            generationConfig: { temperature: 0.1 }
        };

        const endpoint = `${GEMINI_API_BASE_URL}${qcModel}:generateContent`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.settings.apiKey },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`品質チェックAPIエラー (${response.status})`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (text.includes('Result: OK')) {
            return { result: 'OK', reason: '' };
        } else {
            const reasonMatch = text.match(/Reason:\s*(.*)/);
            return { result: 'NG', reason: reasonMatch ? reasonMatch[1] : '理由不明' };
        }
    }
};
