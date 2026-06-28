// dbUtils（Phase 1 で app.js から抽出）。挙動は不変。
import { CHATS_STORE, CHAT_CREATEDAT_INDEX, CHAT_UPDATEDAT_INDEX, DB_NAME, DB_VERSION, IMAGE_STORE, PROFILES_STORE, PROJECTS_STORE, SETTINGS_STORE } from './constants.js';
import { applyDbMigrations } from './db-migrations.js';
import { appLogic } from './app-logic.js';
import { state } from './state.js';
import { uiUtils } from './ui.js';

export const dbUtils = {
    openDB() {
        return new Promise((resolve, reject) => {
            if (state.db) {
                resolve(state.db);
                return;
            }
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onblocked = (event) => {
                console.warn("IndexedDBのバージョンアップがブロックされました。古い接続が残っています。", event);
                // ユーザーに具体的な対処法を案内する
                uiUtils.showCustomAlert(
                    "アプリの更新が他のチャットセッションのタブによってブロックされています。\n\n" +
                    "このアプリを開いている他のタブを閉じてから、" +
                    "このタブを再読み込み（リロード）してください。"
                );
                // ここではrejectしないことで、ユーザーが対処する時間を与える
            };

            request.onerror = (event) => {
                console.error("IndexedDBエラー:", event.target.error);
                reject(`IndexedDBエラー: ${event.target.error}`);
            };

            request.onsuccess = (event) => {
                state.db = event.target.result;
                console.log("IndexedDBオープン成功");
                state.db.onerror = (event) => {
                    console.error(`データベースエラー: ${event.target.error}`);
                };
                resolve(state.db);
            };

            request.onupgradeneeded = (event) => {
                applyDbMigrations(event.target.result, event.target.transaction, event, {
                    settingsDefaults: state.settings,
                    migrateImageData: () => appLogic.migrateImageData(),
                });
            };
        });
    },



    // 指定されたストアを取得する内部関数
    _getStore(storeName, mode = 'readonly') {
        if (!state.db) throw new Error("データベースが開かれていません");
        const transaction = state.db.transaction([storeName], mode);

        return transaction.objectStore(storeName);
    },

    // 設定を保存
    async saveSetting(key, value) {
        await this.openDB();
        return new Promise((resolve, reject) => {
             try {
                console.log(`[DEBUG] saveSetting: key='${key}' の保存トランザクションを開始します。`);
                const transaction = state.db.transaction([SETTINGS_STORE], 'readwrite');
                const store = transaction.objectStore(SETTINGS_STORE);
                
                store.put({ key, value });

                transaction.oncomplete = () => {
                    console.log(`[DEBUG] saveSetting: key='${key}' のトランザクションが正常に完了しました。`);
                    resolve();
                };
                transaction.onerror = (event) => {
                     console.error(`[DEBUG] saveSetting: key='${key}' のトランザクションエラー:`, event.target.error);
                     reject(event.target.error);
                };
            } catch (error) {
                console.error(`[DEBUG] saveSetting: ストアアクセスエラー:`, error);
                reject(error);
            }
        });
    },

    async saveChat(optionalTitle = null, chatObjectToSave = null, options = {}) {
        await this.openDB();
    
        let messagesForStats = [];
        let chatDataToSave;
    
        if (!chatObjectToSave) {
            if ((!state.currentMessages || state.currentMessages.length === 0) && !state.currentSystemPrompt) {
                if(state.currentChatId) console.log(`saveChat: 既存チャット ${state.currentChatId} にメッセージもシステムプロンプトもないため保存せず`);
                else console.log("saveChat: 新規チャットに保存するメッセージもシステムプロンプトもなし");
                return state.currentChatId;
            }

            const messagesToSave = state.currentMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                thoughtSummary: msg.thoughtSummary || null,
                tool_calls: msg.tool_calls || null,
                imageIds: msg.imageIds,
                finishReason: msg.finishReason,
                safetyRatings: msg.safetyRatings,
                error: msg.error,
                isCascaded: msg.isCascaded,
                isSelected: msg.isSelected,
                siblingGroupId: msg.siblingGroupId,
                groundingMetadata: msg.groundingMetadata,
                // attachments を安全にコピーし、file オブジェクトのみ除外する
                attachments: msg.attachments ? msg.attachments.map(att => ({
                    name: att.name,
                    mimeType: att.mimeType,
                    base64Data: att.base64Data,
                    assetId: att.assetId
                })) : undefined,
                usageMetadata: msg.usageMetadata,
                modelName: msg.modelName,
                executedFunctions: msg.executedFunctions,
                generated_images: msg.generated_images,
                generated_videos: msg.generated_videos ? msg.generated_videos.map(video => ({
                        base64Data: video.base64Data,
                        prompt: video.prompt
                    })) : undefined,
                isHidden: msg.isHidden,
                isAutoTrigger: msg.isAutoTrigger
            }));

            messagesForStats = messagesToSave;
    
            chatDataToSave = {
                messages: messagesToSave,
                systemPrompt: state.currentSystemPrompt,
                persistentMemory: state.currentPersistentMemory || {},
                summarizedContext: state.currentSummarizedContext || null,
                isMemoryEnabledForChat: state.isMemoryEnabledForChat,
            };
        } else {
            messagesForStats = chatObjectToSave.messages || [];
            chatDataToSave = chatObjectToSave;
        }
    
        const stats = await this._calculateChatStats(messagesForStats);
    
        return new Promise((resolve, reject) => {
            try {
                const transaction = state.db.transaction([CHATS_STORE], 'readwrite');
                const store = transaction.objectStore(CHATS_STORE);
                const now = Date.now();
    
                const processSave = (existingChatData = null) => {
                    let title;
                    if (optionalTitle !== null) {
                        title = optionalTitle;
                    } else if (existingChatData && existingChatData.title) {
                        title = existingChatData.title;
                    } else {
                        const firstUserMessage = (chatDataToSave.messages || []).find(m => m.role === 'user' && !m.isHidden);
                        title = firstUserMessage ? firstUserMessage.content.substring(0, 50) : "無題のチャット";
                    }
    
                    const chatIdForOperation = existingChatData ? existingChatData.id : state.currentChatId;
                    const finalChatData = {
                        ...chatDataToSave,
                        updatedAt: chatObjectToSave && chatObjectToSave.updatedAt ? chatObjectToSave.updatedAt : now,
                        createdAt: existingChatData ? existingChatData.createdAt : now,
                        title: title,
                        stats: stats
                    };
                    if (chatIdForOperation) {
                        finalChatData.id = chatIdForOperation;
                    }
                    // projectIdを保持・注入 (既存値を優先、なければアクティブプロジェクトを使用)
                    const inheritedProjectId = (chatDataToSave && chatDataToSave.projectId) || (existingChatData && existingChatData.projectId);
                    if (inheritedProjectId) {
                        finalChatData.projectId = inheritedProjectId;
                    } else if (window.state && window.state.activeProjectId) {
                        finalChatData.projectId = window.state.activeProjectId;
                    }
    
                    const putRequest = store.put(finalChatData);
                    putRequest.onsuccess = (event) => {
                        const savedId = event.target.result;
                        if (!state.currentChatId && savedId) {
                            state.currentChatId = savedId;
                        }
                        console.log(`チャット ${state.currentChatId ? '更新' : '保存'} 完了 ID:`, state.currentChatId || savedId);
                        if ((state.currentChatId || savedId) === (chatIdForOperation || savedId)) {
                            uiUtils.updateChatTitle(finalChatData.title);
                        }
                        if (!options.skipPush) {
                            appLogic.markAsDirtyAndSchedulePush();
                        }
                    };
                    putRequest.onerror = (event) => {
                        console.error("チャット保存(put)エラー:", event.target.error);
                    };
                };
    
                if (state.currentChatId && !chatObjectToSave) {
                    const getRequest = store.get(state.currentChatId);
                    getRequest.onsuccess = (event) => {
                        const existingChat = event.target.result;
                        if (!existingChat) {
                            console.warn(`ID ${state.currentChatId} のチャットが見つかりません(保存時)。新規として保存します。`);
                            state.currentChatId = null;
                        }
                        processSave(existingChat);
                    };
                    getRequest.onerror = (event) => {
                        console.error("既存チャットの取得エラー(更新用):", event.target.error);
                        state.currentChatId = null;
                        processSave(null);
                    };
                } else {
                    processSave(chatObjectToSave);
                }
    
                transaction.oncomplete = () => {
                    resolve(state.currentChatId);
                };
                transaction.onerror = (event) => {
                    console.error("チャット保存トランザクション失敗:", event.target.error);
                    reject(new Error(`チャット保存トランザクション失敗: ${event.target.error.message}`));
                };
    
            } catch (error) {
                console.error("チャット保存処理の開始に失敗:", error);
                reject(error);
            }
        });
    },

    async _calculateChatStats(messages) {
        if (!messages) return null;

        let totalTokens = 0;
        let inputTokens = 0;
        let outputTokens = 0;
        const assetIds = new Set();
        let totalAssetSize = 0;
        let attachmentCount = 0;

        messages.forEach(msg => {
            // トークン数を集計
            if (msg.usageMetadata) {
                if (typeof msg.usageMetadata.totalTokenCount === 'number') {
                    totalTokens += msg.usageMetadata.totalTokenCount;
                }
                if (typeof msg.usageMetadata.promptTokenCount === 'number') {
                    inputTokens += msg.usageMetadata.promptTokenCount;
                }
                if (typeof msg.usageMetadata.candidatesTokenCount === 'number') {
                    outputTokens += msg.usageMetadata.candidatesTokenCount;
                }
            }
            // 生成された画像IDを収集
            if (msg.imageIds) {
                msg.imageIds.forEach(id => assetIds.add(id));
            }
            // 添付ファイルの情報を収集
            if (msg.attachments) {
                attachmentCount += msg.attachments.length;
                msg.attachments.forEach(att => {
                    if (att.base64Data) {
                        // Base64文字列の長さの約3/4が元のバイトサイズ
                        totalAssetSize += Math.ceil(att.base64Data.length * 0.75);
                    }
                });
            }
        });

        // imageIds に基づいて image_store から実際のBlobサイズを取得して加算
        if (assetIds.size > 0) {
            await this.openDB();
            const store = this._getStore(IMAGE_STORE);
            const imagePromises = Array.from(assetIds).map(id => {
                return new Promise((resolve) => {
                    const request = store.get(id);
                    request.onsuccess = (event) => {
                        if (event.target.result && event.target.result.blob instanceof Blob) {
                            resolve(event.target.result.blob.size);
                        } else {
                            resolve(0);
                        }
                    };
                    request.onerror = () => resolve(0); // エラー時は0として扱う
                });
            });
            const sizes = await Promise.all(imagePromises);
            totalAssetSize += sizes.reduce((sum, size) => sum + size, 0);
        }

        return {
            totalTokens: totalTokens,
            inputTokens: inputTokens,
            outputTokens: outputTokens,
            assetCount: assetIds.size + attachmentCount,
            totalAssetSize: totalAssetSize
        };
    },

    // チャットタイトルをDBで更新
    async updateChatTitleDb(id, newTitle) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE, 'readwrite');
            const getRequest = store.get(id);
            getRequest.onsuccess = (event) => {
                const chatData = event.target.result;
                if (chatData) {
                    chatData.title = newTitle;
                    chatData.updatedAt = Date.now(); // 更新日時も更新
                    const putRequest = store.put(chatData);
                    putRequest.onsuccess = () => {
                        appLogic.markAsDirtyAndSchedulePush(true);
                        resolve();
                    };
                    putRequest.onerror = (event) => reject(`タイトル更新エラー: ${event.target.error}`);
                } else {
                    reject(`チャットが見つかりません: ${id}`);
                }
            };
            getRequest.onerror = (event) => reject(`タイトル更新用チャット取得エラー: ${event.target.error}`);
            store.transaction.onerror = (event) => reject(`タイトル更新トランザクション失敗: ${event.target.error}`);
        });
    },

    // 指定IDのチャットを取得
    async getChat(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE);
            const request = store.get(id);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`チャット ${id} 取得エラー: ${event.target.error}`);
        });
    },

    // 全チャットを取得 (ソート順指定可)
    async getAllChats(sortBy = 'updatedAt') {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(CHATS_STORE);
            const indexName = sortBy === 'createdAt' ? CHAT_CREATEDAT_INDEX : CHAT_UPDATEDAT_INDEX;
            // インデックスが存在するか確認
            if (!store.indexNames.contains(indexName)) {
                 console.error(`インデックス "${indexName}" が見つかりません。主キー順でフォールバックします。`);
                 // フォールバック: 主キー順で取得して逆順にする
                 const getAllRequest = store.getAll();
                 getAllRequest.onsuccess = (event) => resolve(event.target.result.reverse()); // 新しいものが上に来るように
                 getAllRequest.onerror = (event) => reject(`全チャット取得エラー(フォールバック): ${event.target.error}`);
                 return;
            }
            // インデックスを使ってカーソルを開く (降順)
            const index = store.index(indexName);
            const request = index.openCursor(null, 'prev'); // 'prev'で降順
            const chats = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    chats.push(cursor.value);
                    cursor.continue();
                } else {
                    // カーソル終了
                    resolve(chats);
                }
            };
            request.onerror = (event) => reject(`全チャット取得エラー (${sortBy}順): ${event.target.error}`);
        });
    },

    // 指定IDのチャットを削除
    async deleteChat(id) {
        await this.openDB();
        
        // Step 1: 削除対象のチャットから画像IDを収集
        const chatToDelete = await this.getChat(id);
        const imageIdsToDelete = new Set();
        if (chatToDelete && chatToDelete.messages) {
            chatToDelete.messages.forEach(message => {
                (message.imageIds || []).forEach(imgId => imageIdsToDelete.add(imgId));
            });
        }

        // Step 2: 他のチャットで同じ画像IDが使われていないか確認 (安全対策)
        const allOtherChats = (await this.getAllChats()).filter(chat => chat.id !== id);
        const activeImageIdsInOtherChats = new Set();
        allOtherChats.forEach(chat => {
            (chat.messages || []).forEach(message => {
                (message.imageIds || []).forEach(imgId => activeImageIdsInOtherChats.add(imgId));
            });
        });

        const finalImageIdsToDelete = [...imageIdsToDelete].filter(id => !activeImageIdsInOtherChats.has(id));

        // Step 3: トランザクション内でチャットと画像の削除を実行
        return new Promise((resolve, reject) => {
            const storeNames = [CHATS_STORE];
            if (finalImageIdsToDelete.length > 0) {
                storeNames.push(IMAGE_STORE);
            }
            
            const transaction = state.db.transaction(storeNames, 'readwrite');
            const chatStore = transaction.objectStore(CHATS_STORE);

            // チャットを削除
            chatStore.delete(id);

            // 孤立した画像を削除
            if (finalImageIdsToDelete.length > 0) {
                const imageStore = transaction.objectStore(IMAGE_STORE);
                console.log(`[Delete Chat] チャット(ID:${id})に関連する ${finalImageIdsToDelete.length}件の画像をimage_storeから削除します。`);
                finalImageIdsToDelete.forEach(imgId => imageStore.delete(imgId));
            }

            transaction.oncomplete = () => {
                console.log(`チャット削除完了 (ID: ${id})`);
                appLogic.markAsDirtyAndSchedulePush(true);
                resolve();
            };
            transaction.onerror = (event) => {
                console.error(`チャット(ID:${id})の削除トランザクション中にエラー:`, event.target.error);
                reject(`チャット ${id} 削除エラー: ${event.target.error}`);
            };
        });
    },


    // 全データ (設定とチャット) をクリア
    async clearAllData() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            // DBに存在するすべてのストア名をトランザクションの対象にする
            const storeNames = Array.from(state.db.objectStoreNames);
            if (storeNames.length === 0) {
                console.log("クリア対象のストアが存在しません。");
                resolve();
                return;
            }
            
            console.log(`以下のストアをクリアします: ${storeNames.join(', ')}`);
            const transaction = state.db.transaction(storeNames, 'readwrite');
            let storesCleared = 0;
            const totalStores = storeNames.length;

            transaction.oncomplete = () => {
                console.log("IndexedDBの全データ削除完了");
                resolve();
            };
            transaction.onerror = (event) => {
                reject(`データクリアトランザクション失敗: ${event.target.error}`);
            };

            // 各ストアに対してクリア処理を実行
            storeNames.forEach(storeName => {
                const request = transaction.objectStore(storeName).clear();
                request.onerror = (event) => {
                    console.error(`${storeName} のクリア中にエラー:`, event.target.error);
                };
            });
        });
    },

    async getSetting(key) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            try {
                const store = this._getStore(SETTINGS_STORE);
                const request = store.get(key);
                request.onsuccess = (event) => {
                    resolve(event.target.result);
                };
                request.onerror = (event) => {
                    reject(event.target.error);
                };
            } catch (e) {
                reject(e);
            }
        });
    },

    async addProfile(profile) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE, 'readwrite');
            const request = store.add(profile);
            request.onsuccess = (event) => {
                console.log(`[DB] プロファイルを新規追加しました (ID: ${event.target.result})`);
                resolve(event.target.result);
            };
            request.onerror = (event) => reject(`プロファイル追加エラー: ${event.target.error}`);
        });
    },

    async getProfile(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE);
            const request = store.get(id);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`プロファイル(ID: ${id})取得エラー: ${event.target.error}`);
        });
    },

    async getAllProfiles() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE);
            const request = store.getAll();
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`全プロファイル取得エラー: ${event.target.error}`);
        });
    },

    async updateProfile(profile) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE, 'readwrite');
            const request = store.put(profile);
            request.onsuccess = () => {
                console.log(`[DB] プロファイルを更新しました (ID: ${profile.id})`);
                resolve();
            };
            request.onerror = (event) => reject(`プロファイル(ID: ${profile.id})更新エラー: ${event.target.error}`);
        });
    },

    async deleteProfile(id) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore(PROFILES_STORE, 'readwrite');
            const request = store.delete(id);
            request.onsuccess = () => {
                console.log(`[DB] プロファイルを削除しました (ID: ${id})`);
                resolve();
            };
            request.onerror = (event) => reject(`プロファイル(ID: ${id})削除エラー: ${event.target.error}`);
        });
    },

    async getAsset(name) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore('image_assets');
            const request = store.get(name);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`アセット ${name} 取得エラー: ${event.target.error}`);
        });
    },


    async getAllAssets() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore('image_assets');
            const request = store.getAll();
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`全アセット取得エラー: ${event.target.error}`);
        });
    },

    // image_assets ストアへアセット（{ name, blob, createdAt }）を保存/上書き。
    async saveAsset(asset) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore('image_assets', 'readwrite');
            const request = store.put(asset);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`アセット ${asset?.name} 保存エラー: ${event.target.error}`);
        });
    },

    async deleteAsset(name) {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore('image_assets', 'readwrite');
            const request = store.delete(name);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(`アセット ${name} 削除エラー: ${event.target.error}`);
        });
    },
    async getMemory(profileId) {
        if (!profileId) return null;
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore('memory_store');
            const request = store.get(profileId);
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`メモリ(ID: ${profileId})取得エラー: ${event.target.error}`);
        });
    },

    async saveMemory(profileId, memoryData) {
        if (!profileId) return Promise.reject("プロファイルIDが必要です。");
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore('memory_store', 'readwrite');
            const dataToSave = { profileId, ...memoryData };
            const request = store.put(dataToSave);
            request.onsuccess = () => {
                console.log(`[DB] メモリを保存しました (ID: ${profileId})`);
                resolve();
            };
            request.onerror = (event) => reject(`メモリ(ID: ${profileId})保存エラー: ${event.target.error}`);
        });
    },
    async getAllMemories() {
        await this.openDB();
        return new Promise((resolve, reject) => {
            const store = this._getStore('memory_store');
            const request = store.getAll();
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(`全メモリ取得エラー: ${event.target.error}`);
        });
    },

    /**
     * [V2] メタデータを受け取り、アセットをDLしてからDBをクリア＆インポートする
     */
     async clearAndImportData(data, localAssetsBeforeClear, downloadedAssets, requiredAssetIds) {
        console.log("[DB Import V2] 安全なデータインポート処理を開始します。");
        uiUtils.showProgressDialog('データベースを準備中...');

        const { profiles, chats, memories, projects, assets, settings } = data;
        
        const allAvailableAssets = new Map([...localAssetsBeforeClear, ...downloadedAssets]);
        console.log(`[DB Import V2] 利用可能なアセットの完全なマップを作成しました: ${allAvailableAssets.size}件`);

        // 欠落しているアセットIDを記録するオブジェクト（チャット単位）
        const missingAssetInfo = {};

        (chats || []).forEach(chat => {
            const missingIdsForThisChat = new Set();
            (chat.messages || []).forEach(message => {
                if (Array.isArray(message.imageIds) && message.imageIds.length > 0) {
                    message.imageIds.forEach(id => {
                        if (id && !allAvailableAssets.has(id)) {
                            missingIdsForThisChat.add(id);
                        }
                    });
                }
            });
            if (missingIdsForThisChat.size > 0) {
                const key = chat.title || `ID:${chat.id}`;
                missingAssetInfo[key] = [...missingIdsForThisChat];
            }
        });

        if (Object.keys(missingAssetInfo).length > 0) {
            console.error("[DB Import V2] 必要な画像アセットの一部が見つからないため、インポートを中止します。", missingAssetInfo);
            const error = new Error("必要な画像アセットのダウンロードに失敗したため、データのインポートを中止しました。再度同期をお試しください。");
            error.code = 'MISSING_ASSETS';
            error.missingAssetInfo = missingAssetInfo;
            throw error;
        }

        const profilesWithBlobs = (profiles || []).map(p => {
            if (p.iconAssetId && allAvailableAssets.has(p.iconAssetId)) {
                p.icon = allAvailableAssets.get(p.iconAssetId);
            }
            return p;
        });
        const assetsWithBlobs = (assets || []).map(a => ({
            name: a.name,
            assetId: a.assetId,
            blob: allAvailableAssets.get(a.assetId),
            createdAt: a.createdAt
        })).filter(a => a.blob);

        const imagesWithBlobs = [];
        requiredAssetIds.forEach(id => {
            if (allAvailableAssets.has(id)) {
                imagesWithBlobs.push({
                    id: id,
                    blob: allAvailableAssets.get(id),
                    createdAt: new Date()
                });
            }
        });
        
        const tempStoreNames = [
            `${PROFILES_STORE}_temp`, `${CHATS_STORE}_temp`, `${SETTINGS_STORE}_temp`,
            `${IMAGE_STORE}_temp`, 'image_assets_temp', 'memory_store_temp', 'projects_temp'
        ];
        const mainStoreNames = [
            PROFILES_STORE, CHATS_STORE, SETTINGS_STORE,
            IMAGE_STORE, 'image_assets', 'memory_store', PROJECTS_STORE
        ];

        const currentTokens = await dbUtils.getSetting('dropboxTokens');

        try {
            uiUtils.updateProgressMessage('データを一時領域にインポート中...');
            const tempTx = state.db.transaction(tempStoreNames, 'readwrite');
            const tempStores = {
                'profiles_temp': profilesWithBlobs,
                'chats_temp': chats || [],
                'memory_store_temp': memories || [],
                'projects_temp': projects || [],
                'image_assets_temp': assetsWithBlobs,
                'image_store_temp': imagesWithBlobs,
                'settings_temp': settings || []
            };

            const tempClearPromises = tempStoreNames.map(name => {
                return new Promise((resolve, reject) => {
                    const request = tempTx.objectStore(name).clear();
                    request.onsuccess = resolve;
                    request.onerror = () => reject(request.error);
                });
            });
            await Promise.all(tempClearPromises);

            for (const storeName in tempStores) {
                const store = tempTx.objectStore(storeName);
                (tempStores[storeName] || []).forEach(item => store.put(item));
            }
            
            await new Promise((resolve, reject) => {
                tempTx.oncomplete = resolve;
                tempTx.onerror = () => reject(tempTx.error);
            });
            console.log("[DB Import V2] 一時ストアへのデータ書き込みが完了しました。");

            uiUtils.updateProgressMessage('データベースを更新中...');
            const mainTx = state.db.transaction([...mainStoreNames, ...tempStoreNames], 'readwrite');
            
            const mainClearPromises = mainStoreNames.map(name => {
                return new Promise((resolve, reject) => {
                    const request = mainTx.objectStore(name).clear();
                    request.onsuccess = resolve;
                    request.onerror = () => reject(request.error);
                });
            });
            await Promise.all(mainClearPromises);

            for (let i = 0; i < mainStoreNames.length; i++) {
                const mainStore = mainTx.objectStore(mainStoreNames[i]);
                const tempStore = mainTx.objectStore(tempStoreNames[i]);
                const allTempItemsReq = tempStore.getAll();
                allTempItemsReq.onsuccess = () => {
                    allTempItemsReq.result.forEach(item => mainStore.put(item));
                };
            }
            
            const tempClearPromises2 = tempStoreNames.map(name => {
                return new Promise((resolve, reject) => {
                    const request = mainTx.objectStore(name).clear();
                    request.onsuccess = resolve;
                    request.onerror = () => reject(request.error);
                });
            });
            await Promise.all(tempClearPromises2);

            if (currentTokens) {
                mainTx.objectStore(SETTINGS_STORE).put(currentTokens);
            }

            await new Promise((resolve, reject) => {
                mainTx.oncomplete = resolve;
                mainTx.onerror = () => reject(mainTx.error);
            });
            console.log("[DB Import V2] メインデータベースの更新が正常に完了しました。");

            // 処理結果を返す
            return { removedAssetInfo: missingAssetInfo };

        } catch (error) {
            console.error("[DB Import V2] 安全なインポート処理中にエラーが発生しました:", error);
            try {
                const cleanupTx = state.db.transaction(tempStoreNames, 'readwrite');
                const cleanupPromises = tempStoreNames.map(name => {
                    return new Promise((resolve, reject) => {
                        const request = cleanupTx.objectStore(name).clear();
                        request.onsuccess = resolve;
                        request.onerror = () => reject(request.error);
                    });
                });
                await Promise.all(cleanupPromises);
            } catch (cleanupError) {
                console.error("[DB Import V2] エラー後のクリーンアップに失敗:", cleanupError);
            }
            throw error;
        }
    },
};
