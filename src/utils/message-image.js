// メッセージ要素を PNG 画像化するユーティリティ。
//
// 方式:
//  - foreignObject は WebKit(iOS) で canvas を汚染するため使わず、DOM を直接描画する
//    html2canvas-pro を使う（グローバル名は html2canvas / vendored: html2canvas-pro.min.js）。
//  - テーマは color-mix()/CSS変数で配色しており html2canvas 上で文字が薄くなるため、
//    撮影直前に「実DOM」へ一時的な高コントラストCSS（白背景＋黒文字）を適用してから
//    撮影する。html2canvas は実DOMの計算済みスタイルを取り込むので確実に反映される。
//    撮影後はクラスとstyleを即座に外すため、画面表示は元に戻る（撮影中だけ一瞬変化）。
//  - 範囲保存は各メッセージを個別に撮影 → 縦に連結。長すぎる場合は縮小して1枚に収め、
//    極端に長い場合のみ複数枚へ分割する。

const CAPTURE_EXCLUDED_CLASSES = new Set([
    'message-actions',
    'message-cascade-controls',
    'message-edit-area',
]);

// canvas の上限。iOS では「総面積」が実質的な制約（約 4096^2）。
const MAX_CANVAS_AREA = 16777216;
const MAX_CANVAS_SIDE = 16384;
const MIN_FIT_SCALE = 0.3; // これ未満まで縮小が必要なほど長い場合のみ分割

// 撮影対象に付与するクラスと、それに対する高コントラスト配色。
const CAPTURE_CLASS = 'msg-capture-target';
const CAPTURE_STYLE_ID = '__msg-capture-style';
const CAPTURE_OVERRIDE_CSS = `
    .${CAPTURE_CLASS}, .${CAPTURE_CLASS} * {
        color: #1a1a1a !important;
        -webkit-text-fill-color: #1a1a1a !important;
        text-shadow: none !important;
        line-height: 1.6 !important;
    }
    .${CAPTURE_CLASS} {
        background: #ffffff !important;
        box-shadow: none !important;
        border: 1px solid #e0e0e0 !important;
        opacity: 1 !important;
    }
    .${CAPTURE_CLASS}.user { background: #eaf2f5 !important; }
    .${CAPTURE_CLASS} .message-content pre,
    .${CAPTURE_CLASS} .message-content code {
        background: #f3f3f3 !important;
        color: #1a1a1a !important;
        -webkit-text-fill-color: #1a1a1a !important;
        border-color: #dddddd !important;
    }
    .${CAPTURE_CLASS} .message-content a {
        color: #1565c0 !important;
        -webkit-text-fill-color: #1565c0 !important;
    }
    .${CAPTURE_CLASS} .message-content blockquote {
        color: #555555 !important;
        -webkit-text-fill-color: #555555 !important;
        border-left-color: #cccccc !important;
    }
    /* ターン番号/モデル名ラベル（::before）は薄いグレーに */
    .${CAPTURE_CLASS}::before, .${CAPTURE_CLASS} *::before {
        color: #888888 !important;
        -webkit-text-fill-color: #888888 !important;
        opacity: 1 !important;
    }
    /* 閉じている思考プロセス(details)の中身は画像に含めない（開いていれば含める） */
    .${CAPTURE_CLASS} details:not([open]) > *:not(summary) { display: none !important; }
`;

function shouldExcludeFromCapture(element) {
    return [...CAPTURE_EXCLUDED_CLASSES].some((className) =>
        element.classList?.contains(className)
    );
}

function nextFrame() {
    return new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
}

let captureStyleEl = null;
// 撮影用の一時CSSを実DOMへ適用し、対象要素にクラスを付ける。
function applyCaptureStyles(elements) {
    if (!captureStyleEl) {
        captureStyleEl = document.createElement('style');
        captureStyleEl.id = CAPTURE_STYLE_ID;
        captureStyleEl.textContent = CAPTURE_OVERRIDE_CSS;
    }
    if (!captureStyleEl.isConnected) document.head.appendChild(captureStyleEl);
    for (const el of elements) el.classList.add(CAPTURE_CLASS);
}
function removeCaptureStyles(elements) {
    for (const el of elements) el.classList.remove(CAPTURE_CLASS);
    if (captureStyleEl?.isConnected) captureStyleEl.remove();
}

function captureParams() {
    const backgroundColor = '#ffffff';
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    return { backgroundColor, scale };
}

async function ensureFontsReady() {
    try {
        if (document.fonts?.ready) await document.fonts.ready;
    } catch {
        /* フォントAPI非対応時は無視 */
    }
}

async function captureElementToCanvas(messageElement, { backgroundColor, scale }) {
    return await html2canvas(messageElement, {
        backgroundColor,
        scale,
        useCORS: true,
        ignoreElements: (element) => shouldExcludeFromCapture(element),
    });
}

function canvasToPngBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('PNGへの変換に失敗しました。'))),
            'image/png'
        );
    });
}

function formatTimestamp(date) {
    return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0'),
        '-',
        String(date.getHours()).padStart(2, '0'),
        String(date.getMinutes()).padStart(2, '0'),
        String(date.getSeconds()).padStart(2, '0'),
    ].join('');
}

