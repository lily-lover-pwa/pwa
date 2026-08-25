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
export const MAX_HISTORY_EXCERPTS = 3; // 履歴検索で1チャットあたりに表示する抜粋の上限
export const HISTORY_SEARCH_DEBOUNCE_MS = 200;
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
    { value: 'gemini-3.7-flash', label: 'gemini-3.7-flash (2026年内は半額)' },
    { value: 'gemini-flash-latest', label: 'gemini-flash-latest (常に最新Flash)' },
    { value: 'gemini-3.6-flash', label: 'gemini-3.6-flash (2026年内は半額)' },
    { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash' },
    { value: 'gemini-3.5-flash-lite', label: 'gemini-3.5-flash-lite' },
    { value: 'gemini-3.1-flash-lite', label: 'gemini-3.1-flash-lite (軽量・安価)' },
    { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
    { value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
    { value: 'gemini-3.1-pro-preview', label: 'gemini-3.1-pro-preview', group: 'プレビュー版' },
    { value: 'gemini-3-flash-preview', label: 'gemini-3-flash-preview', group: 'プレビュー版' },
];

// 提供終了したモデルを後継へ自動移行するためのマップ（旧モデル名 → 新モデル名）。
// プロファイル適用時に保存済みのモデル設定を書き換える。
// 後継は各社が公式に案内している移行先に合わせている。
export const RETIRED_MODEL_MAP = {
    // Gemini（2026-06-01 提供終了）
    'gemini-2.0-flash': 'gemini-3.5-flash',
    'gemini-2.0-flash-lite': 'gemini-3.1-flash-lite',
    // Gemini プレビュー版（2026-03-31 / 2026-01-15 提供終了）
    'gemini-2.5-flash-preview-09-2025': 'gemini-2.5-flash',
    'gemini-2.5-flash-lite-preview-09-2025': 'gemini-2.5-flash-lite',
    'gemini-2.5-flash-image-preview': 'gemini-3.1-flash-image',
    'gemini-3-pro-preview': 'gemini-3.1-pro-preview',
    // Claude（Claude API）
    'claude-3-5-sonnet-20241022': 'claude-sonnet-4-6',
    'claude-3-5-sonnet-20240620': 'claude-sonnet-4-6',
    'claude-3-5-haiku-20241022': 'claude-haiku-4-5-20251001',
    'claude-3-opus-20240229': 'claude-opus-4-8',
    'claude-3-sonnet-20240229': 'claude-sonnet-4-6',
    'claude-3-haiku-20240307': 'claude-haiku-4-5-20251001',
    // Claude（Bedrock）
    'anthropic.claude-3-5-sonnet-20241022-v2:0': 'global.anthropic.claude-sonnet-4-6',
    'anthropic.claude-3-5-sonnet-20240620-v1:0': 'global.anthropic.claude-sonnet-4-6',
    'anthropic.claude-3-opus-20240229-v1:0': 'global.anthropic.claude-opus-4-6-v1',
    'anthropic.claude-3-sonnet-20240229-v1:0': 'global.anthropic.claude-sonnet-4-6',
    'anthropic.claude-3-haiku-20240307-v1:0': 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
    // Groq
    'moonshotai/kimi-k2-instruct': 'openai/gpt-oss-120b',
    'meta-llama/llama-4-maverick-17b-128e-instruct': 'openai/gpt-oss-120b',
    'meta-llama/llama-4-scout-17b-16e-instruct': 'openai/gpt-oss-120b',
    'qwen/qwen3-32b': 'openai/gpt-oss-120b',
    'gemma2-9b-it': 'openai/gpt-oss-20b',
    // xAI（2026-05-15 提供終了。旧スラッグは grok-4.3 へ転送されるが単価は 4.3 のものになる）
    'grok-4': 'grok-4.6',
    'grok-4-0709': 'grok-4.3',
    'grok-3': 'grok-4.3',
    'grok-3-mini': 'grok-4.3',
    'grok-2-1212': 'grok-4.6',
};

export const ZAI_MODELS = [
    { value: 'glm-4.6', label: 'GLM-4.6' },
    { value: 'glm-4.5-Air', label: 'GLM-4.5 Air' },
    { value: 'glm-4.5-flash', label: 'GLM-4.5 Flash' },
];

// Bedrock は基本モデルIDのままだと on-demand で呼べず、推論プロファイルの接頭辞
// （global. / us. / jp. など）が要る。東京リージョンで使えるものは jp. を用意している。
export const BEDROCK_MODELS = [
    {
        value: 'jp.anthropic.claude-sonnet-4-5-20250929-v1:0',
        label: 'Claude Sonnet 4.5 (推奨・東京リージョン用)',
    },
    {
        value: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
        label: 'Claude Sonnet 4.5 (グローバル)',
    },
    { value: 'global.anthropic.claude-opus-4-6-v1', label: 'Claude Opus 4.6 (グローバル)' },
    { value: 'jp.anthropic.claude-opus-4-6-v1', label: 'Claude Opus 4.6 (東京リージョン用)' },
    { value: 'global.anthropic.claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (グローバル)' },
    { value: 'jp.anthropic.claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (東京リージョン用)' },
    {
        value: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
        label: 'Claude Haiku 4.5 (グローバル・軽量/安価)',
    },
    {
        value: 'global.anthropic.claude-opus-4-5-20251101-v1:0',
        label: 'Claude Opus 4.5 (グローバル)',
    },
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
    { value: 'claude-opus-5', label: 'Claude Opus 5' },
    { value: 'claude-opus-4-8', label: 'Claude Opus 4.8' },
    { value: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
    { value: 'claude-sonnet-5', label: 'Claude Sonnet 5' },
    { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5' },
];
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';

// Anthropic モデルごとに使用可能な Effort レベルを返す（'' は OFF＝思考なし）。
// 未知のモデル（カスタム等）は null を返し、制限しない。
// - フル（low/medium/high/xhigh/max）: Opus 4.7/4.8/5, Sonnet 5, Fable 5, Mythos 5
// - xhigh 非対応（max はOK）: Opus 4.6, Sonnet 4.6
// - xhigh/max 非対応: Opus 4.5
// - Effort 非対応（OFFのみ）: Haiku 4.5, Sonnet 4.5, Claude 3.x / 2.x
export function getAnthropicEffortLevels(model) {
    if (!model) return null;
    const full = ['claude-opus-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-5', 'claude-fable-5', 'claude-mythos-5'];
    if (full.some((p) => model.startsWith(p))) return ['', 'low', 'medium', 'high', 'xhigh', 'max'];
    if (model.startsWith('claude-opus-4-6') || model.startsWith('claude-sonnet-4-6')) return ['', 'low', 'medium', 'high', 'max'];
    if (model.startsWith('claude-opus-4-5')) return ['', 'low', 'medium', 'high'];
    if (model.startsWith('claude-haiku') || model.startsWith('claude-sonnet-4-5') || model.startsWith('claude-3') || model.startsWith('claude-2')) return [''];
    return null;
}

// Llama 3.3 70B / 3.1 8B は廃止予定日（2026-08-16）を過ぎているが、
// Groq のモデル一覧にはまだ本番モデルとして載っている。取り除くと使えている人が
// 困るため残しつつ、ラベルで注意を促す。
export const GROQ_MODELS = [
    { value: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
    { value: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B (軽量/安価)' },
    { value: 'groq/compound', label: 'Compound (ツール内蔵)' },
    { value: 'groq/compound-mini', label: 'Compound Mini (ツール内蔵・軽量)' },
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (廃止予定)' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (廃止予定)' },
    { value: 'qwen/qwen3.6-27b', label: 'Qwen3.6 27B', group: 'プレビュー版' },
    { value: 'minimaxai/minimax-m2.7', label: 'MiniMax M2.7', group: 'プレビュー版' },
];
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';

export const DEEPSEEK_MODELS = [
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
    { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
];
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat';

export const XAI_MODELS = [
    { value: 'grok-4.6', label: 'Grok 4.6 (推奨)' },
    { value: 'grok-4.5', label: 'Grok 4.5' },
    { value: 'grok-4.3', label: 'Grok 4.3 (安価)' },
    { value: 'grok-build-0.1', label: 'Grok Build 0.1 (コーディング向け)' },
];
export const DEFAULT_XAI_MODEL = 'grok-4.6';

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
    '1.52': [
        '提供が終了したモデルをモデル一覧から取り除き、各社の現行モデルに入れ替えました。Gemini は 2.0 Flash / 2.0 Flash-Lite と旧プレビュー版を外し、3.6 / 3.5 Flash・3.5 Flash-Lite・3.1 Flash-Lite・3 Flash（プレビュー）を追加しています。',
        'Groq と xAI は既定モデル自体が提供終了していて、選び直さないと最初のメッセージでエラーになる状態でした。Groq は GPT-OSS 120B、xAI は Grok 4.6 を既定にし、現行モデルへ入れ替えています。Claude と Bedrock も 3系（3.5 Sonnet / 3 Opus など）を外し、Sonnet 5 / Opus 4.6 / Haiku 4.5 などを追加しました。',
        '設定に廃止モデルが保存されたままでも、送信時に後継モデルを案内するようになりました（自動で切り替わるのは後継がはっきりしているものだけで、それ以外は必ず確認します）。',
        '画像生成モデルの判定を名前の形（〜-image）で行うようにしました。Nano Banana の後継（gemini-3.1-flash-image など）を「追加モデル」に入れても画像生成として扱われます。',
        '※ Groq の Llama 3.3 70B / 3.1 8B は廃止予定日を過ぎていますが、まだ一覧に載っているため残しています（ラベルに「廃止予定」と表示）。',
    ],
    '1.51': [
        'モデル一覧で「追加モデル」が標準モデルより前（一覧の中途半端な位置）に出ていたのを直しました。これからは 標準モデル → 追加モデル → API取得モデル の順に並びます。',
        '※ 表示位置が変わるだけで、選べるモデルや★お気に入りの並び（常に先頭）は変わりません。',
    ],
    '1.50': [
        'GPT-5.6 Sol の値下げ（2026年8月21日）に対応しました。100万トークンあたり入力$5→$4（20%減）、出力$30→$20（33%減）、キャッシュヒット$0.50→$0.40 です。ⓘ の推定コストが新単価で計算されます。',
        '値下げ前に送ったメッセージは、これまでどおり当時の単価で計算します。過去のチャットの推定コストが後から下がって見えることはありません。',
        '※ OpenAI は「少なくとも2026年11月21日まで」の特別価格としています。期間が終わって元の単価に戻った場合は、あらためて対応が必要です。',
    ],
    '1.49': [
        'DeepSeek の週末オフピーク（2026年8月23日 0:00 北京時間から）に対応しました。北京時間の土日は終日オフピーク単価になるため、ⓘ の推定コストも週末はピーク倍率をかけずに計算します。平日はこれまでどおりピーク／オフピークの区分が適用されます。',
        '※ 曜日は北京時間で判定します（日本時間とは1時間ずれるため、日本の土曜1:00〜日曜23:59 が週末扱いになります）。改定前に送ったメッセージは当時の規則のまま計算するので、過去のコストが変わることはありません。',
    ],
    '1.48': [
        'OpenRouterを選んでいるときだけ★お気に入りが効かず、チャット画面のモデル一覧に出てこない不具合を修正しました。OpenRouterは他と選択肢の作り方が違い、一覧を作り直すときに★のグループごと消えていたためです。',
        '※ OpenRouterのモデルを一覧に出すには、設定の「OpenRouter 追加モデル (カンマ区切り)」にモデルIDを書いてください（モデル数が多いため自動取得はしていません）。書いたモデルは★で先頭に固定できます。',
    ],
    '1.47': [
        'OpenRouter経由のモデルで思考プロセスが表示されない問題を修正しました。OpenRouterは思考を「reasoning」という項目で返すのに、アプリが「reasoning_content」（DeepSeek系の名前）しか見ていなかったため捨てられていました。あわせて、OpenRouterには思考を返すよう明示的に要求するようにしました（「Include Thoughts」がONのとき）。',
        '思考の長さは、Gemini・Claudeと同じ「Thinking Budget」の値をそのまま使います（空欄なら指定なし）。',
    ],
    '1.46': [
        'プロジェクト管理で下へスクロールすると、閉じる（✕）ボタンが画面外へ流れて押せなくなっていたのを修正しました。タイトルと✕を上部に固定し、中身だけがスクロールするようにしています。',
    ],
    '1.45': [
        'PCの広い画面で、ダイアログの右側に大きな空白ができていた問題を修正しました。ブラウザ標準の <dialog> が持つ配置指定と噛み合わず、すべてのダイアログが「画面幅のちょうど半分」に引き伸ばされていたためです。中身の量に合わせた幅で表示されるようになりました。',
    ],
    '1.44': [
        'プロジェクト管理の画面が崩れていたのを修正しました。この画面だけ他のダイアログと違うスタイルが当たっておらず、ブラウザ標準の見た目（黒い枠）のまま画面からはみ出し、スマホでは下の方が切れて見えない状態でした。',
        'ナレッジのファイルを削除するときに確認を出すようにしました。編集ボタンのすぐ隣にあって押し間違えやすく、しかも元に戻せないためです。',
    ],
    '1.43': [
        '【重要】ページが再読み込みされると、選んでいたモデルが既定のモデル（Claude Sonnet 4.6 など）に勝手に変わってしまう不具合を修正しました。タイムアウトなどで再読み込みが起きるたびに発生していたため、気づかないまま別のモデルで会話が続き、想定より料金がかかることがありました。',
        '※ モデルが変わるとプロンプトキャッシュも切れるため、Anthropic利用時は再読み込みのたびに履歴全体が再課金されていました。この修正で解消されます。',
        'プロバイダーを切り替えて戻したときに、そのプロバイダーで最後に選んでいたモデルへ戻るようになりました（これまでは設定画面から選んだ分が記録されず、既定のモデルに戻っていました）。',
    ],
    '1.42': [
        'Gemini 3.7 Flash に対応しました。モデル選択から選べます。2026年12月31日までは半額（入力$0.75／出力$3.75／キャッシュヒット$0.075、100万トークンあたり）で、2027年1月1日から通常単価（それぞれ2倍）に戻ります。ⓘ の推定コストは日付に応じて自動で切り替わります。',
        'Gemini 3.6 Flash の推定コストが実際の2倍になっていた問題を修正しました。3.6 Flash も 3.7 Flash と同じく2026年内は半額のため、割引を反映して計算します。',
    ],
    '1.41': [
        '全チャットを横断した使用量サマリーを追加しました。ⓘ（会話の統計）の「全チャットの使用量」ボタンから開けます。今月／先月／過去30日／全期間で切り替えられ、推定コスト・メッセージ数・入出力トークンの合計と、モデル別の内訳が見られます。DeepSeekはピーク時間帯にかかった分も別途表示します。',
        '※ 端末内の履歴からの推定です。削除したチャットや、同期していない端末の分は含まれません。正確な請求額は各社の使用量ページ（同じくⓘから開けます）でご確認ください。',
        '※ 金額を計算できるのは料金表を持つモデル（Claude / GPT-5系・4.1系・o3系 / Gemini 3.x・2.5系 / DeepSeek / Grok 4.6）だけです。それ以外のモデルはトークン数のみ表示し、金額欄は「—」になります。',
        'OpenRouter経由のモデルも金額を計算できるようにしました（モデル名が「anthropic/claude-opus-5」のような形でも判別します）。提供元の単価での概算なので、クレジット購入時の手数料ぶん実際の請求は少し高くなります。',
        'Gemini 3.1 Pro の料金に対応しました（入力$2 / 出力$12、20万トークン超で入力2倍・出力1.5倍）。',
        'Grok 4.6・GPT（5系/4.1系/o3系）・Gemini（3.x/2.5系）の料金に対応しました。長いプロンプトで単価が変わる仕様も反映しています（Grok 4.6 は20万トークン以上で2倍、Gemini 2.5 Pro は20万トークン超で入力2倍・出力1.5倍）。',
        'モデル選択に Grok 4.6 を追加しました。',
        'GPT・Gemini のキャッシュヒット分を、キャッシュ用の安い単価で計算するようにしました（これまでは通常入力として多めに見積もっていました）。',
    ],
    '1.40': [
        'DeepSeek V4 の料金改定（2026年8月16日 16:00 UTC＝日本時間8月17日 1:00）に対応しました。ⓘ の推定コストが新料金で計算されます。V4-Pro は入力$0.66／出力$1.98／キャッシュヒット$0.022、V4-Flash は入力$0.22／出力$0.66／キャッシュヒット$0.007（いずれも100万トークンあたり・オフピーク）です。改定前と比べて出力が約2.3倍、入力が約1.5倍になります。',
        '改定前に送ったメッセージは、これまでどおり旧料金で計算します。過去のチャットの推定コストが後から跳ね上がって見えることはありません。',
        '※ ピーク時間帯（日本時間 10:00-13:00 / 15:00-19:00 は2倍）は改定後も変わりません。',
    ],
    '1.35': [
        '配色プリセットを追加。設定の「配色プリセット」から、藍墨・青磁・灰桜・墨・琥珀の5種類（各ライト/ダーク対応）にワンタップで切り替えられます。ClaudeDesignで作成したテンプレートを移植しました。',
    ],
    '1.34': [
        '【重要】Dropbox同期で設定が巻き戻る不具合を修正。プロファイルのマージが「常にクラウド優先」だったため、ローカルで変更した設定（思考の深さ(Effort)など）が自動同期のたびに古い内容へ戻っていました。チャットやプロジェクトと同じく「更新が新しい方を優先」に変更しています。',
        '思考の深さ(Effort)を「OFF（思考なし）」にしていても、再読み込み後に設定画面上で「high」に戻って見える不具合を修正しました。',
        '※ 上記により、Anthropicのプロンプトキャッシュが設定の巻き戻りで無駄に切れることがなくなります（ページ再読み込み自体ではキャッシュは切れません）。',
    ],
    '1.33': [
        '思考の深さ(Effort)を、選択中のClaudeモデルで使えるレベルだけ表示するように改善。xhighはOpus 4.7以降、Effort自体はOpus 4.6以降/Sonnet 4.6のみ対応で、非対応のモデルでは自動的に選べなくなり、注意書きも表示されます。非対応レベルが設定に残っていてもAPI送信時に対応レベルへ自動調整するため400エラーになりません（※Opus 4.8 は max も xhigh も使えます）。',
    ],
    '1.32': [
        'Claude Opus 5 に対応。Anthropicのモデル一覧に「Claude Opus 5 / 4.8」を追加しました。',
        'Anthropic新世代モデル（Opus 4.7/4.8/5 等）で temperature が廃止され送ると400エラーになる問題に対応（該当モデルでは temperature を送信しないよう修正）。これまで Opus 4.7 選択時に失敗し得た不具合も解消。',
        '思考の深さ(Effort)に「xhigh（高品質・コーディング向け）」を追加。Opus 5 で選べる5段階（low/medium/high/xhigh/max）に対応しました。',
        'Opus 5 は思考がデフォルトONのため、Effort「OFF」を選んだときは明示的に思考を停止するよう修正（意図せず思考が走るのを防止）。',
    ],
    '1.31': [
        'モデルの★お気に入りを追加。設定のモデル名の横の★ボタンで、よく使うモデルを登録できます。お気に入りはドロップダウンの先頭「★ お気に入り」グループに固定表示され、チャットヘッダーのモデル選択にも反映されるので素早く選べます（プロバイダーごとに表示）。',
    ],
    '1.30': [
        '提供終了モデルの実行時サルベージを追加。送信や要約の途中でモデルが提供終了していた場合、「失敗」で終わらせず後継モデルへの切替を案内します。既知の廃止（gemini-3-pro-preview など）は後継へ自動切替、それ以外はそのプロバイダーの現行モデルを提案して確認します（勝手に別モデルへ切り替えて想定外の課金にはしません）。要約はそのまま自動で再試行します。',
    ],
    1.29: [
        '要約・メモリ自動学習を全プロバイダー対応に。これまで Gemini（＋要約は DeepSeek）専用だったため、Claude 等に切り替えると要約が失敗していました。今後は選択中のプロバイダー（Anthropic/OpenAI/Groq/xAI/Mistral/OpenRouter/Sakana 等）で動作します。Gemini キーがなくても Claude だけで完結できます。要約用モデルに Claude（haiku/sonnet/opus）を選べるようになり、モデル名からプロバイダーを自動判定します。',
        '提供終了した gemini-3-pro-preview を後継の gemini-3.1-pro-preview へ自動移行。設定・要約モデルにこのモデルが残っていると「要約の生成に失敗しました（no longer available）」が出ていた問題を修正。モデル一覧からも削除しました。',
    ],
    1.27: [
        '会話統計(ⓘ)ダイアログの下部に「API使用量・料金の確認」リンクを追加。OpenAI / Claude / Gemini / OpenRouter / DeepSeek の各使用量ページへワンタップで移動できます（推定コストの実額確認用）。',
    ],
    1.26: [
        'DeepSeek（v4-pro / v4-flash）の時間帯料金に対応。会話統計(ⓘ)の推定コストで、ピーク時間帯（日本時間 10:00〜13:00 / 15:00〜19:00）のメッセージは通常の2倍で計算します。各メッセージの送信時刻をもとに自動判定します。',
    ],
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
