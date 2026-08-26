import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QuestionForm } from '../components/QuestionForm';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { apiClient } from '@/services/api.client';
import type { QuestionResponse } from '../types';

type Provider = 'claude' | 'gemini' | 'openai';

const PROVIDERS: { id: Provider; label: string; description: string }[] = [
  { id: 'claude', label: 'Claude', description: 'Anthropic' },
  { id: 'gemini', label: 'Gemini', description: 'Google' },
  { id: 'openai', label: 'GPT-4o', description: 'OpenAI' },
];

export function QuestionWorkspacePage() {
  const [response, setResponse] = useState<QuestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('gemini');

  const handleSubmitQuestion = async (text: string) => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const { data } = await apiClient.post<QuestionResponse>('/api/v1/questions/ask', {
        question: text,
        provider,
      });
      setResponse(data);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'שגיאה לא צפויה';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
          ← חזרה לדשבורד
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">שאל שאלה בפיזיקה</h1>
          <p className="text-sm text-gray-500">המורה האישי שלך יסביר שלב אחרי שלב</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-6">
          {/* Provider selector */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">בחר ספק AI:</p>
            <div className="flex gap-3 flex-wrap">
              {PROVIDERS.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border text-sm transition-colors ${
                    provider === p.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={p.id}
                    checked={provider === p.id}
                    onChange={() => setProvider(p.id)}
                    disabled={loading}
                    className="sr-only"
                  />
                  <span className="font-medium">{p.label}</span>
                  <span className={`text-xs ${provider === p.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {p.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <QuestionForm onSubmit={handleSubmitQuestion} disabled={loading} />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm" dir="rtl">
              <strong>שגיאה: </strong>{error}
              {error.includes('No API key') && (
                <div className="mt-2">
                  <Link to="/ai-settings" className="underline text-red-600">
                    → הגדר מפתח API בהגדרות
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Response */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg border border-gray-200">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
              <p className="text-gray-500 text-sm">
                {provider === 'claude' ? 'Claude' : provider === 'gemini' ? 'Gemini' : 'GPT-4o'} חושב...
              </p>
            </div>
          ) : response ? (
            <ResponseDisplay response={response} questionText="" />
          ) : (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
              <span className="text-4xl mb-3">🎓</span>
              <p className="text-sm">התשובה תופיע כאן</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
