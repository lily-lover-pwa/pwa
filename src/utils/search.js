// チャット履歴の全文検索。DB・DOMには触らない純粋関数だけを置く。

const EXCERPT_RADIUS = 30; // ヒット箇所の前後に何文字ぶん抜粋するか

/** 検索語を空白区切りで分ける（全角空白も区切り）。小文字に揃えて重複は除く。 */
export function parseSearchQuery(query) {
    if (typeof query !== 'string') return [];
    const terms = query.trim().split(/[\s\u3000]+/).filter(Boolean).map(term => term.toLowerCase());
    return Array.from(new Set(terms));
}

/**
 * 検索対象のメッセージを {message, index} の配列で返す。
 * 画面に出ないものを拾うとヒットしても飛べないため、renderChatMessages と同じ条件で絞る。
 */
export function collectSearchableMessages(messages) {
    if (!Array.isArray(messages)) return [];
    const found = [];
    const processedGroupIds = new Set();

    messages.forEach((message, index) => {
        if (!message || message.isHidden || message.role === 'tool') return;

        if (message.isCascaded && message.siblingGroupId) {
            // カスケードは選択中のもの（無ければ最後のもの）だけが表示される
            if (processedGroupIds.has(message.siblingGroupId)) return;
            processedGroupIds.add(message.siblingGroupId);
            const siblings = [];
            messages.forEach((sibling, siblingIndex) => {
                if (sibling && !sibling.isHidden && sibling.siblingGroupId === message.siblingGroupId) {
                    siblings.push({ message: sibling, index: siblingIndex });
                }
            });
            const selected = siblings.find(s => s.message.isSelected) || siblings[siblings.length - 1];
            if (selected) found.push(selected);
            return;
        }

        found.push({ message, index });
    });

    return found;
}

/** 表示用に改行や連続空白を1つのスペースへ潰す。 */
function collapseWhitespace(text) {
    return text.replace(/\s+/g, ' ');
}

/**
 * 最初にヒットした語の周辺を切り出す。
 * { before, match, after, truncatedHead, truncatedTail } を返す。
 */
export function buildExcerpt(text, terms, radius = EXCERPT_RADIUS) {
    const source = typeof text === 'string' ? text : '';
    const lower = source.toLowerCase();
    let at = -1;
    let matchLength = 0;

    for (const term of terms || []) {
        const index = lower.indexOf(term);
        if (index !== -1 && (at === -1 || index < at)) {
            at = index;
            matchLength = term.length;
        }
    }

    if (at === -1) {
        // ヒットが無い場合は先頭を抜粋（タイトルだけヒットしたチャットなどで使う）
        const head = source.slice(0, radius * 2);
        return {
            before: '',
            match: '',
            after: collapseWhitespace(head),
            truncatedHead: false,
            truncatedTail: source.length > head.length,
        };
    }

    const start = Math.max(0, at - radius);
    const end = Math.min(source.length, at + matchLength + radius);
    return {
        before: collapseWhitespace(source.slice(start, at)),
        match: source.slice(at, at + matchLength),
        after: collapseWhitespace(source.slice(at + matchLength, end)),
        truncatedHead: start > 0,
        truncatedTail: end < source.length,
    };
}

/**
 * チャット1件を検索する。ヒットしなければ null。
 * 「すべての語がそのチャットのどこか（タイトルか本文）にある」ことを条件にし、
 * ヒット箇所（hits）は語のどれかを含むメッセージを拾う。
 */
export function searchChat(chat, terms) {
    if (!chat || !Array.isArray(terms) || terms.length === 0) return null;

    const title = typeof chat.title === 'string' ? chat.title : '';
    const lowerTitle = title.toLowerCase();
    const foundTerms = new Set(terms.filter(term => lowerTitle.includes(term)));
    const titleHit = foundTerms.size > 0;

    const hits = [];
    for (const { message, index } of collectSearchableMessages(chat.messages)) {
        const content = typeof message.content === 'string' ? message.content : '';
        if (!content) continue;
        const lower = content.toLowerCase();
        const matched = terms.filter(term => lower.includes(term));
        if (matched.length === 0) continue;
        matched.forEach(term => foundTerms.add(term));
        hits.push({ index, role: message.role, excerpt: buildExcerpt(content, matched) });
    }

    if (foundTerms.size !== terms.length) return null; // 1語でも見つからなければ対象外
    if (!titleHit && hits.length === 0) return null;

    return { chat, titleHit, hits, hitCount: hits.length };
}

/** チャット配列を検索して、ヒットしたものだけを元の順序で返す。 */
export function searchChats(chats, query) {
    const terms = parseSearchQuery(query);
    if (terms.length === 0 || !Array.isArray(chats)) return [];

    const results = [];
    for (const chat of chats) {
        const result = searchChat(chat, terms);
        if (result) results.push(result);
    }
    return results;
}
