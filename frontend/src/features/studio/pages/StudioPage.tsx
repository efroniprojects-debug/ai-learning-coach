import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

interface StudioSource { kind: 'drive' | 'upload'; id: string; name: string; mimeType?: string; }
interface DriveFile { id: string; name: string; mimeType: string; }
interface UploadFile { id: string; fileName: string; mimeType: string; processingStatus: string; }

export function StudioPage() {
  const [sources, setSources] = useState<StudioSource[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sourceQuery, setSourceQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [driveResponse, uploadResponse] = await Promise.all([
          fetch(`${API_BASE}/api/v1/drive/files`), fetch(`${API_BASE}/api/v1/uploads`),
        ]);
        const driveData = await driveResponse.json() as { files?: DriveFile[] };
        const uploadData = await uploadResponse.json() as { uploads?: UploadFile[] };
        const supportedDrive = (driveData.files ?? []).filter((file) => [
          'application/pdf', 'text/plain', 'text/markdown', 'application/vnd.google-apps.document',
        ].includes(file.mimeType));
        setSources([
          ...supportedDrive.map((file): StudioSource => ({ kind: 'drive', id: file.id, name: file.name, mimeType: file.mimeType })),
          ...(uploadData.uploads ?? []).filter((file) => file.processingStatus === 'completed').map((file): StudioSource => ({ kind: 'upload', id: file.id, name: file.fileName, mimeType: file.mimeType })),
        ]);
      } catch { setError('טעינת חומרי הלימוד נכשלה'); }
      finally { setLoading(false); }
    };
    void load();
  }, []);

  const selectedSources = useMemo(() => sources.filter((source) => selected.has(`${source.kind}:${source.id}`)), [selected, sources]);
  const filteredSources = useMemo(() => {
    const normalized = sourceQuery.trim().toLocaleLowerCase('he-IL');
    return normalized ? sources.filter((source) => source.name.toLocaleLowerCase('he-IL').includes(normalized)) : sources;
  }, [sourceQuery, sources]);

  const toggle = (source: StudioSource) => {
    const key = `${source.kind}:${source.id}`;
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else if (next.size < 10) next.add(key);
      return next;
    });
  };

  const generate = async (task: 'summary' | 'practice') => {
    if (selectedSources.length === 0) { setError('בחר לפחות מקור לימוד אחד'); return; }
    setGenerating(true); setError(null); setResult('');
    try {
      const response = await fetch(`${API_BASE}/api/v1/studio/generate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, sources: selectedSources }),
      });
      const data = await response.json() as { content?: string; error?: string };
      if (!response.ok || !data.content) throw new Error(data.error ?? 'יצירת התוכן נכשלה');
      setResult(data.content);
    } catch (err) { setError(err instanceof Error ? err.message : 'יצירת התוכן נכשלה'); }
    finally { setGenerating(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Studio 📚</h1>
        <p className="mt-2 text-sm text-gray-600">בחר חומרי לימוד מ־Drive או מהקבצים שהעלית, וצור מהם סיכום או תרגול מותאם.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">מקורות</h2><span className="text-xs text-gray-500">נבחרו {selected.size}/10</span></div>
          <input type="search" value={sourceQuery} onChange={(event) => setSourceQuery(event.target.value)} placeholder="🔎 חיפוש מקור לפי שם..." className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
          {loading ? <div className="h-32 animate-pulse rounded bg-gray-100" /> : (
            <div className="max-h-[480px] space-y-2 overflow-y-auto">
              {sources.length === 0 && <p className="rounded bg-amber-50 p-3 text-sm text-amber-800">לא נמצאו מקורות מעובדים. ניתן להוסיף אותם במסך „העלה חומרים”.</p>}
              {sources.length > 0 && filteredSources.length === 0 && <p className="rounded bg-gray-50 p-3 text-center text-sm text-gray-500">לא נמצאו מקורות התואמים לחיפוש</p>}
              {filteredSources.map((source) => {
                const key = `${source.kind}:${source.id}`;
                return <label key={key} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 ${selected.has(key) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(source)} className="mt-1" />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium text-gray-800">{source.kind === 'drive' ? '☁️' : '📄'} {source.name}</span><span className="text-xs text-gray-500">{source.kind === 'drive' ? 'Google Drive' : 'קובץ שהועלה'}</span></span>
                </label>;
              })}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => void generate('summary')} disabled={generating || selected.size === 0} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">📝 צור סיכום</button>
            <button onClick={() => void generate('practice')} disabled={generating || selected.size === 0} className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50">🎯 צור תרגול</button>
          </div>
        </section>
        <section className="min-h-[520px] rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-gray-900">תוצר הלמידה</h2>
          {generating && <div className="flex h-64 items-center justify-center text-sm text-blue-700"><span className="animate-pulse">SmarterAI מעבד את המקורות…</span></div>}
          {!generating && !result && <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400">התוצר יופיע כאן</div>}
          {result && <div className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{result}</div>}
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        </section>
      </div>
    </div>
  );
}
