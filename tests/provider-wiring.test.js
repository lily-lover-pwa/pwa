import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BAI_API_BASE_URL, BAI_MODELS, DEFAULT_BAI_MODEL } from '../src/constants.js';
import { state } from '../src/state.js';

const read = (p) => readFileSync(resolve(process.cwd(), p), 'utf8');
const html = read('index.html');
const doc = new DOMParser().parseFromString(html, 'text/html');

// プロバイダーを1つ足すには13ファイルを触る必要があり、どれか1つ抜けても
// 「選べるのに動かない」状態になる。抜けを機械的に検出する。
describe('B.AI プロバイダーの配線', () => {
    it('プロバイダー選択に出てくる', () => {
        const values = Array.from(doc.querySelectorAll('#api-provider option')).map((o) => o.value);
        expect(values).toContain('bai');
    });

    it('APIキー入力欄と追加モデル欄が他プロバイダーと同じ場所にある', () => {
        const container = doc.getElementById('bai-api-key-container');
        const sakana = doc.getElementById('sakana-api-key-container');
        expect(container).toBeTruthy();
        expect(doc.getElementById('bai-api-key')).toBeTruthy();
        // 追加モデル欄は `${provider}-custom-models` という名前で機械的に拾われる
        expect(doc.getElementById('bai-custom-models')).toBeTruthy();
        expect(container.parentNode).toBe(sakana.parentNode);
        expect(container.classList.contains('hidden')).toBe(true);
    });

    it('設定の受け皿（state.settings.baiApiKey）がある', () => {
        expect('baiApiKey' in state.settings).toBe(true);
    });

    // Service Worker が掴むと外部APIへのPOSTが壊れる。一番忘れやすい箇所
    it('Service Worker の除外ホストに api.b.ai が入っている', () => {
        expect(read('sw.js')).toContain("'api.b.ai'");
    });

    it('プロファイルの保存対象に baiApiKey が入っている', () => {
        expect(read('src/app-logic/profile.js')).toContain("'baiApiKey'");
    });

    it('モデル一括取得の対象に入っている', () => {
        expect(read('src/app.js')).toContain('https://api.b.ai/v1/models');
    });

    it('要約・メモリ学習とタイトル生成からも呼べる', () => {
        expect(read('src/app-logic/memory.js')).toContain('bai: BAI_API_BASE_URL');
        expect(read('src/app-logic/chat.js')).toContain('bai: BAI_API_BASE_URL');
    });

    it('APIのディスパッチャに case がある', () => {
        expect(read('src/api.js')).toContain("case 'bai':");
    });

    it('エンドポイントは OpenAI互換の chat/completions', () => {
        expect(BAI_API_BASE_URL).toBe('https://api.b.ai/v1/chat/completions');
    });

    // モデルIDはAPIキーの権限ごとに違い、公開された固定の一覧が無いので、
    // 載せてよいのは実アカウントで存在を確認できたものだけ
    it('要望のあった2モデルが選べる', () => {
        const values = BAI_MODELS.map((m) => m.value);
        expect(values).toContain('glm-5.3-flash');
        expect(values).toContain('qwen3.8-flash');
    });

    // ベンダー接頭辞が付く形（'zai/glm-5.3-flash' 等）ではないことを確認済み。
    // 付けてしまうと一覧には出るのに選ぶとエラーになる
    it('モデルIDに余計なベンダー接頭辞が付いていない', () => {
        for (const m of BAI_MODELS) {
            expect(m.value).not.toContain('/');
        }
    });

    it('既定モデルは一覧にあるものを指している', () => {
        expect(BAI_MODELS.map((m) => m.value)).toContain(DEFAULT_BAI_MODEL);
    });

    it('モデル未選択のまま送らないよう案内メッセージを持つ', () => {
        const api = read('src/api.js');
        expect(api).toContain('missingModelMessage');
        // 空のモデル名でリクエストを投げない
        expect(api).toContain('if (!model && cfg.missingModelMessage)');
    });
});
