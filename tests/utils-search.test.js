import { describe, it, expect } from 'vitest';
import { parseSearchQuery, collectSearchableMessages, buildExcerpt, searchChat, searchChats } from '../src/utils/search.js';

describe('parseSearchQuery', () => {
    it('空白で区切って小文字に揃える', () => {
        expect(parseSearchQuery('Aquarium Chat')).toEqual(['aquarium', 'chat']);
    });

    it('全角空白でも区切る', () => {
        expect(parseSearchQuery('水槽　金魚')).toEqual(['水槽', '金魚']);
    });

    it('同じ語は1つにまとめる', () => {
        expect(parseSearchQuery('金魚 金魚')).toEqual(['金魚']);
    });

    it('空・非文字列は空配列', () => {
        expect(parseSearchQuery('   ')).toEqual([]);
        expect(parseSearchQuery(null)).toEqual([]);
    });
});

describe('collectSearchableMessages', () => {
    it('元の配列でのインデックスを保つ', () => {
        const messages = [
            { role: 'user', content: 'a' },
            { role: 'model', content: 'b' },
        ];
        expect(collectSearchableMessages(messages)).toEqual([
            { message: messages[0], index: 0 },
            { message: messages[1], index: 1 },
        ]);
    });

    // 回帰: 画面に出ないメッセージを拾うと、ヒットしても飛べない
    it('非表示メッセージとtoolロールは除く', () => {
        const messages = [
            { role: 'user', content: 'a' },
            { role: 'model', content: 'b', isHidden: true },
            { role: 'tool', content: 'c' },
        ];
        expect(collectSearchableMessages(messages).map(m => m.index)).toEqual([0]);
    });

    it('カスケードは選択中の兄弟だけを返す', () => {
        const messages = [
            { role: 'user', content: 'q' },
            { role: 'model', content: 'A案', isCascaded: true, siblingGroupId: 'g1' },
            { role: 'model', content: 'B案', isCascaded: true, siblingGroupId: 'g1', isSelected: true },
        ];
        expect(collectSearchableMessages(messages).map(m => m.index)).toEqual([0, 2]);
    });

    it('カスケードで選択が無ければ最後の兄弟を使う', () => {
        const messages = [
            { role: 'model', content: 'A案', isCascaded: true, siblingGroupId: 'g1' },
            { role: 'model', content: 'B案', isCascaded: true, siblingGroupId: 'g1' },
        ];
        expect(collectSearchableMessages(messages).map(m => m.index)).toEqual([1]);
    });

    it('配列でなければ空配列', () => {
        expect(collectSearchableMessages(null)).toEqual([]);
    });
});

describe('buildExcerpt', () => {
    it('ヒット箇所の前後を切り出す', () => {
        const excerpt = buildExcerpt('むかしむかし金魚がいました', ['金魚']);
        expect(excerpt.match).toBe('金魚');
        expect(excerpt.before).toBe('むかしむかし');
        expect(excerpt.after).toBe('がいました');
    });

    it('長い本文は前後を切り詰めてフラグを立てる', () => {
        const text = `${'あ'.repeat(100)}金魚${'い'.repeat(100)}`;
        const excerpt = buildExcerpt(text, ['金魚'], 10);
        expect(excerpt.before).toBe('あ'.repeat(10));
        expect(excerpt.after).toBe('い'.repeat(10));
        expect(excerpt.truncatedHead).toBe(true);
        expect(excerpt.truncatedTail).toBe(true);
    });

    it('最初にヒットした語を基準にする', () => {
        const excerpt = buildExcerpt('金魚と水槽', ['水槽', '金魚']);
        expect(excerpt.match).toBe('金魚');
    });

    it('大文字小文字を無視してヒットし、元の表記を返す', () => {
        expect(buildExcerpt('Hello World', ['world']).match).toBe('World');
    });

    it('改行や連続空白は1つのスペースに潰す', () => {
        const excerpt = buildExcerpt('前の行\n\n金魚  です', ['金魚']);
        expect(excerpt.before).toBe('前の行 ');
        expect(excerpt.after).toBe(' です');
    });

    it('ヒットが無ければ先頭を抜粋する', () => {
        const excerpt = buildExcerpt('本文だけ', ['見つからない']);
        expect(excerpt.match).toBe('');
        expect(excerpt.after).toBe('本文だけ');
    });
});

describe('searchChat / searchChats', () => {
    const chats = [
        {
            id: 1,
            title: '水槽の相談',
            messages: [
                { role: 'user', content: '金魚を飼いたい' },
                { role: 'model', content: '水温に気をつけてください' },
            ],
        },
        {
            id: 2,
            title: '雑談',
            messages: [{ role: 'user', content: '今日はいい天気' }],
        },
    ];

    it('本文にヒットしたチャットを返す', () => {
        const results = searchChats(chats, '金魚');
        expect(results).toHaveLength(1);
        expect(results[0].chat.id).toBe(1);
        expect(results[0].hits.map(h => h.index)).toEqual([0]);
    });

    it('タイトルにもヒットする', () => {
        const results = searchChats(chats, '雑談');
        expect(results.map(r => r.chat.id)).toEqual([2]);
        expect(results[0].titleHit).toBe(true);
    });

    // タイトルだけのヒットは飛び先が無いので hits は空のままにする
    it('タイトルだけのヒットでは hits を作らない', () => {
        expect(searchChats(chats, '雑談')[0].hits).toEqual([]);
    });

    it('複数の語はすべて含むチャットだけを返す（語がまたがってもよい）', () => {
        expect(searchChats(chats, '水槽 金魚').map(r => r.chat.id)).toEqual([1]);
        expect(searchChats(chats, '金魚 天気')).toEqual([]);
    });

    it('同じチャット内の複数ヒットをすべて拾う', () => {
        const chat = {
            id: 3,
            title: '',
            messages: [
                { role: 'user', content: '金魚は？' },
                { role: 'model', content: 'はい、金魚です' },
                { role: 'user', content: '関係ない話' },
            ],
        };
        const result = searchChat(chat, ['金魚']);
        expect(result.hitCount).toBe(2);
        expect(result.hits.map(h => h.index)).toEqual([0, 1]);
    });

    it('元の並び順を保つ', () => {
        expect(searchChats(chats, 'い').map(r => r.chat.id)).toEqual([1, 2]);
    });

    it('検索語が空なら空配列（＝絞り込みなし扱い）', () => {
        expect(searchChats(chats, '')).toEqual([]);
        expect(searchChats(chats, '   ')).toEqual([]);
    });

    it('messagesやtitleが欠けていても落ちない', () => {
        expect(searchChats([{ id: 4 }], '金魚')).toEqual([]);
        expect(searchChats(null, '金魚')).toEqual([]);
        expect(searchChat(null, ['金魚'])).toBeNull();
    });
});
