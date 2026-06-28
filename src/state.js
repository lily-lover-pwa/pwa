// アプリの実行時状態（Phase 1 で app.js から抽出）。構造・初期値は不変。
import { DEFAULT_MODEL, DEFAULT_BEDROCK_REGION } from './constants.js';

export const state = {
    tabId: `tab_${Date.now()}_${Math.random()}`, // このタブを識別するユニークID
    db: null,
    currentChatId: null,
    currentMessages: [],
    currentSystemPrompt: '',
    currentPersistentMemory: {}, // 現在のチャットの永続メモリ
    currentSummarizedContext: null,
    profiles: [], // 全プロファイルのリスト
    activeProfileId: null, // 現在アクティブなプロファイルのID
    activeProfile: null, // 現在アクティブなプロファイルの完全なデータ
    profileIconUrls: new Map(),
    videoUrlCache: new Map(),
    imageUrlCache: new Map(),
    settings: {
        apiProvider: 'gemini',
        apiKey: '',
        zaiApiKey: '',
        openrouterApiKey: '',
        bedrockAccessKey: '',
        bedrockSecretKey: '',
        bedrockRegion: DEFAULT_BEDROCK_REGION,
        openaiApiKey: '',
        anthropicApiKey: '',
        anthropicCacheTTL: '5m',
        anthropicEffort: 'high',
        novelaiApiKey: '',
        novelaiModel: 'nai-diffusion-4-5-curated',
        groqApiKey: '',
        deepseekApiKey: '',
        xaiApiKey: '',
        mistralApiKey: '',
        sakanaApiKey: '',
        modelName: DEFAULT_MODEL,
        systemPrompt: '',
        temperature: null,
        maxTokens: null,
        topK: null,
        topP: null,
        thinkingBudget: null,
        includeThoughts: false,
        enableThoughtTranslation: true, // 思考プロセスの翻訳を有効にするか
        thoughtTranslationModel: 'gemini-2.5-flash-lite',
        dummyUser: '',
        dummyEnabled: true,
        applyDummyToProofread: false,
        applyDummyToTranslate: false,
        dummyModel: '',
        reverseDummyOrder: false,
        concatDummyModel: false,
        additionalModels: '',
        enterToSend: true,
        historySortOrder: 'updatedAt',
        darkMode: false,
        backgroundImageBlob: null,
        fontFamily: '',
        hideSystemPromptInChat: false,
        enableSwipeNavigation: false,
        enableAutoRetry: true,
        maxRetries: 30,
        useFixedRetryDelay: false,
        fixedRetryDelaySeconds: 15,
        maxBackoffDelaySeconds: 60,
        enableApiTimeout: false,
        apiTimeoutSeconds: 90,
        enableProofreading: false,
        proofreadingModelName: 'gemini-2.5-flash',
        proofreadingSystemInstruction:
            'あなたはプロの編集者です。受け取った文章の過剰な読点を抑制し、日本語として違和感のない読点の使用量に校正してください。承知しました等の応答は行わず、校正後の文章のみ出力して下さい。読点の抑制以外の編集は禁止です。読点以外の文章には絶対に手を付けないで下さい。',
        geminiEnableGrounding: false,
        geminiEnableFunctionCalling: false,
        googleSearchApiKey: '',
        googleSearchEngineId: '',
        messageOpacity: 1,
        overlayOpacity: 0.65,
        headerColor: '',
        allowPromptUiChanges: true,
        forceFunctionCalling: false,
        autoScroll: true,
        enableWideMode: true,
        enableMemory: false,
        memoryAutoSaveInterval: 30,
        headerAutoHide: false,
        summaryModelName: '', // 空の場合はmodelNameを使用
        summarySystemPrompt: `あなたはプロの編集者です。以下の会話履歴を、第三者の視点から見た物語の「あらすじ」として要約してください。
「承知しました」等のAIとしての応答は不要です。要約文のみ出力して下さい。

【最重要ルール】
- **プロットの維持**: 物語の重要な転換点、登場人物の重要な決断、新しい事実の判明、伏線となりうる発言は、絶対に省略しないでください。
- **客観的な記述**: 「主人公は〜した。」「〇〇は〜と感じた。」のように、キャラクターの行動と感情を客観的に記述してください。
- **情報の取捨選択**: 日常的な挨拶や、物語の進行に直接関係のない会話は省略してください。
- **時系列の維持**: 出来事が起こった順番を正確に保ってください。

最終的な出力は、このあらすじを初めて読む人でも、これまでの物語の流れを正確に理解できるような形式にしてください。`,
        enableSummaryButton: true,
        floatingPanelBehavior: 'on-click',
        dropboxSyncFrequency: 'instant',
        sdApiUrl: '',
        sdApiUser: '',
        sdApiPassword: '',
        sdEnableQualityChecker: false,
        sdQcModel: 'gemini-2.5-pro',
        sdQcPrompt: `あなたはプロンプトと画像を比較し、指示通りに生成されているか評価する専門家です。
以下のプロンプトと画像の内容を厳密に比較してください。

[プロンプト]
{prompt}

[評価ルール]
- プロンプトの要素（人物、服装、背景、構図、雰囲気など）が画像内に明確に反映されていれば "OK" と評価してください。
- 重要な要素が欠けていたり、指示と明らかに異なる場合は "NG" と評価し、その理由を簡潔に説明してください。

[出力形式]
評価結果を以下の形式で出力してください。他のテキストは一切含めないでください。
Result: [OKまたはNG]
Reason: [NGの場合の理由]`,
        sdQcRetries: 3,
        sdPromptImproveModel: 'gemini-2.5-flash',
        sdPromptImproveSystemPrompt: `あなたはプロのプロンプトエンジニアです。提示された「元のプロンプト」と「失敗理由」に基づき、失敗理由を解決するための改善された英語の画像生成プロンプトを生成してください。余計な解説や前置きは一切含めず、改善されたプロンプト本体のみを出力してください。`,
        debugMode: false,
    },
    syncMessageCounter: 0,
    backgroundImageUrl: null,
    isSending: false,
    abortController: null,
    editingMessageIndex: null,
    isEditingSystemPrompt: false,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0,
    isSwiping: false,
    isZoomed: false,
    currentScreen: 'chat',
    panelFadeOutTimer: null,
    selectedFilesForUpload: [],
    pendingAttachments: [],
    isTemporaryBackgroundActive: false,
    currentScene: null,
    currentStyleProfiles: {},
    isMemoryEnabledForChat: true,
    characterProfileVisibleCharacter: null,
    rangeImageSelect: { active: false, startIndex: null, endIndex: null }, // 範囲画像保存モードの選択状態
    sync: {
        isDirty: false, // ローカルに変更があったか
        lastSyncId: null, // 最後に同期したクラウドのID
        isSyncing: false, // 同期処理中か
        pushTimeoutId: null, // Push処理のデバウンス用タイマーID
        lastError: null,
    },
};
