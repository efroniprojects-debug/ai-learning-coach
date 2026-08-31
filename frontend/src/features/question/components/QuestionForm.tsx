import { useEffect, useState } from 'react';

interface QuestionFormProps {
  onSubmit: (text: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
}

export function QuestionForm({ onSubmit, disabled, placeholder, initialValue = '' }: QuestionFormProps) {
  const [question, setQuestion] = useState('');

  useEffect(() => {
    if (initialValue) setQuestion(initialValue);
  }, [initialValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    try {
      await onSubmit(question);
      setQuestion('');
    } catch {
      // Error is handled in parent
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={disabled}
        placeholder={placeholder ?? 'כתוב את השאלה שלך כאן...'}
        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />

      <button
        type="submit"
        disabled={disabled || !question.trim()}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {disabled ? 'טוען...' : 'שלח שאלה'}
      </button>
    </form>
  );
}
