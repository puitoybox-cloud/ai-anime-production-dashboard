import { type ChangeEvent, type PointerEvent, useEffect, useRef, useState } from 'react';

type ProductionStatus = '未着手' | '作業中' | '確認中' | '完了';
type ViduDifficulty = '低' | '中' | '高';
type AssetType = 'character' | 'background' | 'prop' | 'costume' | 'image' | 'video' | 'audio' | 'voice' | 'document' | 'prompt' | 'logo' | 'effect' | 'other';
type AssetStatus = '候補' | '採用' | '不採用' | '修正中' | '完成';
type PromptAiType = 'chatgpt' | 'vidu' | 'image' | 'video' | 'codex' | 'gemini' | 'notebooklm' | 'music' | 'other';
type PromptTemplateId = 'character-lock' | 'background-lock' | 'image-generation' | 'video-generation' | 'vidu-animation' | 'camera-work' | 'expression-variants' | 'clip-studio' | 'final-cut' | 'logic-pro' | 'chatgpt-script' | 'codex-request' | 'blank';
type CreationMethod = 'AI生成' | '手描き' | 'Clip Studio修正' | 'Vidu生成' | 'Logic Pro制作' | 'Final Cut Pro編集' | 'その他';
type ViewMode = 'work-list' | 'episode-list' | 'scene-list' | 'scene-edit' | 'asset-library' | 'prompt-library';
type ProductionStepId = 'script' | 'storyboard' | 'illustration' | 'ai-generation' | 'clip-studio' | 'final-cut' | 'logic-pro' | 'final-check';
type ImportMode = 'add-new' | 'update-content' | 'replace-scope';
type ExportKind = 'full-backup' | 'chatgpt-share';
type ExportScope = 'all' | 'work' | 'prompt-library' | 'selected-prompts' | 'asset-library' | 'episode' | 'scene' | 'production-step' | 'asset' | 'selected-assets';

type ImageReference = {
  label: string;
  source: string;
  memo: string;
};

type ProductionStep = {
  id: ProductionStepId;
  name: string;
  status: ProductionStatus;
  memo: string;
  relatedAssets: string;
  relatedAssetIds: string[];
  relatedPrompts: string;
  relatedPromptIds: string[];
  updatedAt: string;
};

type Asset = {
  id: string;
  title: string;
  reading: string;
  type: AssetType;
  status: AssetStatus;
  fileName: string;
  source: string;
  externalReference: string;
  thumbnailUrl: string;
  thumbnailLabel: string;
  thumbnailMemo: string;
  description: string;
  memo: string;
  tags: string[];
  adopted: boolean;
  favorite: boolean;
  creationMethod: CreationMethod;
  software: string;
  creationAi: string;
  sourceAssetId: string;
  relatedPromptIds: string[];
  versionName: string;
  japanesePrompt: string;
  englishPrompt: string;
  negativePrompt: string;
  consistencyMemo: string;
  character: { age: string; gender: string; species: string; height: string; role: string; personality: string; firstPerson: string; secondPerson: string; speechStyle: string; appearance: string; costume: string; props: string; features: string; background: string; memo: string; };
  createdAt: string;
  updatedAt: string;
};

type Scene = {
  id: string;
  title: string;
  summary: string;
  tiaLine: string;
  novaLine: string;
  decisions: string;
  openIssues: string;
  memo: string;
  productionStatus: ProductionStatus;
  progressPercent: number;
  viduDifficulty: ViduDifficulty;
  thumbnail: ImageReference;
  tags: string[];
  favorite: boolean;
  productionMemo: string;
  productionSteps: ProductionStep[];
  assets: Asset[];
  assetIds: string[];
  promptIds: string[];
  createdAt: string;
  updatedAt: string;
};

type Episode = {
  id: string;
  episodeNumber: number;
  title: string;
  summary: string;
  productionStatus: ProductionStatus;
  thumbnail: ImageReference;
  tags: string[];
  favorite: boolean;
  productionMemo: string;
  scenes: Scene[];
  createdAt: string;
  updatedAt: string;
};

