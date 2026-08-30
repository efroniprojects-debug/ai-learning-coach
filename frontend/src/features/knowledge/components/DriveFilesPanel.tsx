import { useCallback, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
  sizeBytes: number | null;
}

interface DriveFilesResponse {
  configured: boolean;
  files: DriveFile[];
  lastSyncAt: string | null;
}

export function DriveFilesPanel() {
  const [data, setData] = useState<DriveFilesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/drive/files`);
      const body = await response.json() as DriveFilesResponse & { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'טעינת הקבצים נכשלה');
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינת הקבצים נכשלה');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFiles(); }, [loadFiles]);

  const syncNow = async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/drive/sync`, { method: 'POST' });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? 'הסנכרון נכשל');
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הסנכרון נכשל');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <div className="animate-pulse rounded-xl bg-gray-100 h-36" aria-label="טוען קבצים" />;
  if (!data?.configured) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">Google Drive לא מחובר. ניתן להמשיך להשתמש באתר כרגיל.</div>;
  }

  return (
    <section className="space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">חומרי לימוד מ־Drive</h2>
          <p className="text-xs text-gray-500">סונכרן לאחרונה: {data.lastSyncAt ? new Date(data.lastSyncAt).toLocaleString('he-IL') : 'עדיין לא סונכרן'}</p>
        </div>
        <button onClick={syncNow} disabled={syncing} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {syncing ? 'מסנכרן…' : 'סנכרן עכשיו'}
        </button>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="divide-y rounded-xl border bg-white">
        {data.files.length === 0 ? <p className="p-5 text-sm text-gray-500">אין קבצים בתיקייה המחוברת.</p> : data.files.map((file) => (
          <div key={file.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0"><p className="truncate text-sm font-medium">📄 {file.name}</p><p className="text-xs text-gray-500">{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('he-IL') : 'ללא תאריך'}</p></div>
            <span className="shrink-0 text-xs text-gray-400">{file.sizeBytes ? `${(file.sizeBytes / 1024 / 1024).toFixed(1)} MB` : 'Google Doc'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
