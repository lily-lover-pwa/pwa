// appLogic 機能モジュール: chat（Phase 3 で app-logic.js から分割）。挙動は不変。
import { CHATS_STORE, DEEPSEEK_API_BASE_URL, DEFAULT_DEEPSEEK_MODEL, DUPLICATE_SUFFIX, GEMINI_API_BASE_URL, GROQ_API_BASE_URL, IMPORT_PREFIX, MISTRAL_API_BASE_URL, OPENROUTER_API_BASE_URL, SAKANA_API_BASE_URL, XAI_API_BASE_URL, ZAI_API_BASE_URL } from '../constants.js';
import { dbUtils } from '../db.js';
import { elements } from '../dom-elements.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';

export const chatMethods = {
    // --- スワイプ処理ここまで ---


    // 新規チャット開始の確認と実行
    async confirmStartNewChat() {
        const confirmed = await uiUtils.showCustomConfirm("現在のチャットを保存して新規チャットを開始しますか？");
        if (!confirmed) {
            console.log("新規チャットの開始をキャンセルしました。");
            return;
        }

        // 送信中なら中断
        if (state.isSending) {
            this.abortRequest();
        }
        // 編集中なら破棄
        if (state.editingMessageIndex !== null) {
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        // システムプロンプト編集中なら破棄
        if (state.isEditingSystemPrompt) {
            this.cancelEditSystemPrompt();
        }
        // 保留中の添付ファイルがあれば破棄
        if (state.pendingAttachments.length > 0) {
            state.pendingAttachments = [];
            uiUtils.updateAttachmentBadgeVisibility();
        }
        
        try {
            // 現在のチャットに保存すべき内容があれば保存する
            if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId) {
                await dbUtils.saveChat();
            }
        } catch (error) {
            console.error("新規チャット開始前のチャット保存失敗:", error);
            // 保存に失敗しても、ユーザーは新規チャットを望んでいるので処理は続行
            await uiUtils.showCustomAlert("現在のチャットの保存に失敗しました。");
        }

        // 新規チャットを開始
        this.startNewChat();
        uiUtils.showScreen('chat');
    },


    // 新規チャットを開始する (状態リセット)
    startNewChat() {
        state.pendingCascadeResponses = null; // 保留中のカスケードデータをクリア
        state.currentChatId = null;
        state.currentMessages = [];
        state.currentSystemPrompt = state.settings.systemPrompt || ''; 
        state.pendingAttachments = [];
        state.currentPersistentMemory = {};
        state.currentSummarizedContext = null;
        state.isMemoryEnabledForChat = true; // 新規チャットではデフォルトで有効
        state.syncMessageCounter = 0;
        this.toggleMemoryIconVisibility();
        state.currentScene = { scene_id: "initial", location: "不明な場所" };
        uiUtils.updateSystemPromptUI();
        uiUtils.renderChatMessages();
        uiUtils.updateChatTitle();
        elements.userInput.value = '';
        uiUtils.adjustTextareaHeight();
        uiUtils.setSendingState(false);
        this.updateCharacterProfileButtonVisibility();
        state.currentStyleProfiles = {};
    },



    // app.js の appLogic オブジェクト内
    async loadChat(id) {
        state.pendingCascadeResponses = null; // 保留中のカスケードデータをクリア
        const loadChatStartTime = performance.now();
        state.syncMessageCounter = 0;

        state.currentMessages = [];

        if (state.isSending) {
            const confirmed = await uiUtils.showCustomConfirm("送信中です。中断して別のチャットを読み込みますか？");
            if (!confirmed) return;
            this.abortRequest();
        }
        if (state.editingMessageIndex !== null) {
            const confirmed = await uiUtils.showCustomConfirm("編集中です。変更を破棄して別のチャットを読み込みますか？");
            if (!confirmed) return;
            const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
            this.cancelEditMessage(state.editingMessageIndex, msgEl);
        }
        if (state.isEditingSystemPrompt) {
            const confirmed = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄して別のチャットを読み込みますか？");
            if (!confirmed) return;
            this.cancelEditSystemPrompt();
        }
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄して別のチャットを読み込みますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = [];
            uiUtils.updateAttachmentBadgeVisibility();
        }

        try {
            const dbGetStartTime = performance.now();
            const chat = await dbUtils.getChat(id);
            const dbGetEndTime = performance.now();
            
            if (chat) {
                state.currentChatId = chat.id;
                state.currentMessages = chat.messages?.map(msg => ({
                    ...msg,
                    attachments: msg.attachments || []
                })) || [];
                
                state.currentPersistentMemory = chat.persistentMemory || {};
                state.currentSummarizedContext = chat.summarizedContext || null;
                // チャットごとのメモリ有効状態を読み込む (未定義ならtrue)
                state.isMemoryEnabledForChat = chat.isMemoryEnabledForChat !== false;
                this.toggleMemoryIconVisibility();

                this.updateCharacterProfileButtonVisibility();

                let needsSave = false;
                const groupIds = new Set(state.currentMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = state.currentMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        siblings[siblings.length - 1].isSelected = true;
                        needsSave = true;
                    } else if (selected.length > 1) {
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                        needsSave = true;
                    }
                });
                
                // プロジェクトに属するチャットはプロジェクトのSPを優先（プロジェクト設定が正規版）
                if (chat.projectId && window.projectsCache) {
                    const proj = window.projectsCache.find(p => p.id === chat.projectId);
                    state.currentSystemPrompt = proj ? (proj.systemPrompt || '') : (chat.systemPrompt !== undefined ? chat.systemPrompt : state.settings.systemPrompt);
                } else {
                    state.currentSystemPrompt = chat.systemPrompt !== undefined ? chat.systemPrompt : state.settings.systemPrompt;
                }
                state.pendingAttachments = [];
                
                uiUtils.updateChatTitle(chat.title);
                uiUtils.updateSystemPromptUI();
                
                const renderStartTime = performance.now();
                uiUtils.renderChatMessages();
                const renderEndTime = performance.now();
                
                this.scrollToBottom();

                elements.userInput.value = '';
                uiUtils.adjustTextareaHeight();
                uiUtils.setSendingState(false);

                if (needsSave) {
                    console.log("読み込み時に isSelected を正規化しました。DBに保存します。");
                    await dbUtils.saveChat();
                }

            } else {
                await uiUtils.showCustomAlert("チャット履歴が見つかりませんでした。");
                this.startNewChat();
                uiUtils.showScreen('chat');
            }
        } catch (error) {
            await uiUtils.showCustomAlert(`チャットの読み込みエラー: ${error}`);
            this.startNewChat();

        }
        const loadChatEndTime = performance.now();
    },


    // チャットを複製
    async duplicateChat(id) {
        // 送信中・編集中・他チャット保存の確認 (loadChatと同様)
        if (state.isSending) { const conf = await uiUtils.showCustomConfirm("送信中です。中断してチャットを複製しますか？"); if (!conf) return; this.abortRequest(); }
        if (state.editingMessageIndex !== null) { const conf = await uiUtils.showCustomConfirm("編集中です。変更を破棄してチャットを複製しますか？"); if (!conf) return; const msgEl = elements.messageContainer.querySelector(`.message[data-index="${state.editingMessageIndex}"]`); this.cancelEditMessage(state.editingMessageIndex, msgEl); }
        if (state.isEditingSystemPrompt) { const conf = await uiUtils.showCustomConfirm("システムプロンプト編集中です。変更を破棄してチャットを複製しますか？"); if (!conf) return; this.cancelEditSystemPrompt(); }
        if ((state.currentMessages.length > 0 || state.currentSystemPrompt) && state.currentChatId && state.currentChatId !== id) { try { await dbUtils.saveChat(); } catch (error) { console.error("複製前の現チャット保存失敗:", error); const conf = await uiUtils.showCustomConfirm("現在のチャット保存に失敗しました。複製を続行しますか？"); if (!conf) return; } }
        // 保留中の添付ファイルがあれば破棄確認
        if (state.pendingAttachments.length > 0) {
            const confirmedAttach = await uiUtils.showCustomConfirm("添付準備中のファイルがあります。破棄してチャットを複製しますか？");
            if (!confirmedAttach) return;
            state.pendingAttachments = []; // 破棄
        }

        try {
            const chat = await dbUtils.getChat(id); // 複製元を取得
            if (chat) {
                // 新しいタイトルを作成 (末尾のコピーサフィックスを除去して再度付与)
                const originalTitle = chat.title || "無題のチャット";
                const newTitle = originalTitle.replace(new RegExp(DUPLICATE_SUFFIX.replace(/([().])/g, '\\$1') + '$'), '').trim() + DUPLICATE_SUFFIX;

                // メッセージをディープコピーし、新しい siblingGroupId を生成
                const duplicatedMessages = [];
                const groupIdMap = new Map(); // 古いGroupId -> 新しいGroupId
                (chat.messages || []).forEach(msg => {
                    const newMsg = JSON.parse(JSON.stringify(msg)); // ディープコピー
                    // attachments もコピー (Base64データも含まれる)
                    newMsg.attachments = msg.attachments ? JSON.parse(JSON.stringify(msg.attachments)) : [];
                    // 新しいフラグもコピー (isSelected は後で調整)
                    newMsg.isCascaded = msg.isCascaded ?? false;
                    newMsg.isSelected = msg.isSelected ?? false;
                    if (msg.siblingGroupId) {
                        if (!groupIdMap.has(msg.siblingGroupId)) {
                            groupIdMap.set(msg.siblingGroupId, `dup-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
                        }
                        newMsg.siblingGroupId = groupIdMap.get(msg.siblingGroupId);
                    } else {
                        delete newMsg.siblingGroupId; // 元々なければ削除
                    }
                    duplicatedMessages.push(newMsg);
                });

                // 複製後の isSelected を正規化 (各グループの最後のものを選択)
                const newGroupIds = new Set(duplicatedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                newGroupIds.forEach(gid => {
                    const siblings = duplicatedMessages.filter(m => m.siblingGroupId === gid);
                    siblings.forEach((m, idx) => {
                        m.isSelected = (idx === siblings.length - 1); // 最後のものだけ true
                    });
                });

                // 新しいチャットデータを作成
                const newChatData = {
                    messages: duplicatedMessages,
                    systemPrompt: chat.systemPrompt || '', // システムプロンプトもコピー
                    // 永続メモリもディープコピーで複製
                    persistentMemory: JSON.parse(JSON.stringify(chat.persistentMemory || {})),
                    updatedAt: Date.now(), // 更新/作成日時は現在
                    createdAt: Date.now(),
                    title: newTitle
                };
                // 新しいチャットとしてDBに追加
                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData); // addで新規追加
                    request.onsuccess = (event) => resolve(event.target.result); // 新しいIDを返す
                    request.onerror = (event) => reject(event.target.error);
                });
                this.markAsDirtyAndSchedulePush(true);
                console.log("チャット複製完了:", id, "->", newChatId);
                // 履歴画面が表示されていればリストを更新、そうでなければアラート表示
                if (state.currentScreen === 'history') { // stateで判定
                    uiUtils.renderHistoryList();
                } else {
                    await uiUtils.showCustomAlert(`チャット「${newTitle}」を複製しました。`);
                }
            } else {
                await uiUtils.showCustomAlert("複製元のチャットが見つかりません。");
            }
        } catch (error) {
            await uiUtils.showCustomAlert(`チャット複製エラー: ${error}`);
        }
    },




    // チャットをテキストファイルとしてエクスポート
    async exportChat(chatId, chatTitle) {
        const confirmed = await uiUtils.showCustomConfirm(`チャット「${chatTitle || 'この履歴'}」をテキスト出力しますか？`);
        if (!confirmed) return;
    
        uiUtils.showProgressDialog('エクスポート準備中...');
        try {
            let chatToExport;
            if (state.currentChatId === chatId) {
                chatToExport = {
                    id: state.currentChatId,
                    title: chatTitle,
                    messages: state.currentMessages,
                    systemPrompt: state.currentSystemPrompt,
                    persistentMemory: state.currentPersistentMemory,
                    summarizedContext: state.currentSummarizedContext,
                    createdAt: null,
                    updatedAt: Date.now(),
                };
            } else {
                chatToExport = await dbUtils.getChat(chatId);
            }
    
            if (!chatToExport || ((!chatToExport.messages || chatToExport.messages.length === 0) && !chatToExport.systemPrompt)) {
                await uiUtils.showCustomAlert("チャットデータが空です。");
                return;
            }
    
            let exportText = '';
            const imageDataBlock = {};
            const attachmentDataBlock = {};
            const allImageIds = new Set();

            if (chatToExport.messages) {
                // 先に全メッセージを走査して、必要な画像IDと添付ファイルIDを収集
                chatToExport.messages.forEach(msg => {
                    if (msg.imageIds && msg.imageIds.length > 0) {
                        msg.imageIds.forEach(id => allImageIds.add(id));
                    }
                    // 添付ファイルにもユニークIDを割り振り、データ収集の準備
                    if (msg.attachments && msg.attachments.length > 0) {
                        msg.attachments.forEach(att => {
                            if (att.base64Data) {
                                const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                                att.attachmentId = attachmentId; // 一時的にIDを付与
                                attachmentDataBlock[attachmentId] = {
                                    name: att.name,
                                    mimeType: att.mimeType,
                                    data: att.base64Data
                                };
                            }
                        });
                    }
                });
            }

            if (allImageIds.size > 0) {
                uiUtils.updateProgressMessage(`画像データを収集中... (0 / ${allImageIds.size})`);
                let processedCount = 0;
                for (const imageId of allImageIds) {
                    try {
                        const imageData = await this.getImageBlobById(imageId);
                        if (imageData && imageData.blob) {
                            const base64Data = await this.fileToBase64(imageData.blob);
                            imageDataBlock[imageId] = {
                                mimeType: imageData.blob.type,
                                data: base64Data,
                                width: imageData.width,
                                height: imageData.height
                            };
                        }
                    } catch (e) {
                        console.error(`エクスポート中に画像(ID: ${imageId})の処理に失敗しました:`, e);
                    }
                    processedCount++;
                    uiUtils.updateProgressMessage(`画像データを収集中... (${processedCount} / ${allImageIds.size})`);
                }
            }
    
            uiUtils.updateProgressMessage('テキストデータを生成中...');
            if (chatToExport.persistentMemory && Object.keys(chatToExport.persistentMemory).length > 0) {
                try {
                    const metadataToExport = { ...chatToExport.persistentMemory };
                    const metadataJson = JSON.stringify(metadataToExport, null, 2);
                    exportText += `<|#|metadata|#|>\n${metadataJson}\n<|#|/metadata|#|>\n\n`;
                } catch (e) {
                    console.error("persistentMemoryのJSON化に失敗しました:", e);
                }
            }
    
            if (chatToExport.systemPrompt) {
                exportText += `<|#|system|#|>\n${chatToExport.systemPrompt}\n<|#|/system|#|>\n\n`;
            }

            if (chatToExport.summarizedContext) {
                try {
                    const summaryJson = JSON.stringify(chatToExport.summarizedContext, null, 2);
                    exportText += `<|#|summary|#|>\n${summaryJson}\n<|#|/summary|#|>\n\n`;
                } catch (e) {
                    console.error("summarizedContextのJSON化に失敗しました:", e);
                }
            }
    
            if (chatToExport.messages) {
                chatToExport.messages.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'model') {
                        let attributes = '';
                        if (msg.role === 'model') {
                            if (msg.isCascaded) attributes += ' isCascaded';
                            if (msg.isSelected) attributes += ' isSelected';
                            if (msg.imageIds && msg.imageIds.length > 0) {
                                attributes += ` imageIds="${msg.imageIds.join(',')}"`;
                            }
                        }
                        // ファイル名ではなく、割り振ったattachmentIdを記録する
                        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                            const attachmentIds = msg.attachments.map(a => a.attachmentId).filter(Boolean).join(',');
                            if (attachmentIds) {
                                attributes += ` attachments="${attachmentIds}"`;
                            }
                        }
                        exportText += `<|#|${msg.role}|#|${attributes.trim()}>\n${msg.content}\n<|#|/${msg.role}|#|>\n\n`;
                    }
                });
            }

            if (Object.keys(imageDataBlock).length > 0) {
                exportText += `<|#|imagedata|#|>\n${JSON.stringify(imageDataBlock, null, 2)}\n<|#|/imagedata|#|>\n\n`;
            }

            // 新しくattachmentdataブロックを書き出す
            if (Object.keys(attachmentDataBlock).length > 0) {
                exportText += `<|#|attachmentdata|#|>\n${JSON.stringify(attachmentDataBlock, null, 2)}\n<|#|/attachmentdata|#|>\n`;
            }
    
            uiUtils.updateProgressMessage('ファイルをダウンロード中...');
            const blob = new Blob([exportText.trim()], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const safeTitle = (chatToExport.title || `chat_${chatId}_export`).replace(/[<>:"/\\|?*\s]/g, '_');
            a.href = url;
            a.download = `${safeTitle}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log("チャットエクスポート完了:", chatId);
        } catch (error) {
            await uiUtils.showCustomAlert(`エクスポートエラー: ${error}`);
        } finally {
            uiUtils.hideProgressDialog();
        }
    },


    // チャット削除の確認と実行 (メッセージペア全体)
    async confirmDeleteChat(id, title) {
         const confirmed = await uiUtils.showCustomConfirm(`「${title || 'この履歴'}」を削除しますか？`);
         if (confirmed) {
            const isDeletingCurrent = state.currentChatId === id;
            const currentScreenBeforeDelete = state.currentScreen;

            try {
                // 1. DBから削除
                await dbUtils.deleteChat(id);
                console.log("チャット削除:", id);

                // 2. 表示中チャット削除なら内部状態リセット
                if (isDeletingCurrent) {
                    console.log("表示中のチャットが削除されたため、内部状態を新規チャットにリセット。");
                    this.startNewChat(); // pendingAttachments もクリアされる
                }

                // 3. 履歴画面での操作ならリストUI更新 & 状態リセット判定
                if (currentScreenBeforeDelete === 'history') {
                    console.log("履歴画面での操作のため、リストUIを更新します。");
                    await uiUtils.renderHistoryList(); // リストUIを更新
                    const listIsEmpty = elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').length === 0;

                    // リストが空になった場合、内部状態をリセットする（念のため）
                    if (listIsEmpty) {
                        console.log("履歴リストが空になりました。");
                        if (!isDeletingCurrent) {
                            this.startNewChat();
                        }
                    }
                }

            } catch (error) {
                await uiUtils.showCustomAlert(`チャット削除エラー: ${error}`);
                uiUtils.setSendingState(false); // エラー時も送信状態解除
            }
        }
    },


    // 履歴アイテムのタイトルを編集
    async editHistoryTitle(chatId, titleElement) {
        const currentTitle = titleElement.textContent;
        const newTitle = await uiUtils.showCustomPrompt("新しいタイトル:", currentTitle); // newTitle は OK なら文字列、キャンセルなら ''

        // キャンセル時('')でなく、入力があり(trim後空でなく)、変更があった場合
        const trimmedTitle = (newTitle !== null) ? newTitle.trim() : '';

        if (newTitle !== '' && trimmedTitle !== '' && trimmedTitle !== currentTitle) {
            const finalTitle = trimmedTitle.substring(0, 100); // 100文字に制限
            try {
                await dbUtils.updateChatTitleDb(chatId, finalTitle); // DB更新
                // UI更新
                titleElement.textContent = finalTitle;
                titleElement.title = finalTitle; // ホバータイトルも更新
                // 更新日時も更新表示
                const dateElement = titleElement.closest('.history-item')?.querySelector('.updated-date');
                if(dateElement) dateElement.textContent = `更新: ${uiUtils.formatDate(Date.now())}`;
                // 現在表示中のチャットのタイトルが変更されたら、ヘッダーも更新
                if (state.currentChatId === chatId) {
                    uiUtils.updateChatTitle(finalTitle);
                }
            } catch (error) {
                await uiUtils.showCustomAlert(`タイトル更新エラー: ${error}`);
            }
        } else {
            // キャンセルまたは変更なし
            console.log("タイトル編集キャンセルまたは変更なし");
        }
    },


    // --- 履歴インポートハンドラ ---
    async handleHistoryImport(file) {
        if (!file || !file.type.startsWith('text/plain')) {
            await uiUtils.showCustomAlert("テキストファイル (.txt) を選択してください。");
            return;
        }
        console.log("履歴インポート開始:", file.name);
        
        elements.progressMessage.textContent = '履歴ファイルを解析中...';
        elements.progressDialog.showModal();

        const reader = new FileReader();

        reader.onload = async (event) => {
            const textContent = event.target.result;
            if (!textContent) {
                elements.progressDialog.close();
                await uiUtils.showCustomAlert("ファイルの内容が空です。");
                return;
            }
            try {
                const { messages: importedMessages, systemPrompt: importedSystemPrompt, persistentMemory: importedMemory, summarizedContext: importedSummary, imageData: importedImageData } = this.parseImportedHistory(textContent);
                
                if (importedMessages.length === 0 && !importedSystemPrompt && (!importedMemory || Object.keys(importedMemory).length === 0)) {
                    elements.progressDialog.close();
                    await uiUtils.showCustomAlert("ファイルから有効なメッセージ、システムプロンプト、またはメタデータを読み込めませんでした。形式を確認してください。");
                    return;
                }

                const imageIdMap = new Map();
                if (importedImageData && Object.keys(importedImageData).length > 0) {
                   
                    elements.progressMessage.textContent = `画像を復元中... (0 / ${Object.keys(importedImageData).length})`;
                    let restoredCount = 0;
                    const totalImages = Object.keys(importedImageData).length;

                    for (const oldId in importedImageData) {
                        try {
                            const { mimeType, data } = importedImageData[oldId];
                            const blob = await this.base64ToBlob(data, mimeType);
                            const newId = await this.saveImageBlob(blob);
                            imageIdMap.set(oldId, newId);
                            restoredCount++;
                            elements.progressMessage.textContent = `画像を復元中... (${restoredCount} / ${totalImages})`;
                        } catch (e) {
                            console.error(`インポート中に画像(旧ID: ${oldId})の復元に失敗:`, e);
                        }
                    }
                }

                elements.progressMessage.textContent = 'データベースに保存中...';

                importedMessages.forEach(msg => {
                    if (msg.imageIds && msg.imageIds.length > 0) {
                        msg.imageIds = msg.imageIds.map(oldId => imageIdMap.get(oldId) || oldId).filter(Boolean);
                    }
                });

                let currentGroupId = null;
                let lastUserIndex = -1;
                for (let i = 0; i < importedMessages.length; i++) {
                    const msg = importedMessages[i];
                    if (msg.role === 'user') {
                        lastUserIndex = i;
                        currentGroupId = null;
                    } else if (msg.role === 'model' && msg.isCascaded) {
                        if (currentGroupId === null && lastUserIndex !== -1) {
                            currentGroupId = `imp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                        }
                        if (currentGroupId) {
                            msg.siblingGroupId = currentGroupId;
                        }
                    } else {
                        currentGroupId = null;
                    }
                }
                const groupIds = new Set(importedMessages.filter(m => m.siblingGroupId).map(m => m.siblingGroupId));
                groupIds.forEach(gid => {
                    const siblings = importedMessages.filter(m => m.siblingGroupId === gid);
                    const selected = siblings.filter(m => m.isSelected);
                    if (selected.length === 0 && siblings.length > 0) {
                        siblings[siblings.length - 1].isSelected = true;
                    } else if (selected.length > 1) {
                        selected.slice(0, -1).forEach(m => m.isSelected = false);
                    }
                });

                const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                const newTitle = IMPORT_PREFIX + (fileNameWithoutExt || `Imported_${Date.now()}`);

                const newChatData = {
                    messages: importedMessages,
                    systemPrompt: importedSystemPrompt || '',
                    persistentMemory: importedMemory || {},
                    summarizedContext: importedSummary || null,
                    updatedAt: Date.now(),
                    createdAt: Date.now(),
                    title: newTitle.substring(0, 100)
                };

                const newChatId = await new Promise((resolve, reject) => {
                    const store = dbUtils._getStore(CHATS_STORE, 'readwrite');
                    const request = store.add(newChatData);
                    request.onsuccess = (event) => resolve(event.target.result);
                    request.onerror = (event) => reject(event.target.error);
                });

                this.markAsDirtyAndSchedulePush(true);

                console.log("履歴インポート成功:", newChatId);
                elements.progressDialog.close();
                await uiUtils.showCustomAlert(`履歴「${newChatData.title}」をインポートしました。`);
                uiUtils.renderHistoryList();

            } catch (error) {
                console.error("履歴インポート処理エラー:", error);
                elements.progressDialog.close();
                await uiUtils.showCustomAlert(`履歴のインポート中にエラーが発生しました: ${error.message}`);
            }
        };

        reader.onerror = async (event) => {
            console.error("ファイル読み込みエラー:", event.target.error);
            elements.progressDialog.close();
            await uiUtils.showCustomAlert("ファイルの読み込みに失敗しました。");
        };

        reader.readAsText(file);
    },


    parseImportedHistory(text) {
        const messages = [];
        let systemPrompt = '';
        let persistentMemory = {};
        let summarizedContext = null;
        const imageData = {};
        const attachmentData = {}; // 添付ファイルデータ保持用オブジェクト

        let remainingText = text;

        // 正規表現を更新し、attachmentdataも捕捉できるようにする
        const dataBlockRegex = /<\|#\|(metadata|summary|imagedata|attachmentdata)\|#\|>([\s\S]*?)<\|#\|\/\1\|#\|>\s*/g;
        let dataMatch;
        while ((dataMatch = dataBlockRegex.exec(text)) !== null) {
            const blockType = dataMatch[1];
            const blockContent = dataMatch[2].trim();
            try {
                const jsonData = JSON.parse(blockContent);
                switch (blockType) {
                    case 'metadata':
                        persistentMemory = jsonData;
                        break;
                    case 'summary':
                        summarizedContext = jsonData;
                        break;
                    case 'imagedata':
                        Object.assign(imageData, jsonData);
                        break;
                    case 'attachmentdata': // attachmentdataブロックの処理を追加
                        Object.assign(attachmentData, jsonData);
                        break;
                }
            } catch (e) {
                console.error(`インポートされた ${blockType} のJSONパースに失敗:`, e);
            }
            // パースしたブロックを元のテキストから削除
            remainingText = remainingText.replace(dataMatch[0], '');
        }
    
        const blockRegex = /<\|#\|(system|user|model)\|#\|([^>]*)>([\s\S]*?)<\|#\|\/\1\|#\|>/g;
        let match;
    
        while ((match = blockRegex.exec(remainingText)) !== null) {
            const role = match[1];
            const attributesString = match[2].trim();
            const content = match[3].trim();
    
            if (role === 'system' && content) {
                systemPrompt = content;
            } else if ((role === 'user' || role === 'model')) {
                const messageData = {
                    role: role,
                    content: content,
                    timestamp: Date.now(),
                    attachments: []
                };

                const attributeRegex = /(\w+)="([^"]*)"|(\w+)/g;
                let attrMatch;
                while ((attrMatch = attributeRegex.exec(attributesString)) !== null) {
                    if (attrMatch[1]) {
                        const key = attrMatch[1];
                        const value = attrMatch[2].replace(/&quot;/g, '"');
                        if (key === 'attachments') {
                            // attachmentIdを元に、保持しておいたデータから完全なオブジェクトを復元
                            const attachmentIds = value.split(',');
                            messageData.attachments = attachmentIds.map(id => {
                                const data = attachmentData[id];
                                if (data) {
                                    return {
                                        name: data.name,
                                        mimeType: data.mimeType,
                                        base64Data: data.data,
                                        // fileオブジェクトはインポート時には復元しない
                                    };
                                }
                                return null; // データが見つからない場合はnull
                            }).filter(Boolean); // nullを除外
                        } else if (key === 'imageIds') {
                            messageData.imageIds = value.split(',');
                        }
                    } else if (attrMatch[3]) {
                        messageData[attrMatch[3]] = true;
                    }
                }
                messages.push(messageData);
            }
        }
        console.log(`インポートテキストから ${messages.length} 件のメッセージとシステムプロンプト(${systemPrompt ? 'あり' : 'なし'})、要約データ(${summarizedContext ? 'あり' : 'なし'})をパースしました。`);

        // 返り値にimageDataを追加
        return { messages, systemPrompt, persistentMemory, summarizedContext, imageData };
    },


    async autoGenerateTitle() {
        // 初回のやり取り（ユーザー1回 + AI1回）のみ実行
        const userMsgs = state.currentMessages.filter(m => m.role === 'user' && !m.isHidden);
        const modelMsgs = state.currentMessages.filter(m => (m.role === 'model' || m.role === 'assistant') && !m.error && !m.isHidden);
        console.log(`[AutoTitle] 起動: userMsgs=${userMsgs.length}, modelMsgs=${modelMsgs.length}, chatId=${state.currentChatId}, provider=${state.settings.apiProvider}`);
        if (userMsgs.length !== 1 || modelMsgs.length < 1) {
            console.log('[AutoTitle] 条件不一致でスキップ');
            return;
        }
        if (!state.currentChatId) {
            console.log('[AutoTitle] currentChatId なしでスキップ');
            return;
        }

        const provider = state.settings.apiProvider || 'gemini';
        const firstUserContent = (typeof userMsgs[0].content === 'string' ? userMsgs[0].content : JSON.stringify(userMsgs[0].content)).substring(0, 300);
        const firstModelContent = (typeof modelMsgs[0].content === 'string' ? modelMsgs[0].content : '').substring(0, 300);
        const titlePrompt = `以下の会話の内容を端的に表すタイトルを20文字以内で作成してください。タイトルのみを出力してください（説明・引用符不要）。\n\nユーザー: ${firstUserContent}\nAI: ${firstModelContent}`;

        try {
            let title = null;

            if (provider === 'gemini') {
                const apiKey = state.settings.apiKey;
                if (!apiKey) return;
                const endpoint = `${GEMINI_API_BASE_URL}gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
                const resp = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: titlePrompt }] }],
                        generationConfig: { maxOutputTokens: 30, temperature: 0.3 },
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                        ]
                    })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    title = data.candidates?.[0]?.content?.parts?.find(p => p.text && p.thought !== true)?.text?.trim();
                }
            } else if (provider === 'anthropic') {
                const apiKey = state.settings.anthropicApiKey;
                if (!apiKey) return;
                const resp = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify({
                        model: 'claude-haiku-4-5-20251001',
                        max_tokens: 30,
                        messages: [{ role: 'user', content: titlePrompt }]
                    })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    title = data.content?.find(c => c.type === 'text')?.text?.trim();
                }
            } else {
                // OpenAI互換プロバイダー
                const apiKeyMap = {
                    openai: state.settings.openaiApiKey,
                    groq: state.settings.groqApiKey,
                    deepseek: state.settings.deepseekApiKey,
                    xai: state.settings.xaiApiKey,
                    mistral: state.settings.mistralApiKey,
                    openrouter: state.settings.openrouterApiKey,
                    zai: state.settings.zaiApiKey || state.settings.apiKey,
                    sakana: state.settings.sakanaApiKey
                };
                const baseUrlMap = {
                    openai: 'https://api.openai.com/v1/chat/completions',
                    groq: GROQ_API_BASE_URL,
                    deepseek: DEEPSEEK_API_BASE_URL,
                    xai: XAI_API_BASE_URL,
                    mistral: MISTRAL_API_BASE_URL,
                    openrouter: OPENROUTER_API_BASE_URL,
                    zai: ZAI_API_BASE_URL,
                    sakana: SAKANA_API_BASE_URL
                };
                const apiKey = apiKeyMap[provider];
                const baseUrl = baseUrlMap[provider];
                if (!apiKey || !baseUrl) return;
                // タイトル生成は軽量・非リーズナーモデルを優先（gemini=flash-lite / anthropic=haiku と同方針）。
                // 推論モデル（deepseek-reasoner / v4-pro 等）を小さい max_tokens で呼ぶと、思考で
                // トークンを使い切り content が空になりタイトルが生成されないため。
                const titleModelMap = {
                    deepseek: DEFAULT_DEEPSEEK_MODEL // 'deepseek-chat'（非リーズナー）
                };
                const titleModel = titleModelMap[provider] || state.settings.modelName;
                const resp = await fetch(baseUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                    body: JSON.stringify({
                        model: titleModel,
                        max_tokens: 200,
                        messages: [{ role: 'user', content: titlePrompt }]
                    })
                });
                if (resp.ok) {
                    const data = await resp.json();
                    title = data.choices?.[0]?.message?.content?.trim();
                }
            }

            if (!title) return;
            title = title.replace(/^["「『\s]+|["」』\s]+$/g, '').substring(0, 25);
            if (!title) return;

            await dbUtils.updateChatTitleDb(state.currentChatId, title);
            uiUtils.updateChatTitle(title);
            uiUtils.renderHistoryList();
            console.log(`[AutoTitle] タイトル生成: "${title}"`);
        } catch (e) {
            console.warn('[AutoTitle] タイトル自動生成失敗:', e.message || e);
        }
    }
};
