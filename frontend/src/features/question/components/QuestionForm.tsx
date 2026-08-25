import { useState } from 'react';

interface QuestionFormProps {
  onSubmit: (text: string, imageUrls?: string[]) => Promise<void>;
  disabled?: boolean;
}

export function QuestionForm({ onSubmit, disabled }: QuestionFormProps) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      alert('אנא הקלד שאלה');
      return;
    }

    // TODO: Upload images to storage and get URLs
    const imageUrls: string[] = [];

    await onSubmit(text, imageUrls);
    setText('');
    setImages([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text Input */}
      <div>
        <label className="block text-sm font-medium mb-2">שאלתך</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder="לדוגמה: כיצד אחשב את התאוצה אם הכוח הוא 50N והמסה היא 10 ק״ג?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          rows={6}
        />
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">התמונות (אופציוני)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageSelect}
          disabled={disabled}
          className="block w-full text-sm text-gray-500 file:px-4 file:py-2 file:border file:border-gray-300 file:rounded file:text-sm file:font-medium hover:file:bg-gray-50 disabled:opacity-50"
        />
        {images.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">{images.length} תמונות נבחרו</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {disabled ? 'חיפוש...' : 'שלח שאלה'}
      </button>
    </form>
  );
}
