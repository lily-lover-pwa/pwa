// アプリのエントリポイント（Phase 1）。
// index.html での読み込み順（function-calling.js → dropbox.js → app.js）を踏襲し、
// これら3つを1つの app.js バンドルにまとめる。各モジュールは副作用として
// window.* にAPIを公開する（従来のクラシックスクリプトと同じランタイム契約）。
import './function-calling.js';
import './dropbox.js';
import './app.js';
