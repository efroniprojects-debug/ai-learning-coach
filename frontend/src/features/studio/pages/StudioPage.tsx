import { useEffect, useMemo, useRef, useState } from 'react';
import { FormattedText } from '@/features/question/components/ResponseDisplay';
import { SubjectSelector } from '@/features/question/components/SubjectSelector';
import { useSelectedSubject } from '@/features/subjects/useSelectedSubject';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const STUDIO_TIMEOUT_MS = 100_000;

function readableStudioError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/timeout/i.test(message)) return 'יצירת התוכן ארכה יותר מדי. אפשר לנסות שוב עם אותם מקורות.';
  if (/network|fetch|connection|חיבור/i.test(message)) return 'החיבור לשרת נקטע. המקורות נשמרו ואפשר לנסות שוב.';
  if (/429|quota|rate/i.test(message)) return 'שירות יצירת התוכן עמוס כרגע. המתן מעט ונסה שוב.';
  if (message && /[א-ת]/.test(message)) return message;
  return 'יצירת התוכן נכשלה. אפשר לנסות שוב עם אותם מקורות.';
}

interface StudioSource { kind: 'drive' | 'upload'; id: string; name: string; mimeType?: string; }
interface DriveFile { id: string; name: string; mimeType: string; }
interface UploadFile { id: string; fileName: string; mimeType: string; processingStatus: string; }

