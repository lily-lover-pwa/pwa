import("https://esm.run/@google/genai").then(module => {
    // 正しいクラス名 GoogleGenAI をグローバルスコープに設定
    window.GoogleGenAI = module.GoogleGenAI;
    console.log("Google GenAI SDK (@google/genai) の読み込みが完了しました。");
}).catch(err => {
    console.error("Google Gen AI SDKの読み込みに失敗しました:", err);
    // エラーメッセージを画面に表示するなどのフォールバック処理
    document.body.innerHTML = `<p style="color: red; padding: 20px;">SDKの読み込みに失敗しました。アプリを起動できません。</p>`;
});

// Phase 1: 純粋ユーティリティをモジュールから取り込む（挙動は従来通り）

// --- 定数 ---（src/constants.js へ抽出。挙動は不変）
export let broadcastChannel = null; // タブ間通信用
// --- デバッグログ機能 ---
// デバッグログ機能（src/debug-logger.js へ抽出）


// 添付を確定する処理
// 拡張子→MIMEタイプ表（src/mime-types.js へ抽出）

// --- DOM要素 ---
import { elements } from './dom-elements.js';

// --- アプリ状態 ---
// --- アプリ状態 ---（src/state.js へ抽出。挙動は不変）
import { state } from "./state.js";

export function updateMessageMaxWidthVar() {
    const container = elements.messageContainer;
    if (!container) return;

    const isWideMode = state.settings.enableWideMode && window.innerWidth > 800;
    // ワイドモード時はコンテナ幅の70%、通常時は80%をメッセージの最大幅とする
    const percentage = isWideMode ? 0.7 : 0.8;
    let maxWidthPx = container.clientWidth * percentage;

    document.documentElement.style.setProperty('--message-max-width', `${maxWidthPx}px`);
}


let resizeTimer;
window.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded and parsed. Initializing app...");
    appLogic.initializeApp();

    // iOS Safari: フォーカス時の自動ズームをblur後にリセット
    // フォントサイズ16px未満の入力欄がある場合に備えた保険
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
        document.addEventListener('focusout', () => {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1');
            requestAnimationFrame(() => {
                viewport.setAttribute('content', 'width=device-width, initial-scale=1');
            });
        });
    }
});

// --- ユーティリティ関数 ---
// sleep / interruptibleSleep / formatFileSize / base64ToBlob は
// src/utils/format.js へ抽出済み（ファイル冒頭で import）。

// --- Service Worker関連 ---
export function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('このブラウザはService Workerをサポートしていません。');
        return;
    }

    // ページリロードの唯一のトリガーとしてcontrollerchangeを定義
    let isReloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isReloading) return;
        isReloading = true;
        console.log("Controller has changed, reloading page for update...");
        window.location.reload();
    });

    const handleUpdateFound = (registration) => {
        const newWorker = registration.installing;
        if (newWorker) {
            console.log('新しいService Workerのインストールを検知しました。');
            newWorker.addEventListener('statechange', () => {
                // 新しいワーカーがインストールされ、待機状態になったら...
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('新しいService Workerが待機状態に入りました。アクティベートを試みます。');
                    // 確認なしで即座に更新を指示
                    if (state.db) {
                        state.db.close();
                        console.log("Service Worker更新のため、現在のDB接続を閉じました。");
                    }
                    newWorker.postMessage({ action: 'skipWaiting' });
                }
            });
        }
    };

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.status === 'cacheCleared') {
            console.log('Service Workerから手動キャッシュクリア完了のメッセージを受信。リロードを実行します。');
            if (isReloading) return;
            isReloading = true;
            window.location.reload();
        }
    });

    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('ServiceWorker登録成功 スコープ: ', registration.scope);

            const checkForUpdates = () => {
                navigator.serviceWorker.ready.then(readyRegistration => {
                    readyRegistration.update();
                }).catch(error => {
                    console.error('navigator.serviceWorker.ready failed:', error);
                });
            };

            // 各イベントでの更新チェックは維持
            setInterval(checkForUpdates, 60 * 60 * 1000);
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') checkForUpdates();
            });
            window.addEventListener('focus', checkForUpdates);

            // 待機中のワーカーがいれば即座に更新を試みる
            if (registration.waiting) {
                console.log('待機中の新しいService Workerが見つかりました。アクティベートを試みます。');
                // 確認なしで即座に更新を指示
                if (state.db) state.db.close();
                registration.waiting.postMessage({ action: 'skipWaiting' });
            }

            registration.addEventListener('updatefound', () => handleUpdateFound(registration));

        } catch (error) {
            console.error('ServiceWorker処理中にエラー: ', error);
        }
    });
}

// --- HTMLエスケープユーティリティ ---
// htmlUtils は src/utils/html.js へ抽出済み（ファイル冒頭で import）。

// --- IndexedDBユーティリティ (dbUtils) ---
import { dbUtils } from './db.js';

// --- UIユーティリティ (uiUtils) ---


function updateCurrentSystemPrompt() {
    const provider = state.settings.apiProvider;
    const commonPrompt = state.settings.systemPrompt || '';
    const specificPrompt = state.settings.systemPrompt || commonPrompt;

    // 新規チャット(メッセージがまだない状態)の場合のみ、
    // 設定のデフォルト値を state.currentSystemPrompt に反映する。
    // 既存チャットや、新規でもユーザーが編集したチャットは上書きしない。
    if (!state.currentChatId && state.currentMessages.length === 0) {
        state.currentSystemPrompt = specificPrompt;
        console.log(`新規チャットのため、デフォルトのシステムプロンプトを適用しました。`);
    } else {
        console.log(`既存チャットのため、デフォルトのシステムプロンプトによる上書きをスキップしました。`);
    }

    // ログ出力は関数の最後に移動
    console.log(`システムプロンプトを更新しました。Provider: ${provider}, Current Prompt: "${state.currentSystemPrompt.substring(0, 30)}..."`);
}

