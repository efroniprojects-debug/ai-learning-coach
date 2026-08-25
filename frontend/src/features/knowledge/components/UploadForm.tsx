import { useState } from 'react';

interface UploadFormProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function UploadForm({ onUpload, disabled }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('אנא בחר קובץ');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onUpload(file);
      setFile(null);
      // Reset input
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
        <input
          type="file"
          onChange={handleFileSelect}
          disabled={disabled || loading}
          accept=".pdf,.jpg,.jpeg,.png,.txt"
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <div className="text-4xl mb-2">📄</div>
          <p className="font-medium text-gray-700">
            {file ? file.name : 'בחר קובץ לעלאה'}
          </p>
          <p className="text-sm text-gray-500">
            PDF, JPG, PNG, או TXT
          </p>
          <p className="text-xs text-gray-400 mt-2">
            עד 50MB
          </p>
        </label>
      </div>

      {file && (
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <p className="text-sm font-medium text-blue-900">
            ✓ {file.name}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || loading || !file}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'העלייה בתהליך...' : 'העלה קובץ'}
      </button>
    </form>
  );
}
