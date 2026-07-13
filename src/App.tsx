import { type ChangeEvent, type PointerEvent, useEffect, useMemo, useRef, useState } from 'react';

type ProductionStatus = '未着手' | '作業中' | '確認中' | '完了';
type ViduDifficulty = '低' | '中' | '高';
type ImportMode = 'add-new' | 'update-content' | 'replace-all';

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
};

type ProjectData = {
  schemaVersion: '0.2';
  workTitle: string;
  episodeTitle: string;
  scenes: Scene[];
};

type ImportPreview = {
  add: number;
  update: number;
  replace: number;
  ignored: number;
};

const STORAGE_KEY = 'ai-anime-production-dashboard:v0.1';
const BACKUP_KEY = 'ai-anime-production-dashboard:pre-import-backup';
const SCHEMA_VERSION = '0.2' as const;
const emptySceneText = {
  summary: '',
  tiaLine: '',
  novaLine: '',
  decisions: '',
  openIssues: '',
  memo: '',
};

const dummyScenes: Scene[] = [
  {
    id: '1',
    title: '第0話-場面1：目覚めるティア',
    summary: 'ティアが白い実験室のような空間で目を覚まし、自分の記憶が曖昧なことに気づく。',
    tiaLine: 'ここは……どこ？ 私は、何をしていたの？',
    novaLine: '落ち着いて。君の状態は安定している。まずは呼吸を整えよう。',
    decisions: '冒頭は静かな雰囲気で開始。ティアの不安を中心に見せる。',
    openIssues: '実験室の具体的な美術設定を決める。',
    memo: '光は柔らかく、少し神秘的にする。',
    productionStatus: '作業中',
    progressPercent: 50,
    viduDifficulty: '中',
  },
  {
    id: '2',
    title: '第0話-場面2：ノヴァとの出会い',
    summary: 'ティアの前に案内役のノヴァが現れ、状況を説明しようとする。',
    tiaLine: 'あなたは誰？ 私を知っているの？',
    novaLine: '僕はノヴァ。君をここから導くために作られたサポートAIだ。',
    decisions: 'ノヴァは落ち着いた声で、敵ではない印象を出す。',
    openIssues: 'ノヴァのビジュアル表現を人型にするかホログラムにするか。',
    memo: '会話テンポはゆっくり。',
    productionStatus: '未着手',
    progressPercent: 0,
    viduDifficulty: '低',
  },
  {
    id: '3',
    title: '第0話-場面3：外の世界',
    summary: '壁面スクリーンに、崩壊した都市と美しい空が映し出される。',
    tiaLine: 'これが……外の世界？',
    novaLine: '正確には、君がこれから向き合う世界の記録だ。',
    decisions: '世界観提示のため、印象的なワイドショットを入れる。',
    openIssues: '都市崩壊の程度と時代感を調整する。',
    memo: 'Vidu生成では背景変化が多いため難易度高め。',
    productionStatus: '確認中',
    progressPercent: 50,
    viduDifficulty: '高',
  },
  {
    id: '4',
    title: '第0話-場面4：最初の選択',
    summary: 'ティアは記憶を取り戻すため、ノヴァと共に施設を出る決意をする。',
    tiaLine: '怖いけど……知らないままでは進めない。行くよ。',
    novaLine: 'その選択を記録した。扉を開く。',
    decisions: 'ティアの主体性が出る場面にする。',
    openIssues: '扉が開く演出の音と光を決める。',
    memo: '感情の切り替わりを丁寧に。',
    productionStatus: '未着手',
    progressPercent: 0,
    viduDifficulty: '中',
  },
  {
    id: '5',
    title: '第0話-場面5：タイトルへ',
    summary: '施設の扉が開き、強い光の中へ歩き出すティアとノヴァ。第0話のタイトルが表示される。',
    tiaLine: '私の物語は、ここから始まるんだね。',
    novaLine: 'そう。これは、失われた記憶を探す旅の始まりだ。',
    decisions: '最後に作品タイトルへつなぐ。',
    openIssues: 'タイトル表示の文言とタイミング。',
    memo: '短いが印象に残る締めにする。',
    productionStatus: '完了',
    progressPercent: 100,
    viduDifficulty: '低',
  },
];

