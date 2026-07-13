import { type ChangeEvent, type PointerEvent, useEffect, useRef, useState } from 'react';

type ProductionStatus = '未着手' | '作業中' | '確認中' | '完了';
type ViduDifficulty = '低' | '中' | '高';
type AssetType = 'image' | 'video' | 'audio' | 'prompt' | 'document' | 'url' | 'other';
type ViewMode = 'work-list' | 'episode-list' | 'scene-list' | 'scene-edit';
type ProductionStepId = 'script' | 'storyboard' | 'illustration' | 'ai-generation' | 'clip-studio' | 'final-cut' | 'logic-pro' | 'final-check';
type ImportMode = 'add-new' | 'update-content' | 'replace-scope';
type ExportKind = 'full-backup' | 'chatgpt-share';
type ExportScope = 'all' | 'work' | 'episode' | 'scene';

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
  relatedPrompts: string;
  updatedAt: string;
};

type Asset = {
  id: string;
  title: string;
  type: AssetType;
  source: string;
  thumbnailUrl: string;
  description: string;
  memo: string;
  tags: string[];
  adopted: boolean;
  favorite: boolean;
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
  createdAt: string;
  updatedAt: string;
};

type DashboardData = {
  schemaVersion: '0.5';
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
const MIGRATION_BACKUP_KEY = 'dream-architect-studio:migration-backup:v0.2';
const PRE_IMPORT_BACKUP_KEY = 'dream-architect-studio:pre-import-backup';
const SCHEMA_VERSION = '0.5' as const;

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

const assetTypes: AssetType[] = ['image', 'video', 'audio', 'prompt', 'document', 'url', 'other'];
const assetTypeLabels: Record<AssetType, string> = { image: '画像', video: '動画', audio: '音声・BGM・SE', prompt: 'AIプロンプト', document: 'PDF・テキスト', url: '外部リンク', other: 'その他' };

const dummyScenes: Array<Omit<Scene, 'thumbnail' | 'tags' | 'favorite' | 'productionMemo' | 'productionSteps' | 'assets' | 'createdAt' | 'updatedAt'>> = [
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
function createProductionSteps(status: ProductionStatus = '未着手'): ProductionStep[] { const timestamp = nowIso(); return productionStepDefinitions.map((step) => ({ ...step, status, memo: '', relatedAssets: '', relatedPrompts: '', updatedAt: timestamp })); }
function migrateProductionSteps(value: unknown, fallbackStatus: ProductionStatus): ProductionStep[] {
  const source = Array.isArray(value) ? value : [];
  return productionStepDefinitions.map((definition) => {
    const raw = source.find((item) => item && typeof item === 'object' && (item as Partial<ProductionStep>).id === definition.id) as Partial<ProductionStep> | undefined;
    return {
      ...definition,
      status: isProductionStatus(raw?.status) ? raw.status : fallbackStatus,
      memo: typeof raw?.memo === 'string' ? raw.memo : '',
      relatedAssets: typeof raw?.relatedAssets === 'string' ? raw.relatedAssets : '',
      relatedPrompts: typeof raw?.relatedPrompts === 'string' ? raw.relatedPrompts : '',
      updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : nowIso(),
    };
  });
}
function calculateSceneProgress(steps: ProductionStep[]) { return steps.length ? Math.round(steps.reduce((sum, step) => sum + statusProgress[step.status], 0) / steps.length) : 0; }
function inferSceneStatusFromSteps(steps: ProductionStep[]): ProductionStatus { if (steps.every((step) => step.status === '完了')) return '完了'; if (steps.some((step) => step.status === '確認中')) return '確認中'; if (steps.some((step) => step.status === '作業中')) return '作業中'; return '未着手'; }
function clampProgress(value: unknown, fallback: number) { const numberValue = typeof value === 'number' ? value : Number(value); if (!Number.isFinite(numberValue)) return fallback; return Math.min(100, Math.max(0, Math.round(numberValue))); }
function cloneImage(value?: Partial<ImageReference>): ImageReference { return { label: typeof value?.label === 'string' ? value.label : '', source: typeof value?.source === 'string' ? value.source : '', memo: typeof value?.memo === 'string' ? value.memo : '' }; }
function readTags(value: unknown): string[] { return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }

function migrateAsset(raw: Partial<Asset> & { id?: string | number }, index: number): Asset {
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : nowIso();
  return {
    id: String(raw.id ?? `asset-${index + 1}`),
    title: typeof raw.title === 'string' ? raw.title : '新しい素材',
    type: isAssetType(raw.type) ? raw.type : 'image',
    source: typeof raw.source === 'string' ? raw.source : '',
    thumbnailUrl: typeof raw.thumbnailUrl === 'string' ? raw.thumbnailUrl : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    memo: typeof raw.memo === 'string' ? raw.memo : '',
    tags: readTags(raw.tags),
    adopted: Boolean(raw.adopted),
    favorite: Boolean(raw.favorite),
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  };
}
function createAsset(id = createId('asset')): Asset { const timestamp = nowIso(); return { id, title: '新しい素材', type: 'image', source: '', thumbnailUrl: '', description: '', memo: '', tags: [], adopted: false, favorite: false, createdAt: timestamp, updatedAt: timestamp }; }

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
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  };
}

