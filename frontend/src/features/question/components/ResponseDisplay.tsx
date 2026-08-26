import { useState } from 'react';
import type { TutorResponse } from '../types';

// KaTeX is loaded via CDN in index.html — window.katex is available after page load
declare global {
  interface Window {
    katex?: {
      renderToString(expr: string, opts: object): string;
    };
  }
}

function renderMath(el: HTMLElement) {
  const katex = window.katex;
  if (!katex) return; // CDN not yet loaded — graceful degradation

  const html = el.innerHTML.replace(/\$([^$\n]+)\$/g, (_, expr: string) => {
    try {
      return katex.renderToString(expr.trim(), { throwOnError: false, output: 'html' });
    } catch {
      return `$${expr}$`;
    }
  });
  el.innerHTML = html;
}

type Tab = 'explanation' | 'steps' | 'hints';

interface Props {
  response: TutorResponse;
  isStreaming?: boolean;
  streamText?: string;
}

export function ResponseDisplay({ response, isStreaming, streamText }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('explanation');
  const [revealedHints, setRevealedHints] = useState(0);

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
          <span className="text-sm text-gray-500 font-medium">מורה AI חושב...</span>
        </div>
        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">
          {streamText || ''}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" dir="rtl">
      {/* Tab navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
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
      </div>

      <div className="p-6">
        {/* ── Explanation tab ── */}
        {activeTab === 'explanation' && (
          <div className="space-y-4">
            <div
              className="text-gray-800 leading-relaxed text-sm"
              ref={(el) => { if (el) renderMath(el); }}
            >
              {response.explanation}
            </div>

            {/* Socratic question */}
            {response.socraticQuestion && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-bold text-blue-700 mb-1 uppercase tracking-wide">שאלה לחשיבה</p>
                <p className="text-blue-800 text-sm">{response.socraticQuestion}</p>
              </div>
            )}

            {/* Misconceptions */}
            {response.misconceptions && response.misconceptions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">טעויות נפוצות</p>
                {response.misconceptions.map((m, i) => (
                  <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                    <p className="text-amber-800 line-through opacity-70">{m.misconception}</p>
                    <p className="text-green-700 mt-1">✓ {m.correction}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Sources */}
            {response.sources && response.sources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">מקורות</p>
                <div className="space-y-1.5">
                  {response.sources.map((s) => (
                    <div key={s.id} className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5">
                      <span className="font-medium text-gray-600">{s.source}:</span> {s.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                    <div
                      className="text-gray-700 text-sm leading-relaxed"
                      ref={(el) => { if (el) renderMath(el); }}
                    >
                      {step.content}
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
                    <span className="font-medium text-green-700">רמז {i + 1}: </span>
                    {hint}
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
