import { Link } from 'react-router-dom';

import { useSelectedSubject } from './useSelectedSubject';

export function LearningContextSummary() {
  const { subject, mathStudyUnits } = useSelectedSubject();
  const isMath = subject.id === 'math';

  return (
    <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${isMath ? 'border-green-200 bg-green-50 text-green-900' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>
      <span className="font-semibold">
        {subject.icon} {subject.nameHe}{isMath ? ` · ${mathStudyUnits} יח״ל` : ''}
      </span>
      <Link to="/dashboard" className="text-sm font-medium underline underline-offset-2">
        שינוי מקצוע או רמה
      </Link>
    </div>
  );
}