function createScene(id = createId('scene')): Scene { return migrateScene({ id, title: '新しい場面', ...emptySceneText }, 0); }
function createEpisode(episodeNumber: number): Episode { const timestamp = nowIso(); return { id: createId('episode'), episodeNumber, title: `第${episodeNumber}話`, summary: '', productionStatus: '未着手', thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', scenes: [createScene()], createdAt: timestamp, updatedAt: timestamp }; }
function createWork(): Work { const timestamp = nowIso(); return { id: createId('work'), title: '新しい作品', description: '', productionStatus: '未着手', thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', episodes: [createEpisode(0)], createdAt: timestamp, updatedAt: timestamp }; }

function createDefaultDashboardData(): DashboardData {
  const timestamp = nowIso();
  const scenes = dummyScenes.map((scene, index) => migrateScene(scene, index));
  return { schemaVersion: SCHEMA_VERSION, appName: 'Dream Architect Studio', createdAt: timestamp, updatedAt: timestamp, works: [{ id: 'work-tia-nova-production-diary', title: 'ティア・ノヴァのAIアニメ制作日誌', description: 'AIアニメ制作の試行錯誤を記録する作品。', productionStatus: inferStatus(scenes), thumbnail: { ...emptyImageReference }, tags: ['AIアニメ'], favorite: true, productionMemo: '', episodes: [{ id: 'episode-0', episodeNumber: 0, title: '第0話', summary: '', productionStatus: inferStatus(scenes), thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', scenes, createdAt: timestamp, updatedAt: timestamp }], createdAt: timestamp, updatedAt: timestamp }] };
}

function migrateV02Project(raw: unknown): DashboardData | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as ProjectDataV02;
  if (typeof source.workTitle !== 'string' || !Array.isArray(source.scenes)) return null;
  const timestamp = nowIso();
  const scenes = source.scenes.map((scene, index) => migrateScene(scene, index));
  const safeScenes = scenes.length > 0 ? scenes : [createScene('1')];
  return { schemaVersion: SCHEMA_VERSION, appName: 'Dream Architect Studio', createdAt: timestamp, updatedAt: timestamp, works: [{ id: 'work-tia-nova-production-diary', title: 'ティア・ノヴァのAIアニメ制作日誌', description: source.workTitle ? `Version 0.2から移行。旧作品名：${source.workTitle}` : 'Version 0.2から移行した作品。', productionStatus: inferStatus(safeScenes), thumbnail: { ...emptyImageReference }, tags: ['移行データ'], favorite: true, productionMemo: 'Version 0.2の保存データを保持して自動移行しました。', episodes: [{ id: 'episode-0', episodeNumber: 0, title: typeof source.episodeTitle === 'string' ? source.episodeTitle : '第0話', summary: '', productionStatus: inferStatus(safeScenes), thumbnail: { ...emptyImageReference }, tags: [], favorite: false, productionMemo: '', scenes: safeScenes, createdAt: timestamp, updatedAt: timestamp }], createdAt: timestamp, updatedAt: timestamp }] };
}

function normalizeDashboard(raw: unknown): DashboardData | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Partial<DashboardData>;
  if ((source.schemaVersion !== SCHEMA_VERSION && source.schemaVersion !== '0.4' && source.schemaVersion !== '0.3') || !Array.isArray(source.works)) return null;
  const timestamp = typeof source.updatedAt === 'string' ? source.updatedAt : nowIso();
  return { schemaVersion: SCHEMA_VERSION, appName: 'Dream Architect Studio', createdAt: typeof source.createdAt === 'string' ? source.createdAt : timestamp, updatedAt: timestamp, works: source.works.map((work, workIndex) => ({ id: typeof work.id === 'string' ? work.id : `work-${workIndex + 1}`, title: typeof work.title === 'string' ? work.title : '新しい作品', description: typeof work.description === 'string' ? work.description : '', productionStatus: isProductionStatus(work.productionStatus) ? work.productionStatus : '未着手', thumbnail: cloneImage(work.thumbnail), tags: readTags(work.tags), favorite: Boolean(work.favorite), productionMemo: typeof work.productionMemo === 'string' ? work.productionMemo : '', createdAt: typeof work.createdAt === 'string' ? work.createdAt : timestamp, updatedAt: typeof work.updatedAt === 'string' ? work.updatedAt : timestamp, episodes: Array.isArray(work.episodes) && work.episodes.length ? work.episodes.map((episode, episodeIndex) => ({ id: typeof episode.id === 'string' ? episode.id : `episode-${episodeIndex}`, episodeNumber: typeof episode.episodeNumber === 'number' ? episode.episodeNumber : episodeIndex, title: typeof episode.title === 'string' ? episode.title : `第${episodeIndex}話`, summary: typeof episode.summary === 'string' ? episode.summary : '', productionStatus: isProductionStatus(episode.productionStatus) ? episode.productionStatus : '未着手', thumbnail: cloneImage(episode.thumbnail), tags: readTags(episode.tags), favorite: Boolean(episode.favorite), productionMemo: typeof episode.productionMemo === 'string' ? episode.productionMemo : '', scenes: Array.isArray(episode.scenes) && episode.scenes.length ? episode.scenes.map((scene, sceneIndex) => migrateScene(scene, sceneIndex)) : [createScene()], createdAt: typeof episode.createdAt === 'string' ? episode.createdAt : timestamp, updatedAt: typeof episode.updatedAt === 'string' ? episode.updatedAt : timestamp })) : [createEpisode(0)] })) };
}

function loadInitialData(): DashboardData {
  const savedV05 = localStorage.getItem(STORAGE_KEY_V05);
  if (savedV05) { try { return normalizeDashboard(JSON.parse(savedV05)) ?? createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV04 = localStorage.getItem(STORAGE_KEY_V04);
  if (savedV04) { try { return normalizeDashboard(JSON.parse(savedV04)) ?? createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV03 = localStorage.getItem(STORAGE_KEY_V03);
  if (savedV03) { try { const migrated = normalizeDashboard(JSON.parse(savedV03)); if (migrated) { localStorage.setItem(STORAGE_KEY_V05, JSON.stringify(migrated)); return migrated; } return createDefaultDashboardData(); } catch { return createDefaultDashboardData(); } }
  const savedV02 = localStorage.getItem(STORAGE_KEY_V02);
  if (savedV02) {
    try {
      localStorage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify({ backedUpAt: nowIso(), storageKey: STORAGE_KEY_V02, raw: savedV02 }));
      const migrated = migrateV02Project(JSON.parse(savedV02));
      if (migrated) { localStorage.setItem(STORAGE_KEY_V05, JSON.stringify(migrated)); return migrated; }
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_V05, JSON.stringify(dashboard)); }, [dashboard]);

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

  const moveEpisode = (episodeId: string, direction: -1 | 1) => { if (!selectedWork) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => { if (work.id !== selectedWork.id) return work; const index = work.episodes.findIndex((episode) => episode.id === episodeId); const next = index + direction; if (index < 0 || next < 0 || next >= work.episodes.length) return work; const episodes = [...work.episodes]; [episodes[index], episodes[next]] = [episodes[next], episodes[index]]; return { ...work, episodes, updatedAt: nowIso() }; }) })); };
  const moveScene = (sceneId: string, direction: -1 | 1) => { if (!selectedWork || !selectedEpisode) return; moveSceneToIndex(sceneId, selectedEpisode.scenes.findIndex((scene) => scene.id === sceneId) + direction); };
  const moveSceneToIndex = (sceneId: string, to: number) => { if (!selectedWork || !selectedEpisode) return; mutateDashboard((current) => ({ ...current, works: current.works.map((work) => work.id !== selectedWork.id ? work : { ...work, episodes: work.episodes.map((episode) => { if (episode.id !== selectedEpisode.id) return episode; const from = episode.scenes.findIndex((scene) => scene.id === sceneId); if (from < 0 || to < 0 || to >= episode.scenes.length) return episode; const scenes = [...episode.scenes]; const [moved] = scenes.splice(from, 1); scenes.splice(to, 0, moved); return { ...episode, scenes, updatedAt: nowIso() }; }), updatedAt: nowIso() }) })); };
  const moveSceneTo = (sceneId: string, targetId: string) => { if (!selectedEpisode || sceneId === targetId) return; moveSceneToIndex(sceneId, selectedEpisode.scenes.findIndex((scene) => scene.id === targetId)); };
  const handleTouchReorder = (event: PointerEvent<HTMLElement>) => { if (event.pointerType !== 'touch' || !draggedId) return; const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-scene-id]'); const targetId = target?.dataset.sceneId; if (targetId && targetId !== draggedId) moveSceneTo(draggedId, targetId); };

  const buildExportData = (kind: ExportKind, scope: ExportScope) => {
    const context = { workId: selectedWork?.id, episodeId: selectedEpisode?.id, sceneId: selectedScene?.id };
    const rawData = scope === 'all' ? dashboard : scope === 'work' ? selectedWork : scope === 'episode' ? selectedEpisode : selectedScene;
    const data = kind === 'chatgpt-share' ? stripForChatGpt(rawData) : rawData;
    return { schemaVersion: SCHEMA_VERSION, exportType: kind, scope, exportedAt: nowIso(), ...context, data };
  };
  const exportJson = () => { const data = buildExportData(exportKind, exportScope); downloadJson(data, `dream-architect-studio-${exportKind}-${exportScope}-v0.5.json`); };
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
    <header className="app-header"><div><p className="eyebrow">Dream Architect Studio</p><h1>AIアニメ制作ダッシュボード v0.5</h1></div><button onClick={() => setJsonPanelOpen((open) => !open)}>JSON連携</button></header>
    <Breadcrumbs viewMode={viewMode} work={selectedWork} episode={selectedEpisode} scene={selectedScene} onWorks={() => setViewMode('work-list')} onEpisodes={() => setViewMode('episode-list')} onScenes={() => setViewMode('scene-list')} />
    {jsonPanelOpen && <section className="panel import-panel"><h2>JSON連携</h2><div className="form-grid"><label className="field"><span>種類</span><select value={exportKind} onChange={(event) => setExportKind(event.target.value as ExportKind)}><option value="full-backup">完全バックアップJSON</option><option value="chatgpt-share">ChatGPT共有JSON</option></select></label><label className="field"><span>範囲</span><select value={exportScope} onChange={(event) => setExportScope(event.target.value as ExportScope)}><option value="all">全体</option><option value="work">選択中の作品</option><option value="episode">選択中の話数</option><option value="scene">選択中の場面</option></select></label><label className="field"><span>読み込み方式</span><select value={importMode} onChange={(event) => setImportMode(event.target.value as ImportMode)}><option value="add-new">新規だけ追加</option><option value="update-content">一致IDを更新</option><option value="replace-scope">選択範囲を置き換え</option></select></label></div><div className="actions"><button onClick={exportJson}>JSON書き出し</button><button onClick={copyJson}>JSONをコピー</button><button onClick={() => fileInputRef.current?.click()}>JSONファイル読み込み</button><input ref={fileInputRef} type="file" accept="application/json" hidden onChange={importFile} /></div><textarea className="json-paste" value={pastedJson} onChange={(event) => setPastedJson(event.target.value)} placeholder="ここにChatGPT共有JSONまたはバックアップJSONを貼り付け" /><div className="actions"><button onClick={() => applyImport(pastedJson)}>貼り付けたJSONを読み込む</button></div>{message && <p className="status-message">{message}</p>}</section>}
    {viewMode === 'work-list' && <WorkList works={dashboard.works} onAdd={addWork} onOpen={openWork} onDelete={deleteWork} onSelect={(work) => { setSelectedWorkId(work.id); setSelectedEpisodeId(work.episodes[0]?.id ?? null); setSelectedSceneId(work.episodes[0]?.scenes[0]?.id ?? null); }} />}
    {viewMode === 'episode-list' && selectedWork && <EpisodeList work={selectedWork} onAdd={addEpisode} onOpen={openEpisode} onDelete={deleteEpisode} onMove={moveEpisode} onUpdate={updateSelectedWork} />}
    {viewMode === 'scene-list' && selectedWork && selectedEpisode && <SceneList episode={selectedEpisode} onAdd={addScene} onOpen={openScene} onDelete={deleteScene} onMove={moveScene} draggedId={draggedId} setDraggedId={setDraggedId} handleTouchReorder={handleTouchReorder} onUpdate={updateSelectedEpisode} />}
    {viewMode === 'scene-edit' && selectedScene && <SceneEditor scene={selectedScene} onUpdate={updateSelectedScene} onDelete={() => deleteScene(selectedScene.id)} onAddAsset={addAsset} onUpdateAsset={updateAsset} onDeleteAsset={deleteAsset} />}
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

function EpisodeList({ work, onAdd, onOpen, onDelete, onMove, onUpdate }: { work: Work; onAdd: () => void; onOpen: (episode: Episode) => void; onDelete: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void; onUpdate: (patch: Partial<Work>) => void }) {
  return <><section className="panel detail-panel"><h2>作品情報</h2><EditableCommon entity={work} onChange={onUpdate} titleLabel="作品名" descriptionLabel="作品の説明" /></section><section className="panel"><div className="section-heading"><h2>話数一覧</h2><button onClick={onAdd}>＋ 話数追加</button></div>{work.episodes.map((episode, index) => <article className="scene-card" key={episode.id}><button className="scene-card-main" onClick={() => onOpen(episode)}><strong>{episode.favorite ? '★ ' : ''}第{episode.episodeNumber}話：{episode.title}</strong><span>{episode.summary || '概要未入力'}</span><span>制作状態：{episode.productionStatus} / 場面数：{episode.scenes.length}</span><ProgressBar value={episodeProgress(episode)} /><span>平均進捗：{episodeProgress(episode)}% / 更新：{formatDate(episode.updatedAt)}</span></button><div className="reorder-actions"><button onClick={() => onMove(episode.id, -1)} disabled={index === 0}>上へ</button><button onClick={() => onMove(episode.id, 1)} disabled={index === work.episodes.length - 1}>下へ</button><button className="danger" onClick={() => onDelete(episode.id)}>削除</button></div></article>)}</section></>;
}

function SceneList({ episode, onAdd, onOpen, onDelete, onMove, draggedId, setDraggedId, handleTouchReorder, onUpdate }: { episode: Episode; onAdd: () => void; onOpen: (scene: Scene) => void; onDelete: (id: string) => void; onMove: (id: string, direction: -1 | 1) => void; draggedId: string | null; setDraggedId: (id: string | null) => void; handleTouchReorder: (event: PointerEvent<HTMLElement>) => void; onUpdate: (patch: Partial<Episode>) => void }) {
  return <><section className="panel detail-panel"><h2>話数情報</h2><EditableCommon entity={episode} onChange={onUpdate} titleLabel="話数タイトル" descriptionLabel="話数概要" /></section><section className="panel scene-list"><div className="section-heading"><h2>場面一覧</h2><button onClick={onAdd}>＋ 場面追加</button></div>{episode.scenes.map((scene, index) => <article key={scene.id} data-scene-id={scene.id} className="scene-card" draggable onDragStart={() => setDraggedId(scene.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedId) moveByDrop(draggedId, scene.id); setDraggedId(null); }} onPointerDown={(event: PointerEvent<HTMLElement>) => { if (event.pointerType === 'touch') { setDraggedId(scene.id); event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={handleTouchReorder} onPointerUp={() => setDraggedId(null)} onPointerCancel={() => setDraggedId(null)}><button className="scene-card-main" onClick={() => onOpen(scene)}><strong>{index + 1}. {scene.favorite ? '★ ' : ''}{scene.title}</strong><span>制作状態：{scene.productionStatus} / 工程：{scene.productionSteps.filter((step) => step.status === '完了').length}/{scene.productionSteps.length}完了</span><span>Vidu難易度：{scene.viduDifficulty}</span><ProgressBar value={scene.progressPercent} /><span>進捗率：{scene.progressPercent}% / 更新：{formatDate(scene.updatedAt)}</span></button><div className="reorder-actions"><button onClick={() => onMove(scene.id, -1)} disabled={index === 0}>上へ</button><button onClick={() => onMove(scene.id, 1)} disabled={index === episode.scenes.length - 1}>下へ</button><button className="danger" onClick={() => onDelete(scene.id)}>削除</button></div></article>)} </section></>;
  function moveByDrop(fromId: string, targetId: string) { const from = episode.scenes.findIndex((scene) => scene.id === fromId); const to = episode.scenes.findIndex((scene) => scene.id === targetId); if (from < to) { for (let i = from; i < to; i += 1) onMove(fromId, 1); } else { for (let i = from; i > to; i -= 1) onMove(fromId, -1); } }
}

function SceneEditor({ scene, onUpdate, onDelete, onAddAsset, onUpdateAsset, onDeleteAsset }: { scene: Scene; onUpdate: <K extends keyof Scene>(key: K, value: Scene[K]) => void; onDelete: () => void; onAddAsset: () => void; onUpdateAsset: (assetId: string, patch: Partial<Asset>) => void; onDeleteAsset: (assetId: string) => void }) {
  const [selectedStepId, setSelectedStepId] = useState<ProductionStepId>(scene.productionSteps[0]?.id ?? 'script');
  const selectedStep = scene.productionSteps.find((step) => step.id === selectedStepId) ?? scene.productionSteps[0];
  const updateStep = (patch: Partial<ProductionStep>) => {
    if (!selectedStep) return;
    onUpdate('productionSteps', scene.productionSteps.map((step) => step.id === selectedStep.id ? { ...step, ...patch, updatedAt: nowIso() } : step));
  };
  return <>
    <section className="panel scene-detail"><div className="section-heading"><h2>場面編集</h2><button className="danger" onClick={onDelete}>この場面を削除</button></div><Field label="場面タイトル" value={scene.title} onChange={(value) => onUpdate('title', value)} /><TextArea label="概要" value={scene.summary} onChange={(value) => onUpdate('summary', value)} /><TextArea label="ティアのセリフ" value={scene.tiaLine} onChange={(value) => onUpdate('tiaLine', value)} /><TextArea label="ノヴァのセリフ" value={scene.novaLine} onChange={(value) => onUpdate('novaLine', value)} /><TextArea label="決定事項" value={scene.decisions} onChange={(value) => onUpdate('decisions', value)} /><TextArea label="未決定事項" value={scene.openIssues} onChange={(value) => onUpdate('openIssues', value)} /><TextArea label="メモ" value={scene.memo} onChange={(value) => onUpdate('memo', value)} /><CommonFields entity={scene} onChange={(patch) => { if (patch.thumbnail) onUpdate('thumbnail', patch.thumbnail as ImageReference); if (patch.tags) onUpdate('tags', patch.tags as string[]); if (typeof patch.favorite === 'boolean') onUpdate('favorite', patch.favorite); if (typeof patch.productionMemo === 'string') onUpdate('productionMemo', patch.productionMemo); }} /><div className="readonly-progress"><span>制作状態：{scene.productionStatus}</span><span>工程から自動計算：{scene.progressPercent}%</span><ProgressBar value={scene.progressPercent} /></div><label className="field"><span>Vidu難易度</span><select value={scene.viduDifficulty} onChange={(event) => onUpdate('viduDifficulty', event.target.value as ViduDifficulty)}><option>低</option><option>中</option><option>高</option></select></label></section>
    <ProductionStepPanel steps={scene.productionSteps} selectedStep={selectedStep} onSelect={setSelectedStepId} onUpdate={updateStep} />
    <AssetList assets={scene.assets} onAdd={onAddAsset} onUpdate={onUpdateAsset} onDelete={onDeleteAsset} />
  </>;
}

function ProductionStepPanel({ steps, selectedStep, onSelect, onUpdate }: { steps: ProductionStep[]; selectedStep?: ProductionStep; onSelect: (id: ProductionStepId) => void; onUpdate: (patch: Partial<ProductionStep>) => void }) {
  return <section className="panel step-panel"><div className="section-heading"><div><h2>制作工程管理</h2><p className="muted">8工程の状態から場面の進捗率を自動計算します。</p></div></div><div className="step-grid">{steps.map((step, index) => <button key={step.id} type="button" className={`step-card ${selectedStep?.id === step.id ? 'active' : ''}`} onClick={() => onSelect(step.id)}><span className="step-number">{index + 1}</span><strong>{step.name}</strong><StatusBadge status={step.status} /><small>素材：{step.relatedAssets ? 'あり' : '未設定'} / プロンプト：{step.relatedPrompts ? 'あり' : '未設定'}</small></button>)}</div>{selectedStep && <div className="step-editor"><h3>{selectedStep.name}を編集</h3><label className="field"><span>状態</span><select value={selectedStep.status} onChange={(event) => onUpdate({ status: event.target.value as ProductionStatus })}><option>未着手</option><option>作業中</option><option>確認中</option><option>完了</option></select></label><TextArea label="メモ" value={selectedStep.memo} onChange={(memo) => onUpdate({ memo })} /><TextArea label="関連素材" value={selectedStep.relatedAssets} onChange={(relatedAssets) => onUpdate({ relatedAssets })} /><TextArea label="関連プロンプト" value={selectedStep.relatedPrompts} onChange={(relatedPrompts) => onUpdate({ relatedPrompts })} /><p className="thumbnail-info">工程更新：{formatDate(selectedStep.updatedAt)}</p></div>}</section>;
}

function AssetList({ assets, onAdd, onUpdate, onDelete }: { assets: Asset[]; onAdd: () => void; onUpdate: (assetId: string, patch: Partial<Asset>) => void; onDelete: (assetId: string) => void }) {
  return <section className="panel asset-list"><div className="section-heading"><h2>素材一覧</h2><button onClick={onAdd}>＋ 素材追加</button></div>{assets.length === 0 ? <p className="muted">この場面の素材はまだありません。</p> : <div className="asset-grid">{assets.map((asset) => <AssetCard key={asset.id} asset={asset} onUpdate={(patch) => onUpdate(asset.id, patch)} onDelete={() => onDelete(asset.id)} />)}</div>}</section>;
}

function AssetCard({ asset, onUpdate, onDelete }: { asset: Asset; onUpdate: (patch: Partial<Asset>) => void; onDelete: () => void }) {
  const showThumbnail = (asset.type === 'image' || asset.type === 'video') && asset.thumbnailUrl;
  return <article className="asset-card"><div className="asset-card-header"><div><h3>{asset.favorite ? '★ ' : ''}{asset.title}</h3><p>{assetTypeLabels[asset.type]} / {asset.adopted ? '採用' : '未採用'} / 更新：{formatDate(asset.updatedAt)}</p></div><button className="danger" onClick={onDelete}>削除</button></div>{showThumbnail ? <img className="asset-thumbnail" src={asset.thumbnailUrl} alt={`${asset.title}のサムネイル`} loading="lazy" /> : (asset.type === 'image' || asset.type === 'video') && <div className="asset-thumbnail placeholder">サムネイル未設定</div>}<div className="asset-editor"><Field label="タイトル" value={asset.title} onChange={(title) => onUpdate({ title })} /><label className="field"><span>種類</span><select value={asset.type} onChange={(event) => onUpdate({ type: event.target.value as AssetType })}>{assetTypes.map((type) => <option key={type} value={type}>{assetTypeLabels[type]}</option>)}</select></label><Field label="URLまたはファイル参照名" value={asset.source} onChange={(source) => onUpdate({ source })} /><Field label="サムネイルURL" value={asset.thumbnailUrl} onChange={(thumbnailUrl) => onUpdate({ thumbnailUrl })} /><TextArea label="説明" value={asset.description} onChange={(description) => onUpdate({ description })} /><TextArea label="メモ" value={asset.memo} onChange={(memo) => onUpdate({ memo })} /><Field label="タグ（カンマ区切り）" value={tagsText(asset.tags)} onChange={(value) => onUpdate({ tags: parseTags(value) })} /><label className="field checkbox-field"><input type="checkbox" checked={asset.adopted} onChange={(event) => onUpdate({ adopted: event.target.checked })} /><span>採用</span></label><label className="field checkbox-field"><input type="checkbox" checked={asset.favorite} onChange={(event) => onUpdate({ favorite: event.target.checked })} /><span>お気に入り</span></label><p className="thumbnail-info">更新日時：{formatDate(asset.updatedAt)}</p></div></article>;
}

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
