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

export function UploadList({ uploads, onProcess, onDelete }: UploadListProps) {
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
      {uploads.map((upload) => (
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
