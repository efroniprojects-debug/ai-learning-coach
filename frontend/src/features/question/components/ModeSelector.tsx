type Mode = 'step_by_step' | 'full' | 'diagnose' | 'concept';

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}

const MODES: { id: Mode; label: string; emoji: string; tooltip: string }[] = [
  {
    id: 'step_by_step',
    label: 'שלב-אחר-שלב',
    emoji: '🔍',
    tooltip: 'המורה יפרק את הפתרון לשלבים ממוספרים ויוביל אותך להבנה מלאה',
  },
  {
    id: 'full',
    label: 'פתרון מלא מיידי',
    emoji: '⚡',
    tooltip: 'פתרון מלא — נתונים, נוסחה, הצבה, חישוב ותשובה עם יחידות',
  },
  {
    id: 'diagnose',
    label: 'אבחן את הטעות שלי',
    emoji: '🩺',
    tooltip: 'שתף את הניסיון שלך — המורה יזהה בדיוק איפה הטעות ויעזור לתקן',
  },
  {
    id: 'concept',
    label: 'הסבר מושג',
    emoji: '💡',
    tooltip: 'הסבר עמוק של מושג — אנלוגיה מהחיים, הגדרה פורמלית, נוסחה ודוגמאות',
  },
];

export function ModeSelector({ mode, onChange, disabled }: Props) {
  return (
    <div dir="rtl" className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          disabled={disabled}
          title={m.tooltip}
          className={[
            'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium',
            'transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
            mode === m.id
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
              : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50',
          ].join(' ')}
        >
          <span>{m.emoji}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
