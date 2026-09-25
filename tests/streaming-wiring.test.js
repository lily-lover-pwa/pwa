// ストリーミング表示は「設定 → state → UI → API」と何ファイルにもまたがる。
// どれか1つ抜けると「チェックを入れても何も起きない」「毎回OFFに戻る」といった
// 分かりにくい壊れ方をするので、配線の抜けを機械的に検出する。
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { state } from '../src/state.js';

const read = (p) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('ストリーミング設定の配線', () => {
    // 既定ONにすると全ユーザーの見え方が一度に変わる。まずは様子見のため既定OFF。
    it('既定はOFF', () => {
        expect(state.settings.enableStreaming).toBe(false);
    });

    it('設定画面にチェックボックスがある', () => {
        const doc = new JSDOM(read('index.html')).window.document;
        const input = doc.getElementById('streaming-output-toggle');
        expect(input).not.toBeNull();
        expect(input.type).toBe('checkbox');
    });

    it('dom-elements から参照できる', () => {
        expect(read('src/dom-elements.js')).toContain("getElementById('streaming-output-toggle')");
    });

    // ここが抜けると、チェックを入れても保存されず毎回OFFに戻る
    it('設定の保存対象に入っている', () => {
        expect(read('src/app-logic/lifecycle.js'))
            .toContain('enableStreaming: { element: elements.streamingOutputToggle');
    });

    // ここが抜けると、保存はされるのに画面のチェックが復元されない
    it('画面への反映（applySettingsToUI）がある', () => {
        expect(read('src/ui.js'))
            .toContain('elements.streamingOutputToggle.checked = state.settings.enableStreaming');
    });
});

describe('ストリーミングのAPI配線', () => {
    const api = read('src/api.js');

    it('設定がONかつ onChunk がある場合だけストリーミングする', () => {
        expect(api).toContain("typeof onChunk === 'function'");
        expect(api).toContain('state.settings.enableStreaming');
    });

    it('エンドポイントを streamGenerateContent?alt=sse に切り替える', () => {
        expect(api).toContain("'streamGenerateContent?alt=sse&'");
    });

    // 画像生成は inlineData を細切れで受け取る意味が無く、崩れる可能性もある
    it('画像生成モデルは対象外', () => {
        expect(api).toMatch(/useStreaming[\s\S]{0,200}!isImageGenModel/);
    });

    // 途中で切れたときに捨ててしまうと、長文の返事が丸ごと消える
    it('中断・通信断でも受信済みのぶんを返す', () => {
        expect(api).toContain('assembler.hasContent()');
        expect(api).toContain('buildTruncated()');
    });

    // 回帰: 以前は本文の末尾へ注記を書き足していたが、その注記ごと履歴に残り
    // 次の送信でモデルに読まれてしまう。途中であることは finishReason で示す
    it('途中であることを本文ではなく finishReason で示す', () => {
        expect(api).toContain("finishReason = 'ABORTED'");
        expect(api).not.toContain('ここまでの内容です');
    });

    it('onChunk が dispatcher から Gemini へ渡っている', () => {
        expect(api).toMatch(/callGeminiApi\([^)]*forceCalling,\s*signal,\s*onChunk\)/);
    });

    // 他プロバイダーは未対応。誤って渡すと未知のキーで400になりうる
    it('他プロバイダーの呼び出しには onChunk を渡していない', () => {
        const dispatcher = api.slice(api.indexOf('async callApi('), api.indexOf('async callApi(') + 4000);
        const nonGemini = dispatcher
            .split('\n')
            .filter(l => l.includes('return await this.call') && !l.includes('callGeminiApi'));
        expect(nonGemini.length).toBeGreaterThan(0);
        for (const line of nonGemini) {
            expect(line).not.toContain('onChunk');
        }
    });
});

// 回帰: 本文を <pre> で描いているが、既定の .message-content pre はコードブロック用の
// 装飾（等幅・灰背景・折り返しなし）だった。そのまま当たると長い段落が横に伸びて読めない
describe('ストリーミング中の本文が折り返される', () => {
    it('プレースホルダーに streaming-content クラスを付けている', () => {
        expect(read('src/ui.js')).toContain("contentDiv.classList.add('streaming-content')");
    });

    it('CSS で折り返しを指定している', () => {
        const css = read('style.css');
        const rule = css
            .split('\n')
            .find(l => l.includes('.message-content.streaming-content > pre'));
        expect(rule).toBeTruthy();
        expect(rule).toContain('white-space: pre-wrap');
        expect(rule).toContain('word-wrap: break-word');
    });
});