const defaultProject: ProjectData = {
  schemaVersion: SCHEMA_VERSION,
  workTitle: 'ティアとノヴァのAIアニメ制作管理',
  episodeTitle: '第0話',
  scenes: dummyScenes,
};

function isProductionStatus(value: unknown): value is ProductionStatus {
  return value === '未着手' || value === '作業中' || value === '確認中' || value === '完了';
}

function isViduDifficulty(value: unknown): value is ViduDifficulty {
  return value === '低' || value === '中' || value === '高';
}

function inferProgress(status: ProductionStatus) {
  if (status === '完了') return 100;
  if (status === '作業中' || status === '確認中') return 50;
  return 0;
}

function clampProgress(value: unknown, fallback: number) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
}

function migrateScene(raw: Partial<Scene> & { id?: string | number }, index: number): Scene {
  const productionStatus = isProductionStatus(raw.productionStatus) ? raw.productionStatus : '未着手';
  return {
    id: String(raw.id ?? `scene-${index + 1}`),
    title: typeof raw.title === 'string' ? raw.title : '新しい場面',
    summary: typeof raw.summary === 'string' ? raw.summary : '',
    tiaLine: typeof raw.tiaLine === 'string' ? raw.tiaLine : '',
    novaLine: typeof raw.novaLine === 'string' ? raw.novaLine : '',
    decisions: typeof raw.decisions === 'string' ? raw.decisions : '',
    openIssues: typeof raw.openIssues === 'string' ? raw.openIssues : '',
    memo: typeof raw.memo === 'string' ? raw.memo : '',
    productionStatus,
    progressPercent: clampProgress(raw.progressPercent, inferProgress(productionStatus)),
    viduDifficulty: isViduDifficulty(raw.viduDifficulty) ? raw.viduDifficulty : '低',
  };
}

function migrateProject(raw: unknown): ProjectData | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as { workTitle?: unknown; episodeTitle?: unknown; scenes?: unknown };
  if (typeof source.workTitle !== 'string' || !Array.isArray(source.scenes)) return null;
  const scenes = source.scenes.map((scene, index) => migrateScene(scene as Partial<Scene>, index));
  return {
    schemaVersion: SCHEMA_VERSION,
    workTitle: source.workTitle,
    episodeTitle: typeof source.episodeTitle === 'string' ? source.episodeTitle : '第0話',
    scenes: scenes.length > 0 ? scenes : [createScene('1')],
  };
}

function loadInitialData(): ProjectData {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultProject;
  try {
    return migrateProject(JSON.parse(saved)) ?? defaultProject;
  } catch {
    return defaultProject;
  }
}

function createScene(id: string): Scene {
  return {
    id,
    title: '新しい場面',
    ...emptySceneText,
    productionStatus: '未着手',
    progressPercent: 0,
    viduDifficulty: '低',
  };
}

