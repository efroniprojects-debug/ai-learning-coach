export type Mode = 'step_by_step' | 'full' | 'diagnose' | 'concept';

interface ModeOption {
  id: Mode;
  icon: string;
  label: string;
  tooltip: string;
}

const MODES: ModeOption[] = [
  { id: 'step_by_step', icon: '🔍', label: 'שלב-אחר-שלב', tooltip: 'פירוק הבעיה ל-4-6 שלבים ממוספרים — מתאים ללמידה עמוקה' },
  { id: 'full', icon: '⚡', label: 'פתרון מלא', tooltip: 'פתרון מיידי ומלא עם כל הפרטים — מתאים לחזרה מהירה' },
  { id: 'diagnose', icon: '🩺', label: 'אבחן טעות', tooltip: 'שתף את הניסיון השגוי שלך — המורה יאתר בדיוק היכן הטעות' },
  { id: 'concept', icon: '💡', label: 'הסבר מושג', tooltip: 'הסבר אינטואיטיבי דרך אנלוגיה מהחיים — מתאים להבנת עקרון' },
];

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}

export function ModeSelector({ mode, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2" dir="rtl">
      {MODES.map((m) => (
        <button
          key={m.id}
          title={m.tooltip}
          disabled={disabled}
          onClick={() => onChange(m.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-right
            ${mode === m.id
              ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
              : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50/30'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-base">{m.icon}</span>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}