describe('送信経路の配線', () => {
    const message = read('src/app-logic/message.js');

    it('描画コールバックを渡している', () => {
        expect(message).toContain('this._createStreamRenderer(modelMessageIndex)');
    });

    // ここで弾くと、せっかく受信したぶんが捨てられる
    it('ABORTED をエラー扱いにしない', () => {
        expect(message).toMatch(/reason === 'ABORTED'\)\s*\{\s*return null;/);
    });

    // id が残っていると、次の送信で古い要素のほうに書き込んでしまう
    it('完了時にストリーミング用の id を外している', () => {
        expect(message).toContain('uiUtils.finalizeStreamingMessage(modelMessageIndex)');
        expect(read('src/ui.js')).toContain('finalizeStreamingMessage(index)');
    });
});

// 受信は数十文字ずつまとめて届くため、そのまま出すと表示が跳ねる
describe('文字送りの配線', () => {
    const message = read('src/app-logic/message.js');

    it('未表示ぶんを state に持っている', () => {
        expect(read('src/state.js')).toContain('partialStreamContent');
        expect(read('src/state.js')).toContain('streamTargetContent');
    });

    it('planTypewriterStep を使って送る量を決めている', () => {
        expect(message).toContain('planTypewriterStep({');
        expect(message).toContain("from '../utils/typewriter.js'");
    });

    it('中断されたら文字送りを止める', () => {
        expect(message).toMatch(/pump[\s\S]{0,400}abortController\?\.signal\.aborted/);
    });

    it('速度の設定が保存対象に入っている', () => {
        expect(read('src/app-logic/lifecycle.js'))
            .toContain('streamingSpeed: { element: elements.streamingSpeedInput');
        expect(read('src/ui.js'))
            .toContain('elements.streamingSpeedInput.value = state.settings.streamingSpeed');
    });

    it('設定画面に入力欄がある', () => {
        const doc = new JSDOM(read('index.html')).window.document;
        const input = doc.getElementById('streaming-speed');
        expect(input).not.toBeNull();
        expect(input.type).toBe('number');
        expect(input.min).toBe('0');
    });

    // 2周目以降も同じ要素へ流すと、前の呼び出しの本文を上書きしてしまう
    it('ツール呼び出しの2周目以降は流さない', () => {
        expect(message).toContain('onChunk: (loopCount === 1) ? onChunk : null');
    });

    it('callApi へ onChunk が渡っている', () => {
        expect(message).toMatch(/callApi\([^)]*attemptController\.signal,\s*onChunk\)/);
    });
});