export function createMessageImageFilename(messageElement, date = new Date()) {
    const role = messageElement.classList.contains('user') ? 'user' : 'assistant';
    const turn = messageElement.dataset.turn || 'message';
    return `PWA-lily_${turn}_${role}_${formatTimestamp(date)}.png`;
}

export function createRangeImageFilename(date = new Date(), part = 0, total = 1) {
    const suffix = total > 1 ? `_${part}of${total}` : '';
    return `PWA-lily_range_${formatTimestamp(date)}${suffix}.png`;
}

export async function messageElementToPngBlob(messageElement) {
    if (!(messageElement instanceof HTMLElement)) {
        throw new TypeError('保存対象のメッセージが見つかりません。');
    }
    if (typeof html2canvas === 'undefined') {
        throw new Error('画像生成ライブラリ（html2canvas）が読み込まれていません。ページを再読み込みしてください。');
    }
    const rect = messageElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
        throw new Error('表示されていないメッセージは画像にできません。');
    }
    await ensureFontsReady();

    applyCaptureStyles([messageElement]);
    try {
        await nextFrame();
        const canvas = await captureElementToCanvas(messageElement, captureParams());
        return await canvasToPngBlob(canvas);
    } finally {
        removeCaptureStyles([messageElement]);
    }
}

// 複数メッセージを縦に連結して PNG 化する。通常は1枚、極端に長い範囲のみ複数枚。
export async function messagesRangeToPngBlobs(messageElements) {
    if (typeof html2canvas === 'undefined') {
        throw new Error('画像生成ライブラリ（html2canvas）が読み込まれていません。ページを再読み込みしてください。');
    }
    const targets = [...messageElements].filter((el) => {
        if (!(el instanceof HTMLElement)) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    });
    if (targets.length === 0) {
        throw new Error('表示されているメッセージがありません。');
    }

    const { backgroundColor, scale } = captureParams();
    await ensureFontsReady();

    const captures = [];
    applyCaptureStyles(targets);
    try {
        await nextFrame();
        for (const element of targets) {
            const canvas = await captureElementToCanvas(element, { backgroundColor, scale });
            captures.push({ canvas, isUser: element.classList.contains('user') });
        }
    } finally {
        removeCaptureStyles(targets);
    }

    const gap = Math.round(12 * scale);

    // まず「1枚」に収めることを優先。上限を超える場合は縮小して1枚に収める。
    const totalWidth = Math.max(...captures.map((i) => i.canvas.width));
    const totalHeight =
        captures.reduce((sum, i) => sum + i.canvas.height, 0) + gap * (captures.length - 1);
    const fit = Math.min(
        1,
        MAX_CANVAS_SIDE / totalWidth,
        MAX_CANVAS_SIDE / totalHeight,
        Math.sqrt(MAX_CANVAS_AREA / (totalWidth * totalHeight))
    );

    if (fit >= MIN_FIT_SCALE) {
        return [await canvasToPngBlob(combineCanvases(captures, backgroundColor, gap, fit))];
    }

    // 縮小しても読めないほど極端に長い場合のみ、等倍で上限に収まるよう複数枚へ分割。
    const maxChunkHeight = Math.min(MAX_CANVAS_SIDE, Math.floor(MAX_CANVAS_AREA / totalWidth));
    const chunks = [];
    let current = [];
    let currentHeight = 0;
    for (const item of captures) {
        const add = item.canvas.height + (current.length ? gap : 0);
        if (current.length && currentHeight + add > maxChunkHeight) {
            chunks.push(current);
            current = [];
            currentHeight = 0;
        }
        current.push(item);
        currentHeight += item.canvas.height + (current.length > 1 ? gap : 0);
    }
    if (current.length) chunks.push(current);

    const blobs = [];
    for (const chunk of chunks) {
        blobs.push(await canvasToPngBlob(combineCanvases(chunk, backgroundColor, gap, 1)));
    }
    return blobs;
}

function combineCanvases(items, backgroundColor, gap, fit = 1) {
    const logicalWidth = Math.max(...items.map((i) => i.canvas.width));
    const logicalHeight =
        items.reduce((sum, i) => sum + i.canvas.height, 0) + gap * (items.length - 1);

    const out = document.createElement('canvas');
    out.width = Math.max(1, Math.floor(logicalWidth * fit));
    out.height = Math.max(1, Math.floor(logicalHeight * fit));
    const ctx = out.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, out.width, out.height);

    let y = 0;
    for (const item of items) {
        const cw = item.canvas.width;
        const ch = item.canvas.height;
        // user は右寄せ・それ以外は左寄せで連結（チャットの見た目に合わせる）。
        const x = item.isUser ? Math.max(0, logicalWidth - cw) : 0;
        ctx.drawImage(
            item.canvas,
            0, 0, cw, ch,
            Math.round(x * fit), Math.round(y * fit), Math.round(cw * fit), Math.round(ch * fit)
        );
        y += ch + gap;
    }
    return out;
}
