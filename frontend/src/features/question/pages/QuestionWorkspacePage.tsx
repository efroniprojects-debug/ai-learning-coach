import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { QuestionForm } from '../components/QuestionForm';
import { ResponseDisplay } from '../components/ResponseDisplay';
import { ModeSelector } from '../components/ModeSelector';
import { TopicSelector } from '../components/TopicSelector';
import { PhetPanel } from '../components/PhetPanel';
import { ImageUpload } from '../components/ImageUpload';
import { DocumentUpload, type AttachedDocument } from '../components/DocumentUpload';
import { ConversationHistory } from '../components/ConversationHistory';
import { SubjectSelector } from '../components/SubjectSelector';
import type { TutorResponse } from '../types';
import { DEFAULT_SUBJECT_ID, SUBJECTS } from '@/config/subjects';

type Mode = 'step_by_step' | 'full' | 'diagnose' | 'concept';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';
const QUESTION_TIMEOUT_MS = 120_000;

export function extractStreamingExplanation(jsonText: string): string {
  const match = /"explanation"\s*:\s*"/.exec(jsonText);
  if (!match) return '';
  let result = '';
  for (let index = match.index + match[0].length; index < jsonText.length; index += 1) {
    const character = jsonText[index];
    if (character === '"') break;
    if (character !== '\\') { result += character; continue; }
    const escaped = jsonText[index + 1];
    if (!escaped) break;
    if (escaped === 'n') result += '\n';
    else if (escaped === 't') result += '\t';
    else if (escaped === 'r') result += '\r';
    else if (escaped === 'u' && /^[0-9a-fA-F]{4}$/.test(jsonText.slice(index + 2, index + 6))) {
      result += String.fromCharCode(Number.parseInt(jsonText.slice(index + 2, index + 6), 16));
      index += 4;
    } else result += escaped;
    index += 1;
  }
  return result;
}

function readableQuestionError(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  if (/timeout/i.test(message)) return 'הכנת התשובה ארכה יותר מדי. אפשר לנסות שוב בבטחה.';
  if (/network|fetch|connection|חיבור/i.test(message)) return 'החיבור לשרת נקטע. בדוק את החיבור ונסה שוב.';
  if (/429|quota|rate/i.test(message)) return 'שירות המורה עמוס כרגע. המתן מעט ונסה שוב.';
  if (/API key|Gemini.*configured/i.test(message)) return 'שירות המורה אינו מוגדר כרגע. נסה שוב מאוחר יותר.';
  return 'לא הצלחנו להכין תשובה. אפשר לנסות שוב.';
}

const STREAM_STAGE_MESSAGES: Record<string, string> = {
  route_started: 'מתחבר למורה האישי...',
  rag_started: 'מחפש חומר לימוד רלוונטי...',
  rag_completed: 'מכין הסבר שמתאים לשאלה...',
  rag_skipped: 'מכין הסבר על סמך הידע של המורה...',
  gemini_started: 'בונה את ההסבר שלב אחרי שלב...',
};