function createUniqueId(scenes: Scene[]) {
  const ids = new Set(scenes.map((scene) => scene.id));
  let nextNumber = scenes.reduce((max, scene) => {
    const numericId = Number(scene.id);
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max;
  }, 0) + 1;
  let candidate = String(nextNumber);
  while (ids.has(candidate)) candidate = `scene-${Date.now()}-${nextNumber++}`;
  return candidate;
}

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const [project, setProject] = useState<ProjectData>(loadInitialData);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(project.scenes[0]?.id ?? '1');
  const [chatGptImportOpen, setChatGptImportOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [importMode, setImportMode] = useState<ImportMode>('add-new');
  const [importMessage, setImportMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatGptFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const selectedScene = project.scenes.find((scene) => scene.id === selectedSceneId) ?? project.scenes[0];
  const averageProgress = useMemo(() => Math.round(project.scenes.reduce((sum, scene) => sum + scene.progressPercent, 0) / project.scenes.length), [project.scenes]);

  const buildShareJson = (source = project) => ({
    schemaVersion: SCHEMA_VERSION,
    exportType: 'chatgpt-share',
    exportedAt: new Date().toISOString(),
    workTitle: source.workTitle,
    episodeTitle: source.episodeTitle,
    scenes: source.scenes.map((scene, index) => ({ ...scene, sceneNumber: index + 1 })),
  });

  const updateScene = <K extends keyof Scene>(key: K, value: Scene[K]) => {
    if (!selectedScene) return;
    setProject((current) => ({
      ...current,
      scenes: current.scenes.map((scene) => {
        if (scene.id !== selectedScene.id) return scene;
        if (key === 'productionStatus' && value === '完了') return { ...scene, productionStatus: value as ProductionStatus, progressPercent: 100 };
        return { ...scene, [key]: value };
      }),
    }));
  };

  const addScene = () => {
    setProject((current) => {
      const newScene = createScene(createUniqueId(current.scenes));
      setSelectedSceneId(newScene.id);
      return { ...current, scenes: [...current.scenes, newScene] };
    });
  };

  const deleteScene = () => {
    if (!selectedScene) return;
    if (project.scenes.length <= 1) {
      window.alert('最後の1場面は削除できません。');
      return;
    }
    if (!window.confirm(`「${selectedScene.title}」を削除します。元に戻せません。よろしいですか？`)) return;
    setProject((current) => {
      const remaining = current.scenes.filter((scene) => scene.id !== selectedScene.id);
      setSelectedSceneId(remaining[0]?.id ?? '1');
      return { ...current, scenes: remaining };
    });
  };

  const moveScene = (sceneId: string, direction: -1 | 1) => {
    setProject((current) => {
      const index = current.scenes.findIndex((scene) => scene.id === sceneId);
      const newIndex = index + direction;
      if (index < 0 || newIndex < 0 || newIndex >= current.scenes.length) return current;
      const scenes = [...current.scenes];
      [scenes[index], scenes[newIndex]] = [scenes[newIndex], scenes[index]];
      return { ...current, scenes };
    });
  };

  const moveSceneTo = (sceneId: string, targetId: string) => {
    if (sceneId === targetId) return;
    setProject((current) => {
      const from = current.scenes.findIndex((scene) => scene.id === sceneId);
      const to = current.scenes.findIndex((scene) => scene.id === targetId);
      if (from < 0 || to < 0) return current;
      const scenes = [...current.scenes];
      const [moved] = scenes.splice(from, 1);
      scenes.splice(to, 0, moved);
      return { ...current, scenes };
    });
  };


  const handleTouchReorder = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch' || !draggedSceneId) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-scene-id]');
    const targetId = target?.dataset.sceneId;
    if (targetId && targetId !== draggedSceneId) moveSceneTo(draggedSceneId, targetId);
  };

  const exportJson = () => downloadJson(project, 'ai-anime-dashboard-v0.2-backup.json');
  const exportChatGptJson = () => downloadJson(buildShareJson(), 'ai-anime-dashboard-chatgpt-share-v0.2.json');

  const copyChatGptJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildShareJson(), null, 2));
      setCopyMessage('ChatGPT共有用JSONをクリップボードへコピーしました。');
    } catch {
      setCopyMessage('クリップボードへコピーできませんでした。JSONファイル保存を使用してください。');
    }
  };

  const importFullBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = migrateProject(JSON.parse(await file.text()));
      if (!imported) throw new Error('invalid');
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ backedUpAt: new Date().toISOString(), project }));
      setProject(imported);
      setSelectedSceneId(imported.scenes[0]?.id ?? '1');
    } catch {
      window.alert('JSONの読み込みに失敗しました。既存データは変更していません。');
    } finally {
      event.target.value = '';
    }
  };

  const previewImport = (incoming: ProjectData): ImportPreview => {
    const existingIds = new Set(project.scenes.map((scene) => scene.id));
    const incomingIds = new Set(incoming.scenes.map((scene) => scene.id));
    return {
      add: incoming.scenes.filter((scene) => !existingIds.has(scene.id)).length,
      update: incoming.scenes.filter((scene) => existingIds.has(scene.id)).length,
      replace: incoming.scenes.length,
      ignored: project.scenes.filter((scene) => !incomingIds.has(scene.id)).length,
    };
  };

  const applyChatGptImport = (text: string) => {
    setImportMessage('');
    let incoming: ProjectData | null = null;
    try {
      incoming = migrateProject(JSON.parse(text));
      if (!incoming) throw new Error('invalid');
    } catch {
      setImportMessage('不正なJSONです。既存データは変更していません。');
      return;
    }
    const preview = previewImport(incoming);
    const details = importMode === 'add-new'
      ? `新規追加 ${preview.add}件、既存のため無視 ${preview.update}件`
      : importMode === 'update-content'
        ? `内容更新 ${preview.update}件、未照合 ${preview.add}件`
        : `完全置き換え ${preview.replace}件`;
    if (!window.confirm(`読み込み前確認：${details}。実行しますか？`)) {
      setImportMessage(`キャンセルしました。予定されていた変更：${details}。`);
      return;
    }
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ backedUpAt: new Date().toISOString(), project }));
    setProject((current) => {
      if (importMode === 'replace-all') return incoming;
      if (importMode === 'add-new') {
        const ids = new Set(current.scenes.map((scene) => scene.id));
        return { ...current, scenes: [...current.scenes, ...incoming.scenes.filter((scene) => !ids.has(scene.id))] };
      }
      return {
        ...current,
        scenes: current.scenes.map((scene) => {
          const matched = incoming.scenes.find((item) => item.id === scene.id);
          if (!matched) return scene;
          return {
            ...scene,
            title: matched.title,
            summary: matched.summary,
            tiaLine: matched.tiaLine,
            novaLine: matched.novaLine,
            decisions: matched.decisions,
            openIssues: matched.openIssues,
            memo: matched.memo,
            viduDifficulty: matched.viduDifficulty,
          };
        }),
      };
    });
    setSelectedSceneId((currentId) => incoming.scenes.some((scene) => scene.id === currentId) ? currentId : incoming.scenes[0]?.id ?? currentId);
    setImportMessage(`読み込み完了：${details}。読み込み前バックアップをlocalStorageへ保存しました。`);
  };

  const importChatGptFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPastedJson(text);
    applyChatGptImport(text);
    event.target.value = '';
  };

  return (
    <main className="app">
      <section className="panel home-panel">
        <div className="home-fields">
          <p className="label">作品名</p>
          <input className="title-input" value={project.workTitle} onChange={(event) => setProject({ ...project, workTitle: event.target.value })} aria-label="作品名" />
          <p className="label episode-label">話数名</p>
          <input className="title-input" value={project.episodeTitle} onChange={(event) => setProject({ ...project, episodeTitle: event.target.value })} aria-label="話数名" />
          <div className="average-progress" aria-label={`全場面の平均進捗率 ${averageProgress}%`}><span>全体進捗</span><strong>{averageProgress}%</strong><ProgressBar value={averageProgress} /></div>
        </div>
        <div className="actions">
          <button onClick={() => setSelectedSceneId(project.scenes[0]?.id ?? '1')}>第0話を開く</button>
          <button onClick={() => fileInputRef.current?.click()}>完全バックアップJSON読み込み</button>
          <button onClick={exportJson}>完全バックアップJSON書き出し</button>
          <button onClick={exportChatGptJson}>ChatGPTへ渡すJSON</button>
          <button onClick={copyChatGptJson}>共有JSONをコピー</button>
          <button onClick={() => setChatGptImportOpen((open) => !open)}>ChatGPTから読み込む</button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={importFullBackup} />
          <input ref={chatGptFileInputRef} type="file" accept="application/json" hidden onChange={importChatGptFile} />
          {copyMessage && <p className="status-message">{copyMessage}</p>}
        </div>
      </section>

      {chatGptImportOpen && (
        <section className="panel import-panel">
          <h2>ChatGPTからJSONを読み込む</h2>
          <label className="field"><span>読み込み方法</span><select value={importMode} onChange={(event) => setImportMode(event.target.value as ImportMode)}><option value="add-new">新しい場面だけ追加</option><option value="update-content">内容だけ更新</option><option value="replace-all">完全に置き換え</option></select></label>
          <textarea className="json-paste" value={pastedJson} onChange={(event) => setPastedJson(event.target.value)} rows={10} placeholder="ここにChatGPT共有用JSONを貼り付け" />
          <div className="actions"><button onClick={() => applyChatGptImport(pastedJson)}>貼り付けたJSONを読み込む</button><button onClick={() => chatGptFileInputRef.current?.click()}>JSONファイルから読み込む</button></div>
          {importMessage && <p className="status-message">{importMessage}</p>}
        </section>
      )}

      <div className="layout">
        <section className="panel scene-list">
          <div className="section-heading"><h2>場面一覧</h2><button onClick={addScene}>＋ 場面追加</button></div>
          {project.scenes.map((scene, index) => (
            <article key={scene.id} data-scene-id={scene.id} className={scene.id === selectedScene?.id ? 'scene-card selected' : 'scene-card'} draggable onDragStart={() => setDraggedSceneId(scene.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedSceneId) moveSceneTo(draggedSceneId, scene.id); setDraggedSceneId(null); }} onPointerDown={(event: PointerEvent<HTMLElement>) => { if (event.pointerType === 'touch') { setDraggedSceneId(scene.id); event.currentTarget.setPointerCapture(event.pointerId); } }} onPointerMove={handleTouchReorder} onPointerUp={() => setDraggedSceneId(null)} onPointerCancel={() => setDraggedSceneId(null)}>
              <button className="scene-card-main" onClick={() => setSelectedSceneId(scene.id)}><strong>{index + 1}. {scene.title}</strong><span>制作状態：{scene.productionStatus}</span><span>Vidu難易度：{scene.viduDifficulty}</span><ProgressBar value={scene.progressPercent} /><span>進捗率：{scene.progressPercent}%</span></button>
              <div className="reorder-actions"><button onClick={() => moveScene(scene.id, -1)} disabled={index === 0}>上へ</button><button onClick={() => moveScene(scene.id, 1)} disabled={index === project.scenes.length - 1}>下へ</button></div>
            </article>
          ))}
        </section>

        {selectedScene && (
          <section className="panel scene-detail">
            <div className="section-heading"><h2>場面詳細</h2><button className="danger" onClick={deleteScene}>この場面を削除</button></div>
            <Field label="タイトル" value={selectedScene.title} onChange={(value) => updateScene('title', value)} />
            <TextArea label="概要" value={selectedScene.summary} onChange={(value) => updateScene('summary', value)} />
            <TextArea label="ティアのセリフ" value={selectedScene.tiaLine} onChange={(value) => updateScene('tiaLine', value)} />
            <TextArea label="ノヴァのセリフ" value={selectedScene.novaLine} onChange={(value) => updateScene('novaLine', value)} />
            <TextArea label="決定事項" value={selectedScene.decisions} onChange={(value) => updateScene('decisions', value)} />
            <TextArea label="未決定事項" value={selectedScene.openIssues} onChange={(value) => updateScene('openIssues', value)} />
            <TextArea label="メモ" value={selectedScene.memo} onChange={(value) => updateScene('memo', value)} />
            <label className="field"><span>制作状態</span><select value={selectedScene.productionStatus} onChange={(event) => updateScene('productionStatus', event.target.value as ProductionStatus)}><option>未着手</option><option>作業中</option><option>確認中</option><option>完了</option></select></label>
            <label className="field"><span>進捗率（0〜100%）</span><div className="progress-editor"><input type="range" min="0" max="100" value={selectedScene.progressPercent} onChange={(event) => updateScene('progressPercent', clampProgress(event.target.value, selectedScene.progressPercent))} /><input type="number" min="0" max="100" value={selectedScene.progressPercent} onChange={(event) => { const next = Number(event.target.value); if (Number.isFinite(next) && next >= 0 && next <= 100) updateScene('progressPercent', Math.round(next)); }} /></div></label>
            <label className="field"><span>Vidu難易度</span><select value={selectedScene.viduDifficulty} onChange={(event) => updateScene('viduDifficulty', event.target.value as ViduDifficulty)}><option>低</option><option>中</option><option>高</option></select></label>
          </section>
        )}
      </div>
    </main>
  );
}

function ProgressBar({ value }: { value: number }) {
  return <div className="progress-bar"><span style={{ width: `${value}%` }} /></div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} /></label>;
}