/**
 * タブ間通信のためのBroadcastChannelを設定する
 */
export function setupBroadcastChannel() {
    if ('BroadcastChannel' in window) {
        try {
            broadcastChannel = new BroadcastChannel('gemini-pwa-sync-channel');
            console.log('[BroadcastChannel] チャンネルに接続しました。');

            broadcastChannel.onmessage = async (event) => {
                const { type, newSyncId, sourceTabId } = event.data;

                // 自分のタブからのメッセージは無視
                if (sourceTabId === state.tabId) {
                    return;
                }

                console.log(`[BroadcastChannel] 他のタブからメッセージを受信:`, event.data);

                if (type === 'SYNC_COMPLETED' && newSyncId) {
                    // 自身のメモリ上の状態を更新
                    state.sync.lastSyncId = newSyncId;
                    state.sync.isDirty = false;
                    state.sync.lastError = null;
                    
                    // DBにも保存
                    await dbUtils.saveSetting('lastSyncId', newSyncId);
                    await dbUtils.saveSetting('syncIsDirty', false);
                    await dbUtils.saveSetting('syncLastError', null);
                    await dbUtils.saveSetting('lastSyncTimestamp', Date.now());

                    // UIを更新
                    await appLogic.updateDropboxUIState();
                }
            };
        } catch (error) {
            console.error('[BroadcastChannel] チャンネルの作成に失敗しました:', error);
        }
    } else {
        console.warn('[BroadcastChannel] このブラウザはBroadcastChannelをサポートしていません。');
    }
}

// --- アプリケーションロジック (appLogic) ---
import { appLogic } from './app-logic.js';

