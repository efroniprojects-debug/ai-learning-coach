import { useCallback, useEffect, useState } from 'react';

import type { ConversationSummary, TutorResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

interface Props {
  activeConversationId: string | null;
  onSelect: (response: TutorResponse) => void;
  onNew: () => void;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  structuredData: Omit<TutorResponse, 'conversationId' | 'messageId' | 'sources'> | null;
}

export function ConversationHistory({ activeConversationId, onSelect, onNew }: Props) {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/conversations`);
      const data = await response.json() as { conversations?: ConversationSummary[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'טעינת השיחות נכשלה');
      setItems(data.conversations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'טעינת השיחות נכשלה');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load, activeConversationId]);

  const selectConversation = async (conversation: ConversationSummary) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/conversations/${conversation.id}/messages`);
      const data = await response.json() as { messages?: ConversationMessage[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? 'טעינת השיחה נכשלה');
      const assistant = [...(data.messages ?? [])].reverse().find((message) => message.role === 'assistant' && message.structuredData);
      if (!assistant?.structuredData) throw new Error('לא נמצאה תשובת מורה שמורה בשיחה');
      onSelect({
        ...assistant.structuredData,
        conversationId: conversation.id,
        messageId: assistant.id,
        sources: [],
      });
    } catch (err) { setError(err instanceof Error ? err.message : 'טעינת השיחה נכשלה'); }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3" dir="rtl">
      <div className="mb-3 flex items-center justify-between gap-2"><h2 className="text-sm font-semibold">שיחות קודמות</h2><button onClick={onNew} className="text-xs font-medium text-blue-600">+ חדשה</button></div>
      {loading ? <div className="h-20 animate-pulse rounded bg-gray-100" /> : (
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {items.length === 0 && <p className="py-3 text-center text-xs text-gray-400">אין שיחות שמורות עדיין</p>}
          {items.map((item) => <button key={item.id} onClick={() => void selectConversation(item)} className={`w-full rounded-lg p-2 text-right text-xs ${item.id === activeConversationId ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}><span className="block truncate font-medium">{item.title || 'שיחה ללא כותרת'}</span><span className="text-[11px] text-gray-400">{new Date(item.updatedAt).toLocaleDateString('he-IL')}</span></button>)}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
