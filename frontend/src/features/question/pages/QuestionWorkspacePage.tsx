import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QuestionForm } from '../components/QuestionForm';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { ModeSelector } from '../components/ModeSelector';
import { TopicSelector } from '../components/TopicSelector';
import { PhetPanel } from '../components/PhetPanel';
import { ImageUpload } from '../components/ImageUpload';
import { ConversationHistory } from '../components/ConversationHistory';
import type { TutorResponse } from '../types';

type Mode = 'step_by_step' | 'full' | 'diagnose' | 'concept';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

export function QuestionWorkspacePage() {
  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [mode, setMode] = useState<Mode>('step_by_step');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const handleTopicSelect = useCallback((topic: string, subtopic: string) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(subtopic);
  }, []);

  const handleSubmitQuestion = useCallback(async (text: string) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setError(null);
    setIsStreaming(true);
    setStreamText('');
    setResponse(null);

    const topicPrefix = selectedSubtopic ? `[נושא: ${selectedTopic} → ${selectedSubtopic}]\n` : '';

    try {
      const res = await fetch(`${API_BASE}/api/v1/questions/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: topicPrefix + text,
          subjectId: 'physics',
          conversationId: isFollowUp ? conversationId : undefined,
          mode,
          topic: selectedTopic ?? undefined,
          subtopic: selectedSubtopic ?? undefined,
          imageData: imageData ?? undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedDone = false;

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
            const d = event as { conversationId: string; messageId: string; structured: TutorResponse; sources: TutorResponse['sources'] };
            setResponse({ ...d.structured, conversationId: d.conversationId, messageId: d.messageId, sources: d.sources });
            setConversationId(d.conversationId);
            setIsStreaming(false);
            setImageData(null);
            receivedDone = true;
          } else if (event.type === 'error') {
            throw new Error((event.message as string) || 'Stream error');
          }
        }
      }

      if (!receivedDone) {
        throw new Error('החיבור לשרת נסגר לפני שהתקבלה תשובה מלאה');
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
      setIsStreaming(false);
    }
  }, [conversationId, imageData, isFollowUp, mode, selectedTopic, selectedSubtopic]);

  const handleNewConversation = () => {
    setConversationId(null); setResponse(null); setStreamText(''); setError(null); setIsFollowUp(false);
  };

  const handleConversationSelect = (savedResponse: TutorResponse) => {
    setResponse(savedResponse);
    setConversationId(savedResponse.conversationId);
    setStreamText('');
    setError(null);
    setIsFollowUp(true);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">→ דשבורד</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">שאל שאלה בפיזיקה 🔬</h1>
            <p className="text-xs text-gray-500">מורה AI אישי — הסברים שלב אחרי שלב</p>
          </div>
        </div>
        {conversationId && (
          <button onClick={handleNewConversation} className="text-sm text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            + שיחה חדשה
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* ── Sidebar: Topic + PhET ── */}
        <div className="lg:col-span-1 space-y-4">
          <ConversationHistory
            activeConversationId={conversationId}
            onSelect={handleConversationSelect}
            onNew={handleNewConversation}
          />
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTopics(!showTopics)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <span className="font-medium text-gray-800 text-sm">
                📚 {selectedSubtopic ? selectedSubtopic : 'בחר נושא'}
              </span>
              <span className="text-gray-400 text-xs">{showTopics ? '▲' : '▼'}</span>
            </button>
            {showTopics && (
              <div className="p-3 border-t border-gray-100">
                <TopicSelector selectedSubtopic={selectedSubtopic} onSelect={handleTopicSelect} />
              </div>
            )}
          </div>

          {selectedSubtopic && (
            <div className="border border-gray-200 rounded-xl p-3">
              <PhetPanel subtopic={selectedSubtopic} />
            </div>
          )}
        </div>

        {/* ── Main: Mode + Input + Response ── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Mode selector */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">מצב הסבר</p>
            <ModeSelector mode={mode} onChange={setMode} disabled={isStreaming} />
          </div>

          {/* Follow-up */}
          {conversationId && response && (
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <input type="checkbox" checked={isFollowUp} onChange={(e) => setIsFollowUp(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
              <div>
                <p className="text-sm font-medium text-blue-800">שאלת המשך</p>
                <p className="text-xs text-blue-600">שמור על הקשר השיחה</p>
              </div>
            </label>
          )}

          {/* Question form */}
          <QuestionForm
            onSubmit={handleSubmitQuestion}
            disabled={isStreaming}
            placeholder={
              mode === 'diagnose'
                ? 'שתף את הניסיון שלך (גם אם שגוי) — המורה יאבחן את הטעות...'
                : isFollowUp ? 'שאל שאלת המשך...'
                : 'מה זה כוח? מה ההבדל בין מסה למשקל? כדור נזרק...'
            }
          />

          {/* Image upload */}
          <div className="px-1">
            <ImageUpload onImage={setImageData} disabled={isStreaming} />
            {imageData && (
              <p className="text-xs text-blue-600 mt-1">📷 התמונה תישלח לניתוח עם השאלה</p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <strong>שגיאה: </strong>{error}
              {error.includes('API key') && (
                <div className="mt-2">
                  <Link to="/ai-settings" className="underline text-red-600">→ הגדר מפתח API בהגדרות</Link>
                </div>
              )}
            </div>
          )}

          {/* Response */}
          {isStreaming ? (
            <ResponseDisplay
              response={{ conversationId: '', messageId: '', explanation: '', steps: [], hints: [], misconceptions: [], sources: [] }}
              isStreaming
              streamText={streamText}
            />
          ) : response ? (
            <ResponseDisplay response={response} />
          ) : (
            <div className="flex flex-col items-center justify-center h-56 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
              <span className="text-4xl mb-3">🎓</span>
              <p className="text-sm">התשובה תופיע כאן</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
