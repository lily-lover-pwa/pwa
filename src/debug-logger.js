// デバッグログ機能（Phase 1 で app.js から抽出）。挙動は不変。
import { state } from './state.js';

export const DebugLogger = {
    logs: [],
    MAX_LOGS: 500,
    originalConsole: {},
    isInitialized: false,

    init() {
        if (state.settings.debugMode) {
            this._patchConsole();
        } else {
            this._unpatchConsole();
        }
        this.isInitialized = true;
        console.log(
            `[DebugLogger] 初期化完了。デバッグモード: ${state.settings.debugMode ? 'ON' : 'OFF'}`
        );
    },

    _patchConsole() {
        if (this.originalConsole.log) return; // 既にパッチ済み

        const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'];
        consoleMethods.forEach((method) => {
            this.originalConsole[method] = console[method];
            console[method] = (...args) => {
                // ログを内部配列に保存
                this.addLog(method, args);
                // 元のコンソールメソッドを呼び出す
                this.originalConsole[method].apply(console, args);
            };
        });
    },

    _unpatchConsole() {
        if (!this.originalConsole.log) return; // パッチされていない

        Object.keys(this.originalConsole).forEach((method) => {
            console[method] = this.originalConsole[method];
        });
        this.originalConsole = {};
    },

    addLog(type, args) {
        // 循環参照を避けるための簡易的なシリアライザ
        const serialize = (obj) => {
            try {
                // DOM要素や特殊なオブジェクトは文字列に変換
                if (obj instanceof HTMLElement) return `[HTMLElement: ${obj.tagName}]`;
                if (obj instanceof Event) return `[Event: ${obj.type}]`;
                // 通常のオブジェクトはJSONに変換
                return JSON.stringify(
                    obj,
                    (key, value) => {
                        if (typeof value === 'object' && value !== null) {
                            if (value instanceof Blob) return '[Blob]';
                            if (value instanceof File) return `[File: ${value.name}]`;
                        }
                        return value;
                    },
                    2
                );
            } catch (e) {
                return '[Unserializable Object]';
            }
        };

        this.logs.push({
            type,
            timestamp: new Date(),
            args: args.map((arg) =>
                typeof arg === 'object' && arg !== null ? serialize(arg) : arg
            ),
        });

        // ログが最大数を超えたら古いものから削除
        if (this.logs.length > this.MAX_LOGS) {
            this.logs.shift();
        }
    },

    getLogs() {
        return this.logs;
    },

    clearLogs() {
        this.logs = [];
        console.log('[DebugLogger] ログがクリアされました。');
    },
};
