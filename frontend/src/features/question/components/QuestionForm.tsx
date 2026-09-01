import { useEffect, useState, type ReactNode } from 'react';
import { VoiceInput } from './VoiceInput';

interface QuestionFormProps {
  onSubmit: (text: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  attachments?: ReactNode;
}

export function QuestionForm({ onSubmit, disabled, placeholder, initialValue = '', attachments }: QuestionFormProps) {
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

      <div className="flex flex-wrap items-center gap-3">
        <VoiceInput
          disabled={disabled}
          onTranscript={(text) => setQuestion((current) => current ? `${current} ${text}` : text)}
        />
        {attachments}
      </div>

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