// 回帰: ストリーミングで書かれている最中にブロックされると、目の前に出ていた
// 文章が丸ごと消えてエラー表示に置き換わっていた
describe('ブロックされても受信済みの本文を残す', () => {
    const message = read('src/app-logic/message.js');

    it('本文があるときは finishReason でエラーにしない', () => {
        expect(message).toContain('const hasText = (candidate.content?.parts || [])');
        expect(message).toMatch(/if \(hasText\) \{[\s\S]{0,200}return null;/);
    });

    // 本文が無いときまで通すと、ブロックされたこと自体が分からなくなる
    it('本文が無ければ従来どおりエラーにする', () => {
        expect(message).toContain('モデルが応答をブロックしました (理由:');
    });

    it('途中で止まったことを画面に出している', () => {
        const ui = read('src/ui.js');
        expect(ui).toContain('message-stopped-notice');
        expect(ui).toContain('ここまでの内容です');
        // 中断（ABORTED）でも同じ注記が出る
        expect(ui).toContain("stoppedReason === 'ABORTED'");
    });

    it('注記のスタイルがある', () => {
        expect(read('style.css')).toContain('.message-stopped-notice');
    });
});

// モデル変更・キャッシュ期限切れで会話全体が再書き込みになる送信を、額が大きいときだけ止める。
// 判定は utils-cache-miss.test.js。ここでは配線の抜けだけ見る
describe('キャッシュが効かない送信の確認の配線', () => {
    const message = read('src/app-logic/message.js');

    it('既定は $0.50', () => {
        expect(state.settings.cacheMissAlertThresholdUsd).toBe(0.5);
    });

    // ユーザー発言を積んだあとに止めると、キャンセルしても発言が残ってしまう
    it('ユーザー発言を積む前に判定している', () => {
        const check = message.indexOf('await this._confirmCacheMissIfNeeded()');
        const push = message.indexOf('state.currentMessages.push(userMessage)');
        expect(check).toBeGreaterThan(-1);
        expect(push).toBeGreaterThan(check);
    });

    it('「1時間に切り替えて送信」で設定を保存している', () => {
        expect(message).toContain("state.settings.anthropicCacheTTL = '1h'");
        expect(message).toContain('dbUtils.updateProfile(state.activeProfile)');
    });

    it('設定が保存対象と画面反映に入っている', () => {
        expect(read('src/app-logic/lifecycle.js'))
            .toContain('cacheMissAlertThresholdUsd: { element: elements.cacheMissAlertThresholdInput');
        expect(read('src/ui.js'))
            .toContain('elements.cacheMissAlertThresholdInput.value = state.settings.cacheMissAlertThresholdUsd');
    });

    it('設定画面に入力欄があり、確認ダイアログに3つ目のボタンがある', () => {
        const doc = new JSDOM(read('index.html')).window.document;
        const input = doc.getElementById('cache-miss-alert-threshold');
        expect(input).not.toBeNull();
        expect(input.type).toBe('number');
        const alt = doc.querySelector('#confirmDialog .dialog-alt-btn');
        expect(alt).not.toBeNull();
        // 普段は隠れている
        expect(alt.classList.contains('hidden')).toBe(true);
    });
});

// Gemini の thinking_level は「設定 → state → UI → API（3箇所）」にまたがる。
// 判定と組み立ては utils-gemini-thinking.test.js。ここでは配線の抜けだけ見る
describe('Gemini thinking_level の配線', () => {
    it('既定は空（モデルの既定）', () => {
        expect(state.settings.geminiThinkingLevel).toBe('');
    });

    it('設定画面にプルダウンがあり、値は小文字で持つ', () => {
        const doc = new JSDOM(read('index.html')).window.document;
        const sel = doc.getElementById('gemini-thinking-level');
        expect(sel).not.toBeNull();
        const values = Array.from(sel.options).map(o => o.value);
        expect(values).toEqual(['', 'minimal', 'low', 'medium', 'high']);
    });

    it('設定の保存対象と画面反映に入っている', () => {
        expect(read('src/app-logic/lifecycle.js')).toContain('geminiThinkingLevel: { element: elements.geminiThinkingLevelSelect');
        expect(read('src/ui.js')).toContain("elements.geminiThinkingLevelSelect.value = state.settings.geminiThinkingLevel || ''");
    });

    // ここが抜けると、モデルを変えても非対応の値が残って 400 になりうる
    it('モデル変更時に選択肢を絞り直している', () => {
        const ui = read('src/ui.js');
        expect(ui).toContain('updateGeminiThinkingLevelOptions() {');
        expect(ui).toMatch(/updateAnthropicEffortOptions\(\);\s*\n\s*this\.updateGeminiThinkingLevelOptions\(\);/);
    });

    // 3箇所とも同じ関数を通す。1箇所でも旧コードが残ると、そこだけ両方送って 400 になる
    it('thinkingConfig を組む3箇所すべてが buildGeminiThinkingConfig を通る', () => {
        const api = read('src/api.js');
        const message = read('src/app-logic/message.js');
        expect((api.match(/buildGeminiThinkingConfig\(\{/g) || []).length).toBe(1);
        expect((message.match(/buildGeminiThinkingConfig\(\{/g) || []).length).toBe(2);
        // 旧コードの直書きが残っていないこと
        expect(api).not.toContain('generationConfig.thinkingConfig = {};');
        expect(message).not.toContain('generationConfig.thinkingConfig = {};');
    });
});
