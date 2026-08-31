import { SUBJECTS } from '@/config/subjects';

interface Props {
  value: string;
  disabled?: boolean;
  onChange: (subjectId: string) => void;
}

export function SubjectSelector({ value, disabled = false, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3" role="group" aria-label="בחירת מקצוע">
      <span className="ms-1 text-sm font-medium text-gray-600">מקצוע:</span>
      {Object.values(SUBJECTS).map((subject) => (
        <button
          key={subject.id}
          type="button"
          onClick={() => onChange(subject.id)}
          disabled={disabled}
          aria-pressed={value === subject.id}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
            value === subject.id
              ? 'border-blue-600 bg-blue-600 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:text-blue-700'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <span aria-hidden="true">{subject.icon}</span> {subject.nameHe}
        </button>
      ))}
    </div>
  );
}
