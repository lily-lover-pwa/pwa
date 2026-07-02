// アプリ全体で使用する定数（Phase 1 で app.js から抽出）。値は一切変更していない。

export const DB_NAME = 'GeminiPWA_DB';
export const DB_VERSION = 15;
export const PROJECTS_STORE = 'projects';
export const SETTINGS_STORE = 'settings';
export const PROFILES_STORE = 'profiles';
export const CHATS_STORE = 'chats';
export const IMAGE_STORE = 'image_store';
export const CHAT_UPDATEDAT_INDEX = 'updatedAtIndex';
export const CHAT_CREATEDAT_INDEX = 'createdAtIndex';
export const DEFAULT_MODEL = 'gemini-2.5-pro';
export const DEFAULT_TEMPERATURE = 0.5;
export const DEFAULT_MAX_TOKENS = 4000;
export const DEFAULT_TOP_K = 40;
export const DEFAULT_TOP_P = 0.95;
export const DEFAULT_FONT_FAMILY =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'; // デフォルトフォント
export const CHAT_TITLE_LENGTH = 15;
export const TEXTAREA_MAX_HEIGHT = 120;
export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';
export const ZAI_API_BASE_URL = 'https://api.z.ai/api/paas/v4/chat/completions';
export const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const DEEPSEEK_API_BASE_URL = 'https://api.deepseek.com/chat/completions';
export const XAI_API_BASE_URL = 'https://api.x.ai/v1/chat/completions';
export const MISTRAL_API_BASE_URL = 'https://api.mistral.ai/v1/chat/completions';
export const SAKANA_API_BASE_URL = 'https://api.sakana.ai/v1/chat/completions';
export const DUPLICATE_SUFFIX = ' (コピー)';
export const IMPORT_PREFIX = '(取込) ';
export const LIGHT_THEME_COLOR = '#908675';
export const DARK_THEME_COLOR = '#908675';
export const APP_VERSION = '1.25';
export const DEFAULT_ZAI_MODEL = 'glm-4.6';
export const DEFAULT_OPENROUTER_MODEL = 'x-ai/grok-4.1-fast';
export const VERSION_NOTICE_SESSION_KEY = 'pendingVersionNotice';
export const VERSION_ACK_STORAGE_KEY = 'appVersionAcknowledged';
export const VERSION_LEGACY_STORAGE_KEY = 'appVersion';

