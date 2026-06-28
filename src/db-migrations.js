// dbUtils.openDB() の onupgradeneeded から抽出した IndexedDB マイグレーション。
// 目的: アプリ本体グラフ（app.js 等）に依存せず、fake-indexeddb でテスト可能にすること。
// 挙動は抽出前と完全に同一。スキーマ定義のみテーブル化して可読性を上げている。
//
// 詳細なスキーマ/バージョン履歴は docs/db-schema.md を参照。
import { CHATS_STORE, CHAT_CREATEDAT_INDEX, CHAT_UPDATEDAT_INDEX, IMAGE_STORE, PROFILES_STORE, PROJECTS_STORE, SETTINGS_STORE } from './constants.js';

// バージョンに依存せず常に存在すべきストア（既存なら作成しない冪等ガード付き）。
// 旧コードの「既存ストアの確認と作成」ブロックと等価。
const BASE_STORES = [
    { name: SETTINGS_STORE, options: { keyPath: 'key' } },
    {
        name: CHATS_STORE,
        options: { keyPath: 'id', autoIncrement: true },
        indexes: [
            { name: CHAT_UPDATEDAT_INDEX, keyPath: 'updatedAt', options: { unique: false } },
            { name: CHAT_CREATEDAT_INDEX, keyPath: 'createdAt', options: { unique: false } },
        ],
    },
    { name: PROFILES_STORE, options: { keyPath: 'id', autoIncrement: true } },
    { name: 'image_assets', options: { keyPath: 'name' } },
    // Phase 4: プロジェクト機能のストア
    { name: PROJECTS_STORE, options: { keyPath: 'id', autoIncrement: true } },
];

// v10 移行で「設定ストアからプロファイルへ移送する」設定キー群。
const PROFILE_SETTING_KEYS = [
    'apiProvider', 'apiKey', 'zaiApiKey', 'bedrockAccessKey', 'bedrockSecretKey', 'bedrockRegion',
    'modelName', 'systemPrompt', 'temperature', 'maxTokens', 'topK', 'topP',
    'presencePenalty', 'frequencyPenalty', 'thinkingBudget', 'includeThoughts',
    'enableThoughtTranslation', 'thoughtTranslationModel', 'dummyUser',
    'applyDummyToProofread', 'applyDummyToTranslate', 'dummyModel', 'reverseDummyOrder', 'concatDummyModel',
    'additionalModels', 'enterToSend', 'historySortOrder', 'darkMode', 'fontFamily',
    'hideSystemPromptInChat', 'enableSwipeNavigation', 'enableAutoRetry', 'maxRetries',
    'useFixedRetryDelay', 'fixedRetryDelaySeconds', 'maxBackoffDelaySeconds',
    'enableProofreading', 'proofreadingModelName', 'proofreadingSystemInstruction',
    'geminiEnableGrounding', 'geminiEnableFunctionCalling', 'googleSearchApiKey',
    'googleSearchEngineId', 'messageOpacity', 'overlayOpacity', 'headerColor',
    'allowPromptUiChanges', 'forceFunctionCalling', 'anthropicEffort',
];

function createStore(db, def) {
    if (db.objectStoreNames.contains(def.name)) return;
    const store = db.createObjectStore(def.name, def.options);
    for (const idx of def.indexes || []) {
        store.createIndex(idx.name, idx.keyPath, idx.options);
    }
}

/**
 * IndexedDB の onupgradeneeded 本体。
 * @param {IDBDatabase} db - event.target.result
 * @param {IDBTransaction} transaction - event.target.transaction（versionchange トランザクション）
 * @param {{oldVersion:number, newVersion:number}} event - バージョン情報
 * @param {object} deps
 * @param {object} deps.settingsDefaults - v10 移行で未設定キーの既定値に使う（旧: state.settings）
 * @param {Function} deps.migrateImageData - v11 移行完了後に呼ぶ画像データ移行（旧: appLogic.migrateImageData）
 */
