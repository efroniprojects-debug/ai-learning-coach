import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QuestionForm } from '../components/QuestionForm';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { ModeSelector, type Mode } from '../components/ModeSelector';
import { TopicSelector } from '../components/TopicSelector';
import { PhetPanel, type PhetSim } from '../components/PhetPanel';
import type { TutorResponse } from '../types';

type Provider = 'claude' | 'gemini' | 'openai';

const PROVIDERS: { id: Provider; label: string; description: string }[] = [
  { id: 'claude', label: 'Claude', description: 'Anthropic' },
  { id: 'gemini', label: 'Gemini', description: 'Google' },
  { id: 'openai', label: 'GPT-4o', description: 'OpenAI' },
];

const API_BASE = import.meta.env.VITE_API_URL || '';

export function QuestionWorkspacePage() {
  const token = localStorage.getItem('accessToken') ?? '';

  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('claude');
  const [isFollowUp, setIsFollowUp] = useState(false);

  // Sprint 6 additions
  const [mode, setMode] = useState<Mode>('step_by_step');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [phetSims, setPhetSims] = useState<PhetSim[]>([]);
  const [showTopicPanel, setShowTopicPanel] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const handleSubmitQuestion = useCallback(async (rawText: string) => {
    // Prepend topic context if a subtopic is selected
    const text =
      selectedTopic && selectedSubtopic
        ? `[נושא: ${selectedTopic} → ${selectedSubtopic}]\n${rawText}`
        : rawText;

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setError(null);
    setIsStreaming(true);
    setStreamText('');
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/questions/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          subjectId: 'physics',
          conversationId: isFollowUp ? conversationId : undefined,
          mode,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event: Record<string, unknown>;
          try { event = JSON.parse(raw); } catch { continue; }

          if (event.type === 'delta') {
            setStreamText((prev) => prev + (event.text as string));
          } else if (event.type === 'done') {
            const data = event as unknown as {
              type: 'done';
              conversationId: string;
              messageId: string;
              structured: TutorResponse;
              sources: TutorResponse['sources'];
            };
            const structured: TutorResponse = {
              ...data.structured,
              conversationId: data.conversationId,
              messageId: data.messageId,
              sources: data.sources,
            };
            setResponse(structured);
            setConversationId(data.conversationId);
            setIsStreaming(false);
          } else if (event.type === 'error') {
            throw new Error(event.message as string || 'Stream error');
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'שגיאה לא צפויה';
      setError(msg);
      setIsStreaming(false);
    }
  }, [token, conversationId, isFollowUp, mode, selectedTopic, selectedSubtopic]);

  const handleNewConversation = () => {
    setConversationId(null);
    setResponse(null);
    setStreamText('');
    setError(null);
    setIsFollowUp(false);
  };

  const handleTopicSelect = (topic: string, subtopic: string) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(subtopic);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">
            → חזרה לדשבורד
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">שאל שאלה בפיזיקה</h1>
            <p className="text-sm text-gray-500">המורה האישי שלך יסביר שלב אחרי שלב</p>
          </div>
        </div>
        {conversationId && (
          <button
            onClick={handleNewConversation}
            className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg"
          >
            + שיחה חדשה
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ── Input column ── */}
        <div className="space-y-4">
          {/* Provider selector */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">ספק AI:</p>
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
                    disabled={isStreaming}
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

          {/* Mode selector */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">מצב הסבר:</p>
            <ModeSelector mode={mode} onChange={setMode} disabled={isStreaming} />
          </div>

          {/* Topic selector toggle */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowTopicPanel((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>📚</span>
                <span>בחר נושא</span>
                {selectedSubtopic && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {selectedSubtopic}
                  </span>
                )}
              </span>
              <span className="text-gray-400 text-xs">{showTopicPanel ? '▲' : '▼'}</span>
            </button>

            {showTopicPanel && (
              <div className="p-3 space-y-3 border-t border-gray-100">
                <TopicSelector
                  selectedTopic={selectedTopic}
                  selectedSubtopic={selectedSubtopic}
                  onSelect={handleTopicSelect}
                  onPhetSims={setPhetSims}
                />
                {/* PhET panel shown when a subtopic is selected */}
                {selectedSubtopic && (
                  <div className="pt-2 border-t border-gray-100">
                    <PhetPanel sims={phetSims} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Follow-up toggle */}
          {conversationId && response && (
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                checked={isFollowUp}
                onChange={(e) => setIsFollowUp(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <p className="text-sm font-medium text-blue-800">שאלת המשך</p>
                <p className="text-xs text-blue-600">שמור על ההקשר של השיחה הנוכחית</p>
              </div>
            </label>
          )}

          <QuestionForm
            onSubmit={handleSubmitQuestion}
            disabled={isStreaming}
            placeholder={isFollowUp ? 'שאל שאלת המשך...' : 'מה זה כוח? מה ההבדל בין מסה למשקל?'}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <strong>שגיאה: </strong>{error}
              {error.includes('API key') && (
                <div className="mt-2">
                  <Link to="/ai-settings" className="underline text-red-600">
                    → הגדר מפתח API בהגדרות
                  </Link>
                </div>
              )}
            </div>
          )}

          {conversationId && (
            <div className="text-xs text-gray-400 text-center">
              שיחה פעילה · {isFollowUp ? 'שאלת המשך בהקשר' : 'שאלה חדשה'}
            </div>
          )}
        </div>

        {/* ── Response column ── */}
        <div>
          {isStreaming ? (
            <ResponseDisplay
              response={{ conversationId: '', messageId: '', explanation: '', steps: [], hints: [], misconceptions: [], sources: [] }}
              isStreaming
              streamText={streamText}
            />
          ) : response ? (
            <ResponseDisplay response={response} />
          ) : (
            <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
              <span className="text-4xl mb-3">🎓</span>
              <p className="text-sm">התשובה תופיע כאן</p>
              <p className="text-xs mt-1 text-gray-300">עם הסבר, צעדים ורמזים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
