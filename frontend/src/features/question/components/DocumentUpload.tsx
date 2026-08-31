import { useRef, useState } from 'react';

export interface AttachedDocument {
  data: string;
  mimeType: string;
  name: string;
}

interface Props {
  onDocument: (document: AttachedDocument | null) => void;
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt'];
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
};

export function DocumentUpload({ onDocument, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setError(null);
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setError('פורמט לא נתמך — PDF, DOC, DOCX או TXT בלבד');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('המסמך גדול מדי — מקסימום 8MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const data = result.split(',')[1];
      if (!data) {
        setError('קריאת המסמך נכשלה');
        return;
      }
      setFileName(file.name);
      onDocument({ data, mimeType: file.type || MIME_BY_EXTENSION[extension], name: file.name });
    };
    reader.onerror = () => setError('קריאת המסמך נכשלה');
    reader.readAsDataURL(file);
  };

  const remove = () => {
    setFileName(null);
    setError(null);
    onDocument(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="sr-only" onChange={handleChange} disabled={disabled} />
      {!fileName ? (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700 hover:bg-violet-100 disabled:opacity-50">
          📄 צרף מסמך
        </button>
      ) : (
        <div className="flex max-w-full items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-800">
          <span className="max-w-64 truncate">📄 {fileName}</span>
          <button type="button" onClick={remove} disabled={disabled} className="bg-transparent p-0 text-violet-500 hover:text-red-600" aria-label="הסר מסמך">✕</button>
        </div>
      )}
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </div>
  );
}
