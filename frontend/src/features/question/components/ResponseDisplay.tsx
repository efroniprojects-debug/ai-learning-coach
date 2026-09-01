import { Fragment, useEffect, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import type { TutorResponse } from '../types';
import type { TutorMode } from './ModeSelector';

export function normalizeMathText(text: string): string {
  const normalizedCommands = text
    .replace(/\\eq\b/g, '=')
    .replace(/\$\$/g, '$');
  let insideFormula = false;
  let result = '';

  for (const character of normalizedCommands) {
    if (character === '$') {
      insideFormula = !insideFormula;
      result += character;
      continue;
    }
    // Model responses occasionally split one formula over several lines.
    // Joining only while inside delimiters preserves paragraph structure.
    if (insideFormula && character === '\n') {
      result += ' ';
      continue;
    }
    result += character;
  }

  // A missing closing delimiter should not expose the rest of the response as
  // raw LaTeX. Closing it lets KaTeX render a readable best-effort fallback.
  return insideFormula ? `${result}$` : result;
}

function InlineContent({ text }: { text: string }) {
  const parts = text.split(/(\$[^$\n]+\$|\*\*[^*]+\*\*)/g).filter(Boolean);
  return <>{parts.map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const expression = part.slice(1, -1).trim();
      try {
        return <span key={index} dir="ltr" className="inline-block mx-1" dangerouslySetInnerHTML={{
          __html: katex.renderToString(expression, { throwOnError: false, output: 'html' }),
        }} />;
      } catch {
        return <span key={index} dir="ltr">{expression}</span>;
      }
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold labels can contain formulas (for example **מצב $R_1$:**),
      // so format their inner content instead of exposing LaTeX delimiters.
      return <strong key={index}><InlineContent text={part.slice(2, -2)} /></strong>;
    }
    return <Fragment key={index}>{part.replace(/(?<!\*)\*(?!\*)/g, '')}</Fragment>;
  })}</>;
}

export function FormattedText({ text }: { text: string }) {
  const lines = normalizeMathText(text.replace(/\\n/g, '\n')).split('\n');
  return (
    <div className="space-y-2">
      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) return <div key={index} className="h-1" aria-hidden="true" />;
        if (/^---+$/.test(line)) return <hr key={index} className="my-4 border-gray-200" />;
        const heading = line.match(/^#{1,4}\s+(.+)$/);
        if (heading) return <h4 key={index} className="font-bold text-gray-900 mt-4"><InlineContent text={heading[1]} /></h4>;
        const bullet = line.match(/^[-•]\s+(.+)$/);
        if (bullet) return <div key={index} className="flex gap-2"><span aria-hidden="true">•</span><p><InlineContent text={bullet[1]} /></p></div>;
        const numberedItem = line.match(/^(\d+)[.)]\s+(.+)$/);
        if (numberedItem) return <div key={index} className="flex items-start gap-2"><span className="min-w-5 font-medium" aria-hidden="true">{numberedItem[1]}.</span><p><InlineContent text={numberedItem[2]} /></p></div>;
        return <p key={index}><InlineContent text={line} /></p>;
      })}
    </div>
  );
}

type Tab = 'explanation' | 'steps' | 'hints';

export function defaultTutorTabForMode(mode?: TutorMode): Tab {
  return mode === 'step_by_step' || mode === 'full' ? 'steps' : 'explanation';
}

interface Props {
  response: TutorResponse;
  isStreaming?: boolean;
  streamText?: string;
  onCancel?: () => void;
  mode?: TutorMode;
}

