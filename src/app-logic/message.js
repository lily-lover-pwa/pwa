// appLogic 機能モジュール: message（Phase 3 で app-logic.js から分割）。挙動は不変。
import { apiUtils } from '../api.js';
import { GEMINI_API_BASE_URL, INITIAL_RETRY_DELAY } from '../constants.js';
import { dbUtils } from '../db.js';
import { elements } from '../dom-elements.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';
import { htmlUtils } from '../utils/html.js';
import { interruptibleSleep, sleep } from '../utils/format.js';

export const messageMethods = {

    async proofreadText(textToProofread) {
        console.log("--- 校正処理開始 ---");
        const { 
            proofreadingModelName, 
            proofreadingSystemInstruction, 
            apiKey, 
            temperature, 
            maxTokens, 
            topK, 
            topP,
            enableAutoRetry,
            maxRetries
        } = state.settings;

        if (!proofreadingModelName) {
            throw new Error("校正用モデルが設定されていません。");
        }

        const endpoint = `${GEMINI_API_BASE_URL}${proofreadingModelName}:generateContent`;
        const systemInstruction = proofreadingSystemInstruction?.trim() ? { parts: [{ text: proofreadingSystemInstruction.trim() }] } : null;
        const generationConfig = {};
        if (temperature !== null) generationConfig.temperature = temperature;
        if (maxTokens !== null) generationConfig.maxOutputTokens = maxTokens;
        if (topK !== null) generationConfig.topK = topK;
        if (topP !== null) generationConfig.topP = topP;

        const requestBody = {
            contents: [{ role: 'user', parts: [{ text: textToProofread }] }],
            ...(Object.keys(generationConfig).length > 0 && { generationConfig }),
            ...(systemInstruction && { systemInstruction }),
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        if (state.settings.dummyEnabled && state.settings.applyDummyToProofread && state.settings.dummyUser) {
            requestBody.contents.push({
                role: 'user',
                parts: [{ text: state.settings.dummyUser }]
            });
            console.log("校正リクエストにダミーUserプロンプトを適用しました。");
        }

        console.log("校正APIへの送信データ:", JSON.stringify(requestBody, null, 2));

        let lastError = null;
        const maxProofreadRetries = enableAutoRetry ? maxRetries : 0;

        for (let attempt = 0; attempt <= maxProofreadRetries; attempt++) {
            try {
                if (state.abortController?.signal.aborted) {
                    throw new Error("リクエストがキャンセルされました。");
                }

                if (attempt > 0) {
                    let delay;
                    if (state.settings.useFixedRetryDelay) {
                        delay = state.settings.fixedRetryDelaySeconds * 1000;
                    } else {
                        const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                        const maxDelay = state.settings.maxBackoffDelaySeconds * 1000;
                        delay = Math.min(exponentialDelay, maxDelay);
                    }
                    
                    uiUtils.setLoadingIndicatorText(`校正エラー 再試行(${attempt}回目)... ${Math.round(delay/1000)}秒待機`);
                    console.log(`校正APIリトライ ${attempt}: ${delay}ms待機...`);
                    await interruptibleSleep(delay, state.abortController.signal);
                }

                if (attempt === 0) {
                    uiUtils.setLoadingIndicatorText('校正中...');
                } else if (attempt === 1) {
                    uiUtils.setLoadingIndicatorText('校正処理を再試行中...');
                } else {
                    uiUtils.setLoadingIndicatorText(`校正処理${attempt}回目の再試行中...`);
                }

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                    body: JSON.stringify(requestBody),
                    signal: state.abortController?.signal
                });

                if (!response.ok) {
                    let errorMsg = `校正APIエラー (${response.status}): ${response.statusText}`;
                    try {
                        const errorData = await response.json();
                        if (errorData.error?.message) {
                            errorMsg = `校正APIエラー (${response.status}): ${errorData.error.message}`;
                        }
                    } catch (e) { /* JSONパース失敗は無視 */ }
                    const error = new Error(errorMsg);
                    error.status = response.status;
                    throw error;
                }

                const responseData = await response.json();
                if (responseData.candidates?.[0]?.content?.parts) {
                    const proofreadContent = responseData.candidates[0].content.parts.map(p => p.text).join('');
                    console.log("--- 校正処理成功 ---");
                    return proofreadContent;
                } else if (responseData.promptFeedback) {
                    const blockReason = responseData.promptFeedback.blockReason || 'SAFETY';
                    throw new Error(`校正モデルに応答がブロックされました (理由: ${blockReason})`);
                } else {
                    throw new Error("校正APIの応答に有効なコンテンツが含まれていません。");
                }

            } catch (error) {
                lastError = error;
                if (error.name === 'AbortError') {
                    throw error;
                }
                if (error.status && error.status >= 400 && error.status < 500) {
                    console.error(`リトライ不可の校正エラー (ステータス: ${error.status})。`, error);
                    throw error;
                }
                console.warn(`校正API呼び出し試行 ${attempt + 1} が失敗。`, error);
            }
        }

        console.error("校正APIの最大リトライ回数に達しました。");
        throw lastError;
    },


    
    /**
     * @private API通信と応答解析、ループ処理に責務を特化した内部関数。
     * stateの変更やUIの更新は一切行わない。
     * @param {Array} messagesForApi - APIに送信するメッセージ履歴。
     * @param {object} generationConfig - 生成設定。
     * @param {object} systemInstruction - システムプロンプト。
     * @returns {Promise<Array>} 生成された新しいメッセージオブジェクトの配列。
    */
     async _internalHandleSend(messagesForApi, generationConfig, systemInstruction) {
        let loopCount = 0;
        // Z.ai API(OpenAI互換)は1回のレスポンスで1つのtool_callしか返さないため、
        // Gemini APIよりも多くのループが必要
        const MAX_LOOPS = 20;
        const finalTurnResults = [];
        let currentTurnHistory = [...messagesForApi];
        let aggregatedSearchResults = [];

        uiUtils.setLoadingIndicatorText('応答生成中...');

        while (loopCount < MAX_LOOPS) {
            loopCount++;

            const result = await this.callApiWithRetry({
                messagesForApi: currentTurnHistory,
                generationConfig,
                systemInstruction,
                tools: window.functionDeclarations,
                isFirstCall: (loopCount === 1)
            });

            const modelMessage = {
                role: 'model',
                content: result.content || '',
                thoughtSummary: (finalTurnResults.length === 0) ? result.thoughtSummary : null,
                tool_calls: result.toolCalls,
                timestamp: Date.now(),
                finishReason: result.finishReason,
                safetyRatings: result.safetyRatings,
                usageMetadata: result.usageMetadata,
                retryCount: result.retryCount,
                executedFunctions: []
            };
            finalTurnResults.push(modelMessage);

            if (!result.toolCalls || result.toolCalls.length === 0) {
                console.log("[_internalHandleSend] ツール呼び出しがないため、ループを終了します。");
                break;
            }
            
            const historyForFunctions = state.currentMessages.slice(0, -1);
            const responseTextForQc = result.content || '';
            
            const toolResults = [];
            let containsTerminalAction = false;
            
            for (const toolCall of result.toolCalls) {
                const functionName = toolCall.functionCall.name;
                const functionArgs = toolCall.functionCall.args;
                
                console.log(`[Function Calling] 実行: ${functionName}`, functionArgs);
                
                if (functionName === 'generate_image_stable_diffusion') {
                    uiUtils.setLoadingIndicatorText('SDで画像生成中...');
                } else if (functionName === 'generate_image_novelai') {
                    uiUtils.setLoadingIndicatorText('NovelAIで画像生成中...');
                } else if (functionName === 'run_quality_checker') {
                    uiUtils.setLoadingIndicatorText('品質チェック中...');
                } else {
                    uiUtils.setLoadingIndicatorText('関数実行中...');
                }

                let toolResult;
                try {
                    const argsWithContext = { ...functionArgs, _responseTextForQc: responseTextForQc };
                    toolResult = await window.functionCallingTools[functionName](argsWithContext, {
                        messages: historyForFunctions.filter(m => m.role !== 'tool'),
                        persistentMemory: state.currentPersistentMemory
                    });
                } catch (toolError) {
                    console.error(`[_internalHandleSend] ${functionName}の実行中に予期せぬエラー:`, toolError);
                    toolResult = { error: { message: `ツール実行中に予期せぬエラーが発生しました: ${toolError.message}` } };
                }

                if (['generate_image', 'generate_image_stable_diffusion', 'generate_image_novelai', 'generate_video', 'edit_image', 'display_layered_image'].includes(functionName)) {
                    containsTerminalAction = true;
                    console.log(`[Function Calling] 終端アクション (${functionName}) を検出しました。`);
                }

                const responseForAI = { ...toolResult };
                if (toolResult.search_results) {
                    aggregatedSearchResults.push(...toolResult.search_results);
                    delete responseForAI.search_results;
                }
                if (toolResult._internal_ui_action) {
                    delete responseForAI._internal_ui_action;
                }

                const toolResponseMessage = { 
                    role: 'tool', 
                    name: functionName, 
                    response: responseForAI, 
                    timestamp: Date.now(),
                    _toolCallId: toolCall.functionCall._toolCallId  // OpenAI互換APIのtool_call_idを保持
                };
                
                if(toolResult._internal_ui_action){
                    toolResponseMessage._internal_ui_action = toolResult._internal_ui_action;
                }

                toolResults.push(toolResponseMessage);
                modelMessage.executedFunctions.push(functionName);
            }
            
            finalTurnResults.push(...toolResults);
            
            if (containsTerminalAction) {
                console.log("終端アクションが検出されたため、Function Callingループを終了します。");
                if (!result.content) {
                    console.log("[_internalHandleSend] テキスト応答がなかったため、ツール結果を基に最終応答を生成します。");
                    uiUtils.setLoadingIndicatorText('最終応答を生成中...');

                    const partsForApi = [
                        ...(result.thoughtParts || []),
                        ...result.toolCalls.map(tc => ({ functionCall: tc.functionCall }))
                    ];
                    const modelMessageForApi = { role: 'model', parts: partsForApi };
                    const toolResultsForApi = toolResults.map(tr => ({ 
                        role: 'tool', 
                        parts: [{ 
                            functionResponse: { 
                                name: tr.name, 
                                response: tr.response,
                                _toolCallId: tr._toolCallId  // OpenAI互換APIのtool_call_idを引き継ぐ
                            } 
                        }] 
                    }));
                    currentTurnHistory.push(modelMessageForApi, ...toolResultsForApi);

                    // Bedrock使用時はレート制限回避のため遅延を入れる
                    if (state.settings.apiProvider === 'bedrock') {
                        const delayMs = 6500; // 6.5秒の遅延（レート制限: 毎分10リクエスト = 6秒間隔 + 余裕0.5秒）
                        console.log(`[Bedrock] レート制限回避のため ${delayMs}ms 待機します...`);
                        uiUtils.setLoadingIndicatorText(`レート制限回避のため ${delayMs/1000}秒待機中...`);
                        await interruptibleSleep(delayMs, state.abortController.signal);
                    }

                    const textResult = await this.callApiWithRetry({ 
                        messagesForApi: currentTurnHistory,
                        generationConfig,
                        systemInstruction,
                        tools: null,
                        isFirstCall: false
                    });
                    
                    modelMessage.content = textResult.content || '';
                }
                break;
            }

                const partsForApi = [
                    ...(result.thoughtParts || []),
                    ...result.toolCalls.map(tc => ({ functionCall: tc.functionCall }))
                ];

                const modelMessageForApi = { role: 'model', parts: partsForApi };
                const toolResultsForApi = toolResults.map(tr => ({
                    role: 'tool',
                    parts: [{
                        functionResponse: {
                            name: tr.name,
                            response: tr.response,
                            _toolCallId: tr._toolCallId  // OpenAI互換APIのtool_call_idを引き継ぐ
                        }
                    }]
                }));
                currentTurnHistory.push(modelMessageForApi, ...toolResultsForApi);
            
            // Bedrock使用時はレート制限回避のため遅延を入れる
            if (state.settings.apiProvider === 'bedrock') {
                const delayMs = 6500; // 6.5秒の遅延（レート制限: 毎分10リクエスト = 6秒間隔 + 余裕0.5秒）
                console.log(`[Bedrock] レート制限回避のため ${delayMs}ms 待機します...`);
                uiUtils.setLoadingIndicatorText(`レート制限回避のため ${delayMs/1000}秒待機中...`);
                await interruptibleSleep(delayMs, state.abortController.signal);
            }
            
            uiUtils.setLoadingIndicatorText('応答生成中...');
        }

        if (loopCount >= MAX_LOOPS) {
            console.warn("Function Callingのループが上限に達しました。");
            const finalErrorMessage = {
                role: 'model',
                content: 'AIが同じ操作を繰り返しているようです。処理を中断しました。プロンプトを修正して再度お試しください。',
                timestamp: Date.now(),
            };
            finalTurnResults.push(finalErrorMessage);
        }
        
        // 後処理（翻訳や校正）
        const finalModelMessages = finalTurnResults.filter(m => m.role === 'model');
        if (finalModelMessages.length > 0) {
            if (aggregatedSearchResults.length > 0) {
                const lastMessage = finalModelMessages[finalModelMessages.length - 1];
                lastMessage.search_web_results = aggregatedSearchResults;
            }

            if (state.settings.enableProofreading) {
                const lastTextResponse = finalModelMessages.filter(m => m.content).pop();
                if (lastTextResponse) {
                    try {
                        uiUtils.setLoadingIndicatorText('校正中...');
                        lastTextResponse.content = await this.proofreadText(lastTextResponse.content);
                    } catch (proofreadError) {
                        console.error("校正処理中にエラーが発生しました。校正前のテキストを使用します。", proofreadError);
                    }
                }
            }

            if (state.settings.enableThoughtTranslation) {
                for (const msg of finalModelMessages) {
                    if (msg.thoughtSummary) {
                        try {
                            uiUtils.setLoadingIndicatorText('思考プロセスを翻訳中...');
                            msg.thoughtSummary = await apiUtils.translateText(msg.thoughtSummary, state.settings.thoughtTranslationModel);
                        } catch (translateError) {
                            console.error("思考プロセスの翻訳中にエラーが発生しました。原文を使用します。", translateError);
                        }
                    }
                }
            }
        }
        
        return finalTurnResults;
    },






    /**
     * @private _internalHandleSendから返されたメッセージ配列を単一のオブジェクトに集約する。
     */
     _aggregateMessages(messages) {
        // 最後に content を持つ model メッセージを探す。なければ、最後の model メッセージを探す。
        const primaryModelMessage = [...messages].reverse().find(m => m.role === 'model' && m.content) 
                                 || [...messages].reverse().find(m => m.role === 'model');

        // プライマリメッセージが見つからない場合は、空のオブジェクトを返す（安全対策）
        if (!primaryModelMessage) {
            console.warn("[_aggregateMessages] プライマリとなるモデルメッセージが見つかりませんでした。");
            return { role: 'model', content: '', timestamp: Date.now(), imageIds: [] };
        }

        // プライマリメッセージをベースとして、最終的なオブジェクトを作成（ディープコピー）
        const finalAggregatedMessage = JSON.parse(JSON.stringify(primaryModelMessage));

        // imageIds や executedFunctions などを初期化
        finalAggregatedMessage.imageIds = finalAggregatedMessage.imageIds || [];
        finalAggregatedMessage.executedFunctions = finalAggregatedMessage.executedFunctions || [];
        finalAggregatedMessage.generated_videos = finalAggregatedMessage.generated_videos || [];

        // 全てのメッセージを走査し、ツール関連の情報をマージする
        messages.forEach(msg => {
            // 自身（プライマリ）以外のモデルメッセージからは、ツール実行履歴のみをマージ
            if (msg.role === 'model' && msg !== primaryModelMessage) {
                if (msg.executedFunctions) {
                    finalAggregatedMessage.executedFunctions.push(...msg.executedFunctions);
                }
            }
            
            // ツール応答からUIアクション（画像IDなど）をマージ
            if (msg.role === 'tool' && msg._internal_ui_action) {
                const actions = Array.isArray(msg._internal_ui_action) ? msg._internal_ui_action : [msg._internal_ui_action];
                actions.forEach(action => {
                    if (action.type === 'display_generated_images' && action.imageIds) {
                        finalAggregatedMessage.imageIds.push(...action.imageIds);
                    }
                    if (action.type === 'display_generated_videos' && action.videos) {
                        finalAggregatedMessage.generated_videos.push(...action.videos);
                    }
                });
            }
        });

        // 重複を除去
        finalAggregatedMessage.imageIds = [...new Set(finalAggregatedMessage.imageIds)];
        finalAggregatedMessage.executedFunctions = [...new Set(finalAggregatedMessage.executedFunctions)];

        // タイムスタンプを更新
        finalAggregatedMessage.timestamp = Date.now();

        return finalAggregatedMessage;
    },


    
    async handleSend() {
        state.pendingCascadeResponses = null; // 保留中のカスケードデータをクリア
        if (state.isSending) { return; }
        if (state.editingMessageIndex !== null) { await uiUtils.showCustomAlert("他のメッセージを編集中です。"); return; }
        if (state.isEditingSystemPrompt) { await uiUtils.showCustomAlert("システムプロンプトを編集中です。"); return; }

        const text = elements.userInput.value.trim();
        const attachmentsToSend = [...state.pendingAttachments];
        if (!text && attachmentsToSend.length === 0) return;

        uiUtils.setSendingState(true);
        uiUtils.setLoadingIndicatorText('応答生成中...');
        
        const userMessage = { role: 'user', content: text, timestamp: Date.now(), attachments: attachmentsToSend };
        state.currentMessages.push(userMessage);
        uiUtils.appendMessage(userMessage.role, userMessage.content, state.currentMessages.length - 1, false, null, userMessage.attachments);
        
        const baseHistory = state.currentMessages.filter(msg => !msg.isCascaded || msg.isSelected);
        
        const modelMessage = { role: 'model', content: '', timestamp: Date.now() };
        state.currentMessages.push(modelMessage);
        const modelMessageIndex = state.currentMessages.length - 1;
        uiUtils.appendMessage(modelMessage.role, modelMessage.content, modelMessageIndex, true);

        state.pendingAttachments = [];
        state.selectedFilesForUpload = [];
        uiUtils.updateAttachmentBadgeVisibility();
        elements.userInput.value = '';
        uiUtils.adjustTextareaHeight();
        if (state.settings.autoScroll) {
            this.scrollToBottom();
        }
        
        await dbUtils.saveChat(null, null, { skipPush: true });
        
        try {
            const generationConfig = {};
            if (state.settings.temperature !== null) generationConfig.temperature = state.settings.temperature;
            if (state.settings.maxTokens !== null) generationConfig.maxOutputTokens = state.settings.maxTokens;
            if (state.settings.topK !== null) generationConfig.topK = state.settings.topK;
            if (state.settings.topP !== null) generationConfig.topP = state.settings.topP;
            if ((state.settings.apiProvider || 'gemini') === 'gemini' &&
                    ((state.settings.thinkingBudget > 0) || state.settings.includeThoughts)) {
                generationConfig.thinkingConfig = {};
                if(state.settings.thinkingBudget > 0) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;
                if(state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
            }

            const summaryText = this._buildSummaryForPrompt();
            const staticText = state.currentSystemPrompt?.trim() || '';
            const dynamicParts = [];
            if (summaryText) dynamicParts.push(summaryText);

            if (state.settings.enableMemory && state.isMemoryEnabledForChat && state.activeProfileId) {
                const memoryData = await dbUtils.getMemory(state.activeProfileId);
                if (memoryData && memoryData.items && memoryData.items.length > 0) {
                    const memoryBlock = `[長期記憶]\n- ${memoryData.items.join('\n- ')}\n---`;
                    dynamicParts.unshift(memoryBlock);
                    console.log("長期記憶をシステムプロンプトに挿入しました。");
                }
            }

            const dynamicText = dynamicParts.join('\n\n');
            const finalSystemPrompt = [dynamicText, staticText].filter(Boolean).join('\n\n');
            const systemInstruction = finalSystemPrompt ? {
                role: "system",
                parts: [{ text: finalSystemPrompt }],
                _staticText: staticText,
                _dynamicText: dynamicText
            } : null;

            const historyForApi = this._prepareApiHistory(baseHistory);
            const newMessages = await this._internalHandleSend(historyForApi, generationConfig, systemInstruction);
            
            const finalAggregatedMessage = this._aggregateMessages(newMessages);
            finalAggregatedMessage.modelName = state.settings.modelName;
            state.currentMessages[modelMessageIndex] = finalAggregatedMessage;

            uiUtils.renderChatMessages();

            // モデルの応答をDBに保存
            await dbUtils.saveChat(null, null, { skipPush: true });

            // 初回やり取り完了時にタイトルを自動生成（fire-and-forget）
            this.autoGenerateTitle().catch(e => console.warn('[AutoTitle] エラー:', e.message));

            this.updateCharacterProfileButtonVisibility();

            // --- 自動学習トリガー ---
            const interval = parseInt(state.settings.memoryAutoSaveInterval, 10);
            // ユーザーの発言回数をカウント
            const userMessageCount = state.currentMessages.filter(m => m.role === 'user').length;
            if (state.settings.enableMemory && state.isMemoryEnabledForChat && interval > 0 && userMessageCount > 0 && userMessageCount % interval === 0) {
                console.log(`[Memory] ユーザーの発言数が ${userMessageCount} 回に達したため、自動学習を開始します。`);
                this.triggerAutoMemorySave(); // awaitを付けずに実行 (Fire-and-forget)
            }
            // -------------------------

        } catch(error) {
            console.error("--- handleSend: 最終catchブロックでエラー捕捉 ---", error);
            const errorMessage = (error.name !== 'AbortError') ? (error.message || "不明なエラーが発生しました。") : "リクエストがキャンセルされました。";
            
            state.currentMessages[modelMessageIndex] = { role: 'error', content: errorMessage, timestamp: Date.now() };
            uiUtils.renderChatMessages(() => uiUtils.scrollToBottom());
            
            // エラー発生時もDBに保存
            await dbUtils.saveChat(null, null, { skipPush: true });
        } finally {
            uiUtils.setSendingState(false);
            state.abortController = null;
            
            // 処理が完了したこのタイミングで、安全に同期処理をトリガーする
            this.markAsDirtyAndSchedulePush('message');

            if (state.settings.autoScroll) {
                requestAnimationFrame(() => {
                    this.scrollToBottom();
                });
            }
        }
    },



    
    // APIリクエストを中断
    abortRequest() {
        if (state.abortController) {
            console.log("中断リクエスト送信");
            state.abortController.abort(); // AbortControllerで中断
        } else {
            console.log("中断するアクティブなリクエストがありません。");
        }
    },


    async executeToolCalls(toolCalls, historyForFunctions, responseTextForQc = '') {
        const messagesForFunction = (historyForFunctions || []).map(c => c.originalMessage || c);
        
        // ダミープロンプトの数を計算
        const dummyUserCount = state.settings.dummyUser ? 1 : 0;
        const dummyModelCount = state.settings.dummyModel ? 1 : 0;
        const dummyPromptCount = dummyUserCount + dummyModelCount;

        const chat = {
            id: state.currentChatId,
            messages: messagesForFunction.filter(m => m.role !== 'tool'),
            systemPrompt: state.currentSystemPrompt,
            persistentMemory: state.currentPersistentMemory,
            dummy_prompt_count: dummyPromptCount // 計算したダミーの数を追加
        };

    
        const toolResults = [];
        let containsTerminalAction = false;
        let aggregatedSearchResults = [];
        let internalUiActions = [];
    
        for (const toolCall of toolCalls) {
            const functionName = toolCall.functionCall.name;
            const functionArgs = toolCall.functionCall.args;
            
            console.log(`[Function Calling] 実行: ${functionName}`, functionArgs);

            // 終端アクションとなる関数かをここで判定する
            if (['generate_image', 'generate_video', 'edit_image', 'display_layered_image', 'run_quality_checker'].includes(functionName)) {
                containsTerminalAction = true;
                console.log(`[Function Calling] 終端アクション (${functionName}) を検出しました。`);
            }
    
            let result;
            if (window.functionCallingTools && typeof window.functionCallingTools[functionName] === 'function') {
                try {
                    const argsWithContext = { ...functionArgs, _responseTextForQc: responseTextForQc };
                    result = await window.functionCallingTools[functionName](argsWithContext, chat);
                } catch (e) {
                    console.error(`[Function Calling] 関数 '${functionName}' の実行中にエラーが発生しました:`, e);
                    result = { error: `関数実行中の内部エラー: ${e.message}` };
                }
            } else {
                console.error(`[Function Calling] 関数 '${functionName}' が見つかりません。`);
                result = { error: `関数 '${functionName}' が見つかりません。` };
            }

            const responseForAI = { ...result };

            if (result.search_results) {
                aggregatedSearchResults.push(...result.search_results);
                delete responseForAI.search_results;
            }

            if (result._internal_ui_action) {
                console.log(`[Debug] executeToolCalls: _internal_ui_actionを検出`, result._internal_ui_action);
                internalUiActions.push(result._internal_ui_action);

                if (result._internal_ui_action.type === 'display_layered_image') {
                    containsTerminalAction = true;
                }
                
                delete responseForAI._internal_ui_action;
            }

            toolResults.push({ 
                role: 'tool', 
                name: functionName, 
                response: responseForAI, 
                timestamp: Date.now(),
                _toolCallId: toolCall.functionCall._toolCallId  // Bedrock API用にtoolCallIdを保持
            });

            if (containsTerminalAction) {
                break;
            }
        }
    
        if (chat.persistentMemory) {
            state.currentPersistentMemory = chat.persistentMemory;
        }
        await dbUtils.saveChat();
    
        state.currentScene = state.currentPersistentMemory?.scene_stack?.slice(-1)[0] || null;
        state.currentStyleProfiles = state.currentPersistentMemory?.style_profiles || {};
    
        return { toolResults, containsTerminalAction, search_results: aggregatedSearchResults, internalUiActions };
    },



    // --- システムプロンプト編集 ---
    startEditSystemPrompt() {
        if (state.isSending) return; // 送信中は編集不可
        state.isEditingSystemPrompt = true;
        elements.systemPromptEditor.value = state.currentSystemPrompt; // 現在の値で初期化
        uiUtils.adjustTextareaHeight(elements.systemPromptEditor, 200);
        elements.systemPromptEditor.focus();
        console.log("システムプロンプト編集開始");
    },

    async saveCurrentSystemPrompt() {
        const newPrompt = elements.systemPromptEditor.value.trim();
        if (newPrompt !== state.currentSystemPrompt) {
            state.currentSystemPrompt = newPrompt;
            try {
                await dbUtils.saveChat(); // 現在のチャットを保存 (SP含む)
                await sleep(100);
                console.log("システムプロンプト保存完了");
            } catch (error) {
                await uiUtils.showCustomAlert("システムプロンプトの保存に失敗しました。");
            }
        }
        state.isEditingSystemPrompt = false;
        elements.systemPromptDetails.removeAttribute('open'); // detailsを閉じる
    },

    cancelEditSystemPrompt() {
        state.isEditingSystemPrompt = false;
        elements.systemPromptEditor.value = state.currentSystemPrompt; // 元の値に戻す
        elements.systemPromptDetails.removeAttribute('open'); // detailsを閉じる
        uiUtils.adjustTextareaHeight(elements.systemPromptEditor, 200);
        console.log("システムプロンプト編集キャンセル");
    },

    // -----------------------------

    // --- メッセージアクション ---
    // メッセージ編集開始
    async startEditMessage(index, messageElement) {
        const startTime = performance.now();
        console.log(`[PERF_DEBUG] startEditMessage 開始 (index: ${index})`);

        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中は編集できません。");
            return;
        }
        if (state.editingMessageIndex !== null && state.editingMessageIndex !== index) {
            await uiUtils.showCustomAlert("他のメッセージを編集中です。");
            return;
        }
        if (state.isEditingSystemPrompt) {
            await uiUtils.showCustomAlert("システムプロンプトを編集中です。");
            return;
        }
        if (state.editingMessageIndex === index) {
            messageElement.querySelector('.edit-textarea')?.focus();
            return;
        }

        const message = state.currentMessages[index];
        if (!message) return;

        const rawContent = message.content;
        state.editingMessageIndex = index;

        const contentDiv = messageElement.querySelector('.message-content');
        const editArea = messageElement.querySelector('.message-edit-area');
        const cascadeControls = messageElement.querySelector('.message-cascade-controls');
        editArea.innerHTML = '';

        let horizontalPadding = 0;
        try {
            const computedStyle = window.getComputedStyle(messageElement);
            const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
            const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
            horizontalPadding = paddingLeft + paddingRight;
        } catch (e) {
            console.error("幅の動的計算中にエラー:", e);
        }
        messageElement.style.width = `calc(var(--message-max-width) + ${horizontalPadding}px + 17px)`;

        const textarea = document.createElement('textarea');
        textarea.value = rawContent;
        textarea.classList.add('edit-textarea');
        textarea.rows = 3;

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('message-edit-actions');

        const saveButton = document.createElement('button');
        saveButton.textContent = '保存';
        saveButton.classList.add('save-edit-btn');
        saveButton.onclick = () => this.saveEditMessage(index, messageElement);

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'キャンセル';
        cancelButton.classList.add('cancel-edit-btn');
        cancelButton.onclick = () => this.cancelEditMessage(index, messageElement);

        const copyEditButton = document.createElement('button');
        copyEditButton.textContent = 'コピー';
        copyEditButton.classList.add('copy-edit-btn');
        copyEditButton.onclick = () => {
            navigator.clipboard.writeText(textarea.value).then(() => {
                copyEditButton.textContent = 'コピー済';
                setTimeout(() => { copyEditButton.textContent = 'コピー'; }, 1500);
            });
        };

        actionsDiv.appendChild(saveButton);
        actionsDiv.appendChild(cancelButton);
        actionsDiv.appendChild(copyEditButton);
        editArea.appendChild(textarea);
        editArea.appendChild(actionsDiv);

        messageElement.classList.add('editing');
        if(contentDiv) contentDiv.classList.add('hidden');
        if(cascadeControls) cascadeControls.classList.add('hidden');
        editArea.classList.remove('hidden');

        uiUtils.adjustTextareaHeight(textarea, 400); // 編集開始時に一度だけ高さを調整
        textarea.focus();
        textarea.select();
        const endTime = performance.now();
        console.log(`[PERF_DEBUG] startEditMessage 完了 (所要時間: ${endTime - startTime}ms)`);
    },





    // メッセージ編集を保存
    async saveEditMessage(index, messageElement) {
        const textarea = messageElement.querySelector('.edit-textarea');
        if (!textarea) {
            this.cancelEditMessage(index, messageElement);
            return;
        }
        const newRawContent = textarea.value; // trim() を削除し、空白のみの保存も許可
        const originalMessage = state.currentMessages[index];

        if (newRawContent === originalMessage.content) {
            this.cancelEditMessage(index, messageElement);
            return;
        }

        // 1. stateを更新
        const updatedMessage = {
            ...originalMessage,
            content: newRawContent,
            timestamp: Date.now()
        };
        delete updatedMessage.error;
        state.currentMessages[index] = updatedMessage;

        // 2. 既存のメタ情報表示を一旦削除
        messageElement.querySelectorAll('.function-call-details, .citation-details').forEach(el => el.remove());

        // 3. テキスト部分をDOMに反映
        const contentDiv = messageElement.querySelector('.message-content');
        if (contentDiv) {
            if (updatedMessage.role === 'model' && typeof marked !== 'undefined') {
                contentDiv.innerHTML = htmlUtils.renderMarkdownSafe(newRawContent);
            } else {
                const pre = contentDiv.querySelector('pre') || document.createElement('pre');
                pre.textContent = newRawContent;
                if (!contentDiv.querySelector('pre')) {
                    contentDiv.innerHTML = '';
                    contentDiv.appendChild(pre);
                }
            }
        }

        // 4. 画像が存在する場合、画像を再注入
        const imagePlaceholderRegex = /<p>\[IMAGE_HERE\]<\/p>|\[IMAGE_HERE\]/g;
        if (updatedMessage.role === 'model' && updatedMessage.imageIds && updatedMessage.imageIds.length > 0) {
            let imageIndex = 0;
            // プレースホルダーを<img>タグに置換
            const replacedHtml = contentDiv.innerHTML.replace(imagePlaceholderRegex, () => {
                if (imageIndex < updatedMessage.imageIds.length) {
                    const imageId = updatedMessage.imageIds[imageIndex++];
                    // createMessageElementと同様の遅延読み込み用のimgタグを生成
                    return `<img class="lazy-load-image" alt="生成画像（読み込み中...）" data-image-id="${imageId}">`;
                }
                return ''; // プレースホルダーが画像の数より多い場合は空文字に
            });
            contentDiv.innerHTML = replacedHtml;

            // プレースホルダーが足りなかった場合、残りの画像を末尾に追加
            if (imageIndex < updatedMessage.imageIds.length) {
                const fragment = document.createDocumentFragment();
                for (let i = imageIndex; i < updatedMessage.imageIds.length; i++) {
                    const imageId = updatedMessage.imageIds[i];
                    const img = document.createElement('img');
                    img.className = 'lazy-load-image';
                    img.alt = '生成画像（読み込み中...）';
                    img.dataset.imageId = imageId;
                    fragment.appendChild(img);
                }
                contentDiv.appendChild(fragment);
            }
            
            // 新しく追加された画像をIntersectionObserverの監視対象に追加
            requestAnimationFrame(() => {
                const newImages = contentDiv.querySelectorAll('.lazy-load-image[data-image-id]');
                newImages.forEach(img => this.imageObserver.observe(img));
            });
        }

        // 5. メタ情報（ツール使用履歴など）を再生成して追加
        if (updatedMessage.role === 'model') {
            const detailsFragment = document.createDocumentFragment();
            // ツール使用履歴
            if (updatedMessage.executedFunctions && updatedMessage.executedFunctions.length > 0) {
                const details = document.createElement('details');
                details.classList.add('function-call-details');
                const uniqueFunctions = [...new Set(updatedMessage.executedFunctions)];
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
                detailsFragment.appendChild(details);
            }
            // Web検索結果
            if (updatedMessage.search_web_results && updatedMessage.search_web_results.length > 0) {
                const details = document.createElement('details');
                details.classList.add('function-call-details');
                const summary = document.createElement('summary');
                summary.innerHTML = `🌐 Web検索結果 (${updatedMessage.search_web_results.length}件)`;
                details.appendChild(summary);
                const list = document.createElement('ul');
                list.classList.add('function-call-list');
                updatedMessage.search_web_results.forEach(result => {
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
                detailsFragment.appendChild(details);
            }
            
            // 生成したメタ情報を適切な場所に追加
            if (contentDiv.innerHTML.trim() !== '') {
                contentDiv.appendChild(detailsFragment);
            } else {
                messageElement.appendChild(detailsFragment);
            }
        }

        // 6. Prism.jsでハイライトを再適用
        if (window.Prism) {
            contentDiv.querySelectorAll('pre code').forEach((block) => {
                Prism.highlightElement(block);
            });
        }

        // 7. 編集UIを閉じる
        this.finishEditing(messageElement);

        // 8. DBへの保存処理
        try {
            const requiresTitleUpdate = (index === state.currentMessages.findIndex(m => m.role === 'user'));
            let newTitleForSave = null;
            if (requiresTitleUpdate) {
                newTitleForSave = newRawContent.substring(0, 50) || "無題のチャット";
            }
            await dbUtils.saveChat(newTitleForSave);

            if (requiresTitleUpdate) {
                uiUtils.updateChatTitle(newTitleForSave);
            }
            console.log("メッセージ編集後にチャット保存:", index);
        } catch (error) {
            await uiUtils.showCustomAlert("メッセージ編集後のチャット保存に失敗しました。");
        }
    },




    // メッセージ編集をキャンセル
    cancelEditMessage(index, messageElement = null) {
          if (!messageElement) {
              messageElement = elements.messageContainer.querySelector(`.message[data-index="${index}"]`);
          }
          if (messageElement) {
              this.finishEditing(messageElement);
          } else if (state.editingMessageIndex === index) {
              state.editingMessageIndex = null;
              console.log("編集キャンセル: 要素が見つかりませんでしたがインデックスをリセット:", index);
          }
    },

    // 編集UIを終了する共通処理
    finishEditing(messageElement) {
        if (!messageElement) return;
        const editArea = messageElement.querySelector('.message-edit-area');
        const contentDiv = messageElement.querySelector('.message-content');
        const cascadeControls = messageElement.querySelector('.message-cascade-controls');

        messageElement.style.removeProperty('width');

        messageElement.classList.remove('editing');
        if(contentDiv) contentDiv.classList.remove('hidden');
        if(cascadeControls) cascadeControls.classList.remove('hidden');
        if(editArea) {
            editArea.classList.add('hidden');
            editArea.innerHTML = '';
        }

        const index = parseInt(messageElement.dataset.index, 10);
        if (state.editingMessageIndex === index) {
            state.editingMessageIndex = null;
            console.log("編集終了:", index);
        }

        elements.userInput.focus();
    },


    // メッセージを削除 (会話ターン全体)
    async deleteMessage(index) {
        if (state.editingMessageIndex === index) {
            this.cancelEditMessage(index);
        }
        if (state.isSending) {
            await uiUtils.showCustomAlert("送信中は削除できません。");
            return;
        }
        if (state.isEditingSystemPrompt) {
            await uiUtils.showCustomAlert("システムプロンプトを編集中は削除できません。");
            return;
        }
        if (index < 0 || index >= state.currentMessages.length) {
             console.error("削除対象のインデックスが無効:", index);
             return;
        }

        const messageToDelete = state.currentMessages[index];
        const messageContentPreview = messageToDelete.content.substring(0, 30) + "...";
        let confirmMessage = "";
        let deleteTargetDescription = "";
        let indicesToDelete = [];

        if (messageToDelete.role === 'user') {
            indicesToDelete.push(index);
            confirmMessage = `メッセージ「${messageContentPreview}」を削除しますか？`;
            deleteTargetDescription = `単一メッセージ (index: ${index}, role: user)`;

            const nextMessageIndex = index + 1;
            if (nextMessageIndex < state.currentMessages.length && state.currentMessages[nextMessageIndex].role === 'error') {
                indicesToDelete.push(nextMessageIndex);
                confirmMessage = `メッセージ「${messageContentPreview}」と、それに対するエラー応答を削除しますか？`;
                deleteTargetDescription = `メッセージペア (user at ${index}, error at ${nextMessageIndex})`;
            }
        } else if (messageToDelete.role === 'model' && messageToDelete.isCascaded && messageToDelete.siblingGroupId) {
            const groupId = messageToDelete.siblingGroupId;
            const siblings = state.currentMessages.filter(msg => msg.role === 'model' && msg.isCascaded && msg.siblingGroupId === groupId);
            indicesToDelete = state.currentMessages
                .map((msg, i) => (msg.role === 'model' && msg.isCascaded && msg.siblingGroupId === groupId) ? i : -1)
                .filter(i => i !== -1);

            confirmMessage = `「${messageContentPreview}」を含む応答グループ全体 (${siblings.length}件) を削除しますか？`;
            deleteTargetDescription = `カスケードグループ (gid: ${groupId}, ${indicesToDelete.length}件)`;
        } else {
            indicesToDelete.push(index);
            confirmMessage = `メッセージ「${messageContentPreview}」(${messageToDelete.role}) を削除しますか？`;
            deleteTargetDescription = `単一メッセージ (index: ${index}, role: ${messageToDelete.role})`;
        }

        const confirmed = await uiUtils.showCustomConfirm(confirmMessage);
        if (confirmed) {
            console.log(`削除実行: ${deleteTargetDescription}`);
            const originalFirstUserMsgIndex = state.currentMessages.findIndex(m => m.role === 'user');

            indicesToDelete.sort((a, b) => b - a).forEach(idx => {
                state.currentMessages.splice(idx, 1);
            });

            console.log(`メッセージ削除完了 (state)。削除件数: ${indicesToDelete.length}`);

            const newFirstUserMsgIndex = state.currentMessages.findIndex(m => m.role === 'user');
            let requiresTitleUpdate = indicesToDelete.includes(originalFirstUserMsgIndex);

            try {
                uiUtils.renderChatMessages();
    
                let newTitleForSave = null;
                const currentChatData = state.currentChatId ? await dbUtils.getChat(state.currentChatId) : null;
    
                if (requiresTitleUpdate) {
                    const newFirstUserMessage = newFirstUserMsgIndex !== -1 ? state.currentMessages[newFirstUserMsgIndex] : null;
                    newTitleForSave = newFirstUserMessage ? newFirstUserMessage.content.substring(0, 50) : "無題のチャット";
                } else if (currentChatData) {
                    newTitleForSave = currentChatData.title;
                }
    
                await dbUtils.saveChat(newTitleForSave);
    
                if (requiresTitleUpdate) {
                    uiUtils.updateChatTitle(newTitleForSave);
                }
    
                if (state.currentMessages.length === 0 && !state.currentSystemPrompt && state.currentChatId) {
                    console.log("チャットが空になったためリセットします。");
                    this.startNewChat();
                }
                
                if (state.settings.autoScroll) {
                    requestAnimationFrame(() => {
                        this.scrollToBottom();
                    });
                }
    
            } catch (error) {
                console.error("メッセージ削除後のチャット保存/取得エラー:", error);
                await uiUtils.showCustomAlert("メッセージ削除後のチャット保存に失敗しました。");
            }
    
        } else {
             console.log("削除キャンセル");
        }
    },


    async retryFromMessage(index) {
        if (state.isSending) { await uiUtils.showCustomAlert("送信中です。"); return; }
        
        const userMessage = state.currentMessages[index];
        if (!userMessage || userMessage.role !== 'user') return;
    
        const messageContentPreview = userMessage.content.substring(0, 30) + "...";
        const confirmed = await uiUtils.showCustomConfirm(`「${messageContentPreview}」から再生成しますか？\n(これより未来の会話履歴は削除され、既存の応答は別候補として保持されます)`);
    
        if (confirmed) {
            uiUtils.setSendingState(true);
    
            let originalResponses = [];
            // 保留中のカスケード応答があれば、それを使用する
            if (state.pendingCascadeResponses) {
                originalResponses = state.pendingCascadeResponses;
                console.log("保留中のカスケード応答を復元しました。");
            } else {
                const futureMessages = state.currentMessages.slice(index + 1);
                const firstModelResponse = futureMessages.find(msg => msg.role === 'model');
                if (firstModelResponse && firstModelResponse.isCascaded && firstModelResponse.siblingGroupId) {
                    const groupId = firstModelResponse.siblingGroupId;
                    originalResponses = state.currentMessages.filter(
                        msg => msg.siblingGroupId === groupId
                    );
                } else if (firstModelResponse) {
                    originalResponses.push(firstModelResponse);
                }
            }
    
            // 次の再生成に備えて、元の応答をstateに待避させる
            state.pendingCascadeResponses = originalResponses;
            
            // UI上から古い応答を削除し、stateもユーザープロンプトまでの状態に戻す
            state.currentMessages.splice(index + 1);
            uiUtils.renderChatMessages();
    
            let modelMessage;
    
            try {
                const baseHistory = state.currentMessages.filter(msg => !msg.isCascaded || msg.isSelected);
                const historyForApi = this._prepareApiHistory(baseHistory);
    
                modelMessage = { role: 'model', content: '', timestamp: Date.now() };
                state.currentMessages.push(modelMessage);
                const modelMessageIndex = state.currentMessages.length - 1;
                uiUtils.appendMessage(modelMessage.role, modelMessage.content, modelMessageIndex, true);
                this.scrollToBottom();
    
                const generationConfig = {};
                if (state.settings.temperature !== null) generationConfig.temperature = state.settings.temperature;
                if (state.settings.maxTokens !== null) generationConfig.maxOutputTokens = state.settings.maxTokens;
                if (state.settings.topK !== null) generationConfig.topK = state.settings.topK;
                if (state.settings.topP !== null) generationConfig.topP = state.settings.topP;
                if ((state.settings.apiProvider || 'gemini') === 'gemini' &&
                        ((state.settings.thinkingBudget > 0) || state.settings.includeThoughts)) {
                    generationConfig.thinkingConfig = {};
                    if(state.settings.thinkingBudget > 0) generationConfig.thinkingConfig.thinkingBudget = state.settings.thinkingBudget;
                    if(state.settings.includeThoughts) generationConfig.thinkingConfig.includeThoughts = true;
                }
                const systemInstruction = state.currentSystemPrompt?.trim() ? { role: "system", parts: [{ text: state.currentSystemPrompt.trim() }] } : null;
    
                const newMessages = await this._internalHandleSend(historyForApi, generationConfig, systemInstruction);
                const newAggregatedMessage = this._aggregateMessages(newMessages);
                newAggregatedMessage.modelName = state.settings.modelName;
                const finalOriginalResponses = state.pendingCascadeResponses || [];
                state.pendingCascadeResponses = null;

                const siblingGroupId = (finalOriginalResponses.length > 0 && finalOriginalResponses[0].siblingGroupId)
                    ? finalOriginalResponses[0].siblingGroupId
                    : `gid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

                finalOriginalResponses.forEach(msg => {
                    msg.isCascaded = true;
                    msg.isSelected = false;
                    msg.siblingGroupId = siblingGroupId;
                });

                // 最終結果のexecutedFunctionsを初期化
                newAggregatedMessage.executedFunctions = newAggregatedMessage.executedFunctions || [];
                
                // 再生成中に実行された関数呼び出しがあれば、それらも新しいメッセージのexecutedFunctionsに追加する
                newMessages.forEach(msg => {
                    if (msg.executedFunctions && Array.isArray(msg.executedFunctions)) {
                         msg.executedFunctions.forEach(funcName => {
                             if (!newAggregatedMessage.executedFunctions.includes(funcName)) {
                                 newAggregatedMessage.executedFunctions.push(funcName);
                             }
                         });
                    }
                    // ツール実行結果からも復元
                     if (msg.role === 'tool' && msg.name) {
                         if (!newAggregatedMessage.executedFunctions.includes(msg.name)) {
                             newAggregatedMessage.executedFunctions.push(msg.name);
                         }
                     }
                });
                
                newAggregatedMessage.isCascaded = true;
                newAggregatedMessage.isSelected = true;
                newAggregatedMessage.siblingGroupId = siblingGroupId;

                state.currentMessages.splice(modelMessageIndex, 1, ...finalOriginalResponses, newAggregatedMessage);
                uiUtils.renderChatMessages();
                this.scrollToBottom();
                await dbUtils.saveChat();
    
            } catch(error) {
                console.error("再生成エラー:", error);
                const errorMessage = (error.name !== 'AbortError') ? (error.message || "不明なエラーが発生しました。") : "リクエストがキャンセルされました。";
                
    
                // 1. プレースホルダーを履歴から削除
                const placeholderIndex = state.currentMessages.findIndex(m => m.timestamp === modelMessage.timestamp);
                if (placeholderIndex !== -1) {
                    state.currentMessages.splice(placeholderIndex, 1);
                }
    
                // 2. DBにはエラーメッセージを含まない現在の履歴（ユーザープロンプトまで）を保存
                await dbUtils.saveChat();
    
                // 3. UI表示のためだけに、エラーメッセージを現在のメッセージリストに追加
                state.currentMessages.push({ role: 'error', content: errorMessage, timestamp: Date.now(), isNonPersistent: true });
    
                // 4. UIを再描画（これで「ユーザープロンプト → エラー」表示になる）
                uiUtils.renderChatMessages();
    
                // 5. 次の操作に備え、UI表示用に追加したエラーメッセージを履歴から削除
                state.currentMessages = state.currentMessages.filter(m => !m.isNonPersistent);
                
                this.scrollToBottom();
    
            } finally {
                uiUtils.setSendingState(false);
                state.abortController = null; 
                if (state.settings.autoScroll) {
                    requestAnimationFrame(() => {
                        this.scrollToBottom();
                    });
                }
            }
        }
    },


    // --- カスケード応答操作 ---
    getCascadedSiblings(index, includeSelf = false) {
        const targetMsg = state.currentMessages[index];
        if (!targetMsg || !targetMsg.isCascaded || !targetMsg.siblingGroupId) {
            return [];
        }
        const groupId = targetMsg.siblingGroupId;
        const siblings = state.currentMessages.filter((msg, i) =>
            msg.role === 'model' &&
            !msg.tool_calls &&
            msg.isCascaded &&
            msg.siblingGroupId === groupId &&
            (includeSelf || i !== index)
        );
        return siblings;
    },


    async navigateCascade(currentIndex, direction) {
        const currentMsg = state.currentMessages[currentIndex];
        if (!currentMsg || !currentMsg.isCascaded || !currentMsg.siblingGroupId) return;

        const groupId = currentMsg.siblingGroupId;
        
        const siblingsWithIndices = state.currentMessages
            .map((msg, i) => ({ msg, originalIndex: i }))
            .filter(item => item.msg.siblingGroupId === groupId);

        if (siblingsWithIndices.length <= 1) return;

        const currentPosition = siblingsWithIndices.findIndex(item => item.originalIndex === currentIndex);
        if (currentPosition === -1) return;

        let targetPosition = -1;
        if (direction === 'prev' && currentPosition > 0) {
            targetPosition = currentPosition - 1;
        } else if (direction === 'next' && currentPosition < siblingsWithIndices.length - 1) {
            targetPosition = currentPosition + 1;
        }

        if (targetPosition !== -1) {
            siblingsWithIndices.forEach(item => {
                item.msg.isSelected = false;
            });

            const targetItem = siblingsWithIndices[targetPosition];
            targetItem.msg.isSelected = true;
            const newSelectedIndex = targetItem.originalIndex;

            // UIを再描画し、その後で操作UIを強制的に再表示する
            uiUtils.renderChatMessages();
            
            // requestAnimationFrameを使用して、DOMの更新が完了した後に実行
            requestAnimationFrame(() => {
                const elementToShowActions = elements.messageContainer.querySelector(`.message[data-index="${newSelectedIndex}"]`);
                if (elementToShowActions && !elementToShowActions.classList.contains('editing')) {
                    // 他に表示されているメニューがあれば閉じる
                    const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                    if (currentlyShown && currentlyShown !== elementToShowActions) {
                        currentlyShown.classList.remove('show-actions');
                    }
                    // ターゲットのメニューを表示
                    elementToShowActions.classList.add('show-actions');
                }
            });

            await dbUtils.saveChat();
        }
    },


    async confirmDeleteCascadeResponse(indexToDelete) {
        const msgToDelete = state.currentMessages[indexToDelete];
        if (!msgToDelete || msgToDelete.role !== 'model' || !msgToDelete.isCascaded || !msgToDelete.siblingGroupId) {
            return;
        }
        if (state.editingMessageIndex !== null) { await uiUtils.showCustomAlert("編集中は削除できません。"); return; }
        if (state.isSending) { await uiUtils.showCustomAlert("送信中は削除できません。"); return; }
        if (state.isEditingSystemPrompt) { await uiUtils.showCustomAlert("システムプロンプト編集中は削除できません。"); return; }

        const siblings = this.getCascadedSiblings(indexToDelete, true);
        const currentIndexInGroup = siblings.findIndex(m => m === msgToDelete) + 1;
        const totalSiblings = siblings.length;
        const contentPreview = msgToDelete.content.substring(0, 30) + "...";
        const confirmMsg = `この応答 (${currentIndexInGroup}/${totalSiblings})「${contentPreview}」を削除しますか？\n(この応答のみが削除されます)`;

        const confirmed = await uiUtils.showCustomConfirm(confirmMsg);
        if (confirmed) {
            const wasSelected = msgToDelete.isSelected;
            const groupId = msgToDelete.siblingGroupId;

            state.currentMessages.splice(indexToDelete, 1);

            let newlySelectedIndex = -1;
            const remainingSiblingsWithIndices = state.currentMessages
                .map((msg, i) => ({ msg, originalIndex: i }))
                .filter(item => item.msg.role === 'model' && item.msg.isCascaded && item.msg.siblingGroupId === groupId);

            if (remainingSiblingsWithIndices.length > 0) {
                remainingSiblingsWithIndices.forEach(item => { item.msg.isSelected = false; });

                if (wasSelected) {
                    const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
                    lastSiblingItem.msg.isSelected = true;
                    newlySelectedIndex = lastSiblingItem.originalIndex;
                } else {
                    const stillSelectedItem = remainingSiblingsWithIndices.find(item => item.msg.isSelected);
                    if (stillSelectedItem) {
                        newlySelectedIndex = stillSelectedItem.originalIndex;
                    } else {
                        const lastSiblingItem = remainingSiblingsWithIndices[remainingSiblingsWithIndices.length - 1];
                        lastSiblingItem.msg.isSelected = true;
                        newlySelectedIndex = lastSiblingItem.originalIndex;
                    }
                }
            }

            uiUtils.renderChatMessages();
            requestAnimationFrame(() => {
                if (newlySelectedIndex !== -1) {
                    const elementToShowActions = elements.messageContainer.querySelector(`.message[data-index="${newlySelectedIndex}"]`);
                    if (elementToShowActions && !elementToShowActions.classList.contains('editing')) {
                        const currentlyShown = elements.messageContainer.querySelector('.message.show-actions');
                        if (currentlyShown && currentlyShown !== elementToShowActions) {
                            currentlyShown.classList.remove('show-actions');
                        }
                        elementToShowActions.classList.add('show-actions');
                    }
                }
            });

            try {
                await dbUtils.saveChat();
            } catch (error) {
                await uiUtils.showCustomAlert("応答削除後のチャット状態の保存に失敗しました。");
            }
        }
    },


    async callApiWithRetry(apiParams) {
        const { messagesForApi, generationConfig, systemInstruction, tools, isFirstCall } = apiParams;
        let lastError = null;
        const maxRetries = state.settings.enableAutoRetry ? state.settings.maxRetries : 0;
        const forceCalling = state.settings.forceFunctionCalling && isFirstCall;
        
        // state.abortControllerを確実に作成（ユーザーの手動キャンセル用）
        if (!state.abortController) {
            state.abortController = new AbortController();
        }
        
        // タイムアウト設定の取得
        const timeoutEnabled = state.settings.enableApiTimeout || false;
        const timeoutMs = timeoutEnabled ? (state.settings.apiTimeoutSeconds || 90) * 1000 : null;
        
        if (timeoutEnabled) {
            console.log(`[Timeout] APIタイムアウト有効: ${timeoutMs}ms`);
        } else {
            console.log(`[Timeout] APIタイムアウト無効`);
        }

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            // このリトライ専用のAbortController
            const attemptController = new AbortController();
            // ユーザーの停止ボタンで attemptController も中断されるようにリンク
            const abortListener = () => attemptController.abort();
            state.abortController.signal.addEventListener('abort', abortListener);
            let timeoutId = null;

            try {
                if (state.abortController?.signal.aborted) {
                    throw new DOMException("リクエストがキャンセルされました。", "AbortError");
                }

                if (attempt > 0) {
                    let delay;
                    if (state.settings.useFixedRetryDelay) {
                        delay = state.settings.fixedRetryDelaySeconds * 1000;
                    } else {
                        const exponentialDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                        const maxDelay = state.settings.maxBackoffDelaySeconds * 1000;
                        delay = Math.min(exponentialDelay, maxDelay);
                    }

                    uiUtils.setLoadingIndicatorText(`APIエラー 再試行(${attempt}回目)... ${Math.round(delay/1000)}秒待機`);
                    console.log(`API呼び出し失敗。${delay}ms後にリトライします... (試行 ${attempt + 1}/${maxRetries + 1})`);
                    await interruptibleSleep(delay, state.abortController.signal);
                }

                if (attempt === 1) {
                    uiUtils.setLoadingIndicatorText('再試行中...');
                } else if (attempt > 1) {
                    uiUtils.setLoadingIndicatorText(`${attempt}回目の再試行中...`);
                }

                // タイムアウトタイマーの設定
                const startTime = Date.now();
                if (timeoutEnabled && timeoutMs) {
                    timeoutId = setTimeout(() => {
                        const elapsed = Date.now() - startTime;
                        console.warn(`[Timeout] API呼び出しが${elapsed}ms経過。タイムアウト(${timeoutMs}ms)により中断します。`);
                        attemptController.abort();
                    }, timeoutMs);
                }

                const response = await apiUtils.callApi(messagesForApi, generationConfig, systemInstruction, tools, forceCalling, attemptController.signal);

                const getFinishReasonError = (candidate) => {
                    const reason = candidate?.finishReason;
                    if (reason && reason !== 'STOP' && reason !== 'MAX_TOKENS') {
                        const error = new Error(`モデルが応答をブロックしました (理由: ${reason})`);
                        error.candidate = candidate; // エラーオブジェクトに詳細情報を添付
                        return error;
                    }
                    return null;
                };

                const checkForSafetyRejection = (candidate, content, toolCalls, images) => {
                    if (content || (toolCalls && toolCalls.length > 0) || (images && images.length > 0)) {
                        return null;
                    }
                    const isNormalFinish = candidate?.finishReason === 'STOP' || candidate?.finishReason === 'MAX_TOKENS';
                    const safetyRatings = candidate?.safetyRatings;
                    const hasHighRiskRating = safetyRatings && safetyRatings.some(r => r.probability === 'HIGH' || r.probability === 'MEDIUM');

                    if (isNormalFinish && hasHighRiskRating) {
                        const highRiskCategories = safetyRatings
                            .filter(r => r.probability === 'HIGH' || r.probability === 'MEDIUM')
                            .map(r => r.category.replace('HARM_CATEGORY_', ''))
                            .join(', ');
                        return new Error(`モデルがコンテンツの生成を拒否しました (理由: ${highRiskCategories})。プロンプトを調整して再試行してください。`);
                    }
                    return null;
                };

                // 非ストリーミングの処理に統一
                const responseData = await response.json();
                
                // タイマークリア（成功時）
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                    const elapsed = Date.now() - startTime;
                    console.log(`[API Call] レスポンス取得成功 (所要時間: ${elapsed}ms)`);
                }
                
                if (responseData.promptFeedback) {
                    const blockReason = responseData.promptFeedback.blockReason || 'SAFETY';
                    throw new Error(`APIが応答をブロックしました (理由: ${blockReason})`);
                }
                if (!responseData.candidates || responseData.candidates.length === 0) {
                    throw new Error("API応答に有効な候補(candidates)が含まれていません。プロンプトがブロックされた可能性があります。");
                }
                
                const candidate = responseData.candidates[0];
                const finishReasonError = getFinishReasonError(candidate);
                if (finishReasonError) throw finishReasonError;

                const parts = candidate.content?.parts || [];
                let finalContent = '';
                let finalThoughtSummary = '';
                let finalToolCalls = [];
                let finalThoughtParts = [];

                console.log('[Thinking Debug] candidate keys:', Object.keys(candidate));
                console.log('[Thinking Debug] parts count:', parts.length);
                parts.forEach((part, i) => {
                    console.log(`[Thinking Debug] part[${i}] keys:`, Object.keys(part), '| thought:', part.thought, '| hasThoughtSig:', !!part.thoughtSignature, '| hasText:', !!part.text);
                });

                parts.forEach(part => {
                    // Thought Signature + Function Call の検出 (Gemini 3の関数呼び出し)
                    // thoughtSignature と functionCall の両方を持つパートのみ特別扱い
                    if (part.thoughtSignature && part.functionCall) {
                        finalThoughtParts.push(part);
                        finalToolCalls.push({ functionCall: part.functionCall });
                    }
                    
                    // Thought Partの検出 (旧形式: thought がオブジェクトの場合)
                    else if (part.thought && part.thought !== true) {
                        finalThoughtParts.push(part);
                    }

                    // テキストコンテンツの処理
                    // thought:true のパートのみ思考プロセス
                    // thoughtSignatureのみを持つテキストは通常コンテンツとして扱う（Gemini 2.5 Pro対応）
                    else if (part.text) {
                        if (part.thought === true) {
                            finalThoughtSummary += part.text;
                        } else {
                            finalContent += part.text;
                        }
                    }
                    
                    // 関数呼び出しの処理（thoughtSignatureを持たない通常のfunctionCall）
                    else if (part.functionCall) {
                        finalToolCalls.push({ functionCall: part.functionCall });
                    }
                });

                // 古い形式のthoughts（candidate.thoughts）の処理
                if (candidate.thoughts?.parts) {
                    candidate.thoughts.parts.forEach(part => {
                        if (part.text) {
                            finalThoughtSummary += part.text;
                        }
                    });
                }
                
                const safetyError = checkForSafetyRejection(candidate, finalContent, finalToolCalls, []);
                if (safetyError) throw safetyError;

                if (!finalContent && finalToolCalls.length === 0) {
                    throw new Error("APIから空の応答が返されました。");
                }

                return {
                    content: finalContent,
                    thoughtSummary: finalThoughtSummary.trim() || null,
                    toolCalls: finalToolCalls.length > 0 ? finalToolCalls : null,
                    thoughtParts: finalThoughtParts.length > 0 ? finalThoughtParts : null, // 追加
                    finishReason: candidate.finishReason,
                    safetyRatings: candidate.safetyRatings,
                    usageMetadata: responseData.usageMetadata,
                    retryCount: attempt
                };

            } catch (error) {
                // タイマークリーンアップ
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                lastError = error;
                
                // タイムアウトによるAbortの判定
                if (error.name === 'AbortError' && attemptController.signal.aborted && !state.abortController?.signal.aborted) {
                    // attemptControllerによるAbort = タイムアウト
                    const timeoutError = new Error(`APIタイムアウト: ${timeoutMs}ms以内にレスポンスが返りませんでした。`);
                    timeoutError.isTimeout = true;
                    lastError = timeoutError;
                    console.warn(`[Timeout] タイムアウト検出。エラーとして扱い、リトライ機構に委ねます。`);
                    // continueせずにそのままcatchブロックの末尾へ（= リトライループ継続）
                }
                
                // ユーザーによる手動キャンセル
                if (error.name === 'AbortError' && state.abortController?.signal.aborted) {
                    console.error("待機中または通信中に中断されました。リトライを中止します。", error);
                    throw error;
                }
                
                // 4xx系エラーは即座に終了
                if (error.status && error.status >= 400 && error.status < 500) {
                    console.error(`リトライ不可のエラー (ステータス: ${error.status})。リトライを中止します。`, error);
                    throw error;
                }
                
                console.warn(`API呼び出し/処理試行 ${attempt + 1} が失敗しました。`, error);
                if (error.candidate) {
                    console.error("ブロックされた応答の詳細:", JSON.stringify(error.candidate, null, 2));
                }
            } finally {
                state.abortController.signal.removeEventListener('abort', abortListener);
            }
        }

        console.error("最大リトライ回数に達しました。最終的なエラーをスローします。");
        throw lastError;
    }
};
