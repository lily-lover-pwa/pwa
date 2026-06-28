// esbuild ビルドスクリプト（Phase 1）。
// src/main.js を起点に、配信用の単一ファイル app.js を生成する。
//
// 方針:
//  - format: 'iife' でクラシックスクリプト相当の単一ファイルにする。
//  - target を絞らず（esnext）トランスパイルを最小化し、挙動差分を抑える。
//  - charset: 'utf8' で日本語文字列をエスケープせず保持する。
//  - https:// の動的 import（@google/genai など）はバンドルせず外部のまま残す。
//
// 使い方: `npm run build`（CI なし・静的配信のため、生成物 app.js もコミットする）

import * as esbuild from 'esbuild';

const options = {
    entryPoints: ['src/main.js'],
    outfile: 'app.js',
    bundle: true,
    format: 'iife',
    target: 'esnext',
    charset: 'utf8',
    minify: false,
    keepNames: true,
    legalComments: 'none',
    // CDN からの URL import はバンドル対象外（実行時にブラウザが解決する）
    external: ['https://*', 'http://*'],
    logLevel: 'info',
    banner: {
        js: '/* このファイルは src/ から生成された自動生成物です。直接編集せず src/ を編集して `npm run build` を実行してください。 */',
    },
};

const watch = process.argv.includes('--watch');

if (watch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('esbuild: watching src/ for changes...');
} else {
    await esbuild.build(options);
    console.log('esbuild: build complete -> app.js');
}
