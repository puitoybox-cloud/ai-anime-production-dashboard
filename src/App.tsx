import { type ChangeEvent, useEffect, useRef, useState } from 'react';

type ProductionStatus = '未着手' | '作業中' | '確認中' | '完了';
type ViduDifficulty = '低' | '中' | '高';

type Scene = {
  id: number;
  title: string;
  summary: string;
  tiaLine: string;
  novaLine: string;
  decisions: string;
  openIssues: string;
  memo: string;
  productionStatus: ProductionStatus;
  viduDifficulty: ViduDifficulty;
};

type ProjectData = {
  workTitle: string;
  episodeTitle: string;
  scenes: Scene[];
};

const STORAGE_KEY = 'ai-anime-production-dashboard:v0.1';

const dummyScenes: Scene[] = [
  {
    id: 1,
    title: '第0話-場面1：目覚めるティア',
    summary: 'ティアが白い実験室のような空間で目を覚まし、自分の記憶が曖昧なことに気づく。',
    tiaLine: 'ここは……どこ？ 私は、何をしていたの？',
    novaLine: '落ち着いて。君の状態は安定している。まずは呼吸を整えよう。',
    decisions: '冒頭は静かな雰囲気で開始。ティアの不安を中心に見せる。',
    openIssues: '実験室の具体的な美術設定を決める。',
    memo: '光は柔らかく、少し神秘的にする。',
    productionStatus: '作業中',
    viduDifficulty: '中',
  },
  {
    id: 2,
    title: '第0話-場面2：ノヴァとの出会い',
    summary: 'ティアの前に案内役のノヴァが現れ、状況を説明しようとする。',
    tiaLine: 'あなたは誰？ 私を知っているの？',
    novaLine: '僕はノヴァ。君をここから導くために作られたサポートAIだ。',
    decisions: 'ノヴァは落ち着いた声で、敵ではない印象を出す。',
    openIssues: 'ノヴァのビジュアル表現を人型にするかホログラムにするか。',
    memo: '会話テンポはゆっくり。',
    productionStatus: '未着手',
    viduDifficulty: '低',
  },
  {
    id: 3,
    title: '第0話-場面3：外の世界',
    summary: '壁面スクリーンに、崩壊した都市と美しい空が映し出される。',
    tiaLine: 'これが……外の世界？',
    novaLine: '正確には、君がこれから向き合う世界の記録だ。',
    decisions: '世界観提示のため、印象的なワイドショットを入れる。',
    openIssues: '都市崩壊の程度と時代感を調整する。',
    memo: 'Vidu生成では背景変化が多いため難易度高め。',
    productionStatus: '確認中',
    viduDifficulty: '高',
  },
  {
    id: 4,
    title: '第0話-場面4：最初の選択',
    summary: 'ティアは記憶を取り戻すため、ノヴァと共に施設を出る決意をする。',
    tiaLine: '怖いけど……知らないままでは進めない。行くよ。',
    novaLine: 'その選択を記録した。扉を開く。',
    decisions: 'ティアの主体性が出る場面にする。',
    openIssues: '扉が開く演出の音と光を決める。',
    memo: '感情の切り替わりを丁寧に。',
    productionStatus: '未着手',
    viduDifficulty: '中',
  },
  {
    id: 5,
    title: '第0話-場面5：タイトルへ',
    summary: '施設の扉が開き、強い光の中へ歩き出すティアとノヴァ。第0話のタイトルが表示される。',
    tiaLine: '私の物語は、ここから始まるんだね。',
    novaLine: 'そう。これは、失われた記憶を探す旅の始まりだ。',
    decisions: '最後に作品タイトルへつなぐ。',
    openIssues: 'タイトル表示の文言とタイミング。',
    memo: '短いが印象に残る締めにする。',
    productionStatus: '完了',
    viduDifficulty: '低',
  },
];

