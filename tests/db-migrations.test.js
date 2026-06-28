import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { applyDbMigrations } from '../src/db-migrations.js';
import { DB_VERSION } from '../src/constants.js';

// applyDbMigrations を onupgradeneeded に配線して DB を開くヘルパー。
function openWithMigrations(name, version, deps = {}) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name, version);
        req.onupgradeneeded = (event) => {
            applyDbMigrations(event.target.result, event.target.transaction, event, deps);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('blocked'));
    });
}

function txGetAll(db, store) {
    return new Promise((resolve, reject) => {
        const r = db.transaction(store, 'readonly').objectStore(store).getAll();
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
    });
}

function txGet(db, store, key) {
    return new Promise((resolve, reject) => {
        const r = db.transaction(store, 'readonly').objectStore(store).get(key);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
    });
}

function txWrite(db, store, items) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        const os = tx.objectStore(store);
        for (const it of items) os.put(it);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

const EXPECTED_STORES = [
    'settings', 'chats', 'profiles', 'image_assets', 'projects',
    'image_store', 'memory_store',
    'profiles_temp', 'chats_temp', 'settings_temp', 'image_store_temp', 'image_assets_temp', 'memory_store_temp',
    'projects_temp',
];

let dbNameCounter = 0;
function uniqueName() {
    return `MigTest_${Date.now()}_${dbNameCounter++}`;
}

describe('applyDbMigrations', () => {
    it('新規作成（oldVersion 0 → 現行 DB_VERSION）で全ストアとchatインデックスが作られる', async () => {
        const name = uniqueName();
        const db = await openWithMigrations(name, DB_VERSION);

        const storeNames = Array.from(db.objectStoreNames);
        for (const expected of EXPECTED_STORES) {
            expect(storeNames).toContain(expected);
        }

        // chats ストアのインデックス
        const tx = db.transaction('chats', 'readonly');
        const idxNames = Array.from(tx.objectStore('chats').indexNames);
        expect(idxNames).toContain('updatedAtIndex');
        expect(idxNames).toContain('createdAtIndex');
        db.close();
    });

    it('DB_VERSION は 15（テストが想定するスキーマと一致）', () => {
        expect(DB_VERSION).toBe(15);
    });

    it('v9 → 現行: 既存設定がデフォルトプロファイルへ移行され、設定ストアが整理される', async () => {
        const name = uniqueName();

        // --- 旧 v9 相当の DB を用意（settings ストアに旧設定を投入） ---
        const v9db = await new Promise((resolve, reject) => {
            const req = indexedDB.open(name, 9);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                db.createObjectStore('settings', { keyPath: 'key' });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        await txWrite(v9db, 'settings', [
            { key: 'apiKey', value: 'KEY123' },       // プロファイルへ移送される
            { key: 'temperature', value: 0.9 },        // プロファイルへ移送される
            { key: 'someNonProfileKey', value: 'keepme' }, // 設定に残る
        ]);
        v9db.close();

        // --- 現行バージョンへアップグレード ---
        let imageMigrations = 0;
        const db = await openWithMigrations(name, DB_VERSION, {
            settingsDefaults: { topK: 40 },
            migrateImageData: () => { imageMigrations++; },
        });

        // プロファイルが1件作られ、移送対象キーが入っている
        const profiles = await txGetAll(db, 'profiles');
        expect(profiles).toHaveLength(1);
        expect(profiles[0].name).toBe('デフォルトプロファイル');
        expect(profiles[0].settings.apiKey).toBe('KEY123');
        expect(profiles[0].settings.temperature).toBe(0.9);
        // 旧設定に無いキーは settingsDefaults から補完される
        expect(profiles[0].settings.topK).toBe(40);

        // 設定ストア: 移送キーは削除、非対象キーは保持、activeProfileId が設定される
        const apiKeyRow = await txGet(db, 'settings', 'apiKey');
        expect(apiKeyRow).toBeUndefined();
        const keepRow = await txGet(db, 'settings', 'someNonProfileKey');
        expect(keepRow?.value).toBe('keepme');
        const activeRow = await txGet(db, 'settings', 'activeProfileId');
        expect(activeRow?.value).toBe(profiles[0].id);

        // v11 移行（画像データ移行コールバック）が呼ばれている
        expect(imageMigrations).toBe(1);

        db.close();
    });

    it('既存データを保持したまま新ストアが追加される（v12 → 現行）', async () => {
        const name = uniqueName();

        // v12 相当: settings/chats/profiles/image_assets/image_store/memory_store を作り、データ投入
        const v12db = await new Promise((resolve, reject) => {
            const req = indexedDB.open(name, 12);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                db.createObjectStore('settings', { keyPath: 'key' });
                const chats = db.createObjectStore('chats', { keyPath: 'id', autoIncrement: true });
                chats.createIndex('updatedAtIndex', 'updatedAt', { unique: false });
                chats.createIndex('createdAtIndex', 'createdAt', { unique: false });
                db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
                db.createObjectStore('image_assets', { keyPath: 'name' });
                db.createObjectStore('image_store', { keyPath: 'id' });
                db.createObjectStore('memory_store', { keyPath: 'profileId' });
                // activeProfileId を入れておけば v10 移行はスキップ（settings は1件のみ・移送対象外）
                db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        await txWrite(v12db, 'settings', [{ key: 'activeProfileId', value: 7 }]);
        await txWrite(v12db, 'chats', [{ id: 1, title: '既存チャット', updatedAt: 100, createdAt: 50 }]);
        await txWrite(v12db, 'memory_store', [{ profileId: 7, items: ['記憶A'] }]);
        v12db.close();

        const db = await openWithMigrations(name, DB_VERSION, { migrateImageData: () => {} });

        // 新ストア（temp 群・projects_temp）が追加されている
        const storeNames = Array.from(db.objectStoreNames);
        expect(storeNames).toContain('projects_temp');
        expect(storeNames).toContain('chats_temp');
        expect(storeNames).toContain('memory_store_temp');

        // 既存データは保持されている
        const chats = await txGetAll(db, 'chats');
        expect(chats).toHaveLength(1);
        expect(chats[0].title).toBe('既存チャット');
        const mem = await txGet(db, 'memory_store', 7);
        expect(mem?.items).toEqual(['記憶A']);
        // activeProfileId が1件だけ（移送対象外キーなので v10 はプロファイルを作らない）
        const profiles = await txGetAll(db, 'profiles');
        expect(profiles).toHaveLength(0);

        db.close();
    });
});