window.appLogic = appLogic;
window.state = state;
window.dbUtils = dbUtils;
// --- Phase 3 & 4: Settings Switchers & Project Management Hooks ---
(function() {
    function initHeaderModelSwitcher() {
        const headerSelect = document.getElementById('header-model-select');
        const mainSelect = document.getElementById('model-name');
        if (!headerSelect || !mainSelect) return;

        const syncToHeader = () => {
            if (mainSelect.innerHTML !== headerSelect.innerHTML) {
                headerSelect.innerHTML = mainSelect.innerHTML;
            }
            if (window.state && window.state.settings && window.state.settings.modelName) {
                if (headerSelect.value !== window.state.settings.modelName) {
                    headerSelect.value = window.state.settings.modelName;
                }
            } else if (headerSelect.value !== mainSelect.value) {
                headerSelect.value = mainSelect.value;
            }
        };

        const observer = new MutationObserver(syncToHeader);
        observer.observe(mainSelect, { childList: true, subtree: true });
        setInterval(syncToHeader, 1000);

        headerSelect.addEventListener('change', async (e) => {
            const newModel = e.target.value;
            const selectedOpt = headerSelect.options[headerSelect.selectedIndex];
            
            if (window.state && window.state.settings) {
                window.state.settings.modelName = newModel;
                mainSelect.value = newModel;

                // Sync API Provider if data-provider exists
                if (selectedOpt && selectedOpt.dataset.provider) {
                    const provider = selectedOpt.dataset.provider;
                    const apiProvSelect = document.getElementById('api-provider');
                    if (apiProvSelect && window.state.settings.apiProvider !== provider) {
                        window.state.settings.apiProvider = provider;
                        apiProvSelect.value = provider;
                        apiProvSelect.dispatchEvent(new Event('change'));
                        
                        // Sync to active profile
                        if (window.state.activeProfile) {
                            window.state.activeProfile.settings.apiProvider = provider;
                            if (window.dbUtils && typeof window.dbUtils.updateProfile === 'function') {
                                await window.dbUtils.updateProfile(window.state.activeProfile);
                            }
                        }
                    }
                } else if (newModel.startsWith('gemini-')) {
                    // Fallback for standard Gemini models
                    const apiProvSelect = document.getElementById('api-provider');
                    if (apiProvSelect && window.state.settings.apiProvider !== 'gemini') {
                        window.state.settings.apiProvider = 'gemini';
                        apiProvSelect.value = 'gemini';
                        apiProvSelect.dispatchEvent(new Event('change'));
                    }
                }
                
                // プロバイダーごとに最後に選んだモデルを記憶
                const curProvider = window.state.settings.apiProvider;
                if (curProvider && newModel) {
                    window.state.settings.lastModelPerProvider = window.state.settings.lastModelPerProvider || {};
                    window.state.settings.lastModelPerProvider[curProvider] = newModel;
                }
                if (window.state.activeProfile && window.dbUtils && typeof window.dbUtils.updateProfile === 'function') {
                    window.state.activeProfile.settings = window.state.activeProfile.settings || {};
                    window.state.activeProfile.settings.modelName = newModel;
                    window.state.activeProfile.settings.apiProvider = curProvider;
                    window.state.activeProfile.settings.lastModelPerProvider = window.state.settings.lastModelPerProvider;
                    await window.dbUtils.updateProfile(window.state.activeProfile);
                }
                console.log(`[Model Switcher] Model changed to: ${newModel} (Provider: ${window.state.settings.apiProvider})`);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initHeaderModelSwitcher, 500));
    } else {
        setTimeout(initHeaderModelSwitcher, 500);
    }
})();

// --- Phase 4: Project Management Hook ---
(function() {
    window.state.activeProjectId = null;
    window.state.activeProjectKnowledge = [];
    let projectsCache = [];

    async function initProjectManager() {
        const headerSelect = document.getElementById('header-project-select');
        const dialog = document.getElementById('projectManagementDialog');
        if (!headerSelect || !dialog) return;

        // DB methods
        if (window.dbUtils) {
            window.dbUtils.getAllProjects = async () => {
                const db = await window.dbUtils.openDB();
                return new Promise((resolve, reject) => {
                    if (!db.objectStoreNames.contains('projects')) return resolve([]);
                    const req = db.transaction('projects', 'readonly').objectStore('projects').getAll();
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
            };
            window.dbUtils.addProject = async (project) => {
                const db = await window.dbUtils.openDB();
                return new Promise((resolve, reject) => {
                    const req = db.transaction('projects', 'readwrite').objectStore('projects').add(project);
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
            };
            window.dbUtils.deleteProject = async (id) => {
                const db = await window.dbUtils.openDB();
                return new Promise((resolve, reject) => {
                    const req = db.transaction('projects', 'readwrite').objectStore('projects').delete(id);
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
            };
            window.dbUtils.updateProject = async (project) => {
                const db = await window.dbUtils.openDB();
                return new Promise((resolve, reject) => {
                    const req = db.transaction('projects', 'readwrite').objectStore('projects').put(project);
                    req.onsuccess = () => resolve();
                    req.onerror = () => reject(req.error);
                });
            };
            
            // Patch getAllChats to filter by activeProjectId
            const originalGetAllChats = window.dbUtils.getAllChats;
            window.dbUtils.getAllChatsUnfiltered = originalGetAllChats.bind(window.dbUtils);
            window.dbUtils.getAllChats = async function(sortBy) {
                const allChats = await originalGetAllChats.call(this, sortBy);
                if (window.state.activeProjectId) {
                    return allChats.filter(c => c.projectId === window.state.activeProjectId);
                }
                return allChats;
            };

        }

        // Patch startNewChat for New Chat behavior
        if (window.appLogic && window.appLogic.startNewChat) {
            const originalStartNewChat = window.appLogic.startNewChat;
            window.appLogic.startNewChat = function() {
                originalStartNewChat.call(this);
                if (window.state.activeProjectId) {
                    const activeP = projectsCache.find(p => p.id === window.state.activeProjectId);
                    if (activeP) {
                        if (activeP.systemPrompt) {
                            window.state.currentSystemPrompt = activeP.systemPrompt;
                            const editor = document.getElementById('system-prompt-editor');
                            if (editor) editor.value = activeP.systemPrompt;
                        }
                        window.state.activeProjectKnowledge = activeP.knowledgeFiles || [];
                        if (activeP.defaultModel) {
                            const headerModelSelect = document.getElementById('header-model-select');
                            if (headerModelSelect) {
                                headerModelSelect.value = activeP.defaultModel;
                                headerModelSelect.dispatchEvent(new Event('change'));
                            }
                        }
                    }
                } else {
                    window.state.activeProjectKnowledge = [];
                }
            };
        }

        async function loadProjects() {
            if (!window.dbUtils || !window.dbUtils.getAllProjects) return;
            projectsCache = await window.dbUtils.getAllProjects();
            window.projectsCache = projectsCache;

            // Update Header Select
            // activeProjectId が既に設定されていればそれを優先、なければ現在のUIの値を使う
            const currentVal = (window.state.activeProjectId != null ? String(window.state.activeProjectId) : null) || headerSelect.value;
            headerSelect.innerHTML = '<option value="">すべてのプロジェクト</option><option value="manage">⚙️ プロジェクト管理...</option>';
            projectsCache.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.name;
                headerSelect.appendChild(opt);
            });
            if (currentVal && projectsCache.find(p => p.id === parseInt(currentVal, 10))) {
                headerSelect.value = currentVal;
                window.state.activeProjectId = parseInt(currentVal, 10);
            } else if (currentVal === 'manage') {
                headerSelect.value = window.state.activeProjectId || "";
            } else {
                headerSelect.value = "";
                window.state.activeProjectId = null;
            }

            // Update Dialog List
            const listContainer = document.getElementById('project-list-container');
            if (!listContainer) return;
            listContainer.innerHTML = '';
            projectsCache.forEach(p => {
                const div = document.createElement('div');
                div.className = 'project-item';
                div.innerHTML = `
                    <div class="project-item-header">
                        <span class="project-item-title">${p.name}</span>
                        <div class="project-item-actions">
                            <button class="edit-prompt-btn" data-id="${p.id}" title="指示を編集"><span class="material-symbols-outlined">edit</span></button>
                            <button class="delete-project-btn" data-id="${p.id}" title="削除"><span class="material-symbols-outlined">delete</span></button>
                        </div>
                    </div>
                `;
                // System prompt preview + edit area
                const promptPreview = document.createElement('div');
                promptPreview.className = 'project-item-system-prompt';
                promptPreview.textContent = p.systemPrompt || '（指示なし）';
                promptPreview.style.cssText = p.systemPrompt ? '' : 'color:var(--text-secondary,#888); font-style:italic;';
                div.appendChild(promptPreview);

                const promptEditArea = document.createElement('div');
                promptEditArea.style.cssText = 'display:none; margin-top:6px;';

                // Name edit field
                const nameLabel = document.createElement('label');
                nameLabel.textContent = 'プロジェクト名';
                nameLabel.style.cssText = 'font-size:0.85em; color:var(--text-secondary,#888); display:block; margin-bottom:2px;';
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = p.name || '';
                nameInput.style.cssText = 'width:100%; font-size:0.9em; box-sizing:border-box; margin-bottom:8px; padding:4px 6px;';

                const promptLabel = document.createElement('label');
                promptLabel.textContent = 'システムプロンプト';
                promptLabel.style.cssText = 'font-size:0.85em; color:var(--text-secondary,#888); display:block; margin-bottom:2px;';
                const promptTextarea = document.createElement('textarea');
                promptTextarea.value = p.systemPrompt || '';
                promptTextarea.placeholder = 'このプロジェクトのシステムプロンプトを入力...';
                promptTextarea.style.cssText = 'width:100%; height:100px; font-size:0.9em; box-sizing:border-box; resize:vertical;';
                const promptSaveBtn = document.createElement('button');
                promptSaveBtn.textContent = '保存';
                promptSaveBtn.style.cssText = 'margin-top:4px; margin-right:4px; font-size:0.85em;';
                const promptCancelBtn = document.createElement('button');
                promptCancelBtn.textContent = 'キャンセル';
                promptCancelBtn.style.cssText = 'margin-top:4px; font-size:0.85em;';
                promptEditArea.appendChild(nameLabel);
                promptEditArea.appendChild(nameInput);
                promptEditArea.appendChild(promptLabel);
                promptEditArea.appendChild(promptTextarea);
                promptEditArea.appendChild(document.createElement('br'));
                promptEditArea.appendChild(promptSaveBtn);
                promptEditArea.appendChild(promptCancelBtn);
                div.appendChild(promptEditArea);

                div.querySelector('.edit-prompt-btn').onclick = () => {
                    const isOpen = promptEditArea.style.display !== 'none';
                    promptEditArea.style.display = isOpen ? 'none' : 'block';
                    if (!isOpen) {
                        nameInput.value = p.name || '';
                        promptTextarea.value = p.systemPrompt || '';
                        nameInput.focus();
                    }
                };
                promptCancelBtn.onclick = () => { promptEditArea.style.display = 'none'; };
                promptSaveBtn.onclick = async () => {
                    const newName = nameInput.value.trim();
                    const newPrompt = promptTextarea.value.trim();
                    if (newName) {
                        p.name = newName;
                        div.querySelector('.project-item-title').textContent = newName;
                        // ヘッダーのselectも更新
                        const headerSelect = document.getElementById('project-filter-select');
                        if (headerSelect) {
                            const opt = headerSelect.querySelector(`option[value="${p.id}"]`);
                            if (opt) opt.textContent = newName;
                        }
                    }
                    p.systemPrompt = newPrompt;
                    p.updatedAt = Date.now();
                    await window.dbUtils.updateProject(p);
                    promptPreview.textContent = newPrompt || '（指示なし）';
                    promptPreview.style.cssText = newPrompt ? '' : 'color:var(--text-secondary,#888); font-style:italic;';
                    promptEditArea.style.display = 'none';
                    if (window.state.activeProjectId === p.id) {
                        window.state.currentSystemPrompt = newPrompt;
                        const editor = document.getElementById('system-prompt-editor');
                        if (editor) editor.value = newPrompt;
                        // 現在読み込み中のチャットにも反映
                        if (window.appLogic && window.state.currentChatId) {
                            await window.dbUtils.saveChat().catch(() => {});
                        }
                    }
                };

                // Knowledge files section
                const kSection = document.createElement('div');
                kSection.style.cssText = 'margin-top:8px; border-top:1px solid rgba(128,128,128,0.2); padding-top:8px;';
                const kHeader = document.createElement('div');
                kHeader.style.cssText = 'display:flex; align-items:center; justify-content:space-between; font-size:0.82em; color:var(--text-secondary, #888);';
                const kLabel = document.createElement('span');
                kLabel.textContent = `ナレッジ (${(p.knowledgeFiles || []).length}件)`;
                const kAddBtn = document.createElement('button');
                kAddBtn.className = 'add-knowledge-btn';
                kAddBtn.dataset.id = p.id;
                kAddBtn.title = 'ファイルを追加';
                kAddBtn.style.cssText = 'background:none; border:none; cursor:pointer; padding:2px; color:inherit; display:flex; align-items:center;';
                kAddBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:16px;">attach_file</span>';
                kHeader.appendChild(kLabel);
                kHeader.appendChild(kAddBtn);
                kSection.appendChild(kHeader);

                const kList = document.createElement('div');
                kList.style.cssText = 'margin-top:4px;';
                (p.knowledgeFiles || []).forEach(f => {
                    const fDiv = document.createElement('div');
                    fDiv.style.cssText = 'font-size:0.8em; padding:2px 0;';

                    const fRow = document.createElement('div');
                    fRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between;';
                    const fName = document.createElement('span');
                    fName.textContent = `📄 ${f.name}`;
                    fName.style.cssText = 'overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:70%;';
                    const fBtns = document.createElement('div');
                    fBtns.style.cssText = 'display:flex; align-items:center; flex-shrink:0;';
                    const fEdit = document.createElement('button');
                    fEdit.className = 'edit-knowledge-btn';
                    fEdit.dataset.projectId = p.id;
                    fEdit.dataset.fileName = f.name;
                    fEdit.style.cssText = 'background:none; border:none; cursor:pointer; padding:0 2px; color:inherit; display:flex; align-items:center;';
                    fEdit.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">edit</span>';
                    const fDel = document.createElement('button');
                    fDel.className = 'delete-knowledge-btn';
                    fDel.dataset.projectId = p.id;
                    fDel.dataset.fileName = f.name;
                    fDel.style.cssText = 'background:none; border:none; cursor:pointer; padding:0 2px; color:inherit; display:flex; align-items:center;';
                    fDel.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">close</span>';
                    fBtns.appendChild(fEdit);
                    fBtns.appendChild(fDel);
                    fRow.appendChild(fName);
                    fRow.appendChild(fBtns);

                    const fEditArea = document.createElement('div');
                    fEditArea.style.cssText = 'display:none; margin-top:4px;';
                    const fTextarea = document.createElement('textarea');
                    fTextarea.value = f.content || '';
                    fTextarea.style.cssText = 'width:100%; height:120px; font-size:0.9em; box-sizing:border-box; resize:vertical;';
                    const fSaveBtn = document.createElement('button');
                    fSaveBtn.textContent = '保存';
                    fSaveBtn.style.cssText = 'margin-top:4px; margin-right:4px; font-size:0.85em;';
                    const fCancelBtn = document.createElement('button');
                    fCancelBtn.textContent = 'キャンセル';
                    fCancelBtn.style.cssText = 'margin-top:4px; font-size:0.85em;';
                    fEditArea.appendChild(fTextarea);
                    fEditArea.appendChild(document.createElement('br'));
                    fEditArea.appendChild(fSaveBtn);
                    fEditArea.appendChild(fCancelBtn);

                    fEdit.onclick = () => {
                        fTextarea.value = f.content || '';
                        fEditArea.style.display = fEditArea.style.display === 'none' ? 'block' : 'none';
                    };
                    fCancelBtn.onclick = () => { fEditArea.style.display = 'none'; };
                    fSaveBtn.onclick = async () => {
                        const projectId = parseInt(fSaveBtn.closest('[data-pid]')?.dataset.pid || fEdit.dataset.projectId, 10);
                        const project = projectsCache.find(proj => proj.id === parseInt(fEdit.dataset.projectId, 10));
                        if (!project) return;
                        const idx = (project.knowledgeFiles || []).findIndex(kf => kf.name === f.name);
                        if (idx >= 0) {
                            project.knowledgeFiles[idx] = { ...project.knowledgeFiles[idx], content: fTextarea.value };
                            await window.dbUtils.updateProject(project);
                            if (window.state.activeProjectId === project.id) {
                                window.state.activeProjectKnowledge = project.knowledgeFiles;
                            }
                            f.content = fTextarea.value;
                            fEditArea.style.display = 'none';
                        }
                    };

                    fDiv.appendChild(fRow);
                    fDiv.appendChild(fEditArea);
                    kList.appendChild(fDiv);
                });
                kSection.appendChild(kList);
                div.appendChild(kSection);
                listContainer.appendChild(div);
            });

            listContainer.querySelectorAll('.delete-project-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('このプロジェクトを削除しますか？\n(紐づいているチャットデータ自体は削除されず、「すべてのプロジェクト」に表示されます)')) {
                        await window.dbUtils.deleteProject(parseInt(btn.dataset.id, 10));
                        await loadProjects();
                        if (window.state.activeProjectId === parseInt(btn.dataset.id, 10)) {
                            headerSelect.value = "";
                            headerSelect.dispatchEvent(new Event('change'));
                        }
                    }
                };
            });


            async function extractPdfText(file) {
                if (!window.pdfjsLib) {
                    await new Promise((resolve, reject) => {
                        const s = document.createElement('script');
                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                        s.onload = resolve;
                        s.onerror = reject;
                        document.head.appendChild(s);
                    });
                    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
                        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                }
                const buf = await file.arrayBuffer();
                const pdf = await window.pdfjsLib.getDocument({ data: buf }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const pageText = content.items.map(item => item.str).join(' ');
                    text += `[Page ${i}]\n${pageText}\n\n`;
                }
                return text.trim();
            }

            listContainer.querySelectorAll('.add-knowledge-btn').forEach(btn => {
                btn.onclick = () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.txt,.md,.csv,.json,.js,.ts,.jsx,.tsx,.py,.rb,.go,.rs,.java,.c,.cpp,.h,.html,.css,.xml,.yaml,.yml,.toml,.log,.sh,.pdf';
                    input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
                    document.body.appendChild(input);
                    input.onchange = async (e) => {
                        document.body.removeChild(input);
                        const projectId = parseInt(btn.dataset.id, 10);
                        const project = projectsCache.find(p => p.id === projectId);
                        if (!project) return;
                        const knowledgeFiles = project.knowledgeFiles ? [...project.knowledgeFiles] : [];
                        for (const file of Array.from(e.target.files)) {
                            let content;
                            try {
                                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                                    content = await extractPdfText(file);
                                } else {
                                    content = await file.text();
                                }
                            } catch (err) {
                                alert(`${file.name} の読み込みに失敗しました: ${err.message}`);
                                continue;
                            }
                            const idx = knowledgeFiles.findIndex(f => f.name === file.name);
                            const entry = { name: file.name, content, addedAt: Date.now() };
                            if (idx >= 0) knowledgeFiles[idx] = entry;
                            else knowledgeFiles.push(entry);
                        }
                        project.knowledgeFiles = knowledgeFiles;
                        await window.dbUtils.updateProject(project);
                        if (window.state.activeProjectId === projectId) {
                            window.state.activeProjectKnowledge = knowledgeFiles;
                        }
                        await loadProjects();
                    };
                    input.click();
                };
            });

            listContainer.querySelectorAll('.delete-knowledge-btn').forEach(btn => {
                btn.onclick = async () => {
                    const projectId = parseInt(btn.dataset.projectId, 10);
                    const project = projectsCache.find(p => p.id === projectId);
                    if (!project) return;
                    project.knowledgeFiles = (project.knowledgeFiles || []).filter(f => f.name !== btn.dataset.fileName);
                    await window.dbUtils.updateProject(project);
                    if (window.state.activeProjectId === projectId) {
                        window.state.activeProjectKnowledge = project.knowledgeFiles;
                    }
                    await loadProjects();
                };
            });
        }

        headerSelect.addEventListener('change', async (e) => {
            if (e.target.value === 'manage') {
                e.target.value = window.state.activeProjectId || "";
                dialog.showModal();
                return;
            }
            window.state.activeProjectId = e.target.value ? parseInt(e.target.value, 10) : null;
            // 選択プロジェクトをリロード後も復元できるよう保存
            window.dbUtils.saveSetting('activeProjectId', window.state.activeProjectId).catch(() => {});
            const switchedP = window.state.activeProjectId ? projectsCache.find(p => p.id === window.state.activeProjectId) : null;
            window.state.activeProjectKnowledge = switchedP ? (switchedP.knowledgeFiles || []) : [];
            if (window.uiUtils && typeof window.uiUtils.loadHistoryList === 'function') {
                await window.uiUtils.loadHistoryList();
            }

            // If we are currently on a new/empty chat, apply project prompt immediately
            if (!window.state.currentChatId && window.appLogic && window.appLogic.startNewChat) {
                window.appLogic.startNewChat();
            }
        });

        const createBtn = document.getElementById('create-project-btn');
        if (createBtn) {
            createBtn.onclick = async () => {
                const nameInput = document.getElementById('new-project-name');
                const promptInput = document.getElementById('new-project-prompt');
                const modelInput = document.getElementById('new-project-model');
                
                if (!nameInput.value.trim()) {
                    alert('プロジェクト名を入力してください。');
                    return;
                }
                
                const newProject = {
                    name: nameInput.value.trim(),
                    systemPrompt: promptInput.value.trim(),
                    defaultModel: modelInput ? modelInput.value : '',
                    createdAt: Date.now()
                };
                
                await window.dbUtils.addProject(newProject);
                nameInput.value = '';
                promptInput.value = '';
                if(modelInput) modelInput.value = '';
                
                await loadProjects();
            };
        }

        const closeBtn = document.getElementById('close-project-dialog-btn');
        if (closeBtn) {
            closeBtn.onclick = () => dialog.close();
        }
        
        const mainSelect = document.getElementById('model-name');
        const projModelSelect = document.getElementById('new-project-model');
        if (mainSelect && projModelSelect) {
            const syncModelOpts = () => {
                const currentVal = projModelSelect.value;
                projModelSelect.innerHTML = '<option value="">(グローバル設定に従う)</option>' + mainSelect.innerHTML;
                projModelSelect.value = currentVal;
            };
            new MutationObserver(syncModelOpts).observe(mainSelect, { childList: true, subtree: true });
            setTimeout(syncModelOpts, 1000);
        }

        // リロード後に選択プロジェクトを復元
        if (window.dbUtils && window.dbUtils.getSetting) {
            const savedProject = await window.dbUtils.getSetting('activeProjectId');
            if (savedProject && savedProject.value != null) {
                window.state.activeProjectId = savedProject.value;
            }
        }

        await loadProjects();

        // プロジェクトが選択されている場合はナレッジとプロンプトを反映
        if (window.state.activeProjectId) {
            const activeP = projectsCache.find(p => p.id === window.state.activeProjectId);
            if (activeP) {
                window.state.activeProjectKnowledge = activeP.knowledgeFiles || [];
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initProjectManager, 800));
    } else {
        setTimeout(initProjectManager, 800);
    }
})();

