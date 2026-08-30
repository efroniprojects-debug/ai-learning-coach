import { useState } from 'react';
import { UploadForm } from '../components/UploadForm';
import { UploadList } from '../components/UploadList';
import { DriveFilesPanel } from '../components/DriveFilesPanel';
import type { Upload } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

export function UploadPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'drive'>('upload');

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Upload file to storage service
      // For now, mock upload
      const mockUrl = `gs://ai-learning-coach-storage/${file.name}`;

      const response = await fetch(`${API_BASE}/api/v1/uploads/file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
          storageUrl: mockUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const upload = await response.json();
      setUploads((prev) => [upload, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessUpload = async (uploadId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/uploads/process/${uploadId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      // Refresh uploads list
      const listResponse = await fetch(`${API_BASE}/api/v1/uploads`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await listResponse.json();
      setUploads(data.uploads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    }
  };

  const handleDeleteUpload = async (uploadId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/uploads/${uploadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      setUploads((prev) => prev.filter((u) => u.id !== uploadId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-2">העלה חומרי לימוד</h1>
      <p className="text-gray-600 mb-8">
        העלה קבצי PDF, תמונות או טקסט. המערכת תחלץ את הטקסט, תפרק לקטעים, וגנרט embeddings לחיפוש סמנטי.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b" role="tablist" aria-label="מקור חומרי הלימוד">
        <button onClick={() => setActiveTab('upload')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'upload' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>העלה קובץ</button>
        <button onClick={() => setActiveTab('drive')} className={`px-4 py-3 text-sm font-medium ${activeTab === 'drive' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>📁 חומרי לימוד מ־Drive</button>
      </div>

      {activeTab === 'drive' ? <DriveFilesPanel /> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">הוסף קובץ</h2>
          <UploadForm onUpload={handleFileUpload} disabled={loading} />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">הקבצים שלך</h2>
          <UploadList
            uploads={uploads}
            onProcess={handleProcessUpload}
            onDelete={handleDeleteUpload}
          />
        </div>
      </div>}
    </div>
  );
}