type Work = {
  id: string;
  title: string;
  description: string;
  productionStatus: ProductionStatus;
  thumbnail: ImageReference;
  tags: string[];
  favorite: boolean;
  productionMemo: string;
  episodes: Episode[];
  assetLibrary: Asset[];
  promptLibrary: PromptItem[];
  promptTemplates: PromptTemplate[];
  promptHistory: PromptHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

type PromptItem = { id: string; title: string; aiType: PromptAiType; purpose: string; description: string; memo: string; tags: string[]; favorite: boolean; status: AssetStatus; japanesePrompt: string; englishPrompt: string; negativePrompt: string; referencePrompt: string; consistencyMemo: string; characterLockMemo: string; backgroundLockMemo: string; cameraCompositionMemo: string; motionMemo: string; artStyleMemo: string; outputSettingsMemo: string; usedAi: string; usedModel: string; versionName: string; seed: string; aspectRatio: string; resolution: string; duration: string; fps: string; resultUrl: string; resultFileName: string; resultThumbnailUrl: string; resultMemo: string; adoptedResult: boolean; relatedAssetId: string; sourcePromptId: string; derivedPromptId: string; createdAt: string; updatedAt: string; };
type PromptTemplate = { id: PromptTemplateId; name: string; aiType: PromptAiType; purpose: string; initial: Partial<PromptItem>; };
type PromptHistoryEntry = { id: string; promptId: string; changedAt: string; before: PromptItem; after: PromptItem; versionName: string; changeMemo: string; };

type DashboardData = {
  schemaVersion: '0.7';
  appName: 'Dream Architect Studio';
  works: Work[];
  createdAt: string;
  updatedAt: string;
};

type ProjectDataV02 = {
  schemaVersion?: string;
  workTitle: string;
  episodeTitle: string;
  scenes: Array<Partial<Scene> & { id?: string | number }>;
};

type ImportEnvelope = {
  schemaVersion?: string;
  exportType?: ExportKind;
  scope?: ExportScope;
  workId?: string;
  episodeId?: string;
  sceneId?: string;
  data?: unknown;
};

const STORAGE_KEY_V02 = 'ai-anime-production-dashboard:v0.1';
const STORAGE_KEY_V03 = 'dream-architect-studio:v0.3';
const STORAGE_KEY_V04 = 'dream-architect-studio:v0.4';
const STORAGE_KEY_V05 = 'dream-architect-studio:v0.5';
const STORAGE_KEY_V06 = 'dream-architect-studio:v0.6';
const STORAGE_KEY_V07 = 'dream-architect-studio:v0.7';
const MIGRATION_BACKUP_KEY = 'dream-architect-studio:migration-backup:v0.2';
const PRE_IMPORT_BACKUP_KEY = 'dream-architect-studio:pre-import-backup';
const SCHEMA_VERSION = '0.7' as const;

const emptyImageReference: ImageReference = { label: '', source: '', memo: '' };
const emptySceneText = { summary: '', tiaLine: '', novaLine: '', decisions: '', openIssues: '', memo: '' };
const productionStepDefinitions: Array<{ id: ProductionStepId; name: string }> = [
  { id: 'script', name: '台本' },
  { id: 'storyboard', name: '絵コンテ' },
  { id: 'illustration', name: 'イラスト' },
  { id: 'ai-generation', name: 'AI生成' },
  { id: 'clip-studio', name: 'Clip Studio修正' },
  { id: 'final-cut', name: 'Final Cut編集' },
  { id: 'logic-pro', name: 'Logic Pro' },
  { id: 'final-check', name: '完成チェック' },
];
const statusProgress: Record<ProductionStatus, number> = { '未着手': 0, '作業中': 40, '確認中': 70, '完了': 100 };

const assetTypes: AssetType[] = ['character', 'background', 'prop', 'costume', 'image', 'video', 'audio', 'voice', 'document', 'prompt', 'logo', 'effect', 'other'];
const assetTypeLabels: Record<AssetType, string> = { character: 'キャラクター', background: '背景', prop: '小物', costume: '衣装', image: '画像', video: '動画', audio: '音声・BGM・SE', voice: 'ボイス', document: 'PDF・台本・資料', prompt: 'AIプロンプト', logo: 'ロゴ', effect: 'エフェクト', other: 'その他' };
const assetStatuses: AssetStatus[] = ['候補', '採用', '不採用', '修正中', '完成'];
const creationMethods: CreationMethod[] = ['AI生成', '手描き', 'Clip Studio修正', 'Vidu生成', 'Logic Pro制作', 'Final Cut Pro編集', 'その他'];

const promptAiTypes: PromptAiType[] = ['chatgpt', 'vidu', 'image', 'video', 'codex', 'gemini', 'notebooklm', 'music', 'other'];
const promptAiLabels: Record<PromptAiType, string> = { chatgpt: 'ChatGPT用', vidu: 'Vidu用', image: '画像生成AI用', video: '動画生成AI用', codex: 'Codex用', gemini: 'Gemini用', notebooklm: 'NotebookLM用', music: '音楽生成AI用', other: 'その他' };
const promptTemplateLabels: Record<PromptTemplateId, string> = { 'character-lock': 'キャラクター固定', 'background-lock': '背景固定', 'image-generation': '画像生成', 'video-generation': '動画生成', 'vidu-animation': 'Viduアニメーション', 'camera-work': 'カメラワーク', 'expression-variants': '表情差分', 'clip-studio': 'Clip Studio修正指示', 'final-cut': 'Final Cut編集メモ', 'logic-pro': 'Logic Pro音楽指示', 'chatgpt-script': 'ChatGPT台本作成', 'codex-request': 'Codex実装依頼', blank: '空のテンプレート' };
function defaultPromptTemplates(): PromptTemplate[] { return (Object.keys(promptTemplateLabels) as PromptTemplateId[]).map((id) => ({ id, name: promptTemplateLabels[id], aiType: id.includes('vidu') ? 'vidu' : id.includes('codex') ? 'codex' : id.includes('chatgpt') ? 'chatgpt' : id.includes('logic') ? 'music' : id.includes('video') ? 'video' : 'image', purpose: promptTemplateLabels[id], initial: id === 'blank' ? {} : { japanesePrompt: `【${promptTemplateLabels[id]}】\n目的：\n条件：\n避けたいこと：`, englishPrompt: `[${promptTemplateLabels[id]}]\nGoal:\nRequirements:\nAvoid:`, consistencyMemo: '一貫性を保つための固定条件を記録。' } })); }
function migratePrompt(raw: Partial<PromptItem> & { id?: string | number }, index: number): PromptItem { const t = typeof raw.createdAt === 'string' ? raw.createdAt : nowIso(); const ai = promptAiTypes.includes(raw.aiType as PromptAiType) ? raw.aiType as PromptAiType : 'chatgpt'; return { id: String(raw.id ?? createId('prompt')), title: typeof raw.title === 'string' ? raw.title : `新しいプロンプト ${index + 1}`, aiType: ai, purpose: typeof raw.purpose === 'string' ? raw.purpose : '', description: typeof raw.description === 'string' ? raw.description : '', memo: typeof raw.memo === 'string' ? raw.memo : '', tags: readTags(raw.tags), favorite: Boolean(raw.favorite), status: isAssetStatus(raw.status) ? raw.status : '候補', japanesePrompt: raw.japanesePrompt ?? '', englishPrompt: raw.englishPrompt ?? '', negativePrompt: raw.negativePrompt ?? '', referencePrompt: raw.referencePrompt ?? '', consistencyMemo: raw.consistencyMemo ?? '', characterLockMemo: raw.characterLockMemo ?? '', backgroundLockMemo: raw.backgroundLockMemo ?? '', cameraCompositionMemo: raw.cameraCompositionMemo ?? '', motionMemo: raw.motionMemo ?? '', artStyleMemo: raw.artStyleMemo ?? '', outputSettingsMemo: raw.outputSettingsMemo ?? '', usedAi: raw.usedAi ?? '', usedModel: raw.usedModel ?? '', versionName: raw.versionName ?? '', seed: raw.seed ?? '', aspectRatio: raw.aspectRatio ?? '', resolution: raw.resolution ?? '', duration: raw.duration ?? '', fps: raw.fps ?? '', resultUrl: raw.resultUrl ?? '', resultFileName: raw.resultFileName ?? '', resultThumbnailUrl: raw.resultThumbnailUrl ?? '', resultMemo: raw.resultMemo ?? '', adoptedResult: Boolean(raw.adoptedResult), relatedAssetId: raw.relatedAssetId ?? '', sourcePromptId: raw.sourcePromptId ?? '', derivedPromptId: raw.derivedPromptId ?? '', createdAt: t, updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : t }; }
function createPrompt(template?: PromptTemplate): PromptItem { return migratePrompt({ id: createId('prompt'), title: template ? `${template.name}プロンプト` : '新しいプロンプト', aiType: template?.aiType, purpose: template?.purpose, ...template?.initial }, 0); }
function migratePromptHistory(value: unknown): PromptHistoryEntry[] { return Array.isArray(value) ? value.filter((x): x is PromptHistoryEntry => !!x && typeof x === 'object' && typeof (x as any).promptId === 'string').slice(-20) : []; }


const dummyScenes: Array<Omit<Scene, 'thumbnail' | 'tags' | 'favorite' | 'productionMemo' | 'productionSteps' | 'assets' | 'assetIds' | 'promptIds' | 'createdAt' | 'updatedAt'>> = [
  { id: '1', title: '第0話-場面1：目覚めるティア', summary: 'ティアが白い実験室のような空間で目を覚まし、自分の記憶が曖昧なことに気づく。', tiaLine: 'ここは……どこ？ 私は、何をしていたの？', novaLine: '落ち着いて。君の状態は安定している。まずは呼吸を整えよう。', decisions: '冒頭は静かな雰囲気で開始。ティアの不安を中心に見せる。', openIssues: '実験室の具体的な美術設定を決める。', memo: '光は柔らかく、少し神秘的にする。', productionStatus: '作業中', progressPercent: 50, viduDifficulty: '中' },
  { id: '2', title: '第0話-場面2：ノヴァとの出会い', summary: 'ティアの前に案内役のノヴァが現れ、状況を説明しようとする。', tiaLine: 'あなたは誰？ 私を知っているの？', novaLine: '僕はノヴァ。君をここから導くために作られたサポートAIだ。', decisions: 'ノヴァは落ち着いた声で、敵ではない印象を出す。', openIssues: 'ノヴァのビジュアル表現を人型にするかホログラムにするか。', memo: '会話テンポはゆっくり。', productionStatus: '未着手', progressPercent: 0, viduDifficulty: '低' },
  { id: '3', title: '第0話-場面3：外の世界', summary: '壁面スクリーンに、崩壊した都市と美しい空が映し出される。', tiaLine: 'これが……外の世界？', novaLine: '正確には、君がこれから向き合う世界の記録だ。', decisions: '世界観提示のため、印象的なワイドショットを入れる。', openIssues: '都市崩壊の程度と時代感を調整する。', memo: 'Vidu生成では背景変化が多いため難易度高め。', productionStatus: '確認中', progressPercent: 50, viduDifficulty: '高' },
  { id: '4', title: '第0話-場面4：最初の選択', summary: 'ティアは記憶を取り戻すため、ノヴァと共に施設を出る決意をする。', tiaLine: '怖いけど……知らないままでは進めない。行くよ。', novaLine: 'その選択を記録した。扉を開く。', decisions: 'ティアの主体性が出る場面にする。', openIssues: '扉が開く演出の音と光を決める。', memo: '感情の切り替わりを丁寧に。', productionStatus: '未着手', progressPercent: 0, viduDifficulty: '中' },
  { id: '5', title: '第0話-場面5：タイトルへ', summary: '施設の扉が開き、強い光の中へ歩き出すティアとノヴァ。第0話のタイトルが表示される。', tiaLine: '私の物語は、ここから始まるんだね。', novaLine: 'そう。これは、失われた記憶を探す旅の始まりだ。', decisions: '最後に作品タイトルへつなぐ。', openIssues: 'タイトル表示の文言とタイミング。', memo: '短いが印象に残る締めにする。', productionStatus: '完了', progressPercent: 100, viduDifficulty: '低' },
];

function nowIso() { return new Date().toISOString(); }
function createId(prefix: string) { return `${prefix}-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }
function isProductionStatus(value: unknown): value is ProductionStatus { return value === '未着手' || value === '作業中' || value === '確認中' || value === '完了'; }
function isViduDifficulty(value: unknown): value is ViduDifficulty { return value === '低' || value === '中' || value === '高'; }
function isAssetType(value: unknown): value is AssetType { return typeof value === 'string' && assetTypes.includes(value as AssetType); }
function inferProgress(status: ProductionStatus) { return statusProgress[status]; }
function createProductionSteps(status: ProductionStatus = '未着手'): ProductionStep[] { const timestamp = nowIso(); return productionStepDefinitions.map((step) => ({ ...step, status, memo: '', relatedAssets: '', relatedAssetIds: [], relatedPrompts: '', relatedPromptIds: [], updatedAt: timestamp })); }
function migrateProductionSteps(value: unknown, fallbackStatus: ProductionStatus): ProductionStep[] {
  const source = Array.isArray(value) ? value : [];
  return productionStepDefinitions.map((definition) => {
    const raw = source.find((item) => item && typeof item === 'object' && (item as Partial<ProductionStep>).id === definition.id) as Partial<ProductionStep> | undefined;
    return {
      ...definition,
      status: isProductionStatus(raw?.status) ? raw.status : fallbackStatus,
      memo: typeof raw?.memo === 'string' ? raw.memo : '',
      relatedAssets: typeof raw?.relatedAssets === 'string' ? raw.relatedAssets : '',
      relatedAssetIds: readTags((raw as any)?.relatedAssetIds),
      relatedPrompts: typeof raw?.relatedPrompts === 'string' ? raw.relatedPrompts : '',
      relatedPromptIds: readTags((raw as any)?.relatedPromptIds),
      updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : nowIso(),
    };
  });
}
function calculateSceneProgress(steps: ProductionStep[]) { return steps.length ? Math.round(steps.reduce((sum, step) => sum + statusProgress[step.status], 0) / steps.length) : 0; }
function inferSceneStatusFromSteps(steps: ProductionStep[]): ProductionStatus { if (steps.every((step) => step.status === '完了')) return '完了'; if (steps.some((step) => step.status === '確認中')) return '確認中'; if (steps.some((step) => step.status === '作業中')) return '作業中'; return '未着手'; }
function clampProgress(value: unknown, fallback: number) { const numberValue = typeof value === 'number' ? value : Number(value); if (!Number.isFinite(numberValue)) return fallback; return Math.min(100, Math.max(0, Math.round(numberValue))); }
function cloneImage(value?: Partial<ImageReference>): ImageReference { return { label: typeof value?.label === 'string' ? value.label : '', source: typeof value?.source === 'string' ? value.source : '', memo: typeof value?.memo === 'string' ? value.memo : '' }; }
function readTags(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }


function emptyCharacterFields() { return { age: '', gender: '', species: '', height: '', role: '', personality: '', firstPerson: '', secondPerson: '', speechStyle: '', appearance: '', costume: '', props: '', features: '', background: '', memo: '' }; }
function isAssetStatus(value: unknown): value is AssetStatus { return typeof value === 'string' && assetStatuses.includes(value as AssetStatus); }
function isCreationMethod(value: unknown): value is CreationMethod { return typeof value === 'string' && creationMethods.includes(value as CreationMethod); }
function migrateAsset(raw: Partial<Asset> & { id?: string | number; name?: string }, index: number): Asset {
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : nowIso();
  const character = { ...emptyCharacterFields(), ...(raw.character && typeof raw.character === 'object' ? raw.character : {}) } as Asset['character'];
  const status = isAssetStatus(raw.status) ? raw.status : (raw.adopted ? '採用' : '候補');
  return {
    id: String(raw.id ?? `asset-${index + 1}`), title: typeof raw.title === 'string' ? raw.title : typeof raw.name === 'string' ? raw.name : '新しいアセット', reading: typeof raw.reading === 'string' ? raw.reading : '', type: isAssetType(raw.type) ? raw.type : 'image', status,
    fileName: typeof raw.fileName === 'string' ? raw.fileName : '', source: typeof raw.source === 'string' ? raw.source : '', externalReference: typeof raw.externalReference === 'string' ? raw.externalReference : '', thumbnailUrl: typeof raw.thumbnailUrl === 'string' ? raw.thumbnailUrl : '', thumbnailLabel: typeof raw.thumbnailLabel === 'string' ? raw.thumbnailLabel : '', thumbnailMemo: typeof raw.thumbnailMemo === 'string' ? raw.thumbnailMemo : '',
    description: typeof raw.description === 'string' ? raw.description : '', memo: typeof raw.memo === 'string' ? raw.memo : '', tags: readTags(raw.tags), adopted: status === '採用' || Boolean(raw.adopted), favorite: Boolean(raw.favorite),
    creationMethod: isCreationMethod(raw.creationMethod) ? raw.creationMethod : 'AI生成', software: typeof raw.software === 'string' ? raw.software : '', creationAi: typeof raw.creationAi === 'string' ? raw.creationAi : '', sourceAssetId: typeof raw.sourceAssetId === 'string' ? raw.sourceAssetId : '', relatedPromptIds: readTags((raw as any).relatedPromptIds), versionName: typeof raw.versionName === 'string' ? raw.versionName : '', japanesePrompt: typeof raw.japanesePrompt === 'string' ? raw.japanesePrompt : '', englishPrompt: typeof raw.englishPrompt === 'string' ? raw.englishPrompt : '', negativePrompt: typeof raw.negativePrompt === 'string' ? raw.negativePrompt : '', consistencyMemo: typeof raw.consistencyMemo === 'string' ? raw.consistencyMemo : '', character, createdAt, updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  };
}
function createAsset(id = createId('asset')): Asset { return migrateAsset({ id, title: '新しいアセット' }, 0); }

function parseTags(value: string) { return value.split(',').map((tag) => tag.trim()).filter(Boolean); }
function tagsText(tags: string[]) { return tags.join(', '); }
function formatDate(value: string) { return value ? new Date(value).toLocaleString('ja-JP') : '未設定'; }
function averageProgress(scenes: Scene[]) { return scenes.length ? Math.round(scenes.reduce((sum, scene) => sum + scene.progressPercent, 0) / scenes.length) : 0; }
function workScenes(work: Work) { return work.episodes.flatMap((episode) => episode.scenes); }
function workProgress(work: Work) { return averageProgress(workScenes(work)); }
function episodeProgress(episode: Episode) { return averageProgress(episode.scenes); }
function inferStatus(scenes: Scene[]): ProductionStatus { if (scenes.length && scenes.every((scene) => scene.productionStatus === '完了')) return '完了'; if (scenes.some((scene) => scene.productionStatus === '確認中')) return '確認中'; if (scenes.some((scene) => scene.productionStatus === '作業中')) return '作業中'; return '未着手'; }

function migrateScene(raw: Partial<Scene> & { id?: string | number }, index: number): Scene {
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : nowIso();
  const productionStatus = isProductionStatus(raw.productionStatus) ? raw.productionStatus : '未着手';
  const productionSteps = migrateProductionSteps((raw as Partial<Scene>).productionSteps, productionStatus);
  const calculatedProgress = calculateSceneProgress(productionSteps);
  return {
    id: String(raw.id ?? `scene-${index + 1}`),
    title: typeof raw.title === 'string' ? raw.title : '新しい場面',
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    tiaLine: typeof raw.tiaLine === 'string' ? raw.tiaLine : '',
    novaLine: typeof raw.novaLine === 'string' ? raw.novaLine : '',
    decisions: typeof raw.decisions === 'string' ? raw.decisions : '',
    openIssues: typeof raw.openIssues === 'string' ? raw.openIssues : '',
    memo: typeof raw.memo === 'string' ? raw.memo : '',
    productionStatus: inferSceneStatusFromSteps(productionSteps),
    progressPercent: calculatedProgress,
    viduDifficulty: isViduDifficulty(raw.viduDifficulty) ? raw.viduDifficulty : '低',
    thumbnail: cloneImage(raw.thumbnail),
    tags: readTags(raw.tags),
    favorite: Boolean(raw.favorite),
    productionMemo: typeof raw.productionMemo === 'string' ? raw.productionMemo : '',
    productionSteps,
    assets: Array.isArray((raw as Partial<Scene>).assets) ? ((raw as Partial<Scene>).assets ?? []).map((asset, assetIndex) => migrateAsset(asset, assetIndex)) : [],
    assetIds: readTags((raw as Partial<Scene> & { assetIds?: unknown }).assetIds),
    promptIds: readTags((raw as any).promptIds),
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  };
}

function createScene(id = createId('scene')): Scene { return migrateScene({ id, title: '新しい場面', ...emptySceneText }, 0); }
function createEpisode(episodeNumber: number): Episode { const timestamp = nowIso(); return { id: createId('episode'), episodeNumber, title: `第${episodeNumber}話`, summary: '', productionStatus: '未着手', thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', scenes: [createScene()], createdAt: timestamp, updatedAt: timestamp }; }
function createWork(): Work { const timestamp = nowIso(); return { id: createId('work'), title: '新しい作品', description: '', productionStatus: '未着手', thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', episodes: [createEpisode(0)], assetLibrary: [], promptLibrary: [], promptTemplates: defaultPromptTemplates(), promptHistory: [], createdAt: timestamp, updatedAt: timestamp }; }

function createDefaultDashboardData(): DashboardData {
  const timestamp = nowIso();
  const scenes = dummyScenes.map((scene, index) => migrateScene(scene, index));
  return { schemaVersion: SCHEMA_VERSION, appName: 'Dream Architect Studio', createdAt: timestamp, updatedAt: timestamp, works: [{ id: 'work-tia-nova-production-diary', title: 'ティア・ノヴァのAIアニメ制作日誌', description: 'AIアニメ制作の試行錯誤を記録する作品。', productionStatus: inferStatus(scenes), thumbnail: { ...emptyImageReference }, tags: ['AIアニメ'], favorite: true, productionMemo: '', assetLibrary: [], promptLibrary: [], promptTemplates: defaultPromptTemplates(), promptHistory: [], episodes: [{ id: 'episode-0', episodeNumber: 0, title: '第0話', summary: '', productionStatus: inferStatus(scenes), thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', scenes, createdAt: timestamp, updatedAt: timestamp }], createdAt: timestamp, updatedAt: timestamp }] };
}

function migrateV02Project(raw: unknown): DashboardData | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as ProjectDataV02;
  if (typeof source.workTitle !== 'string' || !Array.isArray(source.scenes)) return null;
  const timestamp = nowIso();
  const scenes = source.scenes.map((scene, index) => migrateScene(scene, index));
  const safeScenes = scenes.length > 0 ? scenes : [createScene('1')];
  return { schemaVersion: SCHEMA_VERSION, appName: 'Dream Architect Studio', createdAt: timestamp, updatedAt: timestamp, works: [{ id: 'work-tia-nova-production-diary', title: 'ティア・ノヴァのAIアニメ制作日誌', description: source.workTitle ? `Version 0.2から移行。旧作品名：${source.workTitle}` : 'Version 0.2から移行した作品。', productionStatus: inferStatus(safeScenes), thumbnail: { ...emptyImageReference }, tags: ['移行データ'], favorite: true, productionMemo: 'Version 0.2の保存データを保持して自動移行しました。', assetLibrary: [], promptLibrary: [], promptTemplates: defaultPromptTemplates(), promptHistory: [], episodes: [{ id: 'episode-0', episodeNumber: 0, title: typeof source.episodeTitle === 'string' ? source.episodeTitle : '第0話', summary: '', productionStatus: inferStatus(safeScenes), thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', scenes: safeScenes, createdAt: timestamp, updatedAt: timestamp }], createdAt: timestamp, updatedAt: timestamp }] };
}

function normalizeDashboard(raw: unknown): DashboardData | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Partial<DashboardData>;
  if ((source.schemaVersion !== SCHEMA_VERSION && source.schemaVersion !== '0.6' && source.schemaVersion !== '0.5' && source.schemaVersion !== '0.4' && source.schemaVersion !== '0.3') || !Array.isArray(source.works)) return null;
  const timestamp = typeof source.updatedAt === 'string' ? source.updatedAt : nowIso();
  return { schemaVersion: SCHEMA_VERSION, appName: 'Dream Architect Studio', createdAt: typeof source.createdAt === 'string' ? source.createdAt : timestamp, updatedAt: timestamp, works: source.works.map((work, workIndex) => ({ id: typeof work.id === 'string' ? work.id : `work-${workIndex + 1}`, title: typeof work.title === 'string' ? work.title : '新しい作品', description: typeof work.description === 'string' ? work.description : '', productionStatus: isProductionStatus(work.productionStatus) ? work.productionStatus : '未着手', thumbnail: cloneImage(work.thumbnail), tags: readTags(work.tags), favorite: Boolean(work.favorite), productionMemo: typeof work.productionMemo === 'string' ? work.productionMemo : '', assetLibrary: Array.isArray((work as any).assetLibrary) ? (work as any).assetLibrary.map((asset: any, assetIndex: number) => migrateAsset(asset, assetIndex)) : [], promptLibrary: Array.isArray((work as any).promptLibrary) ? (work as any).promptLibrary.map((prompt: any, promptIndex: number) => migratePrompt(prompt, promptIndex)) : [], promptTemplates: Array.isArray((work as any).promptTemplates) ? (work as any).promptTemplates : defaultPromptTemplates(), promptHistory: migratePromptHistory((work as any).promptHistory), createdAt: typeof work.createdAt === 'string' ? work.createdAt : timestamp, updatedAt: typeof work.updatedAt === 'string' ? work.updatedAt : timestamp, episodes: Array.isArray(work.episodes) && work.episodes.length ? work.episodes.map((episode, episodeIndex) => ({ id: typeof episode.id === 'string' ? episode.id : `episode-${episodeIndex}`, episodeNumber: typeof episode.episodeNumber === 'number' ? episode.episodeNumber : episodeIndex, title: typeof episode.title === 'string' ? episode.title : `第${episodeIndex}話`, summary: typeof episode.summary === 'string' ? episode.summary : '', productionStatus: isProductionStatus(episode.productionStatus) ? episode.productionStatus : '未着手', thumbnail: cloneImage(episode.thumbnail), tags: readTags(episode.tags), favorite: Boolean(episode.favorite), productionMemo: typeof episode.productionMemo === 'string' ? episode.productionMemo : '', scenes: Array.isArray(episode.scenes) && episode.scenes.length ? episode.scenes.map((scene, sceneIndex) => migrateScene(scene, sceneIndex)) : [createScene()], createdAt: typeof episode.createdAt === 'string' ? episode.createdAt : timestamp, updatedAt: typeof episode.updatedAt === 'string' ? episode.updatedAt : timestamp })) : [createEpisode(0)] })) };
}

function loadInitialData(): DashboardData {
  const savedV07 = localStorage.getItem(STORAGE_KEY_V07);
  if (savedV07) { try { return normalizeDashboard(JSON.parse(savedV07)) ?? createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV06 = localStorage.getItem(STORAGE_KEY_V06);
  if (savedV06) { try { return normalizeDashboard(JSON.parse(savedV06)) ?? createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV05 = localStorage.getItem(STORAGE_KEY_V05);
  if (savedV05) { try { return normalizeDashboard(JSON.parse(savedV05)) ?? createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV04 = localStorage.getItem(STORAGE_KEY_V04);
  if (savedV04) { try { return normalizeDashboard(JSON.parse(savedV04)) ?? createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV03 = localStorage.getItem(STORAGE_KEY_V03);
  if (savedV03) { try { const migrated = normalizeDashboard(JSON.parse(savedV03)); if (migrated) { localStorage.setItem(STORAGE_KEY_V07, JSON.stringify(migrated)); return migrated; } return createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV02 = localStorage.getItem(STORAGE_KEY_V02);
  if (savedV02) {
    try {
      localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify({ backedUpAt: nowIso(), storageKey: STORAGE_KEY_V02, raw: savedV02 }));
      const migrated = migrateV02Project(JSON.parse(savedV02));
      if (migrated) { localStorage.setItem(STORAGE_KEY_V07, JSON.stringify(migrated)); return migrated; }
    } catch { /* Keep the old key untouched and fall back to default v0.3 data. */ }
  }
  return createDefaultDashboardData();
}

function downloadJson(data: unknown, filename: string) { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }

export function App() {
  const [dashboard, setDashboard] = useState<DashboardData>(loadInitialData);
  const [viewMode, setViewMode] = useState<ViewMode>('work-list');
  const [selectedWorkId, setSelectedWorkId] = useState(dashboard.works[0]?.id ?? null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(dashboard.works[0]?.episodes[0]?.id ?? null);
  const [selectedSceneId, setSelectedSceneId] = useState(dashboard.works[0]?.episodes[0]?.scenes[0]?.id ?? null);
  const [jsonPanelOpen, setJsonPanelOpen] = useState(false);
  const [exportKind, setExportKind] = useState<ExportKind>('full-backup');
  const [exportScope, setExportScope] = useState<ExportScope>('all');
  const [importMode, setImportMode] = useState<ImportMode>('add-new');
  const [pastedJson, setPastedJson] = useState('');
  const [message, setMessage] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [selectedExportAssetIds, setSelectedExportAssetIds] = useState<string[]>([]);
  const [selectedExportPromptIds, setSelectedExportPromptIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_V07, JSON.stringify(dashboard)); }, [dashboard]);

  const selectedWork = dashboard.works.find((work) => work.id === selectedWorkId) ?? dashboard.works[0];
  const selectedEpisode = selectedWork?.episodes.find((episode) => episode.id === selectedEpisodeId) ?? selectedWork?.episodes[0];
  const selectedScene = selectedEpisode?.scenes.find((scene) => scene.id === selectedSceneId) ?? selectedEpisode?.scenes[0];

  const mutateDashboard = (updater: (current: DashboardData) => DashboardData) => setDashboard((current) => ({ ...updater(current), updatedAt: nowIso() }));
  const updateSelectedWork = (patch: Partial<Work>) => { if (!selectedWork) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id === selectedWork.id ? { ...work, ...patch, updatedAt: nowIso() } : work) })); };
  const updateSelectedEpisode = (patch: Partial<Episode>) => { if (!selectedWork || !selectedEpisode) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id !== selectedWork.id ? work : { ...work, updatedAt: nowIso(), episodes: work.episodes.map((episode) => episode.id === selectedEpisode.id ? { ...episode, ...patch, updatedAt: nowIso() } : episode) }) })); };
  const updateSelectedScene = <K extends keyof Scene>(key: K, value: Scene[K]) => { if (!selectedWork || !selectedEpisode || !selectedScene) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id !== selectedWork.id ? work : { ...work, updatedAt: nowIso(), episodes: work.episodes.map((episode) => episode.id !== selectedEpisode.id ? episode : { ...episode, updatedAt: nowIso(), scenes: episode.scenes.map((scene) => { if (scene.id !== selectedScene.id) return scene; const next = { ...scene, [key]: value, updatedAt: nowIso() } as Scene; if (key === 'productionSteps') { next.progressPercent = calculateSceneProgress(next.productionSteps); next.productionStatus = inferSceneStatusFromSteps(next.productionSteps); } return next; }) }) }) })); };

  const openWork = (work: Work) => { setSelectedWorkId(work.id); setSelectedEpisodeId(work.episodes[0]?.id ?? null); setSelectedSceneId(work.episodes[0]?.scenes[0]?.id ?? null); setViewMode('episode-list'); };
  const openEpisode = (episode: Episode) => { setSelectedEpisodeId(episode.id); setSelectedSceneId(episode.scenes[0]?.id ?? null); setViewMode('scene-list'); };
  const openScene = (scene: Scene) => { setSelectedSceneId(scene.id); setViewMode('scene-edit'); };

  const addWork = () => { const work = createWork(); mutateDashboard((current) => ({ ...current, works: [...current.works, work] })); openWork(work); };
  const deleteWork = (workId: string) => { if (dashboard.works.length <= 1) return window.alert('最後の1作品は削除できません。'); const work = dashboard.works.find((item) => item.id === workId); if (!work || !window.confirm(`作品「${work.title}」を削除します。元に戻せません。よろしいですか？`)) return; mutateDashboard((current) => ({ ...current, works: current.works.filter((item) => item.id !== workId) })); setViewMode('work-list'); };
  const addEpisode = () => { if (!selectedWork) return; const episode = createEpisode(selectedWork.episodes.reduce((max, item) => Math.max(max, item.episodeNumber), -1) + 1); mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id === selectedWork.id ? { ...work, episodes: [...work.episodes, episode], updatedAt: nowIso() } : work) })); openEpisode(episode); };
  const deleteEpisode = (episodeId: string) => { if (!selectedWork) return; if (selectedWork.episodes.length <= 1) return window.alert('最後の1話は削除できません。'); const episode = selectedWork.episodes.find((item) => item.id === episodeId); if (!episode || !window.confirm(`話数「${episode.title}」を削除します。元に戻せません。よろしいですか？`)) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id === selectedWork.id ? { ...work, episodes: work.episodes.filter((item) => item.id !== episodeId), updatedAt: nowIso() } : work) })); setViewMode('episode-list'); };
  const addScene = () => { if (!selectedWork || !selectedEpisode) return; const scene = createScene(); mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id !== selectedWork.id ? work : { ...work, updatedAt: nowIso(), episodes: work.episodes.map((episode) => episode.id === selectedEpisode.id ? { ...episode, scenes: [...episode.scenes, scene], updatedAt: nowIso() } : episode) }) })); openScene(scene); };
  const deleteScene = (sceneId: string) => { if (!selectedWork || !selectedEpisode) return; if (selectedEpisode.scenes.length <= 1) return window.alert('最後の1場面は削除できません。'); const scene = selectedEpisode.scenes.find((item) => item.id === sceneId); if (!scene || !window.confirm(`場面「${scene.title}」を削除します。元に戻せません。よろしいですか？`)) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id !== selectedWork.id ? work : { ...work, episodes: work.episodes.map((episode) => episode.id === selectedEpisode.id ? { ...episode, scenes: episode.scenes.filter((item) => item.id !== sceneId), updatedAt: nowIso() } : episode), updatedAt: nowIso() }) })); setViewMode('scene-list'); };
  const addAsset = () => { if (!selectedScene) return; const asset = createAsset(); updateSelectedScene('assets', [...selectedScene.assets, asset]); };
  const updateAsset = (assetId: string, patch: Partial<Asset>) => { if (!selectedScene) return; updateSelectedScene('assets', selectedScene.assets.map((asset) => asset.id === assetId ? { ...asset, ...patch, updatedAt: nowIso() } : asset)); };
  const deleteAsset = (assetId: string) => { if (!selectedScene) return; const asset = selectedScene.assets.find((item) => item.id === assetId); if (!asset || !window.confirm(`素材「${asset.title}」を削除します。元に戻せません。よろしいですか？`)) return; updateSelectedScene('assets', selectedScene.assets.filter((item) => item.id !== assetId)); };
  const addLibraryAsset = () => { if (!selectedWork) return; const asset = createAsset(); setSelectedExportAssetIds([asset.id]); updateSelectedWork({ assetLibrary: [...selectedWork.assetLibrary, asset] }); };
  const updateLibraryAsset = (assetId: string, patch: Partial<Asset>) => { if (!selectedWork) return; const status = patch.status; updateSelectedWork({ assetLibrary: selectedWork.assetLibrary.map((asset) => asset.id === assetId ? { ...asset, ...patch, adopted: status ? status === '採用' : asset.adopted, updatedAt: nowIso() } : asset) }); };
  const assetUsage = (assetId: string, work = selectedWork) => {
    const scenes: string[] = []; const steps: string[] = [];
    work?.episodes.forEach((episode) => episode.scenes.forEach((scene) => { if (scene.assetIds.includes(assetId)) scenes.push(`${episode.title} / ${scene.title}`); scene.productionSteps.forEach((step) => { if (step.relatedAssetIds.includes(assetId)) steps.push(`${episode.title} / ${scene.title} / ${step.name}`); }); }));
    return { scenes, steps };
  };
  const promptUsage = (promptId: string, work = selectedWork) => {
    const scenes: string[] = []; const steps: string[] = []; const assets: string[] = [];
    work?.episodes.forEach((episode) => episode.scenes.forEach((scene) => { if (scene.promptIds.includes(promptId)) scenes.push(`${episode.title} / ${scene.title}`); scene.productionSteps.forEach((step) => { if (step.relatedPromptIds.includes(promptId)) steps.push(`${episode.title} / ${scene.title} / ${step.name}`); }); scene.assets.forEach((asset) => { if (asset.relatedPromptIds.includes(promptId)) assets.push(`${episode.title} / ${scene.title} / ${asset.title}`); }); }));
    work?.assetLibrary.forEach((asset) => { if (asset.relatedPromptIds.includes(promptId)) assets.push(asset.title); });
    return { scenes, steps, assets };
  };
  const addPrompt = (templateId: PromptTemplateId = 'blank') => { if (!selectedWork) return; const template = selectedWork.promptTemplates.find((item) => item.id === templateId); const prompt = createPrompt(template); setSelectedExportPromptIds([prompt.id]); updateSelectedWork({ promptLibrary: [prompt, ...selectedWork.promptLibrary] }); };
  const updatePrompt = (promptId: string, patch: Partial<PromptItem>) => { if (!selectedWork) return; const before = selectedWork.promptLibrary.find((item) => item.id === promptId); if (!before) return; const after = { ...before, ...patch, updatedAt: nowIso() }; const history: PromptHistoryEntry = { id: createId('prompt-history'), promptId, changedAt: nowIso(), before, after, versionName: after.versionName || `更新 ${formatDate(after.updatedAt)}`, changeMemo: 'プロンプト編集画面から自動保存' }; updateSelectedWork({ promptLibrary: selectedWork.promptLibrary.map((item) => item.id === promptId ? after : item), promptHistory: [...selectedWork.promptHistory.filter((item) => item.promptId !== promptId).slice(-19), history] }); };
  const deletePrompt = (promptId: string) => { if (!selectedWork) return; const prompt = selectedWork.promptLibrary.find((item) => item.id === promptId); if (!prompt || !window.confirm(`プロンプト「${prompt.title}」を削除します。紐付けIDは残して安全に削除します。よろしいですか？`)) return; updateSelectedWork({ promptLibrary: selectedWork.promptLibrary.filter((item) => item.id !== promptId) }); };
  const restorePrompt = (entry: PromptHistoryEntry) => { if (!window.confirm(`過去版「${entry.versionName}」へ戻しますか？`)) return; updatePrompt(entry.promptId, entry.before); };

  const deleteLibraryAsset = (assetId: string) => { if (!selectedWork) return; const asset = selectedWork.assetLibrary.find((item) => item.id === assetId); if (!asset) return; const usage = assetUsage(assetId); const detail = [...usage.scenes.map((name) => `場面：${name}`), ...usage.steps.map((name) => `工程：${name}`)].join('\n') || '使用中の場面・工程はありません。'; if (!window.confirm(`アセット「${asset.title}」を削除します。\n\n使用状況：\n${detail}\n\n紐付けIDは残して安全に削除します。よろしいですか？`)) return; updateSelectedWork({ assetLibrary: selectedWork.assetLibrary.filter((item) => item.id !== assetId) }); };


  const moveEpisode = (episodeId: string, direction: -1 | 1) => { if (!selectedWork) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => { if (work.id !== selectedWork.id) return work; const index = work.episodes.findIndex((episode) => episode.id === episodeId); const next = index + direction; if (index < 0 || next < 0 || next >= work.episodes.length) return work; const episodes = [...work.episodes]; [episodes[index], episodes[next]] = [episodes[next], episodes[index]]; return { ...work, episodes, updatedAt: nowIso() }; }) })); };
  const moveScene = (sceneId: string, direction: -1 | 1) => { if (!selectedWork || !selectedEpisode) return; moveSceneToIndex(sceneId, selectedEpisode.scenes.findIndex((scene) => scene.id === sceneId) + direction); };
  const moveSceneToIndex = (sceneId: string, to: number) => { if (!selectedWork || !selectedEpisode) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id !== selectedWork.id ? work : { ...work, episodes: work.episodes.map((episode) => { if (episode.id !== selectedEpisode.id) return episode; const from = episode.scenes.findIndex((scene) => scene.id === sceneId); if (from < 0 || to < 0 || to >= episode.scenes.length) return episode; const scenes = [...episode.scenes]; const [moved] = scenes.splice(from, 1); scenes.splice(to, 0, moved); return { ...episode, scenes, updatedAt: nowIso() }; }), updatedAt: nowIso() }) })); };
  const moveSceneTo = (sceneId: string, targetId: string) => { if (!selectedEpisode || sceneId === targetId) return; moveSceneToIndex(sceneId, selectedEpisode.scenes.findIndex((scene) => scene.id === targetId)); };
  const handleTouchReorder = (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== 'touch' || !draggedId) return; const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-scene-id]'); const targetId = target?.dataset.sceneId; if (targetId && targetId !== draggedId) moveSceneTo(draggedId, targetId); };

  const buildExportData = (kind: ExportKind, scope: ExportScope) => {
    const context = { workId: selectedWork?.id, episodeId: selectedEpisode?.id, sceneId: selectedScene?.id };
    const rawData = scope === 'all' ? dashboard : scope === 'work' ? selectedWork : scope === 'prompt-library' ? selectedWork?.promptLibrary : scope === 'selected-prompts' ? selectedWork?.promptLibrary.filter((prompt) => selectedExportPromptIds.includes(prompt.id)) : scope === 'asset' ? selectedWork?.assetLibrary.find((asset) => selectedExportAssetIds.includes(asset.id)) : scope === 'asset-library' ? selectedWork?.assetLibrary : scope === 'episode' ? selectedEpisode : scope === 'scene' ? selectedScene : scope === 'production-step' ? selectedScene?.productionSteps : selectedWork?.assetLibrary.filter((asset) => selectedExportAssetIds.includes(asset.id));
    const data = kind === 'chatgpt-share' ? stripForChatGpt(rawData) : rawData;
    return { schemaVersion: SCHEMA_VERSION, exportType: kind, scope, exportedAt: nowIso(), ...context, data };
  };
  const exportJson = () => { const data = buildExportData(exportKind, exportScope); downloadJson(data, `dream-architect-studio-${exportKind}-${exportScope}-v0.7.json`); };
  const copyJson = async () => { try { await navigator.clipboard.writeText(JSON.stringify(buildExportData(exportKind, exportScope), null, 2)); setMessage('JSONをクリップボードへコピーしました。'); } catch { setMessage('クリップボードへコピーできませんでした。書き出しボタンを使用してください。'); } };

  const applyImport = (text: string) => {
    setMessage('');
    let parsed: ImportEnvelope;
    try { parsed = JSON.parse(text) as ImportEnvelope; } catch { setMessage('不正なJSONです。既存データは変更していません。'); return; }
    const scope = parsed.scope ?? 'all';
    if (!window.confirm(`JSONを読み込みます。範囲：${scope}、方式：${importMode}。実行前バックアップを作成します。よろしいですか？`)) return;
    localStorage.setItem(PRE_IMPORT_BACKUP_KEY, JSON.stringify({ backedUpAt: nowIso(), dashboard }));
    const incoming = parsed.data ?? parsed;
    if (scope === 'all') {
      const next = normalizeDashboard(incoming);
      if (!next) { setMessage('全体バックアップJSONとして読み込めませんでした。'); return; }
      setDashboard(importMode === 'add-new' ? mergeDashboard(dashboard, next, false) : importMode === 'update-content' ? mergeDashboard(dashboard, next, true) : next);
      setMessage('全体JSONを読み込みました。');
      return;
    }
    mutateDashboard((current) => importScoped(current, scope, incoming, parsed, importMode));
    setMessage('JSONを読み込みました。実行前バックアップをlocalStorageへ保存しました。');
  };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const text = await file.text(); setPastedJson(text); applyImport(text); event.target.value = ''; };

  return <main className="app">
    <header className="app-header"><div><p className="eyebrow">Dream Architect Studio</p><h1>AIアニメ制作ダッシュボード v0.7</h1></div><button onClick={() => setJsonPanelOpen((open) => !open)}>JSON連携</button></header>
    <Breadcrumbs viewMode={viewMode} work={selectedWork} episode={selectedEpisode} scene={selectedScene} onWorks={() => setViewMode('work-list')} onEpisodes={() => setViewMode('episode-list')} onScenes={() => setViewMode('scene-list')} />
    {jsonPanelOpen && <section className="panel import-panel"><h2>JSON連携</h2><div className="form-grid"><label className="field"><span>種類</span><select value={exportKind} onChange={(event) => setExportKind(event.target.value as ExportKind)}><option value="full-backup">完全バックアップJSON</option><option value="chatgpt-share">ChatGPT共有JSON</option></select></label><label className="field"><span>範囲</span><select value={exportScope} onChange={(event) => setExportScope(event.target.value as ExportScope)}><option value="all">全体</option><option value="work">作品</option><option value="prompt-library">プロンプトライブラリ</option><option value="selected-prompts">選択したプロンプト</option><option value="asset-library">アセットライブラリ</option><option value="episode">話数</option><option value="scene">場面</option><option value="production-step">制作工程</option><option value="asset">アセット</option><option value="selected-assets">選択したアセット</option></select></label><label className="field"><span>読み込み方式</span><select value={importMode} onChange={(event) => setImportMode(event.target.value as ImportMode)}><option value="add-new">新規だけ追加</option><option value="update-content">一致IDを更新</option><option value="replace-scope">選択範囲を置き換え</option></select></label></div>{exportScope === 'selected-prompts' && selectedWork && <PromptSelector prompts={selectedWork.promptLibrary} selectedIds={selectedExportPromptIds} onChange={setSelectedExportPromptIds} title="共有するプロンプト" />}
    {exportScope === 'selected-assets' && selectedWork && <AssetSelector assets={selectedWork.assetLibrary} selectedIds={selectedExportAssetIds} onChange={setSelectedExportAssetIds} title="共有するアセット" />}<div className="actions"><button onClick={exportJson}>JSON書き出し</button><button onClick={copyJson}>JSONをコピー</button><button onClick={() => fileInputRef.current?.click()}>JSONファイル読み込み</button><input ref={fileInputRef} type="file" accept="application/json" hidden onChange={importFile} /></div><textarea className="json-paste" value={pastedJson} onChange={(event) => setPastedJson(event.target.value)} placeholder="ここにChatGPT共有JSONまたはバックアップJSONを貼り付け" /><div className="actions"><button onClick={() => applyImport(pastedJson)}>貼り付けたJSONを読み込む</button></div>{message && <p className="status-message">{message}</p>}</section>}
    {viewMode === 'work-list' && <WorkList works={dashboard.works} onAdd={addWork} onOpen={openWork} onDelete={deleteWork} onSelect={(work) => { setSelectedWorkId(work.id); setSelectedEpisodeId(work.episodes[0]?.id ?? null); setSelectedSceneId(work.episodes[0]?.scenes[0]?.id ?? null); }} />}
    {viewMode === 'episode-list' && selectedWork && <EpisodeList work={selectedWork} onOpenAssetLibrary={() => setViewMode('asset-library')} onOpenPromptLibrary={() => setViewMode('prompt-library')} onAdd={addEpisode} onOpen={openEpisode} onDelete={deleteEpisode} onMove={moveEpisode} onUpdate={updateSelectedWork} />}
    {viewMode === 'prompt-library' && selectedWork && <PromptLibrary work={selectedWork} selectedExportPromptIds={selectedExportPromptIds} setSelectedExportPromptIds={setSelectedExportPromptIds} usageFor={promptUsage} onAdd={addPrompt} onUpdate={updatePrompt} onDelete={deletePrompt} onRestore={restorePrompt} />}
    {viewMode === 'asset-library' && selectedWork && <AssetLibrary work={selectedWork} selectedExportAssetIds={selectedExportAssetIds} setSelectedExportAssetIds={setSelectedExportAssetIds} usageFor={assetUsage} onAdd={addLibraryAsset} onUpdate={updateLibraryAsset} onDelete={deleteLibraryAsset} />}
    {viewMode === 'scene-list' && selectedWork && selectedEpisode && <SceneList episode={selectedEpisode} onAdd={addScene} onOpen={openScene} onDelete={deleteScene} onMove={moveScene} draggedId={draggedId} setDraggedId={setDraggedId} handleTouchReorder={handleTouchReorder} onUpdate={updateSelectedEpisode} />}
    {viewMode === 'scene-edit' && selectedScene && <SceneEditor scene={selectedScene} libraryAssets={selectedWork?.assetLibrary ?? []} promptLibrary={selectedWork?.promptLibrary ?? []} onUpdate={updateSelectedScene} onDelete={() => deleteScene(selectedScene.id)} onAddAsset={addAsset} onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} />}
  </main>;
}

function stripForChatGpt(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(stripForChatGpt);
  if (!data || typeof data !== 'object') return data;
  const { createdAt: _createdAt, updatedAt: _updatedAt, thumbnail, ...rest } = data as Record<string, unknown>;
  return { ...rest, thumbnail };
}

function mergeDashboard(current: DashboardData, incoming: DashboardData, updateExisting: boolean): DashboardData {
  const works = [...current.works];
  incoming.works.forEach((work) => { const index = works.findIndex((item) => item.id === work.id); if (index < 0) works.push(work); else if (updateExisting) works[index] = work; });
  return { ...current, works, updatedAt: nowIso() };
}

function importScoped(current: DashboardData, scope: ExportScope, incoming: unknown, envelope: ImportEnvelope, mode: ImportMode): DashboardData {
  if (scope === 'prompt-library' || scope === 'selected-prompts') {
    const workId = envelope.workId;
    const prompts = Array.isArray(incoming) ? incoming.map((prompt, index) => migratePrompt(prompt as Partial<PromptItem>, index)) : [];
    return { ...current, works: current.works.map((work) => {
      if (work.id !== workId || prompts.length === 0) return work;
      const next = [...work.promptLibrary];
      prompts.forEach((prompt) => { const index = next.findIndex((item) => item.id === prompt.id); if (index < 0) next.push(prompt); else if (mode !== 'add-new') next[index] = prompt; });
      return { ...work, promptLibrary: mode === 'replace-scope' ? prompts : next, updatedAt: nowIso() };
    }) };
  }
  if (scope === 'asset-library' || scope === 'selected-assets') {
    const workId = envelope.workId;
    const assets = Array.isArray(incoming) ? incoming.map((asset, index) => migrateAsset(asset as Partial<Asset>, index)) : [];
    return { ...current, works: current.works.map((work) => {
      if (work.id !== workId || assets.length === 0) return work;
      const next = [...work.assetLibrary];
      assets.forEach((asset) => { const index = next.findIndex((item) => item.id === asset.id); if (index < 0) next.push(asset); else if (mode !== 'add-new') next[index] = asset; });
      return { ...work, assetLibrary: mode === 'replace-scope' ? assets : next, updatedAt: nowIso() };
    }) };
  }
  if (scope === 'work') {
    const work = normalizeDashboard({ schemaVersion: SCHEMA_VERSION, works: [incoming], createdAt: nowIso(), updatedAt: nowIso() })?.works[0];
    if (!work) return current;
    const exists = current.works.some((item) => item.id === work.id);
    if (mode === 'add-new' && exists) return current;
    return { ...current, works: exists ? current.works.map((item) => item.id === work.id ? work : item) : [...current.works, work] };
  }
  if (scope === 'episode') {
    const workId = envelope.workId;
    return { ...current, works: current.works.map((work) => { if (work.id !== workId) return work; const episode = normalizeDashboard({ schemaVersion: SCHEMA_VERSION, works: [{ ...work, episodes: [incoming] }], createdAt: nowIso(), updatedAt: nowIso() })?.works[0].episodes[0]; if (!episode) return work; const exists = work.episodes.some((item) => item.id === episode.id); if (mode === 'add-new' && exists) return work; return { ...work, episodes: exists ? work.episodes.map((item) => item.id === episode.id ? episode : item) : [...work.episodes, episode] }; }) };
  }
  if (scope === 'scene') {
    const { workId, episodeId } = envelope;
    return { ...current, works: current.works.map((work) => work.id !== workId ? work : { ...work, episodes: work.episodes.map((episode) => { if (episode.id !== episodeId) return episode; const scene = migrateScene(incoming as Partial<Scene>, episode.scenes.length); const exists = episode.scenes.some((item) => item.id === scene.id); if (mode === 'add-new' && exists) return episode; return { ...episode, scenes: exists ? episode.scenes.map((item) => item.id === scene.id ? scene : item) : [...episode.scenes, scene] }; }) }) };
  }
  return current;
}

function Breadcrumbs({ viewMode, work, episode, scene, onWorks, onEpisodes, onScenes }: { viewMode: ViewMode; work?: Work; episode?: Episode; scene?: Scene; onWorks: () => void; onEpisodes: () => void; onScenes: () => void }) {
  return <nav className="breadcrumbs" aria-label="現在位置"><button onClick={onWorks}>作品一覧</button>{viewMode !== 'work-list' && work && <><span>›</span><button onClick={onEpisodes}>{work.title}</button></>}{(viewMode === 'scene-list' || viewMode === 'scene-edit') && episode && <><span>›</span><button onClick={onScenes}>{episode.title}</button></>}{viewMode === 'scene-edit' && scene && <><span>›</span><strong>{scene.title}</strong></>}</nav>;
}

function WorkList({ works, onAdd, onOpen, onDelete, onSelect }: { works: Work[]; onAdd: () => void; onOpen: (work: Work) => void; onDelete: (id: string) => void; onSelect: (work: Work) => void }) {
  return <section className="panel"><div className="section-heading"><h2>作品一覧</h2><button onClick={onAdd}>＋ 作品追加</button></div><div className="card-grid">{works.map((work) => <article className="item-card" key={work.id} onFocus={() => onSelect(work)} onMouseEnter={() => onSelect(work)}><div className="card-title"><h3>{work.favorite ? '★ ' : ''}{work.title}</h3><StatusBadge status={work.productionStatus} /></div><p>{work.description || '説明未入力'}</p><MetaList items={[`全体進捗：${workProgress(work)}%`, `話数：${work.episodes.length}`, `場面：${workScenes(work).length}`, `更新：${formatDate(work.updatedAt)}`]} /><ProgressBar value={workProgress(work)} /><ThumbnailInfo image={work.thumbnail} /><TagList tags={work.tags} /><p className="memo-text">{work.productionMemo}</p><div className="actions"><button onClick={() => onOpen(work)}>開く</button><button className="danger" onClick={() => onDelete(work.id)}>削除</button></div></article>)}</div></section>;
}

function EpisodeList({ work, onOpenAssetLibrary, onOpenPromptLibrary, onAdd, onOpen, onDelete, onMove, onUpdate }: { work: Work; onOpenAssetLibrary: () => void; onOpenPromptLibrary: () => void; onAdd: () => void; onOpen: (episode: Episode) => void; onDelete: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void; onUpdate: (patch: Partial<Work>) => void }) {
  return <><section className="panel detail-panel"><div className="section-heading"><h2>作品情報</h2><div className="actions"><button onClick={onOpenPromptLibrary}>プロンプトライブラリ</button><button onClick={onOpenAssetLibrary}>アセットライブラリ</button></div></div><p className="muted">アセットライブラリは作品全体で再利用する設定・素材です。場面素材は各場面だけの生成結果や作業ファイルとして維持します。</p><EditableCommon entity={work} onChange={onUpdate} titleLabel="作品名" descriptionLabel="作品の説明" /></section><section className="panel"><div className="section-heading"><h2>話数一覧</h2><button onClick={onAdd}>＋ 話数追加</button></div>{work.episodes.map((episode, index) => <article className="scene-card" key={episode.id}><button className="scene-card-main" onClick={() => onOpen(episode)}><strong>{episode.favorite ? '★ ' : ''}第{episode.episodeNumber}話：{episode.title}</strong><span>{episode.summary || '概要未入力'}</span><span>制作状態：{episode.productionStatus} / 場面数：{episode.scenes.length}</span><ProgressBar value={episodeProgress(episode)} /><span>平均進捗：{episodeProgress(episode)}% / 更新：{formatDate(episode.updatedAt)}</span></button><div className="reorder-actions"><button onClick={() => onMove(episode.id, -1)} disabled={index === 0}>上へ</button><button onClick={() => onMove(episode.id, 1)} disabled={index === work.episodes.length - 1}>下へ</button><button className="danger" onClick={() => onDelete(episode.id)}>削除</button></div></article>)}</section></>;
}

function SceneList({ episode, onAdd, onOpen, onDelete, onMove, draggedId, setDraggedId, handleTouchReorder, onUpdate }: { episode: Episode; onAdd: () => void; onOpen: (scene: Scene) => void; onDelete: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void; draggedId: string | null; setDraggedId: (id: string | null) => void; handleTouchReorder: (event: PointerEvent<HTMLElement>) => void; onUpdate: (patch: Partial<Episode>) => void }) {
  return <><section className="panel detail-panel"><h2>話数情報</h2><EditableCommon entity={episode} onChange={onUpdate} titleLabel="話数タイトル" descriptionLabel="話数概要" /></section><section className="panel scene-list"><div className="section-heading"><h2>場面一覧</h2><button onClick={onAdd}>＋ 場面追加</button></div>{episode.scenes.map((scene, index) => <article key={scene.id} data-scene-id={scene.id} className="scene-card" draggable onDragStart={() => setDraggedId(scene.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) moveByDrop(draggedId, scene.id); setDraggedId(null); }} onPointerDown={(event: PointerEvent<HTMLElement>) => { if (event.pointerType === 'touch') { setDraggedId(scene.id); event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={handleTouchReorder} onPointerUp={() => setDraggedId(null)} onPointerCancel={() => setDraggedId(null)}><button className="scene-card-main" onClick={() => onOpen(scene)}><strong>{index + 1}. {scene.favorite ? '★ ' : ''}{scene.title}</strong><span>制作状態：{scene.productionStatus} / 工程：{scene.productionSteps.filter((step) => step.status === '完了').length}/{scene.productionSteps.length}完了</span><span>Vidu難易度：{scene.viduDifficulty}</span><ProgressBar value={scene.progressPercent} /><span>進捗率：{scene.progressPercent}% / 更新：{formatDate(scene.updatedAt)}</span></button><div className="reorder-actions"><button onClick={() => onMove(scene.id, -1)} disabled={index === 0}>上へ</button><button onClick={() => onMove(scene.id, 1)} disabled={index === episode.scenes.length - 1}>下へ</button><button className="danger" onClick={() => onDelete(scene.id)}>削除</button></div></article>)} </section></>;
  function moveByDrop(fromId: string, targetId: string) { const from = episode.scenes.findIndex((scene) => scene.id === fromId); const to = episode.scenes.findIndex((scene) => scene.id === targetId); if (from < to) { for (let i = from; i < to; i += 1) onMove(fromId, 1); } else { for (let i = from; i > to; i -= 1) onMove(fromId, -1); } }
}

function SceneEditor({ scene, libraryAssets, promptLibrary, onUpdate, onDelete, onAddAsset, onUpdateAsset, onDeleteAsset }: { scene: Scene; libraryAssets: Asset[]; promptLibrary: PromptItem[]; onUpdate: <K extends keyof Scene>(key: K, value: Scene[K]) => void; onDelete: () => void; onAddAsset: () => void; onUpdateAsset: (assetId: string, patch: Partial<Asset>) => void; onDeleteAsset: (assetId: string) => void }) {
  const [selectedStepId, setSelectedStepId] = useState<ProductionStepId>(scene.productionSteps[0]?.id ?? 'script');
  const selectedStep = scene.productionSteps.find((step) => step.id === selectedStepId) ?? scene.productionSteps[0];
  const updateStep = (patch: Partial<ProductionStep>) => {
    if (!selectedStep) return;
    onUpdate('productionSteps', scene.productionSteps.map((step) => step.id === selectedStep.id ? { ...step, ...patch, updatedAt: nowIso() } : step));
  };
  return <>
    <section className="panel scene-detail"><div className="section-heading"><h2>場面編集</h2><button className="danger" onClick={onDelete}>この場面を削除</button></div><Field label="場面タイトル" value={scene.title} onChange={(value) => onUpdate('title', value)} /><TextArea label="概要" value={scene.summary} onChange={(value) => onUpdate('summary', value)} /><TextArea label="ティアのセリフ" value={scene.tiaLine} onChange={(value) => onUpdate('tiaLine', value)} /><TextArea label="ノヴァのセリフ" value={scene.novaLine} onChange={(value) => onUpdate('novaLine', value)} /><TextArea label="決定事項" value={scene.decisions} onChange={(value) => onUpdate('decisions', value)} /><TextArea label="未決定事項" value={scene.openIssues} onChange={(value) => onUpdate('openIssues', value)} /><TextArea label="メモ" value={scene.memo} onChange={(value) => onUpdate('memo', value)} /><CommonFields entity={scene} onChange={(patch) => { if (patch.thumbnail) onUpdate('thumbnail', patch.thumbnail as ImageReference); if (patch.tags) onUpdate('tags', patch.tags as string[]); if (typeof patch.favorite === 'boolean') onUpdate('favorite', patch.favorite); if (typeof patch.productionMemo === 'string') onUpdate('productionMemo', patch.productionMemo); }} /><div className="readonly-progress"><span>制作状態：{scene.productionStatus}</span><span>工程から自動計算：{scene.progressPercent}%</span><ProgressBar value={scene.progressPercent} /></div><label className="field"><span>Vidu難易度</span><select value={scene.viduDifficulty} onChange={(event) => onUpdate('viduDifficulty', event.target.value as ViduDifficulty)}><option>低</option><option>中</option><option>高</option></select></label></section>
    <AssetSelector assets={libraryAssets} selectedIds={scene.assetIds} onChange={(assetIds) => onUpdate('assetIds', assetIds)} title="登場・使用アセット" />
    <PromptSelector prompts={promptLibrary} selectedIds={scene.promptIds} onChange={(promptIds) => onUpdate('promptIds', promptIds)} title="使用プロンプト" />
    <ProductionStepPanel assets={libraryAssets} prompts={promptLibrary} steps={scene.productionSteps} selectedStep={selectedStep} onSelect={setSelectedStepId} onUpdate={updateStep} />
    <AssetList assets={scene.assets} prompts={promptLibrary} onAdd={onAddAsset} onUpdate={onUpdateAsset} onDelete={onDeleteAsset} />
  </>;
}

function ProductionStepPanel({ assets, prompts, steps, selectedStep, onSelect, onUpdate }: { assets: Asset[]; prompts: PromptItem[]; steps: ProductionStep[]; selectedStep?: ProductionStep; onSelect: (id: ProductionStepId) => void; onUpdate: (patch: Partial<ProductionStep>) => void }) {
  return <section className="panel step-panel"><div className="section-heading"><div><h2>制作工程管理</h2><p className="muted">8工程の状態から場面の進捗率を自動計算します。</p></div></div><div className="step-grid">{steps.map((step, index) => <button key={step.id} type="button" className={`step-card ${selectedStep?.id === step.id ? 'active' : ''}`} onClick={() => onSelect(step.id)}><span className="step-number">{index + 1}</span><strong>{step.name}</strong><StatusBadge status={step.status} /><small>素材：{step.relatedAssets ? 'あり' : '未設定'} / プロンプト：{step.relatedPrompts ? 'あり' : '未設定'}</small></button>)}</div>{selectedStep && <div className="step-editor"><h3>{selectedStep.name}を編集</h3><label className="field"><span>状態</span><select value={selectedStep.status} onChange={(event) => onUpdate({ status: event.target.value as ProductionStatus })}><option>未着手</option><option>作業中</option><option>確認中</option><option>完了</option></select></label><TextArea label="メモ" value={selectedStep.memo} onChange={(memo) => onUpdate({ memo })} /><TextArea label="関連素材（自由入力）" value={selectedStep.relatedAssets} onChange={(relatedAssets) => onUpdate({ relatedAssets })} /><AssetSelector assets={assets} selectedIds={selectedStep.relatedAssetIds} onChange={(relatedAssetIds) => onUpdate({ relatedAssetIds })} title="関連アセット（ライブラリから選択）" /><TextArea label="関連プロンプト（自由入力）" value={selectedStep.relatedPrompts} onChange={(relatedPrompts) => onUpdate({ relatedPrompts })} /><PromptSelector prompts={prompts} selectedIds={selectedStep.relatedPromptIds} onChange={(relatedPromptIds) => onUpdate({ relatedPromptIds })} title="関連プロンプト（ライブラリから選択）" /><p className="thumbnail-info">工程更新：{formatDate(selectedStep.updatedAt)}</p></div>}</section>;
}

function AssetList({ assets, prompts, onAdd, onUpdate, onDelete }: { assets: Asset[]; prompts?: PromptItem[]; onAdd: () => void; onUpdate: (assetId: string, patch: Partial<Asset>) => void; onDelete: (assetId: string) => void }) {
  return <section className="panel asset-list"><div className="section-heading"><h2>素材一覧</h2><button onClick={onAdd}>＋ 素材追加</button></div>{assets.length === 0 ? <p className="muted">この場面の素材はまだありません。</p> : <div className="asset-grid">{assets.map((asset) => <AssetCard key={asset.id} asset={asset} prompts={prompts ?? []} onUpdate={(patch) => onUpdate(asset.id, patch)} onDelete={() => onDelete(asset.id)} />)}</div>}</section>;
}

function AssetCard({ asset, prompts, onUpdate, onDelete }: { asset: Asset; prompts: PromptItem[]; onUpdate: (patch: Partial<Asset>) => void; onDelete: () => void }) {
  const showThumbnail = (asset.type === 'image' || asset.type === 'video') && asset.thumbnailUrl;
  return <article className="asset-card"><div className="asset-card-header"><div><h3>{asset.favorite ? '★ ' : ''}{asset.title}</h3><p>{assetTypeLabels[asset.type]} / {asset.adopted ? '採用' : '未採用'} / 更新：{formatDate(asset.updatedAt)}</p></div><button className="danger" onClick={onDelete}>削除</button></div>{showThumbnail ? <img className="asset-thumbnail" src={asset.thumbnailUrl} alt={`${asset.title}のサムネイル`} loading="lazy" /> : (asset.type === 'image' || asset.type === 'video') && <div className="asset-thumbnail placeholder">サムネイル未設定</div>}<div className="asset-editor"><Field label="タイトル" value={asset.title} onChange={(title) => onUpdate({ title })} /><label className="field"><span>種類</span><select value={asset.type} onChange={(event) => onUpdate({ type: event.target.value as AssetType })}>{assetTypes.map((type) => <option key={type} value={type}>{assetTypeLabels[type]}</option>)}</select></label><Field label="URLまたはファイル参照名" value={asset.source} onChange={(source) => onUpdate({ source })} /><Field label="サムネイルURL" value={asset.thumbnailUrl} onChange={(thumbnailUrl) => onUpdate({ thumbnailUrl })} /><TextArea label="説明" value={asset.description} onChange={(description) => onUpdate({ description })} /><TextArea label="メモ" value={asset.memo} onChange={(memo) => onUpdate({ memo })} /><Field label="タグ（カンマ区切り）" value={tagsText(asset.tags)} onChange={(value) => onUpdate({ tags: parseTags(value) })} /><label className="field checkbox-field"><input type="checkbox" checked={asset.adopted} onChange={(event) => onUpdate({ adopted: event.target.checked })} /><span>採用</span></label><label className="field checkbox-field"><input type="checkbox" checked={asset.favorite} onChange={(event) => onUpdate({ favorite: event.target.checked })} /><span>お気に入り</span></label><PromptSelector prompts={prompts} selectedIds={asset.relatedPromptIds} onChange={(relatedPromptIds) => onUpdate({ relatedPromptIds })} title="関連プロンプト" /><p className="thumbnail-info">更新日時：{formatDate(asset.updatedAt)}</p></div></article>;
}

function AssetSelector({ assets, selectedIds, onChange, title }: { assets: Asset[]; selectedIds: string[]; onChange: (ids: string[]) => void; title: string }) {
  return <section className="panel asset-picker"><div className="section-heading"><h2>{title}</h2><p className="muted">大きなカードをタップして複数選択できます。名前変更は最新のライブラリ情報を参照します。</p></div>{assets.length === 0 ? <p className="muted">アセットライブラリに登録がありません。</p> : <div className="asset-select-grid">{assets.map((asset) => {
    const checked = selectedIds.includes(asset.id);
    return <button type="button" key={asset.id} className={`asset-select-card ${checked ? 'active' : ''}`} onClick={() => onChange(checked ? selectedIds.filter((id) => id !== asset.id) : [...selectedIds, asset.id])}><span className="asset-check">{checked ? '✓' : ''}</span><strong>{asset.title}</strong><small>{assetTypeLabels[asset.type]} / {asset.status}</small></button>;
  })}</div>}</section>;
}

function AssetLibrary({ work, selectedExportAssetIds, setSelectedExportAssetIds, usageFor, onAdd, onUpdate, onDelete }: { work: Work; selectedExportAssetIds: string[]; setSelectedExportAssetIds: (ids: string[]) => void; usageFor: (assetId: string, work?: Work) => { scenes: string[]; steps: string[] }; onAdd: () => void; onUpdate: (assetId: string, patch: Partial<Asset>) => void; onDelete: (assetId: string) => void }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'all' | AssetType>('all');
  const [tag, setTag] = useState('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [status, setStatus] = useState<'all' | AssetStatus>('all');
  const [sort, setSort] = useState<'updated' | 'created' | 'name' | 'type'>('updated');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const tags = Array.from(new Set(work.assetLibrary.flatMap((asset) => asset.tags))).sort();
  const assets = work.assetLibrary.filter((asset) => {
    const text = `${asset.title} ${asset.reading} ${asset.description} ${asset.memo} ${asset.tags.join(' ')}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (type === 'all' || asset.type === type) && (!tag || asset.tags.includes(tag)) && (!favoriteOnly || asset.favorite) && (status === 'all' || asset.status === status);
  }).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title, 'ja') : sort === 'type' ? assetTypeLabels[a.type].localeCompare(assetTypeLabels[b.type], 'ja') : sort === 'created' ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt));
  return <section className="panel asset-library"><div className="section-heading"><div><h2>アセットライブラリ</h2><p className="muted">作品全体で再利用するキャラクター・背景・BGM等です。ファイル本体は保存せず、ファイル名・URL・参照情報だけ保存します。</p></div><button onClick={onAdd}>＋アセット追加</button></div><button onClick={() => setFiltersOpen((open) => !open)}>{filtersOpen ? '検索・フィルターを閉じる' : '検索・フィルターを開く'}</button>{filtersOpen && <div className="form-grid filter-panel"><Field label="検索" value={query} onChange={setQuery} /><label className="field"><span>種類フィルター</span><select value={type} onChange={(event) => setType(event.target.value as 'all' | AssetType)}><option value="all">すべて</option>{assetTypes.map((item) => <option value={item} key={item}>{assetTypeLabels[item]}</option>)}</select></label><label className="field"><span>タグフィルター</span><select value={tag} onChange={(event) => setTag(event.target.value)}><option value="">すべて</option>{tags.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>採用状態フィルター</span><select value={status} onChange={(event) => setStatus(event.target.value as 'all' | AssetStatus)}><option value="all">すべて</option>{assetStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>並び替え</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="updated">更新順</option><option value="created">作成順</option><option value="name">名前順</option><option value="type">種類順</option></select></label><label className="field checkbox-field"><input type="checkbox" checked={favoriteOnly} onChange={(event) => setFavoriteOnly(event.target.checked)} /><span>お気に入りだけ表示</span></label></div>}<AssetSelector assets={work.assetLibrary} selectedIds={selectedExportAssetIds} onChange={setSelectedExportAssetIds} title="ChatGPT共有用に選択したアセット" /><div className="asset-grid">{assets.map((asset) => <LibraryAssetCard key={asset.id} asset={asset} usage={usageFor(asset.id, work)} onUpdate={(patch) => onUpdate(asset.id, patch)} onDelete={() => onDelete(asset.id)} />)}</div></section>;
}

function LibraryAssetCard({ asset, usage, onUpdate, onDelete }: { asset: Asset; usage: { scenes: string[]; steps: string[] }; onUpdate: (patch: Partial<Asset>) => void; onDelete: () => void }) {
  const characterKeys: Array<[keyof Asset['character'], string]> = [['age', '年齢'], ['gender', '性別'], ['species', '種族'], ['height', '身長'], ['role', '役割'], ['personality', '性格'], ['firstPerson', '一人称'], ['secondPerson', '二人称'], ['speechStyle', '口調'], ['appearance', '外見'], ['costume', '衣装'], ['props', '小物'], ['features', '特徴'], ['background', '背景設定'], ['memo', 'キャラクター設定メモ']];
  return <article className="asset-card"><div className="asset-card-header"><div><h3>{asset.favorite ? '★ ' : ''}{asset.title}</h3><p><span className="type-pill">{assetTypeLabels[asset.type]}</span> {asset.status} / 使用中の場面数：{usage.scenes.length} / 更新：{formatDate(asset.updatedAt)}</p></div><button className="danger" onClick={onDelete}>削除</button></div>{asset.thumbnailUrl ? <img className="asset-thumbnail" src={asset.thumbnailUrl} alt={`${asset.title}のサムネイル`} /> : <div className="asset-thumbnail placeholder">サムネイル未設定</div>}<TagList tags={asset.tags} /><details open><summary>編集</summary><div className="asset-editor"><Field label="名前" value={asset.title} onChange={(title) => onUpdate({ title })} /><Field label="読み" value={asset.reading} onChange={(reading) => onUpdate({ reading })} /><label className="field"><span>種類</span><select value={asset.type} onChange={(event) => onUpdate({ type: event.target.value as AssetType })}>{assetTypes.map((item) => <option key={item} value={item}>{assetTypeLabels[item]}</option>)}</select></label><label className="field"><span>採用状態</span><select value={asset.status} onChange={(event) => onUpdate({ status: event.target.value as AssetStatus })}>{assetStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><TextArea label="説明" value={asset.description} onChange={(description) => onUpdate({ description })} /><TextArea label="メモ" value={asset.memo} onChange={(memo) => onUpdate({ memo })} /><Field label="タグ（カンマ区切り）" value={tagsText(asset.tags)} onChange={(value) => onUpdate({ tags: parseTags(value) })} /><label className="field checkbox-field"><input type="checkbox" checked={asset.favorite} onChange={(event) => onUpdate({ favorite: event.target.checked })} /><span>お気に入り</span></label><Field label="ファイル名" value={asset.fileName} onChange={(fileName) => onUpdate({ fileName })} /><Field label="URL" value={asset.source} onChange={(source) => onUpdate({ source })} /><Field label="外部参照" value={asset.externalReference} onChange={(externalReference) => onUpdate({ externalReference })} /><Field label="サムネイルURL" value={asset.thumbnailUrl} onChange={(thumbnailUrl) => onUpdate({ thumbnailUrl })} /><Field label="サムネイル参照名" value={asset.thumbnailLabel} onChange={(thumbnailLabel) => onUpdate({ thumbnailLabel })} /><TextArea label="サムネイルメモ" value={asset.thumbnailMemo} onChange={(thumbnailMemo) => onUpdate({ thumbnailMemo })} /><label className="field"><span>作成方法</span><select value={asset.creationMethod} onChange={(event) => onUpdate({ creationMethod: event.target.value as CreationMethod })}>{creationMethods.map((item) => <option key={item}>{item}</option>)}</select></label><Field label="使用ソフト" value={asset.software} onChange={(software) => onUpdate({ software })} /><Field label="作成AI" value={asset.creationAi} onChange={(creationAi) => onUpdate({ creationAi })} /><Field label="元アセットID" value={asset.sourceAssetId} onChange={(sourceAssetId) => onUpdate({ sourceAssetId })} /><Field label="バージョン名" value={asset.versionName} onChange={(versionName) => onUpdate({ versionName })} /><TextArea label="日本語プロンプト" value={asset.japanesePrompt} onChange={(japanesePrompt) => onUpdate({ japanesePrompt })} /><TextArea label="英語プロンプト" value={asset.englishPrompt} onChange={(englishPrompt) => onUpdate({ englishPrompt })} /><TextArea label="ネガティブプロンプト" value={asset.negativePrompt} onChange={(negativePrompt) => onUpdate({ negativePrompt })} /><TextArea label="一貫性維持メモ" value={asset.consistencyMemo} onChange={(consistencyMemo) => onUpdate({ consistencyMemo })} /><Field label="関連プロンプトID（カンマ区切り）" value={tagsText(asset.relatedPromptIds)} onChange={(value) => onUpdate({ relatedPromptIds: parseTags(value) })} /><p className="thumbnail-info">作成日時：{formatDate(asset.createdAt)} / 更新日時：{formatDate(asset.updatedAt)}</p></div></details>{asset.type === 'character' && <details open><summary>キャラクター用の追加項目</summary><div className="asset-editor">{characterKeys.map(([key, label]) => <Field key={key} label={label} value={asset.character[key]} onChange={(value) => onUpdate({ character: { ...asset.character, [key]: value } })} />)}</div></details>}</article>;
}


async function copyTextForIpad(text: string) { try { await navigator.clipboard.writeText(text); return true; } catch { const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.appendChild(area); area.focus(); area.select(); const ok = document.execCommand('copy'); document.body.removeChild(area); return ok; } }
function promptCopyText(prompt: PromptItem, mode: string) { if (mode === 'ja') return prompt.japanesePrompt; if (mode === 'en') return prompt.englishPrompt; if (mode === 'neg') return prompt.negativePrompt; if (mode === 'all') return `日本語:\n${prompt.japanesePrompt}\n\nEnglish:\n${prompt.englishPrompt}\n\nNegative:\n${prompt.negativePrompt}`; if (mode === 'vidu') return `${prompt.englishPrompt || prompt.japanesePrompt}\nCamera: ${prompt.cameraCompositionMemo}\nMotion: ${prompt.motionMemo}\nStyle: ${prompt.artStyleMemo}`; return `以下のプロンプトをAIアニメ制作に使います。\nタイトル：${prompt.title}\n用途：${prompt.purpose}\n日本語：${prompt.japanesePrompt}\n英語：${prompt.englishPrompt}\nネガティブ：${prompt.negativePrompt}`; }
function PromptSelector({ prompts, selectedIds, onChange, title }: { prompts: PromptItem[]; selectedIds: string[]; onChange: (ids: string[]) => void; title: string }) { return <section className="panel asset-picker"><div className="section-heading"><h2>{title}</h2><p className="muted">最新のプロンプトライブラリ内容を参照して複数選択できます。</p></div>{prompts.length === 0 ? <p className="muted">プロンプトライブラリに登録がありません。</p> : <div className="asset-select-grid">{prompts.map((prompt) => { const checked = selectedIds.includes(prompt.id); return <button type="button" key={prompt.id} className={`asset-select-card ${checked ? 'active' : ''}`} onClick={() => onChange(checked ? selectedIds.filter((id) => id !== prompt.id) : [...selectedIds, prompt.id])}><span className="asset-check">{checked ? '✓' : ''}</span><strong>{prompt.title}</strong><small>{promptAiLabels[prompt.aiType]} / {prompt.purpose || '用途未設定'} / {prompt.status}</small></button>; })}</div>}</section>; }
function PromptLibrary({ work, selectedExportPromptIds, setSelectedExportPromptIds, usageFor, onAdd, onUpdate, onDelete, onRestore }: { work: Work; selectedExportPromptIds: string[]; setSelectedExportPromptIds: (ids: string[]) => void; usageFor: (id: string, work?: Work) => { scenes: string[]; steps: string[]; assets: string[] }; onAdd: (templateId?: PromptTemplateId) => void; onUpdate: (id: string, patch: Partial<PromptItem>) => void; onDelete: (id: string) => void; onRestore: (entry: PromptHistoryEntry) => void }) {
  const [query, setQuery] = useState(''); const [ai, setAi] = useState<'all' | PromptAiType>('all'); const [purpose, setPurpose] = useState(''); const [tag, setTag] = useState(''); const [favoriteOnly, setFavoriteOnly] = useState(false); const [status, setStatus] = useState<'all' | AssetStatus>('all'); const [sort, setSort] = useState<'updated'|'created'|'name'|'ai'>('updated'); const [filtersOpen, setFiltersOpen] = useState(true); const [templateId, setTemplateId] = useState<PromptTemplateId>('blank'); const [copyMessage, setCopyMessage] = useState('');
  const tags = Array.from(new Set(work.promptLibrary.flatMap((p) => p.tags))).sort(); const purposes = Array.from(new Set(work.promptLibrary.map((p) => p.purpose).filter(Boolean))).sort();
  const prompts = work.promptLibrary.filter((p) => `${p.title} ${p.purpose} ${p.description} ${p.memo} ${p.japanesePrompt} ${p.englishPrompt} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()) && (ai === 'all' || p.aiType === ai) && (!purpose || p.purpose === purpose) && (!tag || p.tags.includes(tag)) && (!favoriteOnly || p.favorite) && (status === 'all' || p.status === status)).sort((a,b)=> sort === 'name' ? a.title.localeCompare(b.title,'ja') : sort === 'ai' ? promptAiLabels[a.aiType].localeCompare(promptAiLabels[b.aiType],'ja') : sort === 'created' ? b.createdAt.localeCompare(a.createdAt) : b.updatedAt.localeCompare(a.updatedAt));
  const doCopy = async (prompt: PromptItem, mode: string) => { const ok = await copyTextForIpad(promptCopyText(prompt, mode)); setCopyMessage(ok ? 'コピーしました。' : 'コピーできませんでした。長押しで選択してコピーしてください。'); };
  return <section className="panel prompt-library"><div className="section-heading"><div><h2>プロンプトライブラリ</h2><p className="muted">作品・話数・場面・制作工程・アセットに紐付けて、使用AI、採用結果、履歴を保存します。</p></div><div className="actions"><label className="field"><span>テンプレート</span><select value={templateId} onChange={(e)=>setTemplateId(e.target.value as PromptTemplateId)}>{work.promptTemplates.map((t)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><button onClick={()=>onAdd(templateId)}>＋プロンプト追加</button></div></div><button onClick={()=>setFiltersOpen(!filtersOpen)}>{filtersOpen ? '検索・フィルターを閉じる' : '検索・フィルターを開く'}</button>{filtersOpen && <div className="form-grid filter-panel"><Field label="検索" value={query} onChange={setQuery}/><label className="field"><span>AI種類フィルター</span><select value={ai} onChange={(e)=>setAi(e.target.value as any)}><option value="all">すべて</option>{promptAiTypes.map((t)=><option key={t} value={t}>{promptAiLabels[t]}</option>)}</select></label><label className="field"><span>用途フィルター</span><select value={purpose} onChange={(e)=>setPurpose(e.target.value)}><option value="">すべて</option>{purposes.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field"><span>タグフィルター</span><select value={tag} onChange={(e)=>setTag(e.target.value)}><option value="">すべて</option>{tags.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field"><span>採用状態フィルター</span><select value={status} onChange={(e)=>setStatus(e.target.value as any)}><option value="all">すべて</option>{assetStatuses.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field"><span>並び替え</span><select value={sort} onChange={(e)=>setSort(e.target.value as any)}><option value="updated">更新順</option><option value="created">作成順</option><option value="name">名前順</option><option value="ai">AI種類順</option></select></label><label className="field checkbox-field"><input type="checkbox" checked={favoriteOnly} onChange={(e)=>setFavoriteOnly(e.target.checked)}/><span>お気に入りだけ表示</span></label></div>}{copyMessage && <p className="status-message">{copyMessage}</p>}<PromptSelector prompts={work.promptLibrary} selectedIds={selectedExportPromptIds} onChange={setSelectedExportPromptIds} title="ChatGPT共有用に選択したプロンプト"/><div className="asset-grid">{prompts.map((p)=><PromptCard key={p.id} prompt={p} usage={usageFor(p.id, work)} history={work.promptHistory.filter((h)=>h.promptId===p.id).slice(-20).reverse()} onUpdate={(patch)=>onUpdate(p.id, patch)} onDelete={()=>onDelete(p.id)} onCopy={(mode)=>doCopy(p, mode)} onRestore={onRestore}/>)}</div></section>;
}
function PromptCard({ prompt, usage, history, onUpdate, onDelete, onCopy, onRestore }: { prompt: PromptItem; usage: { scenes: string[]; steps: string[]; assets: string[] }; history: PromptHistoryEntry[]; onUpdate: (patch: Partial<PromptItem>) => void; onDelete: () => void; onCopy: (mode: string) => void; onRestore: (entry: PromptHistoryEntry) => void }) { const fields: Array<[keyof PromptItem,string,'field'|'text']> = [['title','タイトル','field'],['purpose','用途','field'],['description','説明','text'],['memo','メモ','text'],['japanesePrompt','日本語プロンプト','text'],['englishPrompt','英語プロンプト','text'],['negativePrompt','ネガティブプロンプト','text'],['referencePrompt','参考プロンプト','text'],['consistencyMemo','一貫性維持メモ','text'],['characterLockMemo','キャラクター固定メモ','text'],['backgroundLockMemo','背景固定メモ','text'],['cameraCompositionMemo','カメラ・構図メモ','text'],['motionMemo','動きメモ','text'],['artStyleMemo','画風メモ','text'],['outputSettingsMemo','出力設定メモ','text'],['usedAi','使用AI','field'],['usedModel','使用モデル','field'],['versionName','バージョン','field'],['seed','シード','field'],['aspectRatio','アスペクト比','field'],['resolution','解像度','field'],['duration','尺','field'],['fps','FPS','field'],['resultUrl','結果URL','field'],['resultFileName','結果ファイル名','field'],['resultThumbnailUrl','結果サムネイルURL','field'],['resultMemo','結果メモ','text'],['relatedAssetId','関連アセットID','field'],['sourcePromptId','元プロンプトID','field'],['derivedPromptId','派生プロンプトID','field']]; return <article className="asset-card prompt-card"><div className="asset-card-header"><div><h3>{prompt.favorite?'★ ':''}{prompt.title}</h3><p><span className="type-pill">{promptAiLabels[prompt.aiType]}</span> {prompt.purpose || '用途未設定'} / {prompt.status} / 使用中の場面数：{usage.scenes.length} / 更新：{formatDate(prompt.updatedAt)}</p></div><button className="danger" onClick={onDelete}>削除</button></div><p>{prompt.japanesePrompt.slice(0,80) || '日本語プロンプト未入力'}</p><p>{prompt.englishPrompt.slice(0,80) || '英語プロンプト未入力'}</p><TagList tags={prompt.tags}/><div className="actions copy-actions"><button onClick={()=>onCopy('ja')}>日本語だけコピー</button><button onClick={()=>onCopy('en')}>英語だけコピー</button><button onClick={()=>onCopy('neg')}>ネガティブだけコピー</button><button onClick={()=>onCopy('all')}>3種まとめてコピー</button><button onClick={()=>onCopy('chatgpt')}>ChatGPT形式でコピー</button><button onClick={()=>onCopy('vidu')}>Vidu形式でコピー</button></div><details><summary>編集</summary><div className="asset-editor prompt-editor"><label className="field"><span>AI種類</span><select value={prompt.aiType} onChange={(e)=>onUpdate({aiType:e.target.value as PromptAiType})}>{promptAiTypes.map((t)=><option key={t} value={t}>{promptAiLabels[t]}</option>)}</select></label><label className="field"><span>採用状態</span><select value={prompt.status} onChange={(e)=>onUpdate({status:e.target.value as AssetStatus})}>{assetStatuses.map((x)=><option key={x}>{x}</option>)}</select></label><label className="field checkbox-field"><input type="checkbox" checked={prompt.favorite} onChange={(e)=>onUpdate({favorite:e.target.checked})}/><span>お気に入り</span></label><label className="field checkbox-field"><input type="checkbox" checked={prompt.adoptedResult} onChange={(e)=>onUpdate({adoptedResult:e.target.checked})}/><span>採用結果</span></label><Field label="タグ（カンマ区切り）" value={tagsText(prompt.tags)} onChange={(v)=>onUpdate({tags:parseTags(v)})}/>{fields.map(([k,l,t])=> t==='text' ? <TextArea key={k} label={l} value={String(prompt[k] ?? '')} onChange={(v)=>onUpdate({[k]:v} as Partial<PromptItem>)}/> : <Field key={k} label={l} value={String(prompt[k] ?? '')} onChange={(v)=>onUpdate({[k]:v} as Partial<PromptItem>)}/>)}<p className="thumbnail-info">作成日時：{formatDate(prompt.createdAt)} / 更新日時：{formatDate(prompt.updatedAt)}</p></div></details><details><summary>履歴（最大20件）</summary>{history.length===0 ? <p className="muted">履歴はまだありません。</p> : history.map((h)=><div key={h.id} className="history-item"><strong>{formatDate(h.changedAt)} / {h.versionName}</strong><p>{h.changeMemo}</p><p>変更前：{h.before.japanesePrompt.slice(0,80)}</p><p>変更後：{h.after.japanesePrompt.slice(0,80)}</p><button onClick={()=>onRestore(h)}>この版へ戻す</button></div>)}</details></article>; }

function EditableCommon({ entity, onChange, titleLabel, descriptionLabel }: { entity: Work | Episode; onChange: (patch: Partial<Work & Episode>) => void; titleLabel: string; descriptionLabel: string }) {
  const description = 'description' in entity ? entity.description : entity.summary;
  return <><Field label={titleLabel} value={entity.title} onChange={(title) => onChange({ title })} /><TextArea label={descriptionLabel} value={description} onChange={(value) => 'description' in entity ? onChange({ description: value }) : onChange({ summary: value })} /><label className="field"><span>制作状態</span><select value={entity.productionStatus} onChange={(event) => onChange({ productionStatus: event.target.value as ProductionStatus })}><option>未着手</option><option>作業中</option><option>確認中</option><option>完了</option></select></label><CommonFields entity={entity} onChange={onChange} /></>;
}

function CommonFields({ entity, onChange }: { entity: Pick<Work, 'thumbnail' | 'tags' | 'favorite' | 'productionMemo'>; onChange: (patch: Partial<Work & Episode & Scene>) => void }) {
  return <div className="common-fields"><label className="field checkbox-field"><input type="checkbox" checked={entity.favorite} onChange={(event) => onChange({ favorite: event.target.checked })} /><span>お気に入り</span></label><Field label="サムネイル参照名" value={entity.thumbnail.label} onChange={(label) => onChange({ thumbnail: { ...entity.thumbnail, label } })} /><Field label="サムネイル画像ファイル名・URL・参照" value={entity.thumbnail.source} onChange={(source) => onChange({ thumbnail: { ...entity.thumbnail, source } })} /><TextArea label="サムネイルメモ" value={entity.thumbnail.memo} onChange={(memo) => onChange({ thumbnail: { ...entity.thumbnail, memo } })} /><Field label="タグ（カンマ区切り）" value={tagsText(entity.tags)} onChange={(value) => onChange({ tags: parseTags(value) })} /><TextArea label="制作メモ" value={entity.productionMemo} onChange={(productionMemo) => onChange({ productionMemo })} /></div>;
}

function ProgressBar({ value }: { value: number }) { return <div className="progress-bar"><span style={{ width: `${value}%` }} /></div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>; }
function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} /></label>; }
function StatusBadge({ status }: { status: ProductionStatus }) { return <span className="status-badge">{status}</span>; }
function MetaList({ items }: { items: string[] }) { return <ul className="meta-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>; }
function ThumbnailInfo({ image }: { image: ImageReference }) { return image.source ? <p className="thumbnail-info">サムネイル：{image.label ? `${image.label} / ` : ''}{image.source}</p> : <p className="thumbnail-info muted">サムネイル未設定</p>; }
function TagList({ tags }: { tags: string[] }) { return tags.length ? <div className="tag-list">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null; }