/* =========================================================================
 * Phase 6 Hook: Multi-Provider (OpenAI, Anthropic) & Custom Models
 * ========================================================================= */
(()=>{

    // 1. Initial UI setup & Custom Models Rendering (Phase 6 + 7 Accordion and Textareas)
    const initPhase7 = () => {
        const customGroup = document.getElementById('user-defined-models-group');
        const mainSelect = document.getElementById('model-name');

        // Fetch All Models Button
        const fetchModelsBtn = document.getElementById('fetch-all-models-btn');
        if (fetchModelsBtn) {
            fetchModelsBtn.addEventListener('click', async () => {
                fetchModelsBtn.disabled = true;
                fetchModelsBtn.textContent = '取得中...';
                const results = [];

                function mergeModels(provider, newModels) {
                    if (!newModels.length) return;
                    if (!state.settings.fetchedModels) state.settings.fetchedModels = {};
                    // Replace (not merge) so deprecated models disappear automatically
                    state.settings.fetchedModels[provider] = newModels;
                }

                async function fetchOpenAICompat(url, apiKey, provider, filter) {
                    try {
                        const r = await fetch(url, { headers: { 'Authorization': `Bearer ${apiKey}` } });
                        if (!r.ok) { results.push(`${provider}: HTTP ${r.status}`); return; }
                        const d = await r.json();
                        const models = (d.data || []).map(m => m.id).filter(id => id && (!filter || filter(id)));
                        mergeModels(provider, models);
                        results.push(`${provider}: ${models.length}件`);
                    } catch(e) { results.push(`${provider}: エラー (${e.message})`); }
                }

                // Gemini
                if (state.settings.apiKey) {
                    try {
                        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${state.settings.apiKey}&pageSize=100`);
                        if (r.ok) {
                            const d = await r.json();
                            const models = (d.models || [])
                                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                                .map(m => m.name.replace('models/', ''))
                                .filter(id => id.includes('gemini'));
                            mergeModels('gemini', models);
                            results.push(`Gemini: ${models.length}件`);
                        } else { results.push(`Gemini: HTTP ${r.status}`); }
                    } catch(e) { results.push(`Gemini: エラー`); }
                }

                // Anthropic
                if (state.settings.anthropicApiKey) {
                    try {
                        const r = await fetch('https://api.anthropic.com/v1/models?limit=100', {
                            headers: { 'x-api-key': state.settings.anthropicApiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
                        });
                        if (r.ok) {
                            const d = await r.json();
                            const models = (d.data || []).map(m => m.id);
                            mergeModels('anthropic', models);
                            results.push(`Anthropic: ${models.length}件`);
                        } else { results.push(`Anthropic: HTTP ${r.status}`); }
                    } catch(e) { results.push(`Anthropic: エラー`); }
                }

                // OpenAI
                if (state.settings.openaiApiKey) {
                    // gpt-数字 で始まるテキストモデルのみ表示（gpt-image-* / gpt-realtime-* / gpt-audio-* や
                    // gpt-4o-audio-preview 等の音声・画像系バリアントでドロップダウンが溢れるのを防ぐ）
                    await fetchOpenAICompat('https://api.openai.com/v1/models', state.settings.openaiApiKey, 'openai',
                        id => /^(gpt-\d|o\d|chatgpt)/i.test(id) && !/(audio|realtime|image|tts|transcribe)/i.test(id));
                }

                // OpenAI-compatible providers
                const compatList = [
                    { key: 'groq',     url: 'https://api.groq.com/openai/v1/models',    apiKey: state.settings.groqApiKey },
                    { key: 'deepseek', url: 'https://api.deepseek.com/v1/models',        apiKey: state.settings.deepseekApiKey },
                    { key: 'xai',      url: 'https://api.x.ai/v1/models',               apiKey: state.settings.xaiApiKey },
                    { key: 'mistral',  url: 'https://api.mistral.ai/v1/models',          apiKey: state.settings.mistralApiKey },
                ];
                for (const p of compatList) {
                    if (p.apiKey) await fetchOpenAICompat(p.url, p.apiKey, p.key, null);
                }

                // Persist fetchedModels and refresh dropdown
                if (window.dbUtils && typeof window.dbUtils.saveSetting === 'function') {
                    window.dbUtils.saveSetting('fetchedModels', state.settings.fetchedModels).catch(() => {});
                }
                const apiProvSelect = document.getElementById('api-provider');
                if (apiProvSelect) apiProvSelect.dispatchEvent(new Event('change'));

                fetchModelsBtn.disabled = false;
                fetchModelsBtn.textContent = '🔄 全プロバイダーの最新モデルを取得';
                if (results.length) {
                    alert('モデル取得完了:\n' + results.join('\n'));
                } else {
                    alert('APIキーが設定されているプロバイダーが見つかりませんでした。');
                }
            });
        }

        // Save Settings Button
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                // Ensure custom fields are synced to active profile before saving
                if (window.state.activeProfile) {
                    window.state.activeProfile.settings.openaiApiKey = state.settings.openaiApiKey;
                    window.state.activeProfile.settings.anthropicApiKey = state.settings.anthropicApiKey;
                    window.state.activeProfile.settings.customModelsText = state.settings.customModelsText;
                    
                    if (window.dbUtils && typeof window.dbUtils.updateProfile === 'function') {
                        await window.dbUtils.updateProfile(window.state.activeProfile);
                    }
                }

                if (window.dbUtils && typeof window.dbUtils.saveSettings === 'function') {
                    await window.dbUtils.saveSettings(window.state.settings);
                }
                
                // Show a brief visual confirmation without alert that requires interaction
                const originalText = saveBtn.innerText;
                saveBtn.innerText = "✓ 保存しました";
                saveBtn.style.backgroundColor = "#1a6b7a";
                setTimeout(() => {
                    saveBtn.innerText = "設定を保存";
                    saveBtn.style.backgroundColor = "#2196a8";
                }, 2000);
            });
        }

        const persistCustomSetting = async (key, value) => {
            state.settings[key] = value;
            if (window.state.activeProfile) {
                window.state.activeProfile.settings[key] = value;
                if (window.dbUtils && typeof window.dbUtils.updateProfile === 'function') {
                    await window.dbUtils.updateProfile(window.state.activeProfile);
                }
            }
            if (window.dbUtils && typeof window.dbUtils.saveSettings === 'function') {
                await window.dbUtils.saveSettings(window.state.settings);
            }
        };

        const apiProvSelect = document.getElementById('api-provider');
        if(apiProvSelect) {
            const updateKeyVisibility = () => {
                const p = apiProvSelect.value;
                ['gemini', 'zai', 'openrouter', 'bedrock', 'openai', 'anthropic', 'groq', 'deepseek', 'xai', 'mistral', 'sakana'].forEach(prov => {
                    document.getElementById(`${prov}-api-key-container`)?.classList.toggle('hidden', p !== prov);
                });
            };
            apiProvSelect.addEventListener('change', updateKeyVisibility);
            setTimeout(updateKeyVisibility, 500);
        }

        const providers = ['gemini', 'zai', 'openrouter', 'bedrock', 'openai', 'anthropic', 'groq', 'deepseek', 'xai', 'mistral', 'sakana'];
        const defaultModelLists = {
            gemini: 'gemini-2.0-flash, gemini-2.0-flash-lite-preview-02-05, gemini-2.0-pro-exp-02-05, gemini-1.5-pro, gemini-1.5-flash',
            openai: 'gpt-4o, gpt-4o-mini, o1, o1-mini, o3-mini',
            anthropic: 'claude-3-7-sonnet-20250219, claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022',
            groq: 'llama-3.3-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768, gemma2-9b-it',
            deepseek: 'deepseek-chat, deepseek-reasoner',
            xai: 'grok-3, grok-3-mini, grok-2-1212',
            mistral: 'mistral-large-latest, mistral-small-latest, open-mistral-nemo',
            zai: 'deepseek-v3, deepseek-r1',
            openrouter: 'deepseek/deepseek-chat, deepseek/deepseek-r1, google/gemini-2.0-flash-001, anthropic/claude-3.5-sonnet',
            bedrock: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0, us.anthropic.claude-3-5-haiku-20241022-v1:0',
            sakana: 'fugu, fugu-ultra'
        };

        state.settings.customModelsText = state.settings.customModelsText || {};
        state.settings.fetchedModels = state.settings.fetchedModels || {};
        state.settings.lastModelPerProvider = state.settings.lastModelPerProvider || {};
        // Fill defaults for empty providers and persist
        let defaultsApplied = false;
        providers.forEach(prov => {
            if (!state.settings.customModelsText[prov] && defaultModelLists[prov]) {
                state.settings.customModelsText[prov] = defaultModelLists[prov];
                defaultsApplied = true;
            }
        });

        if (defaultsApplied && window.state.activeProfile) {
            window.state.activeProfile.settings.customModelsText = state.settings.customModelsText;
            if (window.dbUtils && typeof window.dbUtils.updateProfile === 'function') {
                window.dbUtils.updateProfile(window.state.activeProfile);
            }
        }

        // Migrate old array logic to textareas if necessary
        if (state.settings.customModels && Array.isArray(state.settings.customModels)) {
            state.settings.customModels.forEach(cm => {
                if (cm && cm.id && cm.provider) {
                    const existing = state.settings.customModelsText[cm.provider] || '';
                    if (!existing.includes(cm.id)) {
                        state.settings.customModelsText[cm.provider] = existing ? `${existing}, ${cm.id}` : cm.id;
                    }
                }
            });
            delete state.settings.customModels;
            if (window.dbUtils && typeof window.dbUtils.saveSettings === 'function') window.dbUtils.saveSettings(window.state.settings);
        }

        const renderCustomModels = () => {
            if(customGroup) customGroup.innerHTML = '';

            // Rebuild the unified custom models list mapped to UI dropdown
            let addedCount = 0;
            providers.forEach(prov => {
                const text = state.settings.customModelsText[prov] || '';
                const ids = text.split(',').map(s => s.trim()).filter(Boolean);
                ids.forEach(id => {
                    if (customGroup) {
                        const opt = document.createElement('option');
                        opt.value = id;
                        opt.textContent = `${id} (${prov})`;
                        // We attach dataset provider because we need to know the origin when selected
                        opt.dataset.provider = prov;
                        opt.dataset.userDefined = 'true';
                        customGroup.appendChild(opt);
                        addedCount++;
                    }
                });
            });
            // updateUserModelOptions() が旧 additionalModels 設定を見て optgroup を
            // disabled にしたまま残すことがあるため、ここで明示的に有効/無効を再設定する。
            // （これをしないと、追加したモデルがグレーアウトして選択できない）
            if (customGroup) customGroup.disabled = addedCount === 0;
        };

        providers.forEach(prov => {
            const textarea = document.getElementById(`${prov}-custom-models`);
            if (textarea) {
                // Restore from state
                if (state.settings.customModelsText[prov]) {
                    textarea.value = state.settings.customModelsText[prov];
                }
                
                // Update state on change
                textarea.addEventListener('change', async (e) => {
                    state.settings.customModelsText[prov] = e.target.value;
                    await persistCustomSetting('customModelsText', state.settings.customModelsText);
                    renderCustomModels();
                    apiProvSelect?.dispatchEvent(new Event('change'));
                });
            }
        });

        if(mainSelect && apiProvSelect) {
            mainSelect.addEventListener('change', async (e) => {
                const selectedOpt = mainSelect.options[mainSelect.selectedIndex];
                const newModel = mainSelect.value;
                
                let provider = null;
                if (selectedOpt && selectedOpt.dataset.provider) {
                    provider = selectedOpt.dataset.provider;
                } else if (newModel.startsWith('gemini-')) {
                    provider = 'gemini';
                }

                if (provider && state.settings.apiProvider !== provider) {
                    state.settings.apiProvider = provider;
                    apiProvSelect.value = provider;
                    apiProvSelect.dispatchEvent(new Event('change'));
                    await persistCustomSetting('apiProvider', provider);
                }
            });
        }

        renderCustomModels();
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initPhase7, 1200));
    } else {
        setTimeout(initPhase7, 1200);
    }
})();

