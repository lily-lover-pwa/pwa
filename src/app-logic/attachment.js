// appLogic 機能モジュール: attachment（Phase 3 で app-logic.js から分割）。挙動は不変。
import { MAX_FILE_SIZE, MAX_TOTAL_ATTACHMENT_SIZE } from '../constants.js';
import { dbUtils } from '../db.js';
import { elements } from '../dom-elements.js';
import { extensionToMimeTypeMap } from '../mime-types.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';
import { formatFileSize } from '../utils/format.js';

export const attachmentMethods = {

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    },


    base64ToBlob(base64, mimeType) {
        return fetch(`data:${mimeType};base64,${base64}`).then(res => res.blob());
    },


    _prepareApiHistory(baseMessages) {
        console.log("[API Prep] 履歴をAPIフォーマットに変換します。");

        // ディープコピーで元のメッセージ配列を保護する
        const messagesForApi = JSON.parse(JSON.stringify(baseMessages));

        let historyToProcess;

        // 要約コンテキストが存在する場合、API送信用の履歴を動的に構築する
        if (state.currentSummarizedContext && state.currentSummarizedContext.summaryText) {
            console.log("[API Prep] 要約コンテキストを検出。API履歴を圧縮します。");
            const { summaryText } = state.currentSummarizedContext;
            const headCount = 5;
            const tailCount = 15;

            const headMessages = messagesForApi.slice(0, headCount);
            const tailMessages = messagesForApi.slice(Math.max(headCount, messagesForApi.length - tailCount));
            
            const summaryMessage = {
                role: 'user',
                content: `【これまでの会話の要約】\n${summaryText}`,
                timestamp: Date.now(),
                isHidden: true, // UIには表示されない内部的なメッセージ
                attachments: []
            };
            
            historyToProcess = [...headMessages, summaryMessage, ...tailMessages];
            console.log(`[API Prep] 履歴を圧縮しました: Head(${headMessages.length}) + Summary(1) + Tail(${tailMessages.length}) = ${historyToProcess.length}件`);

        } else {
            // 通常の履歴
            historyToProcess = messagesForApi;
        }

        // ダミープロンプトの追加処理は共通
        if (state.settings.dummyEnabled) {
            if (state.settings.reverseDummyOrder) {
                // 順序を入れ替える場合: ダミーModel → ダミーUser
                if (state.settings.dummyModel) {
                    historyToProcess.push({ role: 'model', content: state.settings.dummyModel, attachments: [] });
                }
                if (state.settings.dummyUser) {
                    historyToProcess.push({ role: 'user', content: state.settings.dummyUser, attachments: [] });
                }
            } else {
                // 通常の順序: ダミーUser → ダミーModel
                if (state.settings.dummyUser) {
                    historyToProcess.push({ role: 'user', content: state.settings.dummyUser, attachments: [] });
                }
                if (state.settings.dummyModel) {
                    historyToProcess.push({ role: 'model', content: state.settings.dummyModel, attachments: [] });
                }
            }
        }
        
        return historyToProcess.map(msg => {
            const parts = [];
            let contentText = msg.content || '';
            if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                const fileNames = msg.attachments.map(att => att.name).join(', ');
                const attachmentText = `\n\n[添付ファイル: ${fileNames}]`;
                contentText = (contentText.trim() ? contentText : '') + attachmentText;
            }
            if (contentText.trim() !== '' || msg.isHidden) {
                parts.push({ text: contentText });
            }
            if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach(att => parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64Data } }));
            }
            if (msg.generated_images && msg.generated_images.length > 0) {
                msg.generated_images.forEach(img => {
                    parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
                });
            }
            if (msg.role === 'model' && msg.tool_calls) {
                msg.tool_calls.forEach(toolCall => parts.push({ functionCall: toolCall.functionCall }));
            }
            if (msg.role === 'tool') {
                if (msg.name && msg.response) {
                    parts.push({ 
                        functionResponse: { 
                            name: msg.name, 
                            response: msg.response,
                            _toolCallId: msg._toolCallId || msg.tool_call_id  // 元のtoolCallIdを保存
                        } 
                    });
                }
            }
            return { role: msg.role === 'tool' ? 'tool' : (msg.role === 'model' ? 'model' : 'user'), parts };
        }).filter(c => c.parts.length > 0);
    },




    // -------------------------------

    // --- 背景画像ハンドラ ---
    async handleBackgroundImageUpload(file) {
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            await uiUtils.showCustomAlert(`画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下にしてください)`);
            return;
        }
        if (!file.type.startsWith('image/')) {
            await uiUtils.showCustomAlert("画像ファイルを選択してください (JPEG, PNG, GIF, WebPなど)");
            return;
        }
        try {
            const blob = file;
            // stateとDBを更新し、新しい関数を呼び出してUIに適用する
            state.settings.backgroundImageBlob = blob;
            await dbUtils.saveSetting('backgroundImageBlob', blob);
            uiUtils.applyBackgroundImage();
        } catch (error) {
            console.error("背景画像の保存・適用エラー:", error);
            // エラー時にはstateとDBをnullに戻し、背景を非表示にする
            state.settings.backgroundImageBlob = null;
            await dbUtils.saveSetting('backgroundImageBlob', null);
            uiUtils.applyBackgroundImage();
        }
    },

     // 背景画像削除の確認
     async confirmDeleteBackgroundImage() {
         const confirmed = await uiUtils.showCustomConfirm("背景画像を削除しますか？");
         if (confirmed) {
             await this.handleBackgroundImageDelete();
         }
     },

     // 背景画像削除処理
    async handleBackgroundImageDelete() {
        try {
            uiUtils.revokeExistingObjectUrl();
            await dbUtils.saveSetting('backgroundImageBlob', null);
            state.settings.backgroundImageBlob = null;

            state.isTemporaryBackgroundActive = false;
            elements.chatScreen.classList.remove('background-visible');
            document.documentElement.style.removeProperty('--chat-background-image');
            uiUtils.updateBackgroundSettingsUI();
        } catch (error) {
    
    
           console.error("背景画像削除エラー:", error);
           await uiUtils.showCustomAlert(`背景画像の削除中にエラーが発生しました: ${error}`);
        }
    },

    
    // --- ファイルアップロード関連ロジック ---
    async handleFileSelection(fileList) {
        if (!fileList || fileList.length === 0) return;

        const newFiles = Array.from(fileList);
        let addedCount = 0;
        const skippedFiles = {
            duplicate: [],
            size: [],
            totalSize: []
        };

        // 既存ファイルの合計サイズを計算
        let currentTotalSize = state.selectedFilesForUpload.reduce((sum, item) => sum + item.file.size, 0);

        elements.selectFilesBtn.disabled = true;
        elements.selectFilesBtn.textContent = '処理中...';

        for (const file of newFiles) {
            // 個別ファイルサイズチェック
            if (file.size > MAX_FILE_SIZE) {
                skippedFiles.size.push(file.name);
                continue;
            }

            // 合計ファイルサイズチェック
            if (currentTotalSize + file.size > MAX_TOTAL_ATTACHMENT_SIZE) {
                skippedFiles.totalSize.push(file.name);
                continue;
            }

            // 重複ファイルチェック (ファイル名とサイズが両方同じ)
            const isDuplicate = state.selectedFilesForUpload.some(
                existingItem => existingItem.file.name === file.name && existingItem.file.size === file.size
            );
            if (isDuplicate) {
                skippedFiles.duplicate.push(file.name);
                continue;
            }

            // 全てのチェックをパスしたら追加
            state.selectedFilesForUpload.push({ file: file });
            currentTotalSize += file.size;
            addedCount++;
        }

        elements.selectFilesBtn.disabled = false;
        elements.selectFilesBtn.textContent = 'ファイルを選択';

        // スキップされたファイルがあればまとめて通知
        let alertMessage = '';
        if (skippedFiles.duplicate.length > 0) {
            alertMessage += `以下のファイルは既に追加されているためスキップしました:\n- ${skippedFiles.duplicate.join('\n- ')}\n\n`;
        }
        if (skippedFiles.size.length > 0) {
            alertMessage += `以下のファイルはサイズが大きすぎるため(${formatFileSize(MAX_FILE_SIZE)}以下)スキップしました:\n- ${skippedFiles.size.join('\n- ')}\n\n`;
        }
        if (skippedFiles.totalSize.length > 0) {
            alertMessage += `合計サイズ上限(${formatFileSize(MAX_TOTAL_ATTACHMENT_SIZE)})を超えるため、以下のファイルはスキップしました:\n- ${skippedFiles.totalSize.join('\n- ')}\n\n`;
        }

        if (alertMessage) {
            await uiUtils.showCustomAlert(alertMessage.trim());
        }

        uiUtils.updateSelectedFilesUI();
        console.log(`${addedCount}個のファイルが選択リストに新しく追加されました。`);
    },


    

    removeSelectedFile(indexToRemove) {
        if (indexToRemove >= 0 && indexToRemove < state.selectedFilesForUpload.length) {
            const removedFile = state.selectedFilesForUpload.splice(indexToRemove, 1)[0];
            console.log(`ファイル "${removedFile.file.name}" をリストから削除しました。`);
            uiUtils.updateSelectedFilesUI();
        }
    },


    async confirmAttachment() {
        if (state.selectedFilesForUpload.length === 0) {
            state.pendingAttachments = [];
            console.log("添付ファイルリストが空の状態で確定されました。送信待ちリストをクリアします。");
            elements.fileUploadDialog.close('ok');
            uiUtils.adjustTextareaHeight();
            uiUtils.updateAttachmentBadgeVisibility();
            return;
        }

        elements.confirmAttachBtn.disabled = true;
        elements.confirmAttachBtn.textContent = '処理中...';

        const attachmentsToAdd = [];
        let encodingError = false;

        for (const item of state.selectedFilesForUpload) {
            try {
                // 確実なキャッシュ回避のため、一度Base64に変換し、そこから新しいBlobを再生成する
                const base64Data = await this.fileToBase64(item.file);
                const rehydratedBlob = await this.base64ToBlob(base64Data, item.file.type);

                let browserMimeType = item.file.type || '';
                const fileName = item.file.name;
                const fileExtension = fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();

                let guessedMimeType = null;
                if (fileExtension && extensionToMimeTypeMap[fileExtension]) {
                    guessedMimeType = extensionToMimeTypeMap[fileExtension];
                }

                let finalMimeType;
                if (guessedMimeType) {
                    finalMimeType = guessedMimeType;
                    if (finalMimeType !== browserMimeType) {
                        console.log(`ファイル "${fileName}": 拡張子(.${fileExtension})からMIMEタイプを "${finalMimeType}" に設定 (ブラウザ提供: ${browserMimeType || '空'})`);
                    }
                } else if (browserMimeType) {
                    finalMimeType = browserMimeType;
                    console.log(`ファイル "${fileName}": ブラウザ提供のMIMEタイプ "${finalMimeType}" を使用します。(拡張子からの推測なし)`);
                } else {
                    finalMimeType = 'application/octet-stream';
                    console.warn(`ファイル "${fileName}": MIMEタイプ不明。拡張子(.${fileExtension})にもマッピングなし。'application/octet-stream' を使用します。`);
                }

                // Anthropic APIは画像のみ形式制限あり（テキスト・PDFは別途対応）
                const ANTHROPIC_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                if (state.settings.apiProvider === 'anthropic' && finalMimeType.startsWith('image/') && !ANTHROPIC_IMAGE_TYPES.includes(finalMimeType)) {
                    encodingError = true;
                    await uiUtils.showCustomAlert(`"${fileName}": ${finalMimeType} 形式の画像はAnthropicAPIに対応していません。\nJPEG・PNG・GIF・WebP形式に変換してから添付してください。\n※iPhoneのHEIC画像は、設定→カメラ→フォーマットを「互換性優先」に変更するか、変換アプリをご利用ください。`);
                    break;
                }

                attachmentsToAdd.push({
                    file: rehydratedBlob,
                    name: fileName,
                    mimeType: finalMimeType,
                    base64Data: base64Data
                });
            } catch (error) {
                console.error(`ファイル "${item.file.name}" のBase64エンコード中にエラー:`, error);
                encodingError = true;
                await uiUtils.showCustomAlert(`ファイル "${item.file.name}" の処理中にエラーが発生しました。`);
                break;
            }
        }

        elements.confirmAttachBtn.disabled = false;
        elements.confirmAttachBtn.textContent = '添付して閉じる';

        if (!encodingError) {
            state.pendingAttachments = attachmentsToAdd;
            console.log(`${state.pendingAttachments.length}件のファイルを添付準備完了:`, state.pendingAttachments.map(a => `${a.name} (${a.mimeType})`));
            elements.fileUploadDialog.close('ok');
            uiUtils.adjustTextareaHeight();
            uiUtils.updateAttachmentBadgeVisibility();
        }
    },


    cancelAttachment() {
        state.selectedFilesForUpload = [];
        console.log("ファイル添付をキャンセルしました。");
        elements.fileUploadDialog.close('cancel');
        uiUtils.updateAttachmentBadgeVisibility();
    },


    /**
     * Function Callingから受け取ったURLを一時的な背景画像として適用する
     * @param {string} url - 画像のURL
     * @returns {Promise<object>} 処理結果
     */
     async applyBackgroundImageFromUrl(url) {
        if (!url || typeof url !== 'string') {
            return { error: "画像URLが無効です。" };
        }
        console.log(`一時的な背景画像をURLから適用: ${url}`);
        
        // 既存のオブジェクトURLがあれば解放する
        uiUtils.revokeExistingObjectUrl();
        
        // 新しいURLをstateに保存
        state.backgroundImageUrl = url;
        
        const chatScreen = elements.chatScreen;
        const isAlreadyVisible = chatScreen.classList.contains('background-visible');
    
        // フェードアウト完了後に画像を設定してフェードインさせる処理
        const switchImageAndFadeIn = () => {
            document.documentElement.style.setProperty('--chat-background-image', `url("${url}")`);
            chatScreen.classList.add('background-visible');
        };
    
        if (isAlreadyVisible) {
            // 画像が表示されている場合：一度フェードアウトさせてから切り替える
            chatScreen.addEventListener('transitionend', switchImageAndFadeIn, { once: true });
            chatScreen.classList.remove('background-visible');
        } else {
            // 画像がない場合：即座に切り替えてフェードイン
            switchImageAndFadeIn();
        }
        
        // 一時的な背景が適用されたことを示すフラグを立てる
    

        state.isTemporaryBackgroundActive = true;
        
        // サムネイルUIを更新（新しいURLでサムネイルが表示される）
        uiUtils.updateBackgroundSettingsUI();
        
        const message = `背景画像を一時的に変更しました。この変更はリロードするか、設定から背景を再設定すると元に戻ります。`;
        return { success: true, message: message };
    },



    async handleBackgroundImageUrl(url) {
        if (!url || typeof url !== 'string') {
            return { error: "画像URLが無効です。" };
        }

        console.log(`背景画像をURLから取得開始: ${url}`);
        uiUtils.setLoadingIndicatorText('背景画像を取得中...');
        elements.loadingIndicator.classList.remove('hidden');

        try {
            // CORSの問題を回避するため、no-corsモードは使わない。
            // サーバーが許可しない場合はエラーとして扱うのが適切。
            const response = await fetch(url, { referrerPolicy: "no-referrer" });
            if (!response.ok) {
                throw new Error(`画像の取得に失敗しました (HTTPステータス: ${response.status})`);
            }
            const blob = await response.blob();
            
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (blob.size > maxSize) {
                return { error: `画像サイズが大きすぎます (${(maxSize / 1024 / 1024).toFixed(1)}MB以下にしてください)` };
            }

            uiUtils.revokeExistingObjectUrl();
            await dbUtils.saveSetting('backgroundImageBlob', blob);
            state.settings.backgroundImageBlob = blob;
            state.backgroundImageUrl = URL.createObjectURL(blob);
            document.documentElement.style.setProperty('--chat-background-image', `url(${state.backgroundImageUrl})`);
            uiUtils.updateBackgroundSettingsUI();
            
            console.log("背景画像をURLから正常に更新しました。");
            return { success: true, message: "背景画像を更新しました。" };

        } catch (error) {
            console.error("背景画像のURLからの取得エラー:", error);
            // CORSエラーはコンソールに表示されることが多いが、プログラムからは詳細を取得できない場合がある
            if (error instanceof TypeError) { // ネットワークエラーはCORSの可能性が高い
                 return { error: `画像の取得に失敗しました。指定されたURLのサーバーが外部からのアクセスを許可していない(CORSポリシー)可能性があります。` };
            }
            return { error: `画像の取得中にエラーが発生しました: ${error.message}` };
        } finally {
            elements.loadingIndicator.classList.add('hidden');
        }
    }
};
