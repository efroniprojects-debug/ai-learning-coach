import { useRef, useState } from 'react';

interface ImageUploadProps {
  onImage: (base64: string | null) => void;
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function ImageUpload({ onImage, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('פורמט לא נתמך — jpg / png / gif / webp בלבד');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('התמונה גדולה מדי — מקסימום 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // strip the "data:image/jpeg;base64," prefix — send only the base64 data
      const base64 = result.split(',')[1];
      setPreview(result);
      onImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
    // reset so same file can be reselected
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImage(null);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleChange}
        disabled={disabled}
        aria-label="העלאת תמונה"
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="צרף תמונה (jpg/png, עד 5MB)"
        >
          <span>📷</span>
          <span>צרף תמונה</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <img
            src={preview}
            alt="תצוגה מקדימה"
            className="w-10 h-10 object-cover rounded"
          />
          <span className="text-xs text-blue-700 font-medium">תמונה מצורפת</span>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="text-blue-400 hover:text-red-500 disabled:opacity-50 text-lg leading-none ml-1"
            aria-label="הסר תמונה"
            title="הסר תמונה"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 w-full">{error}</p>
      )}
    </div>
  );
}