export function StudioPage() {
  const { subjectId, subject, setSubjectId } = useSelectedSubject();
  const [sources, setSources] = useState<StudioSource[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sourceQuery, setSourceQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingTask, setGeneratingTask] = useState<'summary' | 'practice' | null>(null);
  const [lastTask, setLastTask] = useState<'summary' | 'practice' | null>(null);
  const [generationStatus, setGenerationStatus] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [aggregateTopic, setAggregateTopic] = useState('');
  const [aggregating, setAggregating] = useState(false);
  const [aggregateMessage, setAggregateMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const generationAbortRef = useRef<AbortController | null>(null);
  const generationAbortReasonRef = useRef<'user' | 'timeout' | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [driveResponse, uploadResponse] = await Promise.all([
          fetch(`${API_BASE}/api/v1/drive/files?subjectId=${encodeURIComponent(subjectId)}`),
          fetch(`${API_BASE}/api/v1/uploads?subjectId=${encodeURIComponent(subjectId)}`),
        ]);
        if (!driveResponse.ok || !uploadResponse.ok) throw new Error('SOURCE_LOAD_FAILED');
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
  }, [reloadToken, subjectId]);

  useEffect(() => {
    setSelected(new Set());
    setResult('');
  }, [subjectId]);

  useEffect(() => {
    if (!generating) {
      setElapsedSeconds(0);
      return;
    }

    // Studio requests can take up to 90 seconds, so elapsed time confirms
    // that the request is still active without claiming backend-only progress.
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const timerId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [generating]);

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
    if (generating) return;
    if (selectedSources.length === 0) { setError('בחר לפחות מקור לימוד אחד'); return; }
    const controller = new AbortController();
    generationAbortRef.current = controller;
    generationAbortReasonRef.current = null;
    const timeoutId = window.setTimeout(() => {
      generationAbortReasonRef.current = 'timeout';
      controller.abort();
    }, STUDIO_TIMEOUT_MS);
    setGenerating(true); setGeneratingTask(task); setLastTask(task); setGenerationStatus('מתחיל לקרוא את המקורות…'); setError(null); setResult('');
    try {
      const requestBody = JSON.stringify({ task, sources: selectedSources, subjectId });
      let response = await fetch(`${API_BASE}/api/v1/studio/generate/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: requestBody,
        signal: controller.signal,
      });
      // Preview deployments may reach the stable backend before its new SSE
      // route is deployed. Falling back keeps Studio usable during rollout.
      if (response.status === 404 || response.status === 405) {
        setGenerationStatus(task === 'practice' ? 'מכין תרגול…' : 'מכין סיכום…');
        response = await fetch(`${API_BASE}/api/v1/studio/generate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: requestBody,
          signal: controller.signal,
        });
        const legacyData = await response.json() as { content?: string; error?: string };
        if (!response.ok || !legacyData.content) throw new Error(legacyData.error ?? `HTTP ${response.status}`);
        setResult(legacyData.content);
        return;
      }
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;
      while (!receivedDone) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          const event = JSON.parse(raw) as { type?: string; stage?: string; completed?: number; total?: number; text?: string; content?: string; message?: string };
          if (event.type === 'status') {
            if (event.stage === 'source_completed') setGenerationStatus(`קורא מקור ${event.completed ?? 0} מתוך ${event.total ?? selectedSources.length}…`);
            if (event.stage === 'gemini_started') setGenerationStatus(task === 'practice' ? 'בונה שאלות תרגול…' : 'כותב את הסיכום…');
          } else if (event.type === 'delta' && event.text) {
            setResult((current) => current + event.text);
          } else if (event.type === 'done') {
            if (event.content) setResult(event.content);
            receivedDone = true;
          } else if (event.type === 'error') {
            throw new Error(event.message || 'יצירת התוכן נכשלה');
          }
        }
      }
      if (!receivedDone) throw new Error('החיבור לשרת נסגר לפני שהתוכן הושלם');
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        setError(generationAbortReasonRef.current === 'timeout'
          ? 'יצירת התוכן ארכה יותר מדי. אפשר לנסות שוב עם אותם מקורות.'
          : 'הפעולה בוטלה. המקורות נשמרו ואפשר לנסות שוב.');
      } else setError(readableStudioError(err));
    } finally {
      window.clearTimeout(timeoutId);
      if (generationAbortRef.current === controller) generationAbortRef.current = null;
      setGenerating(false); setGeneratingTask(null); setGenerationStatus('');
    }
  };

  const cancelGeneration = () => {
    generationAbortReasonRef.current = 'user';
    generationAbortRef.current?.abort();
  };

  const aggregateVerifiedSources = async () => {
    const topic = aggregateTopic.trim();
    if (!topic) { setError('הזן נושא לעדכון המקורות'); return; }
    setAggregating(true); setError(null); setAggregateMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/content/aggregate?topic=${encodeURIComponent(topic)}`, { method: 'POST' });
      const data = await response.json() as { sourcesIndexed?: number; chunksCreated?: number; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'עדכון המקורות נכשל');
      setAggregateMessage(`עודכנו ${data.sourcesIndexed ?? 0} מקורות מאומתים ונוצרו ${data.chunksCreated ?? 0} קטעי ידע.`);
    } catch (err) { setError(err instanceof Error ? err.message : 'עדכון המקורות נכשל'); }
    finally { setAggregating(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Studio — {subject.nameHe} {subject.icon}</h1>
        <p className="mt-2 text-sm text-gray-600">בחר חומרי לימוד מ־Drive או מהקבצים שהעלית, וצור מהם סיכום או תרגול מותאם.</p>
      </div>
      <div className="mb-6"><SubjectSelector value={subjectId} disabled={loading || generating} onChange={setSubjectId} /></div>
      {subjectId === 'physics' && <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">🌐 עדכון מקורות פיזיקה מאומתים</h2>
        <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">האיסוף מוגבל למשרד החינוך, ראמ״ה, האוניברסיטה הפתוחה ו־Khan Academy.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={aggregateTopic} onChange={(event) => setAggregateTopic(event.target.value)} placeholder="לדוגמה: מכניקה" className="min-w-52 flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm" />
          <button onClick={() => void aggregateVerifiedSources()} disabled={aggregating || !aggregateTopic.trim()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">{aggregating ? 'מעדכן…' : 'עדכן מקורות'}</button>
        </div>
        {aggregateMessage && <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-200">✓ {aggregateMessage}</p>}
      </section>}
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
          {generating && (
            <div className={`flex flex-col items-center justify-center gap-3 text-center text-sm text-blue-700 ${result ? 'mb-5 rounded-lg bg-blue-50 p-3' : 'h-64'}`}>
              <span className="animate-pulse" role="status" aria-live="polite">
                {generationStatus || (generatingTask === 'practice'
                  ? 'SmarterAI קורא את המקורות ומכין תרגול…'
                  : 'SmarterAI קורא את המקורות ומכין סיכום…')}
              </span>
              <span className="text-xs tabular-nums text-gray-500" aria-hidden="true">{elapsedSeconds} שניות</span>
              {elapsedSeconds >= 15 && (
                <p className="text-xs text-blue-600" role="status">זה לוקח מעט יותר זמן, אבל העבודה ממשיכה כרגיל.</p>
              )}
              <button type="button" onClick={cancelGeneration} className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">בטל פעולה</button>
            </div>
          )}
          {!generating && !result && <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 text-sm text-gray-400">התוצר יופיע כאן</div>}
          {/* Studio returns Markdown and LaTeX, so use the same safe educational formatter as tutor answers. */}
          {result && <div className="text-sm leading-7 text-gray-800"><FormattedText text={result} /></div>}
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => lastTask ? void generate(lastTask) : setReloadToken((value) => value + 1)} className="mt-2 rounded-md bg-red-700 px-3 py-2 text-white">נסה שנית</button></div>}
        </section>
      </div>
    </div>
  );
}
