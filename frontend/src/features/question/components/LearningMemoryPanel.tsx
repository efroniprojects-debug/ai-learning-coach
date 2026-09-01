import { useEffect, useState } from 'react';

import {
  deleteLearningMemory,
  getLearningMemory,
  saveLearningMemory,
  type LearningMemoryInput,
} from '@/services/learning-memory.api';

interface LearningMemoryPanelProps {
  subjectId: string;
  studyUnits?: number;
  disabled?: boolean;
  onMemoryChange?: (memory: LearningMemoryInput) => void;
}

const EMPTY_MEMORY: LearningMemoryInput = {
  isEnabled: false,
  learningPreferences: null,
  knownStrengths: null,
  recurringMistakes: null,
};

export function LearningMemoryPanel({ subjectId, studyUnits, disabled, onMemoryChange }: LearningMemoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [memory, setMemory] = useState<LearningMemoryInput>(EMPTY_MEMORY);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void getLearningMemory(subjectId, studyUnits).then((result) => {
      if (!active) return;
      setMemory(result);
      onMemoryChange?.(result);
    }).catch(() => {
      if (active) setError('הזיכרון הלימודי אינו זמין כרגע. אפשר להמשיך ללמוד בלעדיו.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [onMemoryChange, studyUnits, subjectId]);

  const updateField = (field: keyof LearningMemoryInput, value: string | boolean) => {
    setSaved(false);
    setMemory((current) => ({ ...current, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveLearningMemory(subjectId, studyUnits, memory);
      setMemory(result);
      onMemoryChange?.(result);
      setSaved(true);
    } catch {
      setError('שמירת הזיכרון נכשלה. לא נעשה שינוי במידע הקיים.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('למחוק את כל הזיכרון הלימודי בהקשר הזה? הפעולה אינה ניתנת לביטול.')) return;
    setSaving(true);
    setError(null);
    try {
      await deleteLearningMemory(subjectId, studyUnits);
      setMemory(EMPTY_MEMORY);
      onMemoryChange?.(EMPTY_MEMORY);
      setSaved(true);
    } catch {
      setError('מחיקת הזיכרון נכשלה. המידע הקיים נשאר ללא שינוי.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 p-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-violet-950">🧠 הזיכרון הלימודי שלי</p>
          <p className="mt-1 text-xs text-violet-800">כבוי כברירת מחדל ונשמר רק במכשיר הזה. רק מידע שתאשר כאן יישלח עם השאלה.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} disabled={disabled} aria-expanded={open} className="min-h-11 rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100 disabled:opacity-50">
          {open ? 'סגור' : 'צפייה ושליטה'}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-violet-200 pt-4">
          {loading ? <p className="text-sm text-violet-700" role="status">טוען את הזיכרון…</p> : (
            <>
              <label className="flex items-start gap-3 rounded-lg border border-violet-200 bg-white p-3">
                <input type="checkbox" checked={memory.isEnabled} onChange={(event) => updateField('isEnabled', event.target.checked)} className="mt-1 h-4 w-4" />
                <span><span className="block text-sm font-semibold text-gray-900">אפשר למורה להשתמש בזיכרון הזה</span><span className="block text-xs text-gray-500">ניתן לכבות בכל עת בלי למחוק את הטקסט.</span></span>
              </label>
              {([
                ['learningPreferences', 'איך נוח לי ללמוד', 'למשל: דוגמאות קצרות לפני נוסחאות'],
                ['knownStrengths', 'נקודות החוזק שלי', 'למשל: אלגברה והצבת נתונים'],
                ['recurringMistakes', 'טעויות שחוזרות אצלי', 'למשל: סימנים שליליים והמרת יחידות'],
              ] as const).map(([field, label, placeholder]) => (
                <label key={field} className="block text-sm font-medium text-gray-800">
                  {label}
                  <textarea value={memory[field] ?? ''} onChange={(event) => updateField(field, event.target.value)} maxLength={1_000} rows={2} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900" />
                </label>
              ))}
              {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
              {saved && <p className="text-sm text-green-700" role="status">הזיכרון עודכן.</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void save()} disabled={saving} className="min-h-11 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50">{saving ? 'שומר…' : 'שמור'}</button>
                <button type="button" onClick={() => void remove()} disabled={saving} className="min-h-11 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">מחק את כל הזיכרון</button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
