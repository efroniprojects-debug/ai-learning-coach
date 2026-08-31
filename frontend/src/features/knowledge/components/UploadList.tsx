import { useMemo, useState } from 'react';

import { Upload } from '../types';

interface UploadListProps {
  uploads: Upload[];
  onProcess?: (uploadId: string) => Promise<void>;
  onDelete?: (uploadId: string) => Promise<void>;
}

const STATUS_ICONS = {
  pending: '⏳',
  processing: '⚙️',
  completed: '✅',
  failed: '❌',
};

const STATUS_LABELS = {
  pending: 'ממתין',
  processing: 'בעיבוד',
  completed: 'הושלם',
  failed: 'כשל',
};

type UploadStatusFilter = 'all' | Upload['processingStatus'];

export function filterUploads(uploads: Upload[], query: string, status: UploadStatusFilter): Upload[] {
  const normalized = query.trim().toLocaleLowerCase('he-IL');
  return uploads.filter((upload) =>
    (!normalized || upload.fileName.toLocaleLowerCase('he-IL').includes(normalized))
    && (status === 'all' || upload.processingStatus === status)
  );
}

export function UploadList({ uploads, onProcess, onDelete }: UploadListProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<UploadStatusFilter>('all');
  const visibleUploads = useMemo(() => filterUploads(uploads, query, status), [query, status, uploads]);
  if (uploads.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-600">
        <p>אין קבצים עדיין</p>
        <p className="text-sm mt-2">העלה קובץ כדי להתחיל</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="חיפוש קובץ..." aria-label="חיפוש בקבצים שהועלו" className="rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select value={status} onChange={(event) => setStatus(event.target.value as UploadStatusFilter)} aria-label="סינון לפי סטטוס עיבוד" className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="all">כל הסטטוסים</option><option value="completed">מוכן</option><option value="processing">בעיבוד</option><option value="pending">ממתין</option><option value="failed">נכשל</option>
        </select>
      </div>
      {visibleUploads.length === 0 && <p className="rounded-lg bg-gray-50 p-5 text-center text-sm text-gray-500">לא נמצאו קבצים התואמים למסננים.</p>}
      {visibleUploads.map((upload) => (
        <div
          key={upload.id}
          className="bg-white border rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {STATUS_ICONS[upload.processingStatus]}
                </span>
                <p className="font-medium text-gray-900">{upload.fileName}</p>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <p>גודל: {(upload.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                <p>סטטוס: {STATUS_LABELS[upload.processingStatus]}</p>
                <p>
                  תאריך:{' '}
                  {new Date(upload.createdAt).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>

            <div className="flex gap-2 ml-4">
              {!upload.isProcessed && upload.processingStatus === 'pending' && (
                <button
                  onClick={() => onProcess?.(upload.id)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 font-medium"
                >
                  עבד
                </button>
              )}

              <button
                onClick={() => onDelete?.(upload.id)}
                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 font-medium"
              >
                מחק
              </button>
            </div>
          </div>

          {upload.processingStatus === 'processing' && (
            <div className="mt-3 relative h-1 bg-gray-200 rounded overflow-hidden">
              <div className="absolute h-full bg-blue-600 animate-pulse" style={{width: '50%'}}></div>
            </div>
          )}

          {upload.processingStatus === 'completed' && (
            <div className="mt-3 text-xs text-green-600">
              ✓ קובץ מעובד וזמין לחיפוש
            </div>
          )}

          {upload.processingStatus === 'failed' && (
            <div className="mt-3 text-xs text-red-600">
              ✕ שגיאה בעיבוד הקובץ
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
