import { useCallback, useEffect, useState } from 'react';

import type { ConversationFolder, ConversationSummary, TutorResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

interface Props { subjectId: string; studyUnits?: number; activeConversationId: string | null; onSelect: (response: TutorResponse) => void; onNew: () => void; }
interface ConversationMessage { id: string; role: 'user' | 'assistant'; structuredData: Omit<TutorResponse, 'conversationId' | 'messageId' | 'sources'> | null; }

async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: options?.body ? { 'Content-Type': 'application/json', ...options.headers } : options?.headers,
  });
  const data: unknown = response.status === 204 ? {} : await response.json();
  const apiError = typeof data === 'object' && data !== null && 'error' in data
    ? String((data as { error?: unknown }).error ?? '')
    : '';
  if (!response.ok) throw new Error(apiError || 'הפעולה נכשלה');
  return data;
}

export function ConversationHistory({ subjectId, studyUnits, activeConversationId, onSelect, onNew }: Props) {
  const [items, setItems] = useState<ConversationSummary[]>([]);
  const [folders, setFolders] = useState<ConversationFolder[]>([]);
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      params.set('subjectId', subjectId);
      if (studyUnits) params.set('studyUnits', String(studyUnits));
      if (query.trim()) params.set('q', query.trim());
      if (folderFilter !== 'all') params.set('folderId', folderFilter);
      const suffix = params.size ? `?${params.toString()}` : '';
      const [conversationData, folderData] = await Promise.all([
        apiRequest(`/api/v1/conversations${suffix}`), apiRequest('/api/v1/conversation-folders'),
      ]) as [{ conversations?: ConversationSummary[] }, { folders?: ConversationFolder[] }];
      setItems(conversationData.conversations ?? []); setFolders(folderData.folders ?? []);
    } catch {
      setItems([]);
      setError(subjectId === 'math'
        ? 'היסטוריית השיחות במתמטיקה תהיה זמינה לאחר עדכון השרת.'
        : 'לא ניתן לטעון כרגע את השיחות. אפשר להמשיך לשאול שאלה חדשה.');
    }
    finally { setLoading(false); }
  }, [folderFilter, query, studyUnits, subjectId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timeout);
  }, [load, activeConversationId]);

  const selectConversation = async (conversation: ConversationSummary) => {
    setError(null);
    try {
      const data = await apiRequest(`/api/v1/conversations/${conversation.id}/messages`) as { messages?: ConversationMessage[] };
      const assistant = [...(data.messages ?? [])].reverse().find((message) => message.role === 'assistant' && message.structuredData);
      if (!assistant?.structuredData) throw new Error('לא נמצאה תשובת מורה שמורה בשיחה');
      onSelect({ ...assistant.structuredData, conversationId: conversation.id, messageId: assistant.id, sources: [] });
    } catch (err) { setError(err instanceof Error ? err.message : 'טעינת השיחה נכשלה'); }
  };

  const createFolder = async () => {
    const name = window.prompt('שם התיקייה החדשה:')?.trim();
    if (!name) return;
    try { await apiRequest('/api/v1/conversation-folders', { method: 'POST', body: JSON.stringify({ name }) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'יצירת התיקייה נכשלה'); }
  };

  const renameConversation = async (conversation: ConversationSummary) => {
    const title = window.prompt('שם חדש לשיחה:', conversation.title ?? '')?.trim();
    if (!title) return;
    try { await apiRequest(`/api/v1/conversations/${conversation.id}`, { method: 'PATCH', body: JSON.stringify({ title }) }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'שינוי השם נכשל'); }
  };

  const moveConversation = async (conversation: ConversationSummary, folderId: string) => {
    try {
      await apiRequest(`/api/v1/conversations/${conversation.id}`, { method: 'PATCH', body: JSON.stringify({ folderId: folderId || null }) });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'העברת השיחה נכשלה'); }
  };

  const deleteConversation = async (conversation: ConversationSummary) => {
    if (!window.confirm(`למחוק את השיחה "${conversation.title || 'ללא כותרת'}"? לא ניתן לבטל פעולה זו.`)) return;
    try {
      await apiRequest(`/api/v1/conversations/${conversation.id}`, { method: 'DELETE' });
      if (conversation.id === activeConversationId) onNew();
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'מחיקת השיחה נכשלה'); }
  };

  const manageFolder = async () => {
    if (folderFilter === 'all' || folderFilter === 'unfiled') return;
    const folder = folders.find((entry) => entry.id === folderFilter);
    if (!folder) return;
    const action = window.prompt(`ניהול התיקייה "${folder.name}": כתוב "שנה" לשינוי שם או "מחק" למחיקה.`)?.trim();
    try {
      if (action === 'שנה') {
        const name = window.prompt('שם חדש:', folder.name)?.trim();
        if (!name) return;
        await apiRequest(`/api/v1/conversation-folders/${folder.id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      } else if (action === 'מחק') {
        if (!window.confirm('למחוק את התיקייה? השיחות שבתוכה יועברו ל״ללא תיקייה״.')) return;
        await apiRequest(`/api/v1/conversation-folders/${folder.id}`, { method: 'DELETE' }); setFolderFilter('all');
      } else return;
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'ניהול התיקייה נכשל'); }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3" dir="rtl">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">שיחות קודמות</h2>
        <button onClick={onNew} className="bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100">+ חדשה</button>
      </div>
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="🔎 חיפוש שיחה..." className="mb-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800" />
      <div className="mb-3 flex gap-1.5">
        <select value={folderFilter} onChange={(event) => setFolderFilter(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-800">
          <option value="all">כל השיחות</option><option value="unfiled">ללא תיקייה</option>
          {folders.map((folder) => <option key={folder.id} value={folder.id}>📁 {folder.name}</option>)}
        </select>
        <button onClick={() => void createFolder()} className="bg-violet-50 px-2 py-1 text-xs text-violet-700 hover:bg-violet-100" title="תיקייה חדשה">📁+</button>
        {folderFilter !== 'all' && folderFilter !== 'unfiled' && <button onClick={() => void manageFolder()} className="bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200" title="ניהול תיקייה">⚙️</button>}
      </div>
      {loading ? <div className="h-20 animate-pulse rounded bg-gray-100" /> : (
        <div className="max-h-72 space-y-2 overflow-y-auto">
          {items.length === 0 && <p className="py-3 text-center text-xs text-gray-400">לא נמצאו שיחות</p>}
          {items.map((item) => (
            <div key={item.id} className={`rounded-lg border p-2 ${item.id === activeConversationId ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}>
              <button onClick={() => void selectConversation(item)} className="w-full bg-transparent p-0 text-right text-xs text-gray-800 hover:text-blue-700">
                <span className="block truncate font-medium">{item.title || 'שיחה ללא כותרת'}</span>
                <span className="text-[11px] text-gray-500">{new Date(item.updatedAt).toLocaleDateString('he-IL')}</span>
              </button>
              <div className="mt-2 flex items-center gap-1 border-t border-gray-100 pt-2">
                <select value={item.folderId ?? ''} onChange={(event) => void moveConversation(item, event.target.value)} className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-1 py-1 text-[11px] text-gray-700" aria-label="העבר לתיקייה">
                  <option value="">ללא תיקייה</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                </select>
                <button onClick={() => void renameConversation(item)} className="bg-gray-50 px-1.5 py-1 text-xs text-gray-700 hover:bg-gray-100" title="שינוי שם">✏️</button>
                <button onClick={() => void deleteConversation(item)} className="bg-red-50 px-1.5 py-1 text-xs text-red-700 hover:bg-red-100" title="מחיקה">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </section>
  );
}