export function applyDbMigrations(db, transaction, event, deps = {}) {
    const { settingsDefaults = {}, migrateImageData = () => {} } = deps;
    console.log(`[DB Migration] IndexedDBをバージョン ${event.oldVersion} から ${event.newVersion} へアップグレード中...`);

    // --- 既存ストアの確認と作成 ---
    for (const def of BASE_STORES) {
        createStore(db, def);
    }

    // v10への移行処理 (プロファイル機能導入)
    if (event.oldVersion < 10) {
        console.log("[DB Migration] v10へのデータ移行処理を実行します。");
        const settingsStore = transaction.objectStore(SETTINGS_STORE);
        const profilesStore = transaction.objectStore(PROFILES_STORE);

        const getAllSettingsReq = settingsStore.getAll();

        getAllSettingsReq.onsuccess = () => {
            const oldSettingsArray = getAllSettingsReq.result;

            if (oldSettingsArray.length > 0) {
                console.log("[DB Migration] 既存の設定を検出しました。新しいプロファイル構造に移行します...");

                const oldSettingsObject = {};
                oldSettingsArray.forEach(item => {
                    oldSettingsObject[item.key] = item.value;
                });

                const newProfileSettings = {};
                PROFILE_SETTING_KEYS.forEach(key => {
                    newProfileSettings[key] = oldSettingsObject[key] !== undefined ? oldSettingsObject[key] : settingsDefaults[key];
                });

                const defaultProfile = {
                    name: "デフォルトプロファイル",
                    icon: null,
                    createdAt: Date.now(),
                    settings: newProfileSettings
                };

                const addProfileReq = profilesStore.add(defaultProfile);

                addProfileReq.onsuccess = (addEvent) => {
                    const newProfileId = addEvent.target.result;
                    console.log(`[DB Migration] デフォルトプロファイルを生成しました (ID: ${newProfileId})`);

                    PROFILE_SETTING_KEYS.forEach(key => {
                        settingsStore.delete(key);
                    });

                    settingsStore.put({ key: 'activeProfileId', value: newProfileId });
                    console.log(`[DB Migration] SETTINGS_STOREを整理し、activeProfileIdを設定しました。`);
                };
            }
        };
    }

    // v11へのアップグレード処理 (画像ストア追加)
    if (event.oldVersion < 11) {
        console.log("[DB Migration] v11へのアップグレード: image_storeを作成します。");
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
            db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
        }
        transaction.oncomplete = () => {
            console.log("[DB Migration] スキーマ更新完了。データ移行処理を開始します。");
            migrateImageData();
        };
    }

    if (event.oldVersion < 12) {
        console.log("[DB Migration] v12へのアップグレード: memory_storeを作成します。");
        if (!db.objectStoreNames.contains('memory_store')) {
            db.createObjectStore('memory_store', { keyPath: 'profileId' });
        }
    }

    // v13へのアップグレード: 安全なインポート用の一時ストアを追加
    if (event.oldVersion < 13) {
        console.log("[DB Migration] v13へのアップグレード: 安全なインポート用の一時ストアを作成します。");
        const tempStores = [
            { name: `${PROFILES_STORE}_temp`, options: { keyPath: 'id' } },
            { name: `${CHATS_STORE}_temp`, options: { keyPath: 'id' } },
            { name: `${SETTINGS_STORE}_temp`, options: { keyPath: 'key' } },
            { name: `${IMAGE_STORE}_temp`, options: { keyPath: 'id' } },
            { name: 'image_assets_temp', options: { keyPath: 'name' } },
            { name: 'memory_store_temp', options: { keyPath: 'profileId' } }
        ];

        tempStores.forEach(storeInfo => {
            if (!db.objectStoreNames.contains(storeInfo.name)) {
                db.createObjectStore(storeInfo.name, storeInfo.options);
                console.log(`[DB Migration] Temporary store '${storeInfo.name}' created.`);
            }
        });
    }

    if (event.oldVersion < 15) {
        console.log("[DB Migration] v15へのアップグレード: projects_tempストアを作成します。");
        if (!db.objectStoreNames.contains('projects_temp')) {
            db.createObjectStore('projects_temp', { keyPath: 'id' });
            console.log("[DB Migration] 'projects_temp' store created.");
        }
    }
}
