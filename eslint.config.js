import js from '@eslint/js';
import globals from 'globals';

/**
 * ESLint 設定。
 * 目的は「既存コードの問題を可視化する」こと。レガシーコードを今すぐ全て直すのが
 * 目的ではないため、ノイズの多いスタイル系ルールは warn に落としている。
 * リファクタリングの進行に合わせて段階的に error へ引き上げる想定。
 *
 * Phase 1 以降、ソースは src/ 配下の ESM モジュール。ルート直下の app.js は
 * esbuild が生成する配信用バンドル（自動生成物）なので lint 対象外にする。
 */
export default [
    // 第三者ライブラリ（vendored）・生成物・依存物は対象外
    {
        ignores: [
            'node_modules/**',
            'marked.js',
            'prism.js',
            'app.js', // ← src/main.js から生成されるバンドル（自動生成物）
            'coverage/**',
            '.eslint-report.json',
        ],
    },

    js.configs.recommended,

    // ブラウザ側スクリプト（アプリ本体・補助スクリプト = src/ 配下の ESM）
    {
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                // 外部ライブラリ（index.html で読み込む / CDN から動的 import）
                marked: 'readonly',
                DOMPurify: 'readonly',
                html2canvas: 'readonly',
                Prism: 'readonly',
                JSZip: 'readonly',
                GoogleGenAI: 'readonly',
            },
        },
        rules: {
            // バグに直結するものは error のまま
            'no-undef': 'error',
            'no-unsafe-negation': 'error',
            'no-unreachable': 'error',
            'no-dupe-keys': 'error',
            'no-dupe-args': 'error',
            // 蓄積した負債は warn で可視化（段階的に解消）
            'no-unused-vars': ['warn', { args: 'none', vars: 'all' }],
            'no-empty': ['warn', { allowEmptyCatch: false }],
            'no-constant-condition': 'warn',
            'no-cond-assign': 'warn',
            'no-fallthrough': 'warn',
            'no-prototype-builtins': 'off',
        },
    },

    // Service Worker（クラシックスクリプト）
    {
        files: ['sw.js'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'script',
            globals: { ...globals.serviceworker, ...globals.browser },
        },
    },

    // Node 側（設定・ビルド・テスト）
    {
        files: ['*.config.js', '*.mjs', 'tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: { ...globals.node, ...globals.browser },
        },
    },
];
