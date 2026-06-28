// uiUtils（Phase 1 で app.js から抽出）。挙動は不変。
import { CHAT_TITLE_LENGTH, DARK_THEME_COLOR, DEFAULT_BEDROCK_REGION, DEFAULT_FONT_FAMILY, DEFAULT_MODEL, IMPORT_PREFIX, LIGHT_THEME_COLOR, MAX_TOTAL_ATTACHMENT_SIZE, TEXTAREA_MAX_HEIGHT } from './constants.js';
import { appLogic } from './app-logic.js';
import { base64ToBlob, formatFileSize } from './utils/format.js';
import { dbUtils } from './db.js';
import { elements } from './dom-elements.js';
import { htmlUtils } from './utils/html.js';
import { state } from './state.js';

export const uiUtils = {
    setLoadingIndicatorText(text) {
        elements.loadingIndicator.textContent = text;
    },
    // APIタイムアウトオプションの表示/非表示を制御
    updateApiTimeoutOptionsVisibility() {
        const isEnabled = elements.enableApiTimeoutCheckbox.checked;
        elements.apiTimeoutOptions.style.display = isEnabled ? 'block' : 'none';
        elements.apiTimeoutSecondsInput.disabled = !isEnabled;
    },
    // オーバーレイの透明度を適用
    applyOverlayOpacity() {
        const opacityValue = state.settings.overlayOpacity ?? 0.75; // デフォルト値を0.75に
        document.documentElement.style.setProperty('--overlay-opacity-value', opacityValue);
        console.log(`オーバーレイ透明度適用: ${opacityValue}`);
    },

    // ===== 範囲画像保存モードの表示制御 =====
    clearRangeImageHighlight() {
        elements.messageContainer
            ?.querySelectorAll('.message.range-selected')
            .forEach((el) => el.classList.remove('range-selected'));
    },

    updateRangeImageSelectionUI() {
        const sel = state.rangeImageSelect;
        const bar = elements.rangeImageBar;
        if (!sel || !sel.active) {
            bar?.classList.add('hidden');
            return;
        }
        bar?.classList.remove('hidden');
        this.clearRangeImageHighlight();

        let count = 0;
        if (sel.startIndex !== null) {
            const end = sel.endIndex === null ? sel.startIndex : sel.endIndex;
            const a = Math.min(sel.startIndex, end);
            const b = Math.max(sel.startIndex, end);
            for (let i = a; i <= b; i++) {
                const el = elements.messageContainer?.querySelector(`.message[data-index="${i}"]`);
                if (el) {
                    el.classList.add('range-selected');
                    count++;
                }
            }
        }

        if (elements.rangeImageInfo) {
            elements.rangeImageInfo.textContent =
                sel.startIndex === null
                    ? '開始メッセージをタップ'
                    : sel.endIndex === null
                      ? '終了メッセージをタップ（タップで範囲を伸縮）'
                      : `${count}件を選択中（タップで範囲変更）`;
        }
        if (elements.rangeImageSaveConfirmBtn) {
            elements.rangeImageSaveConfirmBtn.disabled = sel.startIndex === null;
        }
    },

    // 新しいメッセージ要素をコンテナの末尾に追加する（ちらつき防止用）
    appendMessage(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
        const messageElement = this.createMessageElement(role, content, index, isStreamingPlaceholder, cascadeInfo, attachments);
        if (messageElement) {
            elements.messageContainer.appendChild(messageElement);
            if (window.Prism) {
                // 追加した要素内のコードブロックのみをハイライトする
                messageElement.querySelectorAll('pre code').forEach((block) => {
                    Prism.highlightElement(block);
                });
            }
        }
    },

renderChatMessages() {
    const renderStartTime = performance.now();

    const container = elements.messageContainer;
    
    container.style.minHeight = `${container.scrollHeight}px`;

    if (state.imageUrlCache.size > 0) {
        for (const url of state.imageUrlCache.values()) {
            URL.revokeObjectURL(url);
        }
        state.imageUrlCache.clear();
    }
    if (state.editingMessageIndex !== null) {
        const messageElement = container.querySelector(`.message[data-index="${state.editingMessageIndex}"]`);
        if (messageElement) appLogic.cancelEditMessage(state.editingMessageIndex, messageElement);
        else state.editingMessageIndex = null;
    }

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    // 新しいヘルパー関数で表示対象メッセージを取得
    const visibleMessages = appLogic.getVisibleMessages();

    // 要約マーカー表示ロジック
    const summaryEndIndex = state.currentSummarizedContext?.summaryRange?.end;
    let markerInserted = false;

    visibleMessages.forEach(msg => {
        const index = state.currentMessages.indexOf(msg);
        if (index === -1 || msg.role === 'tool') return;
        
        // メッセージのインデックスが要約範囲の終端と一致したらマーカーを挿入
        if (!markerInserted && summaryEndIndex !== undefined && index >= summaryEndIndex) {
            const markerDiv = document.createElement('div');
            markerDiv.className = 'summary-marker';
            const markerText = document.createElement('span');
            markerText.className = 'summary-marker-text';
            const summarizedDate = new Date(state.currentSummarizedContext.summarizedAt).toLocaleString('ja-JP');
            markerText.textContent = `ここまで要約済み (${summarizedDate})`;
            markerDiv.appendChild(markerText);
            fragment.appendChild(markerDiv);
            markerInserted = true;
        }

        let cascadeInfo = null;
        if (msg.isCascaded && msg.siblingGroupId) {
            const siblings = state.currentMessages.filter(m => m.siblingGroupId === msg.siblingGroupId && !m.isHidden);
            const currentIndexInGroup = siblings.findIndex(m => m === msg);
            cascadeInfo = {
                currentIndex: currentIndexInGroup + 1,
                total: siblings.length,
                siblingGroupId: msg.siblingGroupId
            };
        }
        
        const messageElement = uiUtils.createMessageElement(msg.role, msg.content, index, false, cascadeInfo, msg.attachments);
        if (messageElement) {
            fragment.appendChild(messageElement);
        }
    });
    
    // ループ後にマーカーが挿入されなかった場合（＝全履歴が要約対象だった場合）の処理
    if (!markerInserted && summaryEndIndex !== undefined && state.currentMessages.length > 0 && state.currentMessages.length <= summaryEndIndex) {
        const markerDiv = document.createElement('div');
        markerDiv.className = 'summary-marker';
        const markerText = document.createElement('span');
        markerText.className = 'summary-marker-text';
        const summarizedDate = new Date(state.currentSummarizedContext.summarizedAt).toLocaleString('ja-JP');
        markerText.textContent = `ここまで要約済み (${summarizedDate})`;
        markerDiv.appendChild(markerText);
        fragment.appendChild(markerDiv);
        markerInserted = true;
    }

    container.appendChild(fragment);
    
    if (window.Prism) {
        const highlightStartTime = performance.now();
        Prism.highlightAll();
        const highlightEndTime = performance.now();
    }
    
    requestAnimationFrame(() => {
        container.style.minHeight = '';
    });
    
    appLogic.updateSummarizeButtonState();
    const renderEndTime = performance.now();
},

createMessageElement(role, content, index, isStreamingPlaceholder = false, cascadeInfo = null, attachments = null) {
    const messageData = state.currentMessages[index];
    if (!messageData) return null;

    const summaryEndIndex = state.currentSummarizedContext?.summaryRange?.end;
    const isSummarized = summaryEndIndex !== undefined && index < summaryEndIndex;

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role);
    messageDiv.dataset.index = index;

    // ターン番号を計算して設定
    if (role === 'user' || role === 'model') {
        let turnNumber = 0;
        for (let i = 0; i <= index; i++) {
            const m = state.currentMessages[i];
            if (!m || m.isHidden || m.role === 'tool' || m.role === 'error') continue;
            if (m.isCascaded && !m.isSelected) continue;
            if (m.role === 'user') turnNumber++;
        }
        messageDiv.dataset.turn = turnNumber;
        if (role === 'model' && messageData.modelName) {
            messageDiv.dataset.model = messageData.modelName;
        }
        // 送信時刻を HH:MM でラベル表示用に付与（UI表示のみ。APIには送られずキャッシュに影響しない）
        if (messageData.timestamp) {
            const t = new Date(messageData.timestamp);
            messageDiv.dataset.time = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        }
    }
    
    if (role === 'model' && messageData && messageData.thoughtSummary) {
        const thoughtDetails = document.createElement('details');
        thoughtDetails.classList.add('thought-summary-details');
        const thoughtSummaryElem = document.createElement('summary');
        thoughtSummaryElem.textContent = '思考プロセス';
        thoughtDetails.appendChild(thoughtSummaryElem);
        const thoughtContentDiv = document.createElement('div');
        thoughtContentDiv.classList.add('thought-summary-content');
        if (isStreamingPlaceholder) {
            thoughtContentDiv.id = `streaming-thought-summary-${index}`;
        } else {
            try {
                thoughtContentDiv.innerHTML = htmlUtils.renderMarkdownSafe(messageData.thoughtSummary);
            } catch (e) {
                console.error("Thought Summary Markdownパースエラー:", e);
                thoughtContentDiv.textContent = messageData.thoughtSummary || '';
            }
        }
        thoughtDetails.appendChild(thoughtContentDiv);
        messageDiv.appendChild(thoughtDetails);
    }

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('message-content');
    
    if (isStreamingPlaceholder) {
        contentDiv.id = `streaming-content-${index}`;
    }

    if (role === 'user' && attachments && attachments.length > 0) {
        const details = document.createElement('details');
        details.classList.add('attachment-details');
        details.open = false; // 最初から展開状態にする
        const summary = document.createElement('summary');
        summary.textContent = `添付ファイル (${attachments.length}件)`;
        details.appendChild(summary);
        const list = document.createElement('ul');
        list.classList.add('attachment-list');
        
        attachments.forEach(att => {
            const listItem = document.createElement('li');
            
            const mimeType = att.mimeType || '';
            let previewElement;

            if (mimeType.startsWith('image/')) {
                previewElement = document.createElement('img');
                previewElement.className = 'attachment-thumbnail';
                previewElement.alt = att.name;
                
                // 同期後のデータ(base64Data)からもサムネイルを生成できるようにする
                if (att.file instanceof Blob) {
                    const objectURL = URL.createObjectURL(att.file);
                    previewElement.src = objectURL;
                    state.imageUrlCache.set(objectURL, true);
                } else if (att.base64Data) {
                    // base64からBlobを生成してURLを作成
                    base64ToBlob(att.base64Data, att.mimeType)
                        .then(blob => {
                            const objectURL = URL.createObjectURL(blob);
                            previewElement.src = objectURL;
                            state.imageUrlCache.set(objectURL, true);
                        })
                        .catch(err => {
                            console.error('Base64からサムネイル用Blobへの変換に失敗:', err);
                            previewElement.alt = 'プレビュー失敗';
                        });
                }

            } else if (mimeType.startsWith('video/')) {
                previewElement = document.createElement('video');
                previewElement.className = 'attachment-thumbnail';
                previewElement.muted = true;
                previewElement.playsInline = true;
                if (att.file instanceof Blob) {
                    const objectURL = URL.createObjectURL(att.file);
                    previewElement.src = objectURL;
                    state.videoUrlCache.set(objectURL, true);
                } else if (att.base64Data) {
                    base64ToBlob(att.base64Data, att.mimeType)
                        .then(blob => {
                            const objectURL = URL.createObjectURL(blob);
                            previewElement.src = objectURL;
                            state.videoUrlCache.set(objectURL, true);
                        })
                        .catch(err => console.error('Base64から動画用Blobへの変換に失敗:', err));
                }
            } else {
                previewElement = document.createElement('span');
                previewElement.className = 'attachment-thumbnail material-symbols-outlined';
                previewElement.style.display = 'flex';
                previewElement.style.alignItems = 'center';
                previewElement.style.justifyContent = 'center';
                previewElement.textContent = 'description';
            }
            
            if (previewElement.tagName === 'IMG' || previewElement.tagName === 'VIDEO') {
                previewElement.onclick = () => {
                    const modalOverlay = document.getElementById('image-modal-overlay');
                    const modalImg = document.getElementById('image-modal-img'); // 正しいIDを参照
                    
                    // modalContentではなく、存在する要素を直接操作する
                    if (modalOverlay && modalImg) {
                        if (previewElement.tagName === 'IMG') {
                            modalImg.src = previewElement.src;
                            modalOverlay.classList.remove('hidden');
                        } else {
                            // 動画の場合は新しいタブで開くなどの代替案も考えられる
                            console.warn("動画のモーダル表示は現在サポートされていません。");
                        }
                    } else {
                        console.error("画像拡大用のモーダル要素が見つかりません。");
                    }
                };
            }

            const filenameSpan = document.createElement('span');
            filenameSpan.className = 'attachment-filename';
            filenameSpan.textContent = att.name;
            filenameSpan.title = `${att.name} (${att.mimeType})`;

            listItem.appendChild(previewElement);
            listItem.appendChild(filenameSpan);
            list.appendChild(listItem);
        });
        details.appendChild(list);
        contentDiv.appendChild(details);

        if (content && content.trim() !== '') {
            const pre = document.createElement('pre');
            pre.textContent = content;
            pre.style.marginTop = '8px';
            contentDiv.appendChild(pre);
        }
    } 

    else {
        try {
            if (content && (role === 'model' || role === 'user')) {
                 if (role === 'model' && !isStreamingPlaceholder && typeof marked !== 'undefined') {
                    contentDiv.innerHTML = htmlUtils.renderMarkdownSafe(content);
                } else {
                    const pre = document.createElement('pre'); pre.textContent = content; contentDiv.appendChild(pre);
                }
            } else if (role === 'error') {
                 const p = document.createElement('p'); p.textContent = content; contentDiv.appendChild(p);
            }
        } catch (e) {
             console.error("Markdownパースエラー:", e);
             const pre = document.createElement('pre'); pre.textContent = content; contentDiv.innerHTML = ''; contentDiv.appendChild(pre);
        }
    }
    messageDiv.appendChild(contentDiv);
            
    const imagePlaceholderRegex = /<p>\[IMAGE_HERE\]<\/p>|\[IMAGE_HERE\]/g;
    if (role === 'model' && messageData && messageData.imageIds && messageData.imageIds.length > 0) {
        let imageIndex = 0;
        const replacedHtml = contentDiv.innerHTML.replace(imagePlaceholderRegex, () => {
            if (imageIndex < messageData.imageIds.length) {
                const imageId = messageData.imageIds[imageIndex++];
                return `<img class="lazy-load-image" alt="生成画像（読み込み中...）" data-image-id="${imageId}">`;
            }
            return '';
        });
        contentDiv.innerHTML = replacedHtml;

        if (imageIndex < messageData.imageIds.length) {
            const fragment = document.createDocumentFragment();
            for (let i = imageIndex; i < messageData.imageIds.length; i++) {
                const imageId = messageData.imageIds[i];
                const img = document.createElement('img');
                img.className = 'lazy-load-image';
                img.alt = '生成画像（読み込み中...）';
                img.dataset.imageId = imageId;
                fragment.appendChild(img);
            }
            contentDiv.appendChild(fragment);
        }
        requestAnimationFrame(() => {
            const newImages = contentDiv.querySelectorAll('.lazy-load-image');
            newImages.forEach(img => appLogic.imageObserver.observe(img));
        });
    }

    // コードブロック（```）をコピーボタン付きカードに変換（テキストアーティファクト）
    if (role === 'model') {
        contentDiv.querySelectorAll('pre').forEach(pre => {
            if (pre.closest('.code-artifact')) return; // 二重適用防止
            const code = pre.querySelector('code');
            let lang = '';
            if (code) {
                const langClass = [...code.classList].find(c => c.startsWith('language-'));
                if (langClass) lang = langClass.replace('language-', '');
            }
            const wrapper = document.createElement('div');
            wrapper.className = 'code-artifact';
            const header = document.createElement('div');
            header.className = 'code-artifact-header';
            const label = document.createElement('span');
            label.className = 'code-artifact-lang';
            label.textContent = lang || 'テキスト';
            const copyBtn = document.createElement('button');
            copyBtn.type = 'button';
            copyBtn.className = 'code-artifact-copy';
            copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー';
            copyBtn.onclick = () => {
                const text = code ? code.textContent : pre.textContent;
                navigator.clipboard.writeText(text || '').then(() => {
                    copyBtn.innerHTML = '<span class="material-symbols-outlined">check</span> コピー済';
                    setTimeout(() => { copyBtn.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー'; }, 1500);
                }).catch(() => {});
            };
            header.appendChild(label);
            header.appendChild(copyBtn);
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });
    }

    if (role === 'model' && messageData && messageData.groundingMetadata &&
        ( (messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0) ||
          (messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0) )
       )
    {
        try {
            const details = document.createElement('details');
            details.classList.add('citation-details');
            const summary = document.createElement('summary');
            summary.textContent = '引用元/検索クエリ';
            details.appendChild(summary);
            let detailsHasContent = false;
            if (messageData.groundingMetadata.groundingChunks && messageData.groundingMetadata.groundingChunks.length > 0) {
                const citationList = document.createElement('ul');
                citationList.classList.add('citation-list');
                const citationMap = new Map();
                let displayIndexCounter = 1;
                if (messageData.groundingMetadata.groundingSupports) {
                    messageData.groundingMetadata.groundingSupports.forEach(support => {
                        if (support.groundingChunkIndices) {
                            support.groundingChunkIndices.forEach(chunkIndex => {
                                if (!citationMap.has(chunkIndex) && chunkIndex >= 0 && chunkIndex < messageData.groundingMetadata.groundingChunks.length) {
                                    const chunk = messageData.groundingMetadata.groundingChunks[chunkIndex];
                                    if (chunk?.web?.uri) {
                                        citationMap.set(chunkIndex, {
                                            uri: chunk.web.uri,
                                            title: chunk.web.title || 'タイトル不明',
                                            displayIndex: displayIndexCounter++
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                const sortedCitations = Array.from(citationMap.entries())
                                            .sort(([, a], [, b]) => a.displayIndex - b.displayIndex);
                sortedCitations.forEach(([chunkIndex, citationInfo]) => {
                    const listItem = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = citationInfo.uri;
                    link.textContent = `[${citationInfo.displayIndex}] ${citationInfo.title}`;
                    link.title = citationInfo.title;
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                    listItem.appendChild(link);
                    citationList.appendChild(listItem);
                });
                if (sortedCitations.length === 0) {
                     messageData.groundingMetadata.groundingChunks.forEach((chunk, idx) => {
                         if (chunk?.web?.uri) {
                             const listItem = document.createElement('li');
                             const link = document.createElement('a');
                             link.href = chunk.web.uri;
                             link.textContent = chunk.web.title || `ソース ${idx + 1}`;
                             link.title = chunk.web.title || 'タイトル不明';
                             link.target = '_blank';
                             link.rel = 'noopener noreferrer';
                             listItem.appendChild(link);
                             citationList.appendChild(listItem);
                         }
                     });
                }
                if (citationList.hasChildNodes()) {
                    details.appendChild(citationList);
                    detailsHasContent = true;
                }
            }
            if (messageData.groundingMetadata.webSearchQueries && messageData.groundingMetadata.webSearchQueries.length > 0) {
                if (detailsHasContent) {
                    const separator = document.createElement('hr');
                    separator.style.marginTop = '10px';
                    separator.style.marginBottom = '8px';
                    separator.style.border = 'none';
                    separator.style.borderTop = '1px dashed var(--border-tertiary)'; 
                    details.appendChild(separator);
                }
                const queryHeader = document.createElement('div');
                queryHeader.textContent = '検索に使用されたクエリ:';
                queryHeader.style.fontWeight = '500';
                queryHeader.style.marginTop = detailsHasContent ? '0' : '8px';
                queryHeader.style.marginBottom = '4px';
                queryHeader.style.fontSize = '11px';
                queryHeader.style.color = 'var(--text-secondary)';
                details.appendChild(queryHeader);
                const queryList = document.createElement('ul');
                queryList.classList.add('search-query-list');
                queryList.style.listStyle = 'none';
                queryList.style.paddingLeft = '0';
                queryList.style.margin = '0';
                queryList.style.fontSize = '11px';
                queryList.style.color = 'var(--text-secondary)';
                messageData.groundingMetadata.webSearchQueries.forEach(query => {
                    const queryItem = document.createElement('li');
                    queryItem.textContent = `• ${query}`;
                    queryItem.style.marginBottom = '3px';
                    queryList.appendChild(queryItem);
                });
                details.appendChild(queryList);
                detailsHasContent = true;
            }
            if (detailsHasContent) {
                contentDiv.appendChild(details);
            }
        } catch (e) {
            console.error(`引用元/検索クエリ表示の生成中にエラーが発生しました (index: ${index}):`, e);
        }
    }
    
    if (role === 'model' && messageData && messageData.executedFunctions && messageData.executedFunctions.length > 0) {
        const details = document.createElement('details');
        details.classList.add('function-call-details');
        const uniqueFunctions = [...new Set(messageData.executedFunctions)];
        const summary = document.createElement('summary');
        summary.innerHTML = `⚙️ ツール使用 (${uniqueFunctions.length}件)`;
        details.appendChild(summary);
        const list = document.createElement('ul');
        list.classList.add('function-call-list');
        uniqueFunctions.forEach(funcName => {
            const listItem = document.createElement('li');
            listItem.textContent = funcName;
            list.appendChild(listItem);
        });
        details.appendChild(list);
        if (contentDiv.innerHTML.trim() !== '') {
            contentDiv.appendChild(details);
        } else {
            messageDiv.appendChild(details);
        }
    }

    if (role === 'model' && messageData && messageData.search_web_results && messageData.search_web_results.length > 0) {
        const details = document.createElement('details');
        details.classList.add('function-call-details');
        const summary = document.createElement('summary');
        summary.innerHTML = `🌐 Web検索結果 (${messageData.search_web_results.length}件)`;
        details.appendChild(summary);
        const list = document.createElement('ul');
        list.classList.add('function-call-list');
        messageData.search_web_results.forEach(result => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = result.link;
            link.textContent = result.title;
            link.title = result.snippet;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            listItem.appendChild(link);
            list.appendChild(listItem);
        });
        details.appendChild(list);
        if (contentDiv.innerHTML.trim() !== '') {
            contentDiv.appendChild(details);
        } else {
            messageDiv.appendChild(details);
        }
    }

    if (role === 'model' && messageData && messageData.generated_videos && messageData.generated_videos.length > 0) {
        const videoData = messageData.generated_videos[0];
        if (videoData && (videoData.url || videoData.base64Data)) {
            const video = document.createElement('video');
            video.controls = true; 
            video.playsInline = true; 
            video.muted = true; 
            video.loop = true; 
            video.style.maxWidth = '100%';
            video.style.borderRadius = 'var(--border-radius-md)';
            video.style.display = 'block';

            if (videoData.url) {
                video.src = videoData.url;
            } else if (videoData.base64Data) {
                base64ToBlob(videoData.base64Data, 'video/mp4')
                    .then(blob => {
                        const objectURL = URL.createObjectURL(blob);
                        video.src = objectURL;
                    })
                    .catch(err => {
                        console.error("Base64からの動画Blob生成に失敗:", err);
                        video.remove();
                    });
            }

            const placeholderRegex = /\[VIDEO_HERE\]/g;
            if (placeholderRegex.test(contentDiv.innerHTML)) {
                let replaced = false;
                contentDiv.innerHTML = contentDiv.innerHTML.replace(placeholderRegex, (match) => {
                    if (!replaced) {
                        replaced = true;
                        return video.outerHTML;
                    }
                    return '';
                });
            }
        }
    }

    const editArea = document.createElement('div');
    editArea.classList.add('message-edit-area', 'hidden');
    messageDiv.appendChild(editArea);

    if (role === 'model' && cascadeInfo && cascadeInfo.total > 1) {
        const cascadeControlsDiv = document.createElement('div');
        cascadeControlsDiv.classList.add('message-cascade-controls');
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<span class="material-symbols-outlined">chevron_left</span>';
        prevButton.title = '前の応答';
        prevButton.classList.add('cascade-prev-btn');
        prevButton.disabled = cascadeInfo.currentIndex <= 1;
        prevButton.onclick = () => appLogic.navigateCascade(index, 'prev');
        cascadeControlsDiv.appendChild(prevButton);
        const indicatorSpan = document.createElement('span');
        indicatorSpan.classList.add('cascade-indicator');
        indicatorSpan.textContent = `${cascadeInfo.currentIndex}/${cascadeInfo.total}`;
        cascadeControlsDiv.appendChild(indicatorSpan);
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '<span class="material-symbols-outlined">chevron_right</span>';
        nextButton.title = '次の応答';
        nextButton.classList.add('cascade-next-btn');
        nextButton.disabled = cascadeInfo.currentIndex >= cascadeInfo.total;
        nextButton.onclick = () => appLogic.navigateCascade(index, 'next');
        cascadeControlsDiv.appendChild(nextButton);
        const deleteCascadeButton = document.createElement('button');
        deleteCascadeButton.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        deleteCascadeButton.title = 'この応答を削除';
        deleteCascadeButton.classList.add('cascade-delete-btn');
        deleteCascadeButton.onclick = () => appLogic.confirmDeleteCascadeResponse(index);
        cascadeControlsDiv.appendChild(deleteCascadeButton);
        messageDiv.appendChild(cascadeControlsDiv);
    }

    if (role !== 'error') {
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-actions');

        if (!isSummarized) {
            const editButton = document.createElement('button');
            editButton.innerHTML = '<span class="material-symbols-outlined">edit</span> 編集'; 
            editButton.title = 'メッセージを編集'; 
            editButton.classList.add('js-edit-btn');
            editButton.onclick = () => appLogic.startEditMessage(index, messageDiv);
            actionsDiv.appendChild(editButton);
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<span class="material-symbols-outlined">delete</span> 削除';
            deleteButton.title = 'この会話ターンを削除';
            deleteButton.classList.add('js-delete-btn');
            deleteButton.onclick = () => appLogic.deleteMessage(index);
            actionsDiv.appendChild(deleteButton);
            const copyButton = document.createElement('button');
            copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー';
            copyButton.title = 'メッセージをコピー';
            copyButton.classList.add('js-copy-btn');
            copyButton.onclick = () => {
                const msg = state.currentMessages[index];
                if (!msg) return;
                navigator.clipboard.writeText(msg.content || '').then(() => {
                    copyButton.innerHTML = '<span class="material-symbols-outlined">check</span> コピー済';
                    setTimeout(() => {
                        copyButton.innerHTML = '<span class="material-symbols-outlined">content_copy</span> コピー';
                    }, 1500);
                });
            };
            actionsDiv.appendChild(copyButton);
            if (role === 'user') {
                const retryButton = document.createElement('button');
                retryButton.innerHTML = '<span class="material-symbols-outlined">replay</span> 再生成'; 
                retryButton.title = 'このメッセージから再生成'; 
                retryButton.classList.add('js-retry-btn');
                retryButton.onclick = () => appLogic.retryFromMessage(index);
                actionsDiv.appendChild(retryButton);
            }
        }

        if (role === 'model' && messageData?.usageMetadata &&
            typeof messageData.usageMetadata.candidatesTokenCount === 'number' &&
            typeof messageData.usageMetadata.totalTokenCount === 'number')
        {
            const usage = messageData.usageMetadata;
            const tokenSpan = document.createElement('span');
            tokenSpan.classList.add('token-count-display');
            let finalTotalTokenCount = usage.totalTokenCount;
            if (typeof messageData.usageMetadata.thoughtsTokenCount === 'number') {
                finalTotalTokenCount -= messageData.usageMetadata.thoughtsTokenCount;
            }
            const formattedCandidates = usage.candidatesTokenCount.toLocaleString('en-US');
            const formattedTotal = finalTotalTokenCount.toLocaleString('en-US');
            const cacheRead = usage.cacheReadInputTokens || 0;
            const cacheWrite = usage.cacheCreationInputTokens || 0;
            const toK = n => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
            tokenSpan.textContent = `${formattedCandidates} / ${formattedTotal}`;
            if (cacheRead > 0 || cacheWrite > 0) {
                const cacheSpan = document.createElement('span');
                cacheSpan.classList.add('token-cache-display');
                let cacheParts = [];
                if (cacheRead > 0) cacheParts.push(`💾${toK(cacheRead)}`);
                if (cacheWrite > 0) cacheParts.push(`✏️${toK(cacheWrite)}`);
                cacheSpan.textContent = cacheParts.join(' ');
                tokenSpan.appendChild(document.createElement('br'));
                tokenSpan.appendChild(cacheSpan);
            }
            tokenSpan.title = `出力 / 合計トークン${cacheRead > 0 ? ` | キャッシュ読取: ${cacheRead.toLocaleString('en-US')}` : ''}${cacheWrite > 0 ? ` | キャッシュ書込: ${cacheWrite.toLocaleString('en-US')}` : ''}`;
            actionsDiv.appendChild(tokenSpan);
        }
        if (role === 'model' && typeof messageData?.retryCount === 'number' && messageData.retryCount > 0) {
            const retrySpan = document.createElement('span');
            retrySpan.classList.add('token-count-display');
            retrySpan.textContent = `(リトライ: ${messageData.retryCount}回)`;
            retrySpan.title = `APIリクエストを${messageData.retryCount}回再試行した結果です`;
            if (actionsDiv.querySelector('.token-count-display')) {
                retrySpan.style.marginLeft = '8px';
            }
            actionsDiv.appendChild(retrySpan);
        }
        
        if (actionsDiv.hasChildNodes()) {
            messageDiv.appendChild(actionsDiv);
        }
    }

    if (isStreamingPlaceholder) {
        messageDiv.id = `streaming-message-${index}`;
    }
    return messageDiv;
},


    // エラーメッセージを表示
    displayError(message, isApiError = false) {
        console.error("エラー表示:", message);
        const errorIndex = state.currentMessages.length; // 現在のメッセージリストの末尾に追加
        this.appendMessage('error', `エラー: ${message}`, errorIndex);
        elements.loadingIndicator.classList.add('hidden'); // ローディング非表示
        this.setSendingState(false); // 送信状態解除
    },
    // チャットタイトルを更新
    updateChatTitle(definitiveTitle = null) {
        let titleText = '新規チャット';
        let baseTitle = '';
        let isNewChat = !state.currentChatId;

        if (state.currentChatId) {
            isNewChat = false;
            if (definitiveTitle !== null) {
                baseTitle = definitiveTitle;
            } else {
                const firstUserMessage = state.currentMessages.find(m => m.role === 'user' && !m.isHidden);
                if (firstUserMessage) {
                    baseTitle = firstUserMessage.content;
                } else if (state.currentMessages.length > 0) {
                    baseTitle = "チャット履歴";
                }
            }
            if(baseTitle) {
                const displayBase = baseTitle.startsWith(IMPORT_PREFIX) ? baseTitle.substring(IMPORT_PREFIX.length) : baseTitle;
                const truncated = displayBase.substring(0, CHAT_TITLE_LENGTH);
                titleText = truncated + (displayBase.length > CHAT_TITLE_LENGTH ? '...' : '');
                if (baseTitle.startsWith(IMPORT_PREFIX)) {
                    titleText = IMPORT_PREFIX + titleText;
                }
            } else if(state.currentMessages.length > 0) {
                titleText = 'チャット履歴';
            }
            if (titleText === '新規チャット' && state.currentMessages.length > 0) {
                titleText = 'チャット履歴';
            }
        }
        
        // コロンを削除
        const displayTitle = titleText;
        elements.chatTitle.textContent = displayTitle;
        document.title = `PWA-lily - ${titleText}`;
    },


    // タイムスタンプをフォーマット
    formatDate(timestamp) {
        if (!timestamp) return '';
        try {
            // 日本語形式でフォーマット
            return new Intl.DateTimeFormat('ja-JP', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(timestamp));
        } catch (e) {
            // Intlが使えない場合のフォールバック
            console.warn("Intl.DateTimeFormatエラー:", e);
            const d = new Date(timestamp);
            return `${String(d.getFullYear()).slice(-2)}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        }
    },

    // 履歴リストをレンダリング
    async renderHistoryList() {
        try {
            const chats = await dbUtils.getAllChats(state.settings.historySortOrder);
            elements.historyList.querySelectorAll('.history-item:not(.js-history-item-template)').forEach(item => item.remove());

            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            let oldChatsCount = 0;

            if (chats && chats.length > 0) {
                elements.noHistoryMessage.classList.add('hidden');
                const sortOrderText = state.settings.historySortOrder === 'createdAt' ? '作成順' : '更新順';
                elements.historyTitle.textContent = `履歴一覧 (${sortOrderText})`;

                chats.forEach(chat => {
                    if (chat.updatedAt < sevenDaysAgo) {
                        oldChatsCount++;
                    }

                    const li = elements.historyItemTemplate.cloneNode(true);
                    li.classList.remove('js-history-item-template');
                    li.dataset.chatId = chat.id;

                    const titleText = chat.title || `履歴 ${chat.id}`;
                    const titleEl = li.querySelector('.history-item-title');
                    titleEl.textContent = titleText;
                    titleEl.title = titleText;

                    // 統計情報を表示
                    if (chat.stats) {
                        const totalTokenText = chat.stats.totalTokens > 0 ? chat.stats.totalTokens.toLocaleString() : '0';
                        const inputTokenText = chat.stats.inputTokens > 0 ? chat.stats.inputTokens.toLocaleString() : '0';
                        const outputTokenText = chat.stats.outputTokens > 0 ? chat.stats.outputTokens.toLocaleString() : '0';
                        li.querySelector('.js-stat-tokens').innerHTML = `<span class="material-symbols-outlined">token</span>${totalTokenText} (入:${inputTokenText} / 出:${outputTokenText})`;
                        li.querySelector('.js-stat-assets').innerHTML = `<span class="material-symbols-outlined">perm_media</span>${chat.stats.assetCount > 0 ? chat.stats.assetCount.toLocaleString() : '0'}`;
                        li.querySelector('.js-stat-size').innerHTML = `<span class="material-symbols-outlined">database</span>${chat.stats.totalAssetSize > 0 ? formatFileSize(chat.stats.totalAssetSize) : '0 B'}`;
                    } else {
                        // 古いデータにはstatsがない場合がある
                        li.querySelector('.history-item-stats').style.display = 'none';
                    }

                    li.querySelector('.created-date').textContent = `作成: ${this.formatDate(chat.createdAt)}`;
                    li.querySelector('.updated-date').textContent = `更新: ${this.formatDate(chat.updatedAt)}`;

                    li.onclick = async (event) => {
                        if (!event.target.closest('.history-item-actions button')) {
                            const screenTransitionPromise = uiUtils.showScreen('chat');
                            const loadChatPromise = appLogic.loadChat(chat.id);
                            await Promise.all([screenTransitionPromise, loadChatPromise]);
                        }
                    };
                    li.querySelector('.js-edit-title-btn').onclick = (e) => { e.stopPropagation(); appLogic.editHistoryTitle(chat.id, titleEl); };
                    li.querySelector('.js-export-btn').onclick = (e) => { e.stopPropagation(); appLogic.exportChat(chat.id, titleText); };
                    li.querySelector('.js-duplicate-btn').onclick = (e) => { e.stopPropagation(); appLogic.duplicateChat(chat.id); };
                    li.querySelector('.js-delete-btn').onclick = (e) => { e.stopPropagation(); appLogic.confirmDeleteChat(chat.id, titleText); };

                    elements.historyList.appendChild(li);
                });
            } else {
                elements.noHistoryMessage.classList.remove('hidden');
                elements.historyTitle.textContent = '履歴一覧';
                const pEl = elements.noHistoryMessage.querySelector('p') || elements.noHistoryMessage;
                const restoreBtn = document.getElementById('restore-from-cloud-btn');
                // フィルターなしの総数を確認し、プロジェクトフィルターで空なのか本当に空なのかを判別
                const getAllUnfiltered = window.dbUtils.getAllChatsUnfiltered || dbUtils.getAllChats.bind(dbUtils);
                const totalChats = await getAllUnfiltered();
                if (totalChats.length > 0) {
                    // プロジェクトフィルターで絞り込まれて空になっている
                    pEl.textContent = 'このプロジェクトにチャットはありません。';
                    if (restoreBtn) restoreBtn.classList.add('hidden');
                } else {
                    // DB自体が空
                    pEl.textContent = 'チャット履歴はありません。';
                    if (restoreBtn) {
                        dbUtils.getSetting('dropboxTokens').then(tok => {
                            restoreBtn.classList.toggle('hidden', !(tok && tok.value));
                        });
                    }
                }
            }

            // 古い履歴削除ボタンの状態を更新
            const deleteBtn = document.getElementById('delete-old-chats-btn');
            if (oldChatsCount > 0) {
                deleteBtn.disabled = false;
                deleteBtn.title = `${oldChatsCount}件の古い履歴を一括削除`;
            } else {
                deleteBtn.disabled = true;
                deleteBtn.title = '削除対象の古い履歴はありません';
            }

        } catch (error) {
            console.error("履歴リストのレンダリングエラー:", error);
            const pEl = elements.noHistoryMessage.querySelector('p') || elements.noHistoryMessage;
            pEl.textContent = "履歴の読み込み中にエラーが発生しました。";
            elements.noHistoryMessage.classList.remove('hidden');
            elements.historyTitle.textContent = '履歴一覧';
        }
    },

    // --- 背景画像UIヘルパー ---
    // 既存のオブジェクトURLを破棄
    revokeExistingObjectUrl() {
        if (state.backgroundImageUrl) {
            try {
                URL.revokeObjectURL(state.backgroundImageUrl);
                console.log("以前の背景URLを破棄:", state.backgroundImageUrl);
            } catch (e) {
                console.error("オブジェクトURLの破棄エラー:", e);
            }
            state.backgroundImageUrl = null;
        }
    },
    // 背景画像設定UIを更新
    updateBackgroundSettingsUI() {
        if (!elements.backgroundThumbnail || !elements.deleteBackgroundBtn) return;
        if (state.backgroundImageUrl) {
            elements.backgroundThumbnail.src = state.backgroundImageUrl;
            elements.backgroundThumbnail.classList.remove('hidden');
            elements.deleteBackgroundBtn.classList.remove('hidden');
        } else {
            elements.backgroundThumbnail.src = '';
            elements.backgroundThumbnail.classList.add('hidden');
            elements.deleteBackgroundBtn.classList.add('hidden');
        }
    },

    applyHeaderColor() {
        const customColor = state.settings.headerColor;
        if (customColor) {
            // カスタム色が設定されていれば、--header-color-custom 変数を設定
            document.documentElement.style.setProperty('--header-color-custom', customColor);
        } else {
            // 設定がなければ、--header-color-custom 変数を削除してデフォルトに戻す
            document.documentElement.style.removeProperty('--header-color-custom');
        }
        // ヘッダーの色が確定した後に、ブラウザのテーマカラーを更新
        // getComputedStyleで実際に適用されている色を取得
        const finalHeaderColor = getComputedStyle(elements.appHeader).backgroundColor;
        elements.themeColorMeta.content = finalHeaderColor;
        console.log(`ヘッダーカラー適用。テーマカラー: ${finalHeaderColor}`);
    },

    applyBackgroundImage() {
        // 一時的な背景が適用中の場合は、永続設定で上書きしない
        if (state.isTemporaryBackgroundActive) {
            console.log("一時的な背景が適用中のため、永続的な背景の適用をスキップしました。");
            return;
        }
        this.revokeExistingObjectUrl(); // 既存のURLがあれば破棄
        const blob = state.settings.backgroundImageBlob;
        if (blob instanceof Blob) {
            try {
                state.backgroundImageUrl = URL.createObjectURL(blob);
                const newUrl = `url("${state.backgroundImageUrl}")`;
                
                const chatScreen = elements.chatScreen;
                const isAlreadyVisible = chatScreen.classList.contains('background-visible');
    
                const switchImageAndFadeIn = () => {
                    document.documentElement.style.setProperty('--chat-background-image', newUrl);
                    chatScreen.classList.add('background-visible');
                };
    
                if (isAlreadyVisible) {
                    chatScreen.addEventListener('transitionend', switchImageAndFadeIn, { once: true });
                    chatScreen.classList.remove('background-visible');
                } else {
                    switchImageAndFadeIn();
                }
    
                console.log("背景画像をBlobから適用しました。");
            } catch (e) {
    
                console.error("背景画像のオブジェクトURL生成に失敗:", e);
                elements.chatScreen.classList.remove('background-visible');
                document.documentElement.style.removeProperty('--chat-background-image');
            }
        } else {
            elements.chatScreen.classList.remove('background-visible');
            document.documentElement.style.removeProperty('--chat-background-image');
        }
        this.updateBackgroundSettingsUI(); // 設定画面のUIも更新
    
    
    },

    // ------------------------------------

    // 設定をUIに適用
    applySettingsToUI() {
        // プロバイダーとAPIキーの設定（要素が存在する場合のみ）
        if (elements.apiProviderSelect) {
            const provider = state.settings.apiProvider || 'gemini';
            elements.apiProviderSelect.value = provider;
            if (elements.apiProviderRow) {
                elements.apiProviderRow.classList.remove('hidden');
            }
            appLogic.updateProviderUI(provider);
            appLogic.updateModelOptions(provider);
        }
        elements.apiKeyInput.value = state.settings.apiKey || '';
        if (elements.zaiApiKeyInput) {
            elements.zaiApiKeyInput.value = state.settings.zaiApiKey || '';
        }
        if (elements.openrouterApiKeyInput) {
            elements.openrouterApiKeyInput.value = state.settings.openrouterApiKey || '';
        }
        if (elements.bedrockAccessKeyInput) {
            elements.bedrockAccessKeyInput.value = state.settings.bedrockAccessKey || '';
        }
        if (elements.bedrockSecretKeyInput) {
            elements.bedrockSecretKeyInput.value = state.settings.bedrockSecretKey || '';
        }
        if (elements.bedrockRegionSelect) {
            elements.bedrockRegionSelect.value = state.settings.bedrockRegion || DEFAULT_BEDROCK_REGION;
        }
        if (elements.openaiApiKeyInput) {
            elements.openaiApiKeyInput.value = state.settings.openaiApiKey || '';
        }
        if (elements.anthropicApiKeyInput) {
            elements.anthropicApiKeyInput.value = state.settings.anthropicApiKey || '';
        }
        if (elements.anthropicCacheTTLSelect) {
            elements.anthropicCacheTTLSelect.value = state.settings.anthropicCacheTTL || '5m';
        }
        if (elements.anthropicEffortSelect) {
            elements.anthropicEffortSelect.value = state.settings.anthropicEffort || 'high';
        }
        if (elements.novelaiApiKeyInput) {
            elements.novelaiApiKeyInput.value = state.settings.novelaiApiKey || '';
        }
        if (elements.novelaiModelSelect) {
            elements.novelaiModelSelect.value = state.settings.novelaiModel || 'nai-diffusion-4-5-curated';
        }
        if (elements.groqApiKeyInput) {
            elements.groqApiKeyInput.value = state.settings.groqApiKey || '';
        }
        if (elements.deepseekApiKeyInput) {
            elements.deepseekApiKeyInput.value = state.settings.deepseekApiKey || '';
        }
        if (elements.xaiApiKeyInput) {
            elements.xaiApiKeyInput.value = state.settings.xaiApiKey || '';
        }
        if (elements.sakanaApiKeyInput) {
            elements.sakanaApiKeyInput.value = state.settings.sakanaApiKey || '';
        }
        if (elements.mistralApiKeyInput) {
            elements.mistralApiKeyInput.value = state.settings.mistralApiKey || '';
        }
        elements.modelNameSelect.value = state.settings.modelName || DEFAULT_MODEL;
        elements.systemPromptDefaultTextarea.value = state.settings.systemPrompt || '';
        elements.temperatureInput.value = state.settings.temperature === null ? '' : state.settings.temperature;
        elements.maxTokensInput.value = state.settings.maxTokens === null ? '' : state.settings.maxTokens;
        elements.topKInput.value = state.settings.topK === null ? '' : state.settings.topK;
        elements.topPInput.value = state.settings.topP === null ? '' : state.settings.topP;
        elements.thinkingBudgetInput.value = state.settings.thinkingBudget === null ? '' : state.settings.thinkingBudget;
        elements.includeThoughtsToggle.checked = state.settings.includeThoughts;
        elements.enableThoughtTranslationCheckbox.checked = state.settings.enableThoughtTranslation;
        elements.thoughtTranslationModelSelect.value = state.settings.thoughtTranslationModel || 'gemini-2.5-flash-lite';
        elements.thoughtTranslationOptionsDiv.classList.toggle('hidden', !state.settings.includeThoughts);
        elements.dummyUserInput.value = state.settings.dummyUser || '';
        if (elements.dummyEnabledToggle) elements.dummyEnabledToggle.checked = state.settings.dummyEnabled !== false;
        elements.applyDummyToProofreadCheckbox.checked = state.settings.applyDummyToProofread;
        elements.applyDummyToTranslateCheckbox.checked = state.settings.applyDummyToTranslate;
        elements.dummyModelInput.value = state.settings.dummyModel || '';
        elements.reverseDummyOrderCheckbox.checked = state.settings.reverseDummyOrder;
        elements.concatDummyModelCheckbox.checked = state.settings.concatDummyModel;
        elements.additionalModelsTextarea.value = state.settings.additionalModels || '';
        elements.enterToSendCheckbox.checked = state.settings.enterToSend;
        elements.historySortOrderSelect.value = state.settings.historySortOrder || 'updatedAt';
        elements.darkModeToggle.checked = state.settings.darkMode;
        elements.debugModeToggle.checked = state.settings.debugMode;
        elements.fontFamilyInput.value = state.settings.fontFamily || '';
        elements.hideSystemPromptToggle.checked = state.settings.hideSystemPromptInChat;
        elements.geminiEnableGroundingToggle.checked = state.settings.geminiEnableGrounding;
        elements.geminiEnableFunctionCallingToggle.checked = state.settings.geminiEnableFunctionCalling;
        elements.swipeNavigationToggle.checked = state.settings.enableSwipeNavigation;
        elements.enableProofreadingCheckbox.checked = state.settings.enableProofreading;
        elements.proofreadingModelNameSelect.value = state.settings.proofreadingModelName || 'gemini-2.5-flash';
        elements.proofreadingSystemInstructionTextarea.value = state.settings.proofreadingSystemInstruction || '';
        elements.proofreadingOptionsDiv.classList.toggle('hidden', !state.settings.enableProofreading);
        elements.enableAutoRetryCheckbox.checked = state.settings.enableAutoRetry;
        elements.maxRetriesInput.value = state.settings.maxRetries;
        elements.autoRetryOptionsDiv.classList.toggle('hidden', !state.settings.enableAutoRetry);
        elements.useFixedRetryDelayCheckbox.checked = state.settings.useFixedRetryDelay;
        elements.fixedRetryDelayInput.value = state.settings.fixedRetryDelaySeconds;
        elements.maxBackoffDelayInput.value = state.settings.maxBackoffDelaySeconds;
        elements.fixedRetryDelayContainer.classList.toggle('hidden', !state.settings.useFixedRetryDelay);
        elements.maxBackoffDelayContainer.classList.toggle('hidden', state.settings.useFixedRetryDelay);
        elements.enableApiTimeoutCheckbox.checked = state.settings.enableApiTimeout || false;
        elements.apiTimeoutSecondsInput.value = state.settings.apiTimeoutSeconds || 90;
        this.updateApiTimeoutOptionsVisibility();
        elements.googleSearchApiKeyInput.value = state.settings.googleSearchApiKey || '';
        elements.googleSearchEngineIdInput.value = state.settings.googleSearchEngineId || '';
        const opacityPercent = Math.round((state.settings.overlayOpacity ?? 0.65) * 100);
        if (elements.overlayOpacitySlider) elements.overlayOpacitySlider.value = opacityPercent;
        if (elements.overlayOpacityValue)  elements.overlayOpacityValue.textContent = `${opacityPercent}%`;
        const msgPercent = Math.round((state.settings.messageOpacity ?? 1) * 100);
        if (elements.messageOpacitySlider) elements.messageOpacitySlider.value = msgPercent;
        if (elements.messageOpacityValue)  elements.messageOpacityValue.textContent = `${msgPercent}%`;
        document.documentElement.style.setProperty('--message-bubble-opacity', String(state.settings.messageOpacity ?? 1));
        const promptUiCb = document.getElementById('allow-prompt-ui-changes');
        if (promptUiCb) promptUiCb.checked = state.settings.allowPromptUiChanges;
        elements.forceFunctionCallingToggle.checked = state.settings.forceFunctionCalling;
        elements.autoScrollToggle.checked = state.settings.autoScroll;
        elements.enableWideModeToggle.checked = state.settings.enableWideMode; 
        elements.enableMemoryToggle.checked = state.settings.enableMemory;
        elements.memoryAutoSaveIntervalSelect.value = state.settings.memoryAutoSaveInterval;
        appLogic.toggleMemoryOptions(state.settings.enableMemory);
        
        // ヘッダー自動非表示機能のUIを更新
        elements.headerAutoHideToggle.checked = state.settings.headerAutoHide;
        elements.summaryModelNameSelect.value = state.settings.summaryModelName || state.settings.modelName || 'gemini-2.5-flash';
        elements.summarySystemPromptTextarea.value = state.settings.summarySystemPrompt || '';
        elements.enableSummaryButtonToggle.checked = state.settings.enableSummaryButton;
        document.body.classList.toggle('header-auto-hide', state.settings.headerAutoHide);
        elements.floatingPanelBehaviorSelect.value = state.settings.floatingPanelBehavior || 'on-click';
        elements.dropboxSyncFrequencySelect.value = state.settings.dropboxSyncFrequency || 'instant';

        const defaultHeaderColor = state.settings.darkMode ? '#908675' : '#908675';
        elements.headerColorInput.value = state.settings.headerColor || defaultHeaderColor;

        this.updateUserModelOptions();
        this.updateBackgroundSettingsUI();
        this.applyDarkMode();
        this.applyFontFamily();
        this.toggleSystemPromptVisibility();
        this.applyOverlayOpacity();
        this.applyHeaderColor();
        this.updateModelWarningMessage();
        this.applyBackgroundImage();
        appLogic.applyWideMode();
        appLogic.toggleDebugLogButtonVisibility(state.settings.debugMode);

        elements.sdApiUrlInput.value = state.settings.sdApiUrl || '';
        elements.sdApiUserInput.value = state.settings.sdApiUser || '';
        elements.sdApiPasswordInput.value = state.settings.sdApiPassword || '';
        elements.sdEnableQualityCheckerCheckbox.checked = state.settings.sdEnableQualityChecker;
        elements.sdQcModelSelect.value = state.settings.sdQcModel || 'gemini-2.5-pro';
        elements.sdQcPromptTextarea.value = state.settings.sdQcPrompt || '';
        elements.sdQcRetriesInput.value = state.settings.sdQcRetries === null ? '' : state.settings.sdQcRetries;
        elements.sdPromptImproveModelSelect.value = state.settings.sdPromptImproveModel || 'gemini-2.5-flash';
        elements.sdPromptImproveSystemPromptTextarea.value = state.settings.sdPromptImproveSystemPrompt || '';
        elements.sdQualityCheckerOptionsDiv.classList.toggle('hidden', !state.settings.sdEnableQualityChecker);
    },



    // ユーザー指定モデルをコンボボックスに反映
    updateUserModelOptions() {
        const models = (state.settings.additionalModels || '')
            .split(',')
            .map(m => m.trim())
            .filter(m => m !== ''); // カンマ区切りで分割し、空要素を除去

        // 更新対象のグループとそれに対応するセレクターの設定値
        const targetGroups = [
            { 
                groupId: 'user-defined-models-group', 
                selectElement: elements.modelNameSelect, 
                currentValue: state.settings.modelName 
            },
            { 
                groupId: 'thought-translation-user-models', 
                selectElement: elements.thoughtTranslationModelSelect, 
                currentValue: state.settings.thoughtTranslationModel 
            },
            { 
                groupId: 'proofreading-user-models', 
                selectElement: elements.proofreadingModelNameSelect, 
                currentValue: state.settings.proofreadingModelName 
            },
            { 
                groupId: 'sd-qc-user-models', 
                selectElement: elements.sdQcModelSelect, 
                currentValue: state.settings.sdQcModel 
            },
            { 
                groupId: 'sd-prompt-improve-user-models', 
                selectElement: elements.sdPromptImproveModelSelect, 
                currentValue: state.settings.sdPromptImproveModel 
            },
            { 
                groupId: 'summary-user-models', 
                selectElement: elements.summaryModelNameSelect, 
                currentValue: state.settings.summaryModelName || state.settings.modelName 
            }
        ];

        // 各グループに対してユーザー定義モデルを追加
        targetGroups.forEach(({ groupId, selectElement, currentValue }) => {
            // メインのモデル選択(追加モデル)は per-provider の renderCustomModels が
            // 単独管理する。ここで触ると（特にChromeでは実行順の関係で）optgroupを
            // 空のまま disabled=true にしてしまい、追加モデルがグレーアウトして
            // 選べなくなるため、このグループはスキップする。
            if (groupId === 'user-defined-models-group') return;

            const group = document.getElementById(groupId);
            if (!group) return; // グループが存在しない場合はスキップ

            group.innerHTML = ''; // 一旦クリア

        if (models.length > 0) {
            group.disabled = false; // optgroupを有効化
            models.forEach(modelId => {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = modelId;
                group.appendChild(option);
            });
            // 現在選択中のモデルがユーザー指定モデルに含まれていれば、それを選択状態にする
                if (models.includes(currentValue) && selectElement) {
                    selectElement.value = currentValue;
            }
        } else {
            group.disabled = true; // モデルがなければoptgroupを無効化
        }
        });
    },

    // ダークモードを適用
    applyDarkMode() {
        const isDark = state.settings.darkMode;
        document.body.classList.toggle('dark-mode', isDark);
        // OS設定の上書き用クラス (ダークモードでない場合)
        document.body.classList.toggle('light-mode-forced', !isDark);
        elements.themeColorMeta.content = isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR;
        console.log(`ダークモード ${isDark ? '有効' : '無効'}. テーマカラー: ${elements.themeColorMeta.content}`);
        this.applyOverlayOpacity();
        this.applyHeaderColor();
    },

    // フォント設定を適用
    applyFontFamily() {
        const customFont = state.settings.fontFamily?.trim();
        const fontFamilyToApply = customFont ? customFont : DEFAULT_FONT_FAMILY;
        document.documentElement.style.setProperty('--font-family', fontFamilyToApply);
        console.log(`フォント適用: ${fontFamilyToApply}`);
    },

    // --- システムプロンプトUI更新 ---
    updateSystemPromptUI() {
        elements.systemPromptEditor.value = state.currentSystemPrompt;
        // 編集中でない場合、detailsタグを閉じる
        if (!state.isEditingSystemPrompt) {
            elements.systemPromptDetails.removeAttribute('open');
        }
        // テキストエリアの高さを調整
        this.adjustTextareaHeight(elements.systemPromptEditor, 200);
        // 表示/非表示を制御
        this.toggleSystemPromptVisibility();
    },
    // システムプロンプトエリアの表示/非表示を切り替え
    toggleSystemPromptVisibility() {
        const shouldHide = state.settings.hideSystemPromptInChat;
        elements.systemPromptArea.classList.toggle('hidden', shouldHide);
        console.log(`システムプロンプト表示エリア ${shouldHide ? '非表示' : '表示'}`);
    },
    // --------------------------------

    // 画面を表示 (スワイプアニメーション + inert対応 + 戻るボタン対応)
    showScreen(screenName, fromPopState = false) {
        return new Promise((resolve) => {
          const startTime = performance.now();
      
          // --- 同一画面への重複遷移は無視 ---
          if (screenName === state.currentScreen) {
            resolve();
            return;
          }
      
          const chat = elements.chatScreen;
          const historyEl = elements.historyScreen;
          const settings = elements.settingsScreen;
          const allScreens = [chat, historyEl, settings];
      
          const pos = {
            chat: {
              chat: 'translate3d(0,0,0)',
              history: 'translate3d(-100%,0,0)',
              settings: 'translate3d(100%,0,0)',
            },
            history: {
              chat: 'translate3d(100%,0,0)',
              history: 'translate3d(0,0,0)',
              settings: 'translate3d(200%,0,0)',
            },
            settings: {
              chat: 'translate3d(-100%,0,0)',
              history: 'translate3d(-200%,0,0)',
              settings: 'translate3d(0,0,0)',
            },
          };
      
          if (screenName === 'chat') {
            chat.style.transform = pos.chat.chat;
            historyEl.style.transform = pos.chat.history;
            settings.style.transform = pos.chat.settings;
          } else if (screenName === 'history') {
            chat.style.transform = pos.history.chat;
            historyEl.style.transform = pos.history.history;
            settings.style.transform = pos.history.settings;
            this.renderHistoryList();
          } else if (screenName === 'settings') {

            chat.style.transform = pos.settings.chat;
            historyEl.style.transform = pos.settings.history;
            settings.style.transform = pos.settings.settings;
          }
      
          void elements.appContainer.offsetHeight;
      
          let activeScreen = null;
          if (screenName === 'chat') activeScreen = chat;
          else if (screenName === 'history') activeScreen = historyEl;
          else if (screenName === 'settings') activeScreen = settings;
      
          if (activeScreen) {
            activeScreen.classList.add('active');
            activeScreen.inert = false;
          }
          allScreens.forEach((s) => {
            if (s !== activeScreen) {
              s.classList.remove('active');
              s.inert = true;
            }
          });
      
          if (!fromPopState) {
            const entry = { screen: screenName };
            if (screenName === 'chat' && state.__navSource === 'history-item') {
              history.replaceState(entry, '', '#chat');
            } else {
              history.pushState(entry, '', `#${screenName}`);
            }
          }
      
          let finished = false;
          const finish = () => {
            if (finished) return;
            finished = true;
            state.currentScreen = screenName;
            const endTime = performance.now();
            resolve();
          };
          requestAnimationFrame(() => requestAnimationFrame(finish));
          setTimeout(finish, 600);
        });
    },

    // 送信状態を設定
    setSendingState(sending) {
        state.isSending = sending;
        if (sending) {
            elements.sendButton.innerHTML = '<span class="material-symbols-outlined">stop</span>';
            elements.sendButton.classList.add('sending');
            elements.sendButton.title = "停止";
            elements.sendButton.disabled = false;
            elements.userInput.disabled = true;
            elements.attachFileBtn.disabled = true;
            elements.loadingIndicator.classList.remove('hidden');
            elements.loadingIndicator.setAttribute('aria-live', 'polite');
            elements.systemPromptDetails.style.pointerEvents = 'none';
            elements.systemPromptDetails.style.opacity = '0.7';
        } else {
            elements.sendButton.innerHTML = '<span class="material-symbols-outlined">send</span>';
            elements.sendButton.classList.remove('sending');
            elements.sendButton.title = "送信";
            elements.sendButton.disabled = elements.userInput.value.trim() === '' && state.pendingAttachments.length === 0;
            elements.userInput.disabled = false;
            elements.attachFileBtn.disabled = false;
            elements.loadingIndicator.classList.add('hidden');
            elements.loadingIndicator.removeAttribute('aria-live');
            elements.systemPromptDetails.style.pointerEvents = '';
            elements.systemPromptDetails.style.opacity = '';
        }
    },

    // テキストエリアの高さを自動調整
    adjustTextareaHeight(textarea = elements.userInput, maxHeight = TEXTAREA_MAX_HEIGHT) {
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';
        
        if (textarea === elements.userInput && !state.isSending) {
            elements.sendButton.disabled = textarea.value.trim() === '' && state.pendingAttachments.length === 0;
        }
    },



    // --- カスタムダイアログ関数 ---
    showCustomDialog(dialogElement, focusElement) {
        return new Promise((resolve) => {
            const closeListener = () => {
                dialogElement.removeEventListener('close', closeListener);
                resolve(dialogElement.returnValue);
            };
            dialogElement.addEventListener('close', closeListener);

            // アニメーションクラスを追加
            dialogElement.classList.add('animating');
            dialogElement.addEventListener('animationend', () => {
                dialogElement.classList.remove('animating');
            }, { once: true });

            dialogElement.showModal();
            
            if (focusElement) {
                requestAnimationFrame(() => { focusElement.focus(); });
            }
        });
    },

    // アラートダイアログ表示
    async showCustomAlert(message) {
        elements.alertMessage.textContent = message;
         // ボタンのイベントリスナーが重複しないように複製して置き換え
         const newOkBtn = elements.alertOkBtn.cloneNode(true);
         elements.alertOkBtn.parentNode.replaceChild(newOkBtn, elements.alertOkBtn);
         elements.alertOkBtn = newOkBtn;
        elements.alertOkBtn.onclick = () => elements.alertDialog.close('ok');
        await this.showCustomDialog(elements.alertDialog, elements.alertOkBtn);
    },
    // 確認ダイアログ表示
    async showCustomConfirm(message) {
        elements.confirmMessage.textContent = message;
         // ボタンのイベントリスナーが重複しないように複製して置き換え
         const newOkBtn = elements.confirmOkBtn.cloneNode(true);
         elements.confirmOkBtn.parentNode.replaceChild(newOkBtn, elements.confirmOkBtn);
         elements.confirmOkBtn = newOkBtn;
         const newCancelBtn = elements.confirmCancelBtn.cloneNode(true);
         elements.confirmCancelBtn.parentNode.replaceChild(newCancelBtn, elements.confirmCancelBtn);
         elements.confirmCancelBtn = newCancelBtn;

        elements.confirmOkBtn.onclick = () => elements.confirmDialog.close('ok');
        elements.confirmCancelBtn.onclick = () => elements.confirmDialog.close('cancel');
        const result = await this.showCustomDialog(elements.confirmDialog, elements.confirmOkBtn);
        return result === 'ok'; // OKが押されたか
    },
    // プロンプトダイアログ表示
    async showCustomPrompt(message, defaultValue = '') {
        elements.promptMessage.textContent = message;
        elements.promptInput.value = defaultValue;
         // ボタンと入力欄のイベントリスナーが重複しないように複製して置き換え
         const newOkBtn = elements.promptOkBtn.cloneNode(true);
         elements.promptOkBtn.parentNode.replaceChild(newOkBtn, elements.promptOkBtn);
         elements.promptOkBtn = newOkBtn;
         const newCancelBtn = elements.promptCancelBtn.cloneNode(true);
         elements.promptCancelBtn.parentNode.replaceChild(newCancelBtn, elements.promptCancelBtn);
         elements.promptCancelBtn = newCancelBtn;
         const newPromptInput = elements.promptInput.cloneNode(true);
         elements.promptInput.parentNode.replaceChild(newPromptInput, elements.promptInput);
         elements.promptInput = newPromptInput;

        // EnterキーでOKボタンをクリックする処理
        const enterHandler = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                elements.promptOkBtn.click();
            }
        };
        elements.promptInput.addEventListener('keypress', enterHandler);

        elements.promptOkBtn.onclick = () => elements.promptDialog.close(elements.promptInput.value); // OK時は入力値を返す
        elements.promptCancelBtn.onclick = () => elements.promptDialog.close(''); // キャンセル時は空文字列 ('') を渡す

        // ダイアログが閉じたらEnterキーリスナーを削除
        const closeHandler = () => {
            elements.promptInput.removeEventListener('keypress', enterHandler);
            elements.promptDialog.removeEventListener('close', closeHandler);
        };
         elements.promptDialog.addEventListener('close', closeHandler);

        const result = await this.showCustomDialog(elements.promptDialog, elements.promptInput);
        return result; // 入力値またはnullを返す
    },

    // 添付ファイルバッジの表示/非表示を更新する関数
    updateAttachmentBadgeVisibility() {
        const hasAttachments = state.pendingAttachments.length > 0;
        elements.attachFileBtn.classList.toggle('has-attachments', hasAttachments);
    },

    // ファイルアップロードダイアログ表示
    showFileUploadDialog() {
        if (state.selectedFilesForUpload.length === 0 && state.pendingAttachments.length > 0) {
            state.selectedFilesForUpload = state.pendingAttachments.map(att => ({ file: att.file }));
            console.log("送信待ちの添付ファイルをダイアログに復元:", state.selectedFilesForUpload.map(item => item.file.name));
        } else if (state.selectedFilesForUpload.length === 0) {
            // ファイルが選択されておらず、送信待ちもない場合はクリアを確実にする
            state.selectedFilesForUpload = [];
        }

        this.updateSelectedFilesUI();
        elements.fileUploadDialog.showModal();
        this.updateAttachmentBadgeVisibility();
    },

    // 選択されたファイルリストのUIを更新 (変更なし、呼び出しタイミングが重要)
    updateSelectedFilesUI() {
        elements.selectedFilesList.innerHTML = ''; // リストをクリア
        let totalSize = 0;
        // selectedFilesForUpload には { file: File } が入っている
        state.selectedFilesForUpload.forEach((item, index) => {
            const li = document.createElement('li');
            li.classList.add('selected-file-item');
            li.dataset.fileIndex = index;

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('selected-file-info');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('selected-file-name');
            nameSpan.textContent = item.file.name;
            nameSpan.title = item.file.name;

            const sizeSpan = document.createElement('span');
            sizeSpan.classList.add('selected-file-size');
            sizeSpan.textContent = formatFileSize(item.file.size); // File オブジェクトからサイズ取得

            infoDiv.appendChild(nameSpan);
            infoDiv.appendChild(sizeSpan);

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-file-btn');
            removeBtn.title = '削除';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => appLogic.removeSelectedFile(index);

            li.appendChild(infoDiv);
            li.appendChild(removeBtn);
            elements.selectedFilesList.appendChild(li);

            totalSize += item.file.size;
        });

        // 合計サイズチェック
        if (totalSize > MAX_TOTAL_ATTACHMENT_SIZE) {
            elements.confirmAttachBtn.disabled = true;
            // アラートはファイル追加時に行う方が親切かもしれない
            // uiUtils.showCustomAlert(`合計ファイルサイズが大きすぎます (${formatFileSize(MAX_TOTAL_ATTACHMENT_SIZE)}以下にしてください)。`);
        } else {
            // サイズが問題なければ常に有効化
            elements.confirmAttachBtn.disabled = false;
        }
    },

    // モデル選択に応じた警告メッセージの表示/非表示を切り替え
    updateModelWarningMessage() {
        const selectedModel = elements.modelNameSelect.value;
        const isNanoBanana = selectedModel === 'gemini-2.5-flash-image-preview';
        elements.modelWarningMessage.classList.toggle('hidden', !isNanoBanana);
    },
    updateProfileSwitcher() {
        const switcher = elements.profileSwitcher;
        switcher.innerHTML = '';
        state.profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = profile.name;
            if (profile.id === state.activeProfileId) {
                option.selected = true;
            }
            switcher.appendChild(option);
        });
        console.log("[UI] プロファイルスイッチャーを更新しました。");
    },

    updateProfileSwitcherUI() {
        const menus = [elements.headerProfileMenu, elements.headerProfileMenuSettings];

        menus.forEach(menu => {
            if (!menu) return;
            menu.innerHTML = '';
            menu.addEventListener('click', e => e.stopPropagation());
        });

        state.profiles.forEach(profile => {
            const menuItem = document.createElement('div');
            menuItem.classList.add('profile-menu-item');
            if (profile.id === state.activeProfileId) {
                menuItem.classList.add('active');
            }
            menuItem.dataset.profileId = profile.id;

            const iconContainer = document.createElement('div');
            iconContainer.classList.add('profile-icon-container');
            
            if (profile.icon) {
                let url = state.profileIconUrls.get(profile.id);
                if (!url) {
                    url = URL.createObjectURL(profile.icon);
                    state.profileIconUrls.set(profile.id, url);
                }
                iconContainer.innerHTML = `<img src="${url}" alt="${htmlUtils.escapeAttr(profile.name)}">`;
            } else {
                iconContainer.innerHTML = `<span class="material-symbols-outlined">account_circle</span>`;
            }

            const textContainer = document.createElement('div');
            textContainer.classList.add('profile-menu-text-container');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('profile-menu-name');
            nameSpan.textContent = profile.name;
            textContainer.appendChild(nameSpan);

            const modelLineDiv = document.createElement('div');
            modelLineDiv.classList.add('profile-menu-model-line');

            const modelSpan = document.createElement('span');
            modelSpan.classList.add('profile-menu-model');
            modelSpan.textContent = profile.settings?.modelName || 'モデル未設定';
            modelLineDiv.appendChild(modelSpan);

            if (profile.settings?.modelName === 'gemini-2.5-pro') {
                const usage = profile.apiUsage || { count: 0 };
    
                const countSpan = document.createElement('span');
                countSpan.classList.add('profile-menu-api-count');
                countSpan.textContent = `(本日: ${usage.count} 回)`;
                modelLineDiv.appendChild(countSpan);
            }
            
            textContainer.appendChild(modelLineDiv);

            menuItem.appendChild(iconContainer);
            menuItem.appendChild(textContainer);

            const switchHandler = (event) => {
                event.stopPropagation();
                appLogic.switchProfile(profile.id);
                menus.forEach(m => m?.classList.add('hidden'));
            };
            
            menus.forEach(menu => {
                if (menu) {
                    const clonedItem = menuItem.cloneNode(true);
                    clonedItem.onclick = switchHandler;
                    menu.appendChild(clonedItem);
                }
            });
        });
        
        console.log("[UI] プロファイルメニューを更新しました。");
    },


    updateProfileCardUI() {
        if (!state.activeProfile) return;
        const profile = state.activeProfile;
        
        // --- ヘッダーカード (チャット & 設定) ---
        const cards = [
            { name: elements.profileCardName, container: elements.profileCardIconContainer },
            { name: elements.profileCardNameSettings, container: elements.profileCardIconContainerSettings }
        ];
        
        cards.forEach(card => {
            // アイコンコンテナが存在すれば、アイコンの更新は必ず実行する
            if (card.container) {
                if (profile.icon) {
                    let url = state.profileIconUrls.get(profile.id);
                    if (!url) {
                        url = URL.createObjectURL(profile.icon);
                        state.profileIconUrls.set(profile.id, url);
                    }
                    card.container.innerHTML = `<img src="${url}" alt="プロファイルアイコン">`;
                } else {
                    card.container.innerHTML = `<span class="material-symbols-outlined">account_circle</span>`;
                }
            }
            // 名前の要素が存在する場合のみ、名前を更新する
            if (card.name) {
                card.name.textContent = profile.name;
            }
        });

        // --- 設定画面のプロファイル編集エリア ---
        const iconImg = elements.profileDisplayIcon;
        const iconPlaceholder = iconImg.nextElementSibling;
        if (profile.icon) {
            let url = state.profileIconUrls.get(profile.id);
            if (!url) {
                url = URL.createObjectURL(profile.icon);
                state.profileIconUrls.set(profile.id, url);
            }
            iconImg.src = url;
            iconImg.style.display = 'block';
            iconPlaceholder.style.display = 'none';
            elements.profileResetIconBtn.style.display = 'flex';
        } else {
            iconImg.style.display = 'none';
            iconPlaceholder.style.display = 'flex';
            elements.profileResetIconBtn.style.display = 'none';
        }
        elements.profileDisplayNameMain.textContent = profile.name;
        
        const subText = `${profile.settings.modelName || '...'} / T: ${profile.settings.temperature ?? '...'}`;
        elements.profileDisplayNameSub.textContent = subText;
        
        elements.profileDisplayStatus.classList.toggle('active', profile.id === state.activeProfileId);

        console.log("[UI] プロファイルカードUIを更新しました。");
    },
    

    toggleProfileMenu(type) {
        console.log(`[Debug Toggle] toggleProfileMenuが呼び出されました。type: ${type}`);
        const menu = type === 'header' ? elements.headerProfileMenu : elements.headerProfileMenuSettings;
        console.log('[Debug Toggle] 対象メニュー要素:', menu);
        if (menu) {
            menu.classList.toggle('hidden');
            console.log(`[Debug Toggle] hiddenクラスをトグルしました。現在のクラス: ${menu.className}`);
        } else {
            console.error('[Debug Toggle] エラー: 対象となるメニュー要素が見つかりません。');
        }
    },

    // --- 進捗ダイアログ ヘルパー ---
    showProgressDialog(message) {
        elements.progressMessage.textContent = message;
        if (!elements.progressDialog.open) {
            elements.progressDialog.showModal();
        }
    },
    updateProgressMessage(message) {
        elements.progressMessage.textContent = message;
    },
    hideProgressDialog() {
        if (elements.progressDialog.open) {
            elements.progressDialog.close();
        }
    },

    showSyncNotification(message, isError = false) {
        const notification = document.getElementById('sync-notification');
        const icon = document.getElementById('sync-notification-icon');
        const messageEl = document.getElementById('sync-notification-message');

        if (!notification || !icon || !messageEl) return;

        messageEl.textContent = message;
        notification.classList.remove('success', 'error');

        if (isError) {
            notification.classList.add('error');
            icon.textContent = 'cloud_off';
        } else {
            notification.classList.add('success');
            icon.textContent = 'check_circle';
        }

        notification.classList.remove('hidden');
        notification.style.opacity = 1;

        setTimeout(() => {
            notification.style.opacity = 0;
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 500);
        }, 4000);
    },
}; // uiUtilsオブジェクトの末尾