export function ResponseDisplay({ response, isStreaming, streamText, onCancel, mode }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>(() => defaultTutorTabForMode(mode));
  const [revealedHints, setRevealedHints] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!isStreaming) {
      setElapsedSeconds(0);
      return;
    }

    // A visible clock confirms that the request is still active during long AI calls.
    const startedAt = Date.now();
    setElapsedSeconds(0);
    const timerId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isStreaming]);

  useEffect(() => {
    // A new answer must open on the view promised by the selected tutor mode.
    setActiveTab(defaultTutorTabForMode(mode));
  }, [mode, response.messageId]);

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const readableText = [
      response.explanation,
      ...(response.steps ?? []).map((step) => `${step.title}. ${step.content}`),
    ].join('. ').replace(/[$*_#\\]/g, ' ');
    const utterance = new SpeechSynthesisUtterance(readableText);
    utterance.lang = 'he-IL';
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const tabs: { id: Tab; label: string; emoji: string; count?: number }[] = [
    { id: 'explanation', label: 'הסבר', emoji: '💡' },
    { id: 'steps', label: 'צעדים', emoji: '📋', count: response.steps?.length },
    { id: 'hints', label: 'רמזים', emoji: '🔑', count: response.hints?.length },
  ];

  // During streaming — show live text
  if (isStreaming) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6" dir="rtl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm text-gray-500 font-medium">SmarterAI עובד על התשובה</span>
          <span className="ms-auto text-xs tabular-nums text-gray-400" aria-hidden="true">{elapsedSeconds} שניות</span>
        </div>
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm" role="status" aria-live="polite">
          {streamText || 'מכין את התשובה...'}
        </div>
        {elapsedSeconds >= 15 && (
          <p className="mt-3 text-xs text-blue-600" role="status">זה לוקח מעט יותר זמן, אבל העבודה ממשיכה כרגיל.</p>
        )}
        {onCancel && <button type="button" onClick={onCancel} className="mt-4 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">בטל פעולה</button>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" dir="rtl">
      {/* Tab navigation */}
      <div className="flex flex-wrap items-center border-b border-gray-200 bg-gray-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
        {'speechSynthesis' in window && (
          <button onClick={toggleSpeech} className={`mr-auto ml-2 my-1 rounded-lg border px-3 py-2 text-xs ${speaking ? 'border-red-200 bg-red-50 text-red-700' : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-50'}`}>
            {speaking ? '⏹ עצור הקראה' : '🔊 הקרא תשובה'}
          </button>
        )}
      </div>

      <div className="p-6">
        {/* ── Explanation tab ── */}
        {activeTab === 'explanation' && (
          <div className="space-y-4">
            <div className="text-gray-800 leading-relaxed text-sm">
              <FormattedText text={response.explanation} />
            </div>

            {/* Socratic question */}
            {response.socraticQuestion && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wide">שאלה לחשיבה</p>
                <div className="text-blue-800 text-sm"><FormattedText text={response.socraticQuestion} /></div>
              </div>
            )}

            {/* Misconceptions */}
            {response.misconceptions && response.misconceptions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">טעויות נפוצות</p>
                {response.misconceptions.map((m, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <div className="text-amber-800 line-through opacity-70"><FormattedText text={m.misconception} /></div>
                    <div className="text-green-700 mt-1 flex gap-1"><span>✓</span><FormattedText text={m.correction} /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Retrieved citations only; a missing URL remains visibly non-clickable. */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">מקורות ששימשו בתשובה</p>
              {response.sources && response.sources.length > 0 ? (
                <ol className="space-y-2">
                  {response.sources.map((source, index) => {
                    const citationNumber = source.citationNumber ?? index + 1;
                    const details = [
                      source.section ? `סעיף ${source.section}` : null,
                      source.page ? `עמוד ${source.page}` : null,
                      source.year ? `שנת ${source.year}` : null,
                    ].filter((value): value is string => Boolean(value));
                    const label = `מקור ${citationNumber}: ${source.source}`;
                    return (
                      <li key={source.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        <div className="flex flex-wrap items-center gap-2">
                          {source.url ? (
                            <a href={source.url} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800">
                              {label} <span aria-hidden="true">↗</span>
                            </a>
                          ) : (
                            <span className="font-semibold text-gray-700">{label}</span>
                          )}
                          {details.length > 0 && <span className="text-gray-500">{details.join(' · ')}</span>}
                        </div>
                        <p className="mt-1 line-clamp-3 leading-relaxed">{source.text}</p>
                        {!source.url && <p className="mt-1 text-gray-400">אין קישור מאומת למקור זה</p>}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="note">
                  לא נמצא מקור לימודי מתאים לשאלה הזאת. התשובה ניתנה ללא מקור מצורף.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Steps tab ── */}
        {activeTab === 'steps' && (
          <div className="space-y-4">
            {response.steps && response.steps.length > 0 ? (
              response.steps.map((step) => (
                <div key={step.number} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                    {step.number}
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-100 last:border-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{step.title}</h4>
                    <div className="text-gray-700 text-sm leading-relaxed">
                      <FormattedText text={step.content} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">אין צעדים להציג</p>
            )}
          </div>
        )}

        {/* ── Hints tab ── */}
        {activeTab === 'hints' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 mb-4">
              גלה רמזים בזה אחר זה — נסה קודם בעצמך!
            </p>
            {response.hints && response.hints.map((hint, i) => (
              <div key={i}>
                {i < revealedHints ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    <span className="font-medium text-green-700">רמז {i + 1}:</span>
                    <FormattedText text={hint} />
                  </div>
                ) : i === revealedHints ? (
                  <button
                    onClick={() => setRevealedHints(i + 1)}
                    className="w-full p-4 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors text-center"
                  >
                    גלה רמז {i + 1} 🔍
                  </button>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-300 text-center select-none">
                    רמז {i + 1} (נעול)
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
