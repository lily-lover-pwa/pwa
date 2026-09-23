import { describe, it, expect } from 'vitest';
import { createGeminiStreamAssembler } from '../src/utils/gemini-stream.js';

const textChunk = (text, extra = {}) => ({
    candidates: [{ content: { role: 'model', parts: [{ text }] }, ...extra }]
});

describe('createGeminiStreamAssembler', () => {
    it('細切れのテキストを順につなぐ', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk(textChunk('こん'));
        a.addChunk(textChunk('にち'));
        a.addChunk(textChunk('は'));
        expect(a.getText()).toBe('こんにちは');
    });

    // 下流は parts をなめて text を連結する作りなので、細切れのまま積んで問題ない
    it('非ストリーミングと同じ形に組み立てる', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk(textChunk('あ'));
        a.addChunk(textChunk('い', { finishReason: 'STOP' }));
        const built = a.build();

        expect(built.candidates).toHaveLength(1);
        expect(built.candidates[0].content.role).toBe('model');
        expect(built.candidates[0].content.parts.map(p => p.text).join('')).toBe('あい');
        expect(built.candidates[0].finishReason).toBe('STOP');
    });

    // 回帰: usageMetadata が毎チャンク来るのか最終チャンクだけなのかは公式ドキュメントに
    // 明記が無い。どちらでも最後の値が残ることを固定する
    it('usageMetadata は最後に受け取ったものを採用する', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk({ ...textChunk('あ'), usageMetadata: { totalTokenCount: 10 } });
        a.addChunk({ ...textChunk('い'), usageMetadata: { totalTokenCount: 25 } });
        expect(a.build().usageMetadata).toEqual({ totalTokenCount: 25 });
    });

    it('usageMetadata が最終チャンクにしか無くても拾える', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk(textChunk('あ'));
        a.addChunk(textChunk('い'));
        a.addChunk({ ...textChunk(''), usageMetadata: { totalTokenCount: 25 } });
        expect(a.build().usageMetadata).toEqual({ totalTokenCount: 25 });
    });

    it('usageMetadata が一度も来なければ付けない', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk(textChunk('あ'));
        expect(a.build().usageMetadata).toBeUndefined();
    });

    // 思考パートを本文に混ぜると、画面に思考が漏れる
    it('thought:true のパートは画面用テキストに含めない', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk({ candidates: [{ content: { parts: [{ text: '考え中', thought: true }] } }] });
        a.addChunk(textChunk('答え'));

        expect(a.getText()).toBe('答え');
        // ただし parts には残す。下流が thoughtSummary として拾うため
        expect(a.build().candidates[0].content.parts).toHaveLength(2);
    });

    it('functionCall / inlineData のパートをそのまま保つ', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk({ candidates: [{ content: { parts: [{ functionCall: { name: 'f', args: {} } }] } }] });
        a.addChunk({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'x' } }] } }] });

        const parts = a.build().candidates[0].content.parts;
        expect(parts[0].functionCall).toEqual({ name: 'f', args: {} });
        expect(parts[1].inlineData.mimeType).toBe('image/png');
    });

    it('finishReason / safetyRatings / groundingMetadata を引き継ぐ', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk(textChunk('あ'));
        a.addChunk(textChunk('', {
            finishReason: 'SAFETY',
            safetyRatings: [{ category: 'HARM_CATEGORY_HARASSMENT', probability: 'HIGH' }],
            groundingMetadata: { webSearchQueries: ['q'] }
        }));

        const c = a.build().candidates[0];
        expect(c.finishReason).toBe('SAFETY');
        expect(c.safetyRatings[0].probability).toBe('HIGH');
        expect(c.groundingMetadata.webSearchQueries).toEqual(['q']);
    });

    it('promptFeedback を引き継ぐ（ブロック判定に使われる）', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk({ promptFeedback: { blockReason: 'SAFETY' } });
        expect(a.build().promptFeedback).toEqual({ blockReason: 'SAFETY' });
    });

    it('壊れたチャンクや候補なしでも落ちない', () => {
        const a = createGeminiStreamAssembler();
        a.addChunk(null);
        a.addChunk(undefined);
        a.addChunk({});
        a.addChunk({ candidates: [] });
        a.addChunk({ candidates: [{ content: {} }] });
        expect(a.getText()).toBe('');
        expect(a.hasContent()).toBe(false);
    });

    // 途中で失敗したとき、保存する価値があるかの判定に使う
    it('hasContent はパートを受け取ってから true になる', () => {
        const a = createGeminiStreamAssembler();
        expect(a.hasContent()).toBe(false);
        a.addChunk(textChunk('あ'));
        expect(a.hasContent()).toBe(true);
    });
});