// プロバイダーごとのモデルリスト
export const GEMINI_MODELS = [
    { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
    { value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    { value: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
    {
        value: 'gemini-2.5-flash-preview-09-2025',
        label: 'gemini-2.5-flash-preview-09-2025',
        group: 'プレビュー版',
    },
    {
        value: 'gemini-2.5-flash-lite-preview-09-2025',
        label: 'gemini-2.5-flash-lite-preview-09-2025',
        group: 'プレビュー版',
    },
    {
        value: 'gemini-2.5-flash-image-preview',
        label: 'gemini-2.5-flash-image-preview (Nano Banana)',
        group: 'プレビュー版',
    },
    { value: 'gemini-3-pro-preview', label: 'gemini-3-pro-preview', group: 'プレビュー版' },
    { value: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview', group: 'プレビュー版' },
];

export const ZAI_MODELS = [
    { value: 'glm-4.6', label: 'GLM-4.6' },
    { value: 'glm-4.5-Air', label: 'GLM-4.5 Air' },
    { value: 'glm-4.5-flash', label: 'GLM-4.5 Flash' },
];

export const BEDROCK_MODELS = [
    {
        value: 'jp.anthropic.claude-sonnet-4-5-20250929-v1:0',
        label: 'Claude Sonnet 4.5 (推奨・東京リージョン用)',
    },
    {
        value: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
        label: 'Claude Sonnet 4.5 (標準リージョン用)',
    },
    { value: 'anthropic.claude-3-5-sonnet-20241022-v2:0', label: 'Claude 3.5 Sonnet v2' },
    { value: 'anthropic.claude-3-5-sonnet-20240620-v1:0', label: 'Claude 3.5 Sonnet v1' },
    { value: 'anthropic.claude-3-opus-20240229-v1:0', label: 'Claude 3 Opus' },
    { value: 'anthropic.claude-3-sonnet-20240229-v1:0', label: 'Claude 3 Sonnet' },
    { value: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku' },
];

export const DEFAULT_BEDROCK_MODEL = 'jp.anthropic.claude-sonnet-4-5-20250929-v1:0';
export const DEFAULT_BEDROCK_REGION = 'us-east-1';

export const OPENAI_MODELS = [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { value: 'o3', label: 'o3', group: '推論モデル' },
    { value: 'o4-mini', label: 'o4-mini', group: '推論モデル' },
];
export const DEFAULT_OPENAI_MODEL = 'gpt-4o';

export const ANTHROPIC_MODELS = [
    { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
];
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';

export const GROQ_MODELS = [
    { value: 'moonshotai/kimi-k2-instruct', label: 'Kimi K2 Instruct' },
    { value: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B' },
    { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { value: 'qwen/qwen3-32b', label: 'Qwen3 32B' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
];
export const DEFAULT_GROQ_MODEL = 'moonshotai/kimi-k2-instruct';

export const DEEPSEEK_MODELS = [
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
];
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

export const XAI_MODELS = [
    { value: 'grok-4', label: 'Grok 4' },
    { value: 'grok-3', label: 'Grok 3' },
    { value: 'grok-3-mini', label: 'Grok 3 Mini' },
    { value: 'grok-2-1212', label: 'Grok 2' },
];
export const DEFAULT_XAI_MODEL = 'grok-4';

export const MISTRAL_MODELS = [
    { value: 'mistral-large-latest', label: 'Mistral Large (latest)' },
    { value: 'mistral-medium-latest', label: 'Mistral Medium (latest)' },
    { value: 'mistral-small-latest', label: 'Mistral Small (latest)' },
    { value: 'codestral-latest', label: 'Codestral (latest)' },
    { value: 'open-mistral-nemo', label: 'Mistral Nemo' },
];
export const DEFAULT_MISTRAL_MODEL = 'mistral-large-latest';

// Sakana AI（fugu）。OpenAI Chat Completions 互換。
export const SAKANA_MODELS = [
    { value: 'fugu', label: 'Fugu' },
    { value: 'fugu-ultra', label: 'Fugu Ultra' },
];
export const DEFAULT_SAKANA_MODEL = 'fugu';

export const VERSION_HISTORY = {
    1.25: [
        'テキストアーティファクト機能：AIの応答内のコードブロック（```で囲まれた部分）を、コピーボタン付きのカードとして表示。プロンプトや長文をワンタップでコピーできます。',
    ],
    1.24: [
        '【セキュリティ修正】AI応答・インポートしたログ内の生HTMLが実行され得るXSS脆弱性を修正。生HTMLはエスケープ表示、javascript:等の危険なリンクは無効化されます（APIキー・Dropboxトークン保護のため必ず更新してください）。',
        'Anthropic会話履歴キャッシュを改善：トップレベル自動キャッシュ方式（cache_control）に変更し、キャッシュポイントが会話の伸びに合わせて自動前進。TTLは設定値（5分/1時間）に従います。',
        'コスト計算を改善：5分/1時間キャッシュ書き込みを区別して計算。料金テーブルを現行価格に更新（Opus 4.5〜4.8: $5/$25、Haiku 4.5: $1/$5 等）。',
        'モデル名が記録されていないメッセージを現在のモデル価格で計算してしまい推定コストがずれる問題を修正。',
        '長期記憶の自動学習間隔に「75」「100メッセージごと」を追加。',
    ],
    1.22: [
        'Dropbox自動同期でデータが一時的に消えて見える不具合を修正。競合マージ後にページ全体を再読み込みしていた処理を、チャット履歴のみ静かに再読み込みするソフトリロードに変更しました。',
    ],
    '1.20': [
        '初回の会話往復後にチャットタイトルが自動生成されない不具合を修正。プロバイダー別（Gemini / Anthropic / OpenAI互換）のタイトル生成ロジックが正しく動作するよう改善しました。',
        '重複定義されていた `autoGenerateTitle` を整理し、意図しない上書きによる挙動不一致を解消しました。',
        '重複定義されていた `exportProfile` / `importProfile` を統合し、プロファイルのインポート後にアクティブプロファイル反映・UI更新・同期フラグ更新が確実に行われるよう修正しました。',
        '内部コードの重複を削減し、将来の保守時に不具合を生みにくい構成へ整理しました。',
        '履歴一覧のトークン表示を改善し、合計トークンに加えて入力（prompt）/出力（completion）の内訳を表示するようにしました。',
    ],
    1.14: [
        'Claude APIの適応的思考（adaptive thinking）に対応。思考の深さ（effort: low/medium/high/max）を設定画面から選択可能に。',
        'Claude Opus 4.7モデルを追加。',
        'モデルの応答にターン番号とモデル名を小さく表示するようにしました（例: #1 claude-opus-4-6）。',
        'モデル側の吹き出し幅を拡大し、スマホでも読みやすくしました。',
        'Anthropicプロンプトキャッシュ設定に「なし（キャッシュ未使用）」オプションを追加。',
    ],
    1.13: [
        'Claude API使用時にトークン数（候補トークン/合計トークン）が表示されない不具合を修正。',
        'Function Calling使用後にツールをOFFにしてチャットすると発生していた`tool_use without tool_result`エラーを修正。',
        'Claude APIのプロンプトキャッシングを大幅改善。ツール定義と会話履歴にキャッシュブレークポイントを追加し、長い会話でのAPI費用を削減。',
    ],
    1.12: [
        'ユーザー追加モデル対応を全面強化。思考プロセス翻訳、校正、要約、画像品質チェック、プロンプト改善の各機能で、ユーザーが追加したモデルを選択可能に。',
        '「追加モデル (カンマ区切り):」入力後、ページリロード不要で全モデル選択セレクターに即座に反映されるよう改善。',
        '`edit_image`関数にユーザー指定モデル機能を追加。`gemini-3-pro-image-preview`を含む任意のモデルで画像編集が可能に。',
        '開発者が更新を停止しても、ユーザーが新規モデルを追加すれば各種機能で使用できる拡張性の高い設計を実現。',
    ],
    1.11: [
        'デバッグモード有効時のみ、`OpenRouter`、`Z.ai`、`AmazonBedrock`のプロバイダーを追加。開発者向け機能のため既存機能との連携は保証されていません。',
        '設定画面に「ダミーUserプロンプトとダミーModelプロンプトの順序を入れ替える」を追加。',
        'metadata内のキャラクター名や関係性名に特殊文字が使用されているとquerySelectorが正常に動作しない問題を修正',
    ],
    1.1: [
        'gemini-3-pro-previewモデルを追加しました。',
        'gemini-3-pro-previewでのFunction Calling使用時に発生していた「thought_signature」エラーを修正しました。',
    ],
    '1.0': [
        'Dropbox連携機能とStable Diffusion WebUI/Forge/Reforge連携を追加し、PWA内のデータと画像生成ワークフローをクラウドやローカル環境とシームレスに同期できるようにしました。',
        '添付ファイルのサムネイル表示やアップデート内容を告知するダイアログ、URLコンテンツを取り込むfetch_url_content関数、プロファイルへのgemini-2.5-pro使用回数表示、デバッグモード切替などのUI/機能改善を実装しました。',
        'gemini-2.5-flash-imageやveo-3.1シリーズなど最新モデルの追加、画像/動画関連関数のモデル選択改善、URL要約や要約機能まわりのエラーハンドリング強化を行いました。',
        'Firefoxでのパフォーマンス劣化や再生成時の履歴破損、記憶管理画面の不具合など多数のバグを修正し、DB関連関数の保存ロジックも刷新しました。',
    ],
};
export const SWIPE_THRESHOLD = 50; // スワイプ判定の閾値 (px)
export const ZOOM_THRESHOLD = 1.01; // ズーム状態と判定するスケールの閾値 (誤差考慮)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 最大ファイルサイズ (例: 10MB)
export const MAX_TOTAL_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 1メッセージあたりの合計添付ファイルサイズ上限 (例: 50MB) - API制限も考慮
export const INITIAL_RETRY_DELAY = 100; // 初期リトライ遅延時間 (ミリ秒)
export const MAX_PROFILES = 5; // プロファイル作成の上限数
