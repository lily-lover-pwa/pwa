// appLogic 機能モジュール: memory（Phase 3 で app-logic.js から分割）。挙動は不変。
import { DEEPSEEK_API_BASE_URL, GEMINI_API_BASE_URL } from '../constants.js';
import { dbUtils } from '../db.js';
import { elements } from '../dom-elements.js';
import { state } from '../state.js';
import { uiUtils } from '../ui.js';

export const memoryMethods = {

    /**
     * @private 現在の永続メモリから状況サマリーを生成するヘルパー関数
     * @returns {string} AI向けのマークダウン形式のサマリー文字列
     */
    _buildSummaryForPrompt() {
        const memory = state.currentPersistentMemory || {};
        if (Object.keys(memory).length === 0) {
            return '';
        }

        let summary = "【現在の状況サマリー】\n";
        const sections = [];

        // 1. キャラクター記憶 (最優先)
        const characterMemoryEntries = Object.entries(memory).filter(([key]) => key.startsWith('character_memory_'));
        if (characterMemoryEntries.length > 0) {
            let content = characterMemoryEntries.map(([key, value]) => {
                const charName = key.replace('character_memory_', '');
                return `■ ${charName}\n` + JSON.stringify(value, null, 2);
            }).join('\n');
            sections.push(`## キャラクター記憶 (manage_character_memory)\n${content}`);
        }
        
        // 2. シーン
        if (memory.scene_stack && memory.scene_stack.length > 0) {
            const currentScene = memory.scene_stack[memory.scene_stack.length - 1];
            let content = Object.entries(currentScene)
                .map(([key, value]) => `- ${key}: ${value}`)
                .join('\n');
            sections.push(`## シーン (manage_scene)\n${content}`);
        }

        // 3. 日付
        if (typeof memory.game_day === 'number') {
            sections.push(`## 日付 (manage_game_date)\n- 現在: ${memory.game_day}日目`);
        }

        // 4. ステータス
        const statusEntries = Object.entries(memory).filter(([key]) => key.startsWith('character_') && !key.startsWith('character_memory_'));
        if (statusEntries.length > 0) {
            let content = statusEntries.map(([key, value]) => {
                const charName = key.replace('character_', '');
                const statuses = Object.entries(value).map(([sKey, sValue]) => `${sKey}: ${sValue}`).join(', ');
                return `- ${charName}: ${statuses}`;
            }).join('\n');
            sections.push(`## 主要ステータス (manage_character_status)\n${content}`);
        }

        // 5. 所持品
        if (memory.inventories && Object.keys(memory.inventories).length > 0) {
            let content = Object.entries(memory.inventories).map(([charName, items]) => {
                const itemList = Object.entries(items).map(([itemName, qty]) => `${itemName}(${qty})`).join(', ');
                return `- ${charName}: ${itemList}`;
            }).join('\n');
            sections.push(`## 所持品 (manage_inventory)\n${content}`);
        }
        
        // 6. 口調
        if (memory.style_profiles && Object.keys(memory.style_profiles).length > 0) {
            let content = Object.entries(memory.style_profiles).map(([charName, profile]) => {
                const profileDetails = Object.entries(profile).map(([key, value]) => `${key}: ${value}`).join(', ');
                return `- ${charName}: ${profileDetails}`;
            }).join('\n');
            sections.push(`## 口調設定 (manage_style_profile)\n${content}`);
        }

        // 7. フラグと短期記憶 (既知の構造化データキーを除外して抽出)
        const knownKeys = new Set(['scene_stack', 'game_day', 'inventories', 'style_profiles']);
        const flagAndMemoryKeys = Object.keys(memory).filter(key => 
            !key.startsWith('character_') && !knownKeys.has(key)
        );

        if (flagAndMemoryKeys.length > 0) {
            let flagContent = flagAndMemoryKeys.map(key => `- ${key}: ${JSON.stringify(memory[key])}`).join('\n');
            sections.push(`## フラグ・重要設定 (manage_flags, manage_persistent_memory)\n${flagContent}`);
        }

        if (sections.length > 0) {
            summary += sections.join('\n\n');
            return summary;
        }

        return '';
    },

    // --- Memory Feature ---
    toggleMemoryOptions(isEnabled) {
        elements.memoryOptionsContainer.classList.toggle('hidden', !isEnabled);
        this.toggleMemoryIconVisibility();
    },


    toggleMemoryIconVisibility() {
        const isMasterEnabled = state.settings.enableMemory;
        elements.memoryToggleBtn.classList.toggle('hidden', !isMasterEnabled);
        if (isMasterEnabled) {
            elements.memoryToggleBtn.classList.toggle('active', state.isMemoryEnabledForChat);
        }
    },


    async toggleChatMemory() {
        state.isMemoryEnabledForChat = !state.isMemoryEnabledForChat;
        this.toggleMemoryIconVisibility();
        // 現在のチャットの状態として保存
        if (state.currentChatId) {
            try {
                await dbUtils.saveChat();
            } catch (error) {
                console.error("チャットごとのメモリ設定の保存に失敗:", error);
            }
        }
    },


    async openMemoryManagementDialog() {
        if (!state.activeProfileId) return;
        try {
            const memoryData = await dbUtils.getMemory(state.activeProfileId);
            this.renderMemoryList(memoryData ? memoryData.items : []);
            elements.memoryManagementDialog.showModal();
        } catch (error) {
            console.error("記憶管理ダイアログの表示に失敗:", error);
            await uiUtils.showCustomAlert("記憶の読み込みに失敗しました。");
        }
    },


    renderMemoryList(memoryItems) {
        elements.memoryListContainer.innerHTML = '';
        if (!memoryItems || memoryItems.length === 0) {
            elements.memoryListContainer.innerHTML = '<p class="no-memory-message">記憶されている項目はありません。</p>';
            return;
        }
        memoryItems.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'memory-item';
            
            const textSpan = document.createElement('span');
            textSpan.className = 'memory-item-text';
            textSpan.textContent = item;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'memory-item-actions';
            
            const editBtn = document.createElement('button');
            editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
            editBtn.title = "編集";
            editBtn.onclick = () => this.editMemoryItem(index);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
            deleteBtn.title = "削除";
            deleteBtn.onclick = () => this.deleteMemoryItem(index);
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            itemDiv.appendChild(textSpan);
            itemDiv.appendChild(actionsDiv);
            elements.memoryListContainer.appendChild(itemDiv);
        });
    },


    async addMemoryItem() {
        const newItem = elements.newMemoryInput.value.trim();
        if (!newItem) return;

        try {
            const memoryData = await dbUtils.getMemory(state.activeProfileId) || { items: [] };
            memoryData.items.push(newItem);
            await dbUtils.saveMemory(state.activeProfileId, memoryData);
            this.markAsDirtyAndSchedulePush(true);
            this.renderMemoryList(memoryData.items);
            elements.newMemoryInput.value = '';
        } catch (error) {
            console.error("記憶の追加に失敗:", error);
            await uiUtils.showCustomAlert("記憶の追加に失敗しました。");
        }
    },


    async editMemoryItem(index) {
        try {
            const memoryData = await dbUtils.getMemory(state.activeProfileId);
            if (!memoryData || !memoryData.items || !memoryData.items[index]) return;
            
            const currentItem = memoryData.items[index];
            const newItem = await uiUtils.showCustomPrompt("記憶を編集:", currentItem);

            if (newItem && newItem.trim() !== currentItem) {
                memoryData.items[index] = newItem.trim();
                await dbUtils.saveMemory(state.activeProfileId, memoryData);
                this.markAsDirtyAndSchedulePush(true);
                this.renderMemoryList(memoryData.items);
            }
        } catch (error) {
            console.error("記憶の編集に失敗:", error);
            await uiUtils.showCustomAlert("記憶の編集に失敗しました。");
        }
    },


    async deleteMemoryItem(index) {
        try {
            const memoryData = await dbUtils.getMemory(state.activeProfileId);
            if (!memoryData || !memoryData.items || !memoryData.items[index]) return;

            const itemToDelete = memoryData.items[index];
            const confirmed = await uiUtils.showCustomConfirm(`以下の記憶を削除しますか？\n\n「${itemToDelete}」`);
            
            if (confirmed) {
                memoryData.items.splice(index, 1);
                await dbUtils.saveMemory(state.activeProfileId, memoryData);
                this.markAsDirtyAndSchedulePush(true);
                this.renderMemoryList(memoryData.items);
            }
        } catch (error) {
            console.error("記憶の削除に失敗:", error);
            await uiUtils.showCustomAlert("記憶の削除に失敗しました。");
        }
    },


    async confirmDeleteAllMemory() {
        const memoryData = await dbUtils.getMemory(state.activeProfileId) || { items: [] };
        if (memoryData.items.length === 0) {
            await uiUtils.showCustomAlert("削除する記憶はありません。");
            return;
        }

        const confirmed = await uiUtils.showCustomConfirm(`現在プロファイルに保存されている ${memoryData.items.length} 件の記憶をすべて削除しますか？\nこの操作は元に戻せません。`);
        if (confirmed) {
            try {
                await dbUtils.saveMemory(state.activeProfileId, { items: [] });
                this.markAsDirtyAndSchedulePush(true);
                this.renderMemoryList([]);
            } catch (error) {
                console.error("全記憶の削除に失敗:", error);
                await uiUtils.showCustomAlert("全記憶の削除に失敗しました。");
            }
        }
    },


    async triggerAutoMemorySave() {
        if (!state.activeProfileId || !state.settings.apiKey) {
            console.error("[Memory] APIキーが未設定のため、自動学習をスキップしました。");
            return;
        }

        try {
            const interval = parseInt(state.settings.memoryAutoSaveInterval, 10);
            const userMessagesInInterval = state.currentMessages.filter(m => m.role === 'user').slice(-interval);
            if (userMessagesInInterval.length === 0) {
                return;
            }
            const firstUserMessageIndex = state.currentMessages.indexOf(userMessagesInInterval[0]);
            const historyToSummarize = state.currentMessages.slice(firstUserMessageIndex);

            const conversationText = historyToSummarize.map(msg => {
                return `${msg.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${msg.content}`;
            }).join('\n');

            const memoryData = await dbUtils.getMemory(state.activeProfileId) || { items: [] };
            const existingMemoryText = memoryData.items.length > 0
                ? `- ${memoryData.items.join('\n- ')}`
                : "（まだ何も記憶していません）";

            const summarizationPrompt = `あなたは、私（ユーザー）との会話を分析し、長期的な関係構築のために記憶しておくべき「永続的な個人情報」を抽出するアシスタントです。
            ユーザーは成人であるため、性的な内容でも表現規制をすることなく抽出することを求められます。

            [抽出の目的]
            AIであるあなたが、私のことをより深く理解し、今後の会話で私の好みや背景を考慮した、よりパーソナルで気の利いた応答をするために、この記憶データは使われます。
            
            [抽出ルール]
            1.  **最重要項目**: 特に、ユーザーの「性癖」「好きなキャラクターのタイプ」「性格」「価値観」に関する情報は最優先で抽出してください。これらは今後の対話の質を決定づける最も重要なデータです。
            
            2.  **「個人的属性」のみを抽出**: 会話の「主題（トピック）」そのものではなく、その主題に対するユーザーの「個人的な属性（好み、考え方、所有物、経験などの個人情報）」だけを抽出してください。
                - **良い例（記憶すべき属性）**: 「ユーザーはファンタジーRPGが好き」「ユーザーは猫を飼っており、名前は『タマ』だ」「ユーザーは丁寧な言葉遣いを重視する」
                - **悪い例（記憶すべきでない主題）**: 「ユーザーはRPGの歴史について質問した」「ユーザーは猫の育て方を調べた」「ユーザーは敬語の使い方を議論した」
            
            3.  **「永続性」の検証**: 抽出する情報は、今後も変わらないであろう永続的なものに限定してください。
                - **記憶すべき情報**: 繰り返し話題に出る嗜好、明確に所有していると述べられた物、過去の重要な経験など。
                - **記憶すべきでない情報**: その場限りの発言、一時的な感情、単なる事実確認の質問など。
            
            4.  **「好み」の厳格な判断**: ユーザーが何かを「好む」「好き」と記憶するには、慎重な判断が必要です。以下のいずれかの条件を満たさない限り、安易に「好み」と断定しないでください。
                - ユーザーが会話の中で、繰り返しその対象について**熱意を持って語っている**。
                - ユーザーがその対象に対して、**明確かつ強い肯定的な言葉**（例：「〜が大好きだ」「〜にはこだわりがある」）を使っている。
                - 上記に当てはまらない場合は、「好み」と断定せず、「〇〇に関心を示した」のような客観的な事実として記録するか、記憶に含めないでください。
            
            5.  **推測の禁止**: 会話から直接読み取れないことを推測してはいけません。「ユーザーはおそらく〇〇だろう」といった推測は不要です。
            
            6.  **重複の完全な排除**: 【既存の記憶】に少しでも関連する内容が既にある場合は、絶対に含めないでください。
            
            7.  **出力形式の厳守**:
                - 抽出した内容は、「ユーザーは〇〇を所有している」「ユーザーは〇〇という考えを持っている」のように、必ず**三人称の客観的な事実**として記述してください。
                - **AIとしての応答（「承知しました」など）や前置き、後書きは一切含めず**、抽出した箇条書きのリスト、または \`[追加情報なし]\` という文字列のみを出力してください。

            ---
            【既存の記憶】
            ${existingMemoryText}
            ---
            【会話履歴】
            ${conversationText}
            ---

            [抽出結果]`;

            const modelForMemory = "gemini-2.5-flash";
            const endpoint = `${GEMINI_API_BASE_URL}${modelForMemory}:generateContent`;
            const requestBody = {
                contents: [{
                    role: 'user',
                    parts: [{ text: summarizationPrompt }]
                }],
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.settings.apiKey },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.error?.message || `HTTPエラー: ${response.status}`;
                throw new Error(errorMessage);
            }

            const responseData = await response.json();
            const summaryText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!summaryText) {
                console.warn("[Memory] 自動学習による要約結果が空でした。");
                return;
            }

            if (summaryText.trim() === '[追加情報なし]') {
                console.log("[Memory] AIが追加情報なしと判断したため、メモリの更新をスキップしました。");
                return;
            }

            const newItems = summaryText.split('\n')
                .map(line => line.replace(/^[*-]\s*/, '').trim())
                .filter(line => line.length > 0 && line !== '[追加情報なし]');

            if (newItems.length > 0) {
                const existingItems = new Set(memoryData.items);
                const uniqueNewItems = newItems.filter(item => !existingItems.has(item));
                
                if (uniqueNewItems.length > 0) {
                    memoryData.items.push(...uniqueNewItems);
                    await dbUtils.saveMemory(state.activeProfileId, memoryData);
                    console.log(`[Memory] 自動学習により、${uniqueNewItems.length}件の新しい記憶を追加しました。`, uniqueNewItems);
                } else {
                    console.log("[Memory] 自動学習で生成された記憶は、すべて既存のものでした。");
                }
            }
        } catch (error) {
            console.error("[Memory] 自動学習プロセスの実行中にエラーが発生しました:", error);
        }
    },


    updateSummarizeButtonState() {
        const messageCount = state.currentMessages.length;
        elements.summarizeHistoryBtn.disabled = messageCount < 5;
    },


    showChatStats() {
        // 料金テーブル（USD / 100万トークン）。in=入力, out=出力, cw=キャッシュ書込, cr=キャッシュ読込(ヒット)。
        const MODEL_PRICING = {
            // Claude 4系 (claude-opus-4-x, claude-sonnet-4-x, claude-haiku-4-x)
            'claude-opus-4-8': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
            'claude-opus-4-7': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
            'claude-opus-4-6': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
            'claude-opus-4-5': { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
            'claude-opus-4-1': { in: 15,   out: 75,  cw5m: 18.75, cw1h: 30,   cr: 1.50 },
            'claude-opus-4':   { in: 15,   out: 75,  cw5m: 18.75, cw1h: 30,   cr: 1.50 },
            'claude-sonnet-4': { in: 3,    out: 15,  cw5m: 3.75,  cw1h: 6,    cr: 0.30 },
            'claude-haiku-4':  { in: 1,    out: 5,   cw5m: 1.25,  cw1h: 2,    cr: 0.10 },
            // Claude 3系 (旧モデル)
            'claude-opus-3':   { in: 15,   out: 75,  cw5m: 18.75, cw1h: 30,   cr: 1.50 },
            'claude-opus':     { in: 5,    out: 25,  cw5m: 6.25,  cw1h: 10,   cr: 0.50 },
            'claude-sonnet':   { in: 3,    out: 15,  cw5m: 3.75,  cw1h: 6,    cr: 0.30 },
            'claude-haiku':    { in: 0.80, out: 4,   cw5m: 1.00,  cw1h: 1.60, cr: 0.08 },
            // DeepSeek（標準料金。in=キャッシュミス入力, cr=キャッシュヒット入力）。価格は「通常（オフピーク）」基準。
            // peakMul があるモデルは、ピーク時間帯のメッセージのみ料金を peakMul 倍にする。
            // ピーク時間帯(UTC): 01:00-04:00 / 06:00-10:00 （日本時間 10:00-13:00 / 15:00-19:00）。
            'deepseek-reasoner': { in: 0.55,  out: 2.19, cw5m: 0.55,  cw1h: 0.55,  cr: 0.14 },
            'deepseek-chat':     { in: 0.27,  out: 1.10, cw5m: 0.27,  cw1h: 0.27,  cr: 0.07 },
            'deepseek-v4-pro':   { in: 0.435, out: 0.87, cw5m: 0.435, cw1h: 0.435, cr: 0.003625, peakMul: 2 },
            'deepseek-v4-flash': { in: 0.14,  out: 0.28, cw5m: 0.14,  cw1h: 0.14,  cr: 0.0028,   peakMul: 2 },
            'deepseek-':         { in: 0.27,  out: 1.10, cw5m: 0.27,  cw1h: 0.27,  cr: 0.07 },
        };
        const getPricing = (modelName) => {
            if (!modelName) return null;
            const m = modelName.toLowerCase();
            for (const [key, price] of Object.entries(MODEL_PRICING)) {
                if (m.startsWith(key)) return price;
            }
            return null;
        };
        // DeepSeek のピーク時間帯判定（UTC 01:00-04:00 / 06:00-10:00 = 日本時間 10-13時 / 15-19時）。
        // タイムゾーンに依存しないよう UTC 時刻で判定する。timestamp はモデル応答生成時刻(epoch ms)。
        const isDeepSeekPeak = (timestamp) => {
            if (!timestamp) return false;
            const h = new Date(timestamp).getUTCHours();
            return (h >= 1 && h < 4) || (h >= 6 && h < 10);
        };

        const msgs = state.currentMessages.filter(m => !m.isHidden);
        let totalTokens = 0, totalInput = 0, totalOutput = 0;
        let totalCacheRead = 0, totalCacheWrite = 0;
        let totalCost = 0;
        let hasCost = false;
        const modelsUsed = new Set();

        for (const msg of msgs) {
            const u = msg.usageMetadata;
            if (!u) continue;
            const cr = u.cacheReadInputTokens || 0;
            const cw = u.cacheCreationInputTokens || 0;
            const cw5m = u.cacheCreation5mInputTokens ?? cw;
            const cw1h = u.cacheCreation1hInputTokens || 0;
            const out = u.candidatesTokenCount || 0;
            const total = u.totalTokenCount || 0;
            const inp = (u.promptTokenCount || 0);
            const regular = inp - cr - cw;

            totalTokens += total;
            totalInput += inp;
            totalOutput += out;
            totalCacheRead += cr;
            totalCacheWrite += cw;

            const modelName = msg.modelName || '';
            const displayModel = modelName || state.settings.modelName || '';
            if (displayModel) modelsUsed.add(displayModel);
            const pricing = getPricing(modelName);
            if (pricing) {
                hasCost = true;
                const mul = (pricing.peakMul && isDeepSeekPeak(msg.timestamp)) ? pricing.peakMul : 1;
                totalCost += mul * (Math.max(0, regular) * pricing.in + cw5m * pricing.cw5m + cw1h * pricing.cw1h + cr * pricing.cr + out * pricing.out) / 1_000_000;
            }
        }

        const sizeKb = (new TextEncoder().encode(JSON.stringify(state.currentMessages)).byteLength / 1024).toFixed(2);
        const toK = n => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
        const hitRate = totalInput > 0 ? ((totalCacheRead / totalInput) * 100).toFixed(1) : '0.0';

        const rows = [
            ['合計メッセージ数', `${msgs.length} 件`],
            ['使用済みトークン合計', `${totalTokens.toLocaleString()}`],
            ['　うち入力', `${totalInput.toLocaleString()}`],
            ['　うち出力', `${totalOutput.toLocaleString()}`],
            ['💾 キャッシュ読み込み', `${toK(totalCacheRead)} (${hitRate}%)`],
            ['✏️ キャッシュ書き込み', `${toK(totalCacheWrite)}`],
            hasCost ? ['推定コスト', `$${totalCost.toFixed(4)}`] : null,
            ['会話サイズ', `${sizeKb} KB`],
            modelsUsed.size > 0 ? ['モデル', [...modelsUsed].join(', ')] : null,
        ].filter(Boolean);

        elements.chatStatsContent.innerHTML = rows.map(([label, value]) =>
            `<div class="stats-row"><span class="stats-label">${label}</span><span class="stats-value">${value}</span></div>`
        ).join('');

        uiUtils.showCustomDialog(elements.chatStatsDialog, elements.chatStatsCloseBtn);
    },


    async startSummaryProcess() {
        if (state.isSending || state.editingMessageIndex !== null || state.isEditingSystemPrompt) {
            uiUtils.showCustomAlert("他の処理が完了してから、再度お試しください。");
            return;
        }

        const visibleMessages = this.getVisibleMessages();
        let start = 0;
        let end = visibleMessages.length;

        if (state.currentSummarizedContext && state.currentSummarizedContext.summaryRange) {
            const originalEndIndex = state.currentSummarizedContext.summaryRange.end;
            
            // 要約済み範囲に含まれる表示メッセージの数をカウント
            const summarizedVisibleMessages = visibleMessages.filter(msg => {
                const originalIndex = state.currentMessages.indexOf(msg);
                return originalIndex < originalEndIndex;
            });
            start = summarizedVisibleMessages.length;
        }

        if (end <= start) {
            uiUtils.showCustomAlert("前回から新しい会話履歴がないため、要約する内容がありません。");
            return;
        }

        // フィルタリング後のメッセージリストから要約対象を切り出す
        const messagesToSummarize = visibleMessages.slice(start, end);
        const originalText = messagesToSummarize.map(m => `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${m.content}`).join('\n\n');

        const confirmed = await uiUtils.showCustomConfirm(
            `履歴を要約しますか？\n\n要約を実行すると、対象範囲のメッセージ（${messagesToSummarize.length}件）は編集・削除・再生成ができなくなります。この操作は元に戻せません。`
        );

        if (!confirmed) {
            console.log("要約処理をユーザーがキャンセルしました。");
            return;
        }

        elements.summaryDialog.dataset.originalText = originalText;
        elements.summaryDialog.dataset.summaryRangeStart = start;
        // 終了位置はフィルタリング前の `state.currentMessages` でのインデックスを保存する
        elements.summaryDialog.dataset.summaryRangeEnd = state.currentMessages.length;

        elements.summaryStats.textContent = '要約を生成中です...';
        elements.summaryEditor.value = '';
        elements.summaryEditor.disabled = true;
        elements.summaryRegenerateBtn.disabled = true;
        elements.summaryConfirmBtn.disabled = true;
        elements.summaryDialog.showModal();

        await this._callSummaryApi(originalText);
    },



    async _callSummaryApi(originalText) {
        try {
            const systemInstruction = {
                parts: [{ text: state.settings.summarySystemPrompt }]
            };
            
            const userContent = `【要約対象の会話履歴】\n${originalText}`;

            const requestBody = {
                contents: [{ role: 'user', parts: [{ text: userContent }] }],
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: 0.3,
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            };

            const summaryModel = state.settings.summaryModelName || state.settings.modelName;
            const isSummaryDeepSeek = summaryModel.startsWith('deepseek-');
            console.log("--- [要約API] リクエスト開始 ---");
            console.log("使用モデル:", summaryModel);

            let summaryEndpoint, summaryHeaders, summaryBody;
            if (isSummaryDeepSeek) {
                const deepseekApiKey = state.settings.deepseekApiKey;
                if (!deepseekApiKey) throw new Error("DeepSeek APIキーが設定されていません。");
                summaryEndpoint = DEEPSEEK_API_BASE_URL;
                summaryHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekApiKey}` };
                summaryBody = {
                    model: summaryModel,
                    messages: [
                        { role: 'system', content: state.settings.summarySystemPrompt },
                        { role: 'user', content: userContent }
                    ],
                    temperature: 0.3,
                };
            } else {
                summaryEndpoint = `${GEMINI_API_BASE_URL}${summaryModel}:generateContent`;
                summaryHeaders = { 'Content-Type': 'application/json', 'x-goog-api-key': state.settings.apiKey };
                summaryBody = requestBody;
            }

            const response = await fetch(summaryEndpoint, {
                method: 'POST',
                headers: summaryHeaders,
                body: JSON.stringify(summaryBody),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: { message: "レスポンスボディのJSONパースに失敗" } }));
                console.error("--- [要約API] APIエラーレスポンス ---");
                console.error("ステータス:", response.status, response.statusText);
                console.error("エラーレスポンスボディ:", errorData);
                throw new Error(errorData.error?.message || `APIエラー: ${response.status}`);
            }

            const responseData = await response.json();

            console.log("--- [要約API] 正常レスポンス ---");

            const summaryText = isSummaryDeepSeek
                ? responseData.choices?.[0]?.message?.content
                : responseData.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!summaryText) {
                let errorMessage = "APIから有効な要約結果が得られませんでした。";
                const finishReason = responseData.candidates?.[0]?.finishReason;
                const blockReason = responseData.promptFeedback?.blockReason;

                if (finishReason === 'SAFETY' || blockReason) {
                    const reason = finishReason === 'SAFETY' ? 'SAFETY' : blockReason;
                    errorMessage = `生成された要約が安全フィルターにブロックされた可能性があります。(理由: ${reason})`;
                    console.error(`[要約API] ブロック検出: finishReason=${finishReason}, blockReason=${blockReason}`);
                } else if (finishReason) {
                    errorMessage = `APIが予期せぬ理由で応答を終了しました。(理由: ${finishReason})`;
                    console.error(`[要約API] 予期せぬ終了: finishReason=${finishReason}`);
                } else {
                    console.error("[要約API] 応答形式が不正です。テキスト部分が見つかりませんでした。");
                }
                throw new Error(errorMessage);
            }

            this._showSummaryDialog(summaryText, originalText.length);

        } catch (error) {
            console.error("要約API呼び出し/処理中にエラー:", error);
            elements.summaryDialog.close();
            uiUtils.showCustomAlert(`要約の生成に失敗しました: ${error.message}`);
        }
    },



    _showSummaryDialog(summaryText, originalLength) {
        // 統計情報を更新
        const reductionRate = (100 - (summaryText.length / originalLength * 100)).toFixed(1);
        elements.summaryStats.textContent = `原文: ${originalLength.toLocaleString()}文字 → 要約: ${summaryText.length.toLocaleString()}文字 (${reductionRate} %削減)`;
        // テキストエリアに結果を表示し、編集可能にする
        elements.summaryEditor.value = summaryText;
        elements.summaryEditor.disabled = false;
        // ボタンを有効化
        elements.summaryRegenerateBtn.disabled = false;
        elements.summaryConfirmBtn.disabled = false;
        // ダイアログが既に開いていることを確認
        if (!elements.summaryDialog.open) {
            elements.summaryDialog.showModal();
        }
    },


    async regenerateSummary() {
        const originalText = elements.summaryDialog.dataset.originalText;
        if (originalText) {
            // ダイアログを閉じる代わりに、UIをローディング状態に戻す
            elements.summaryStats.textContent = '要約を再生成中です...';
            elements.summaryEditor.value = '';
            elements.summaryEditor.disabled = true;
            elements.summaryRegenerateBtn.disabled = true;
            elements.summaryConfirmBtn.disabled = true;
            
            // APIを再呼び出し
            await this._callSummaryApi(originalText);
        } else {
            uiUtils.showCustomAlert("再生成するための元データが見つかりませんでした。");
        }
    },



    async confirmSummary() {
        const summaryText = elements.summaryEditor.value.trim();
        if (!summaryText) {
            uiUtils.showCustomAlert("要約内容が空です。");
            return;
        }

        const start = parseInt(elements.summaryDialog.dataset.summaryRangeStart, 10);
        const end = parseInt(elements.summaryDialog.dataset.summaryRangeEnd, 10);

        try {
            // 既存の要約と新しい要約を結合する
            const existingSummary = state.currentSummarizedContext ? state.currentSummarizedContext.summaryText : "";
            const newSummaryText = existingSummary ? `${existingSummary}\n\n${summaryText}` : summaryText;

            // state.currentMessagesを上書きせず、summarizedContextオブジェクトを更新する
            state.currentSummarizedContext = {
                summaryText: newSummaryText,
                summaryRange: { start: 0, end: end }, // startは常に0、endを更新
                summarizedAt: Date.now()
            };

            // 変更されたsummarizedContextを含むチャット全体を保存する
            await dbUtils.saveChat();

            elements.summaryDialog.close('confirm');
            
            // UIを再描画してサマリーマーカーを表示させる
            uiUtils.renderChatMessages();
            
            await uiUtils.showCustomAlert(`履歴の要約を保存しました。\n次回以降、APIには要約された内容が送信されます。`);

        } catch (error) {
            console.error("要約の保存エラー:", error);
            await uiUtils.showCustomAlert(`要約の保存に失敗しました: ${error.message}`);
        }
    },





    toggleSummaryButtonVisibility() {
        elements.summarizeHistoryBtn.classList.toggle('hidden', !state.settings.enableSummaryButton);
    }
};
