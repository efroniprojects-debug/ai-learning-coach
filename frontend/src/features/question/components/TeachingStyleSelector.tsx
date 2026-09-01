export type TeachingStyle = 'concise' | 'balanced' | 'deep';

interface TeachingStyleSelectorProps {
  value: TeachingStyle;
  onChange: (style: TeachingStyle) => void;
  disabled?: boolean;
}

const TEACHING_STYLES: Array<{
  id: TeachingStyle;
  label: string;
  description: string;
}> = [
  { id: 'concise', label: 'חד וקולע', description: 'הסבר קצר וישיר עם כל השלבים החשובים' },
  { id: 'balanced', label: 'מאוזן ומסביר', description: 'פירוט בינוני ודוגמה כשצריך' },
  { id: 'deep', label: 'מעמיק עם דוגמאות', description: 'הסבר רחב, הקשרים ודוגמאות מהחיים' },
];

/** Selects presentation depth without changing the tutor's problem-solving mode. */
export function TeachingStyleSelector({ value, onChange, disabled }: TeachingStyleSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" dir="rtl" role="group" aria-label="סגנון המורה">
      {TEACHING_STYLES.map((style) => {
        const selected = value === style.id;
        return (
          <button
            type="button"
            key={style.id}
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(style.id)}
            className={[
              'min-h-16 rounded-lg border px-3 py-2 text-right transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              selected
                ? 'border-blue-600 bg-blue-50 text-blue-900'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">{style.label}</span>
            <span className="mt-1 block text-xs text-current opacity-80">{style.description}</span>
          </button>
        );
      })}
    </div>
  );
}
