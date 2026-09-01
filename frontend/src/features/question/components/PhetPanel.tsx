import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PhetSim {
  id?: string;
  title: string;
  url: string;
  description: string;
  learningGoal?: string;
  investigation?: string;
  guidingQuestions?: string[];
  summaryPrompt?: string;
}

interface Props {
  subjectId: string;
  studyUnits?: number;
  subtopic: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

// Keeps Math simulations available while the new backend and frontend are
// deployed at different times. The server registry remains authoritative.
const MATH_SIMULATION_FALLBACKS: Array<PhetSim & { topics: string[]; units: number[] }> = [
  { title: 'גרף שיפוע וחיתוך', url: 'https://phet.colorado.edu/sims/html/graphing-slope-intercept/latest/graphing-slope-intercept_all.html', description: 'חוקרים כיצד שיפוע ונקודת חיתוך משנים ישר.', topics: ['פונקציה קווית', 'גאומטריה אנליטית'], units: [3, 4, 5] },
  { title: 'התאמת עקומה לנתונים', url: 'https://phet.colorado.edu/sims/html/curve-fitting/latest/curve-fitting_all.html', description: 'מתאימים מודל לנתונים ובוחנים את איכות ההתאמה.', topics: ['דיאגרמות פיזור ורגרסיה', 'סטטיסטיקה', 'בדיקת השערות'], units: [3, 4, 5] },
  { title: 'חוקר חשבון דיפרנציאלי ואינטגרלי', url: 'https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_all.html', description: 'משווים בין פונקציה, נגזרת ופונקציית הצטברות.', topics: ['נגזרות', 'יישומי נגזרת', 'חקירת פונקציות', 'אינטגרלים'], units: [4, 5] },
  { title: 'מרובעים', url: 'https://phet.colorado.edu/sims/html/quadrilateral/latest/quadrilateral_all.html', description: 'חוקרים תכונות קבועות ומשתנות של משפחות מרובעים.', topics: ['גאומטריה במישור', 'גאומטריה משולבת', 'גאומטריה אוקלידית'], units: [3, 4, 5] },
];

function localMathSimulations(subtopic: string, studyUnits?: number): PhetSim[] {
  return MATH_SIMULATION_FALLBACKS.filter((simulation) =>
    simulation.topics.includes(subtopic) && (!studyUnits || simulation.units.includes(studyUnits)));
}

export function PhetPanel({ subjectId, studyUnits, subtopic }: Props) {
  const [openUrl, setOpenUrl] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const { data: sims = [], isLoading, isError, refetch } = useQuery<PhetSim[]>({
    queryKey: ['phet-sims', subjectId, studyUnits, subtopic],
    queryFn: async () => {
      if (!subtopic) return [];
      const params = new URLSearchParams({ topic: subtopic });
      if (studyUnits) params.set('studyUnits', String(studyUnits));
      const endpoint = subjectId === 'physics'
        ? `${API_BASE}/api/v1/physics/phet?subtopic=${encodeURIComponent(subtopic)}`
        : `${API_BASE}/api/v1/subjects/${encodeURIComponent(subjectId)}/simulations?${params}`;
      const res = await fetch(endpoint);
      if (!res.ok && subjectId === 'math') return localMathSimulations(subtopic, studyUnits);
      if (!res.ok) throw new Error('PHET_LOAD_FAILED');
      return res.json() as Promise<PhetSim[]>;
    },
    enabled: !!subtopic,
    staleTime: 10 * 60 * 1000,
  });

  if (!subtopic) {
    return (
      <p dir="rtl" className="text-center py-3 text-gray-400 text-sm">
        🔬 בחר נושא לסימולציות PhET
      </p>
    );
  }

  if (isLoading) return <p className="text-center py-3 text-gray-400 text-sm">טוען...</p>;
  if (isError) return (
    <div dir="rtl" className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700">
      <p>טעינת הסימולציות נכשלה.</p>
      <button type="button" onClick={() => void refetch()} className="mt-2 rounded-md bg-red-700 px-3 py-2 text-white">נסה שנית</button>
    </div>
  );
  if (sims.length === 0) return <p dir="rtl" className="text-center py-3 text-gray-400 text-sm">אין סימולציות לנושא זה</p>;

  return (
    <div dir="rtl" className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">סימולציות חקר PhET</p>
      {sims.map((sim) => (
        <div key={sim.url} className="flex flex-col items-stretch gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 truncate">{sim.title}</p>
            <p className="text-xs text-blue-600">{sim.description}</p>
            {sim.learningGoal && <p className="mt-1 text-xs text-blue-900"><strong>מה חוקרים:</strong> {sim.learningGoal}</p>}
          </div>
          <button
            onClick={() => { setOpenUrl(sim.url); setIframeLoaded(false); }}
            className="min-h-11 flex-shrink-0 rounded-md bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700 sm:mr-2 sm:min-h-0 sm:py-1.5 sm:text-xs"
          >
            פתח 🔬
          </button>
        </div>
      ))}

      {sims.some((sim) => sim.investigation) && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          <p className="font-semibold">משימת חקר קצרה</p>
          <p>{sims[0].investigation}</p>
          {sims[0].guidingQuestions && (
            <ul className="mt-2 list-disc space-y-1 pr-5">
              {sims[0].guidingQuestions.map((question) => <li key={question}>{question}</li>)}
            </ul>
          )}
          {sims[0].summaryPrompt && <p className="mt-2"><strong>לסיכום:</strong> {sims[0].summaryPrompt}</p>}
        </div>
      )}

      {openUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) setOpenUrl(null); }}
        >
          <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
            <span className="text-white text-sm font-medium">🔬 סימולציית PhET</span>
            <button onClick={() => setOpenUrl(null)} className="text-white hover:text-gray-300 text-xl font-bold px-2">✕</button>
          </div>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 mt-10">
              <div className="text-white text-center">
                <div className="animate-spin text-4xl mb-2">⚛️</div>
                <p className="text-sm">טוען סימולציה...</p>
              </div>
            </div>
          )}
          <iframe
            src={openUrl}
            className="flex-1 w-full"
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setIframeLoaded(true)}
            title="PhET Simulation"
          />
        </div>
      )}
    </div>
  );
}