export function QuestionWorkspacePage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSubject = searchParams.get('subject') ?? DEFAULT_SUBJECT_ID;
  const [subjectId, setSubjectId] = useState(
    SUBJECTS[requestedSubject] ? requestedSubject : DEFAULT_SUBJECT_ID
  );
  const subject = SUBJECTS[subjectId];
  const routeState = location.state as { prefilledText?: string; selectedTopic?: string; selectedSubtopic?: string } | null;
  const [response, setResponse] = useState<TutorResponse | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [document, setDocument] = useState<AttachedDocument | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [mode, setMode] = useState<Mode>('step_by_step');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(routeState?.selectedTopic ?? null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(routeState?.selectedSubtopic ?? null);
  const [showTopics, setShowTopics] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const abortReasonRef = useRef<'user' | 'timeout' | null>(null);
  const lastQuestionRef = useRef<string | null>(null);

  useEffect(() => {
    if (routeState?.selectedTopic) setSelectedTopic(routeState.selectedTopic);
    if (routeState?.selectedSubtopic) setSelectedSubtopic(routeState.selectedSubtopic);
  }, [routeState?.selectedTopic, routeState?.selectedSubtopic]);

  const handleTopicSelect = useCallback((topic: string, subtopic: string) => {
    setSelectedTopic(topic);
    setSelectedSubtopic(subtopic);
  }, []);

  const handleSubmitQuestion = useCallback(async (text: string) => {
    if (isStreaming) return;
    const controller = new AbortController();
    abortRef.current = controller;
    abortReasonRef.current = null;
    lastQuestionRef.current = text;
    const timeoutId = window.setTimeout(() => {
      abortReasonRef.current = 'timeout';
      controller.abort();
    }, QUESTION_TIMEOUT_MS);
    setError(null);
    setIsStreaming(true);
    setStreamText('שולח את השאלה...');
    setResponse(null);

    const topicPrefix = selectedSubtopic ? `[נושא: ${selectedTopic} → ${selectedSubtopic}]\n` : '';

    try {
      const res = await fetch(`${API_BASE}/api/v1/questions/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: topicPrefix + text,
          subjectId,
          conversationId: isFollowUp ? conversationId : undefined,
          mode,
          topic: selectedTopic ?? undefined,
          subtopic: selectedSubtopic ?? undefined,
          imageData: imageData ?? undefined,
          documentData: document?.data,
          documentMimeType: document?.mimeType,
          documentName: document?.name,
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
      let streamedJson = '';
      let receivedDone = false;

      while (!receivedDone) {
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

          if (event.type === 'status') {
            // The backend already reports real work stages; translating them here
            // reassures the student without inventing progress or changing the API.
            const stage = typeof event.stage === 'string' ? event.stage : '';
            const stageMessage = STREAM_STAGE_MESSAGES[stage];
            if (stageMessage) setStreamText(stageMessage);
          } else if (event.type === 'delta') {
            streamedJson += typeof event.text === 'string' ? event.text : '';
            const explanation = extractStreamingExplanation(streamedJson);
            setStreamText(explanation || 'מעבד ומסדר את התשובה...');
          } else if (event.type === 'done') {
            const d = event as { conversationId: string; messageId: string; structured: TutorResponse; sources: TutorResponse['sources']; masteryUpdate?: { subtopic: string; previousElo: number; elo: number; confidence: string } };
            setResponse({ ...d.structured, conversationId: d.conversationId, messageId: d.messageId, sources: d.sources });
            setConversationId(d.conversationId);
            setIsStreaming(false);
            setImageData(null);
            setDocument(null);
            receivedDone = true;
            if (d.masteryUpdate && d.masteryUpdate.previousElo < 900 && d.masteryUpdate.elo >= 900) {
              const levels: Record<string, string> = { novice: 'מתחיל', intermediate: 'ביניים', proficient: 'שולט', expert: 'מומחה' };
              setCelebration(`🎉 שיפרת את ${d.masteryUpdate.subtopic}! רמה: ${levels[d.masteryUpdate.confidence] ?? d.masteryUpdate.confidence}`);
              window.setTimeout(() => setCelebration(null), 4000);
            }
          } else if (event.type === 'error') {
            throw new Error((event.message as string) || 'Stream error');
          }
        }
      }

      if (!receivedDone) {
        throw new Error('החיבור לשרת נסגר לפני שהתקבלה תשובה מלאה');
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        setError(abortReasonRef.current === 'timeout'
          ? 'הכנת התשובה ארכה יותר מדי. אפשר לנסות שוב בבטחה.'
          : 'הפעולה בוטלה. אפשר לערוך את השאלה ולשלוח שוב.');
      } else {
        setError(readableQuestionError(err));
      }
      setIsStreaming(false);
    } finally {
      window.clearTimeout(timeoutId);
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [conversationId, document, imageData, isFollowUp, isStreaming, mode, selectedTopic, selectedSubtopic, subjectId]);

  const cancelQuestion = () => {
    abortReasonRef.current = 'user';
    abortRef.current?.abort();
  };

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

  const handleSubjectChange = (nextSubjectId: string) => {
    if (nextSubjectId === subjectId || isStreaming || !SUBJECTS[nextSubjectId]) return;
    setSubjectId(nextSubjectId);
    setSearchParams({ subject: nextSubjectId }, { replace: true });
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    setShowTopics(false);
    handleNewConversation();
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 text-sm">→ דשבורד</Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">שאל שאלה ב{subject.nameHe} {subject.icon}</h1>
            <p className="text-xs text-gray-500">מורה AI אישי — הסברים שלב אחרי שלב</p>
          </div>
        </div>
        {conversationId && (
          <button onClick={handleNewConversation} className="text-sm text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            + שיחה חדשה
          </button>
        )}
      </div>

      <div className="mb-5">
        <SubjectSelector value={subjectId} disabled={isStreaming} onChange={handleSubjectChange} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* ── Sidebar: Topic + PhET ── */}
        <div className="lg:col-span-1 space-y-4">
          <ConversationHistory
            subjectId={subjectId}
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
                <TopicSelector subjectId={subjectId} selectedSubtopic={selectedSubtopic} onSelect={handleTopicSelect} />
              </div>
            )}
          </div>

          {subjectId === 'physics' && selectedSubtopic && (
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
            initialValue={routeState?.prefilledText}
            placeholder={
              mode === 'diagnose'
                ? 'שתף את הניסיון שלך (גם אם שגוי) — המורה יאבחן את הטעות...'
                : isFollowUp ? 'שאל שאלת המשך...'
                : 'מה זה כוח? מה ההבדל בין מסה למשקל? כדור נזרק...'
            }
          />

          {celebration && (
            <div className="fixed bottom-6 right-6 z-[9000] max-w-sm rounded-xl bg-green-600 text-white px-5 py-4 shadow-2xl animate-bounce" role="status">
              {celebration}
            </div>
          )}

          {/* Attachments */}
          <div className="flex flex-wrap items-start gap-3 px-1">
            <ImageUpload onImage={setImageData} disabled={isStreaming || Boolean(document)} />
            <DocumentUpload onDocument={setDocument} disabled={isStreaming || Boolean(imageData)} />
            {imageData && (
              <p className="w-full text-xs text-blue-600">📷 התמונה תישלח לניתוח עם השאלה</p>
            )}
            {document && (
              <p className="w-full text-xs text-violet-700">📄 המסמך ייקרא וינותח יחד עם השאלה</p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <strong>לא הצלחנו להשלים את הפעולה: </strong>{error}
              {lastQuestionRef.current && !isStreaming && (
                <button type="button" onClick={() => void handleSubmitQuestion(lastQuestionRef.current as string)} className="mt-3 block rounded-lg bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-800">נסה שוב</button>
              )}
            </div>
          )}

          {/* Response */}
          {isStreaming ? (
            <ResponseDisplay
              response={{ conversationId: '', messageId: '', explanation: '', steps: [], hints: [], misconceptions: [], sources: [] }}
              isStreaming
              streamText={streamText}
              onCancel={cancelQuestion}
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