const defaultProject: ProjectData = {
  workTitle: 'ティアとノヴァのAIアニメ制作管理',
  episodeTitle: '第0話',
  scenes: dummyScenes,
};

function loadInitialData(): ProjectData {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return defaultProject;

  try {
    const parsed = JSON.parse(saved) as ProjectData;
    if (!parsed.workTitle || !Array.isArray(parsed.scenes)) return defaultProject;
    return parsed;
  } catch {
    return defaultProject;
  }
}

export function App() {
  const [project, setProject] = useState<ProjectData>(loadInitialData);
  const [selectedSceneId, setSelectedSceneId] = useState<number>(project.scenes[0]?.id ?? 1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const selectedScene = project.scenes.find((scene) => scene.id === selectedSceneId) ?? project.scenes[0];

  const updateScene = <K extends keyof Scene>(key: K, value: Scene[K]) => {
    if (!selectedScene) return;
    setProject((current) => ({
      ...current,
      scenes: current.scenes.map((scene) =>
        scene.id === selectedScene.id ? { ...scene, [key]: value } : scene,
      ),
    }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ai-anime-dashboard-v0.1.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as ProjectData;
      if (!imported.workTitle || !Array.isArray(imported.scenes)) {
        window.alert('JSONの形式が正しくありません。');
        return;
      }
      setProject(imported);
      setSelectedSceneId(imported.scenes[0]?.id ?? 1);
    } catch {
      window.alert('JSONの読み込みに失敗しました。');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <main className="app">
      <section className="panel home-panel">
        <div>
          <p className="label">作品名</p>
          <input
            className="title-input"
            value={project.workTitle}
            onChange={(event) => setProject({ ...project, workTitle: event.target.value })}
            aria-label="作品名"
          />
        </div>
        <div className="actions">
          <button onClick={() => setSelectedSceneId(project.scenes[0]?.id ?? 1)}>第0話を開く</button>
          <button onClick={() => fileInputRef.current?.click()}>JSON読み込み</button>
          <button onClick={exportJson}>JSON書き出し</button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={importJson} />
        </div>
      </section>

      <div className="layout">
        <section className="panel scene-list">
          <h2>場面一覧</h2>
          {project.scenes.map((scene) => (
            <button
              key={scene.id}
              className={scene.id === selectedScene?.id ? 'scene-card selected' : 'scene-card'}
              onClick={() => setSelectedSceneId(scene.id)}
            >
              <strong>{scene.title}</strong>
              <span>制作状態：{scene.productionStatus}</span>
              <span>Vidu難易度：{scene.viduDifficulty}</span>
            </button>
          ))}
        </section>

        {selectedScene && (
          <section className="panel scene-detail">
            <h2>場面詳細</h2>
            <Field label="タイトル" value={selectedScene.title} onChange={(value) => updateScene('title', value)} />
            <TextArea label="概要" value={selectedScene.summary} onChange={(value) => updateScene('summary', value)} />
            <TextArea label="ティアのセリフ" value={selectedScene.tiaLine} onChange={(value) => updateScene('tiaLine', value)} />
            <TextArea label="ノヴァのセリフ" value={selectedScene.novaLine} onChange={(value) => updateScene('novaLine', value)} />
            <TextArea label="決定事項" value={selectedScene.decisions} onChange={(value) => updateScene('decisions', value)} />
            <TextArea label="未決定事項" value={selectedScene.openIssues} onChange={(value) => updateScene('openIssues', value)} />
            <TextArea label="メモ" value={selectedScene.memo} onChange={(value) => updateScene('memo', value)} />
            <label className="field">
              <span>制作状態</span>
              <select
                value={selectedScene.productionStatus}
                onChange={(event) => updateScene('productionStatus', event.target.value as ProductionStatus)}
              >
                <option>未着手</option>
                <option>作業中</option>
                <option>確認中</option>
                <option>完了</option>
              </select>
            </label>
          </section>
        )}
      </div>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} />
    </label>
  );
}
