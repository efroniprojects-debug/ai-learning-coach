import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSelectedSubject } from '@/features/subjects/useSelectedSubject';

type SeasonMap = Record<string, string[]>;
type SubjectData = Record<string, SeasonMap>;

const EXAM_DATA: SubjectData = {
  'פיסיקה': {
    '2024': ['כללי'],
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'קיץ'],
    '2016': ['כללי'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    'כללי': ['כללי'],
  },
  'מתמטיקה': {
    '2025': ['כללי'],
    '2022': ['כללי'],
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'כללי', 'קיץ'],
    '2018': ['כללי'],
    '2017': ['כללי'],
    '2016': ['כללי'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['כללי', 'קיץ'],
    'כללי': ['כללי'],
  },
  'הסטוריה': {
    '2025': ['כללי'],
    '2023': ['כללי'],
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'כללי', 'קיץ'],
    '2018': ['כללי'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    'כללי': ['כללי'],
  },
  'אנגלית': {
    '2025': ['כללי'],
    '2024': ['כללי'],
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'כללי', 'קיץ'],
    '2016': ['כללי'],
    '2015': ['כללי'],
    '2014': ['כללי'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    'כללי': ['כללי'],
  },
  'ספרות': {
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'כללי', 'קיץ'],
    '2018': ['כללי'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    '8282': ['כללי'],
    '8281': ['כללי'],
    'כללי': ['כללי'],
  },
  'תנך': {
    '2020': ['חורף', 'כללי', 'קיץ'],
    '2019': ['חורף', 'כללי', 'קיץ'],
    '2018': ['כללי'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    '1262': ['כללי'],
    '1261': ['כללי'],
    'כללי': ['כללי'],
  },
  'אזרחות': {
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'קיץ'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    'כללי': ['כללי'],
  },
  'גאוגרפיה': {
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'קיץ'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    'כללי': ['כללי'],
  },
  'לשון': {
    '2020': ['חורף', 'קיץ'],
    '2019': ['חורף', 'כללי', 'קיץ'],
    '2010': ['קיץ'],
    '2005': ['חורף', 'קיץ'],
    '2000': ['קיץ'],
    'כללי': ['כללי'],
  },
};

const SUBJECT_ORDER = ['פיסיקה', 'מתמטיקה', 'הסטוריה', 'אנגלית', 'ספרות', 'תנך', 'אזרחות', 'גאוגרפיה', 'לשון'];
const NEW_MATH_QUESTIONNAIRES: Record<3 | 4 | 5, string[]> = {
  3: ['35172', '35173', '35371', '35372'],
  4: ['35471', '35472'],
  5: ['35571', '35572'],
};
const LEGACY_MATH_QUESTIONNAIRES: Record<3 | 4 | 5, string[]> = {
  3: ['35381', '35382'],
  4: ['35481', '35482'],
  5: ['35581', '35582'],
};

function mathQuestionnairesForYear(units: 3 | 4 | 5, year: string): string[] {
  const numericYear = Number(year);
  return year === 'כללי' || numericYear >= 2024
    ? NEW_MATH_QUESTIONNAIRES[units]
    : LEGACY_MATH_QUESTIONNAIRES[units];
}

const SEASON_COLORS: Record<string, string> = {
  'קיץ': 'bg-yellow-100 text-yellow-800',
  'חורף': 'bg-blue-100 text-blue-800',
  'כללי': 'bg-gray-100 text-gray-700',
};

function seasonBadge(season: string) {
  const cls = SEASON_COLORS[season] ?? 'bg-gray-100 text-gray-600';
  return (
    <span key={season} className={`text-xs px-1.5 py-0.5 rounded font-medium ${cls}`}>
      {season}
    </span>
  );
}

export function BagruyotSidebar() {
  const navigate = useNavigate();
  const { mathStudyUnits, setSubjectId } = useSelectedSubject();
  const [open, setOpen] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(NEW_MATH_QUESTIONNAIRES[mathStudyUnits][0]);

  useEffect(() => {
    setSelectedQuestionnaire(NEW_MATH_QUESTIONNAIRES[mathStudyUnits][0]);
  }, [mathStudyUnits]);

  const toggleSubject = (subject: string) => {
    setExpandedSubject((prev) => (prev === subject ? null : subject));
    setExpandedYear(null);
  };

  const toggleYear = (year: string) => {
    setExpandedYear((prev) => (prev === year ? null : year));
  };

  const askFromExam = (subject: string, year: string, season: string) => {
    if (subject === 'מתמטיקה') setSubjectId('math');
    if (subject === 'פיסיקה') setSubjectId('physics');
    setOpen(false);
    const mathContext = subject === 'מתמטיקה'
      ? ` ברמת ${mathStudyUnits} יח״ל, שאלון ${selectedQuestionnaire},`
      : '';
    navigate('/ask', {
      state: {
        prefilledText: `צור לי שאלת תרגול מקורית הדומה במיומנות — אך אינה העתק — למבחן בגרות ב${subject},${mathContext} שנת ${year}, מועד ${season}. הצג תחילה רק את השאלה, והמתן לתשובה שלי לפני הצגת הפתרון.`,
      },
    });
  };

  return (
    <>
      {/* Header-sized trigger keeps this utility aligned with the other global controls. */}
      <button
        onClick={() => setOpen((v) => !v)}
        type="button"
        className="flex h-10 items-center justify-center rounded-lg border border-indigo-500 bg-indigo-600 px-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:px-3"
        aria-label={open ? 'סגור סרגל בגרויות' : 'פתח סרגל בגרויות'}
        aria-expanded={open}
      >
        <span aria-hidden="true">📚</span>
        <span className="ms-1 hidden sm:inline">{open ? 'סגור' : 'בגרויות'}</span>
      </button>

      {/* Sidebar panel */}
      {open && createPortal(
        <div
          className="fixed right-0 top-16 z-[7500] flex h-[calc(100%-4rem)] w-72 max-w-[90vw] flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bagruyot-title"
        >
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <h2 id="bagruyot-title" className="font-bold text-base">📚 בגרויות בעבר</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-indigo-200 hover:text-white text-lg leading-none"
              aria-label="סגור"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-gray-500 px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex-shrink-0">
            נלחץ על מקצוע לצפות בשנים ועונות
          </p>

          {/* Subject list */}
          <div className="overflow-y-auto flex-1">
            {SUBJECT_ORDER.map((subject) => {
              const years = EXAM_DATA[subject];
              const isOpen = expandedSubject === subject;
              const yearKeys = Object.keys(years).sort((a, b) => {
                // Sort numeric years descending, כללי at end
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
                if (isNaN(aNum)) return 1;
                if (isNaN(bNum)) return -1;
                return 0;
              });

              return (
                <div key={subject} className="border-b border-gray-100">
                  {/* Subject row */}
                  <button
                    onClick={() => toggleSubject(subject)}
                    className={`w-full text-right px-4 py-3 flex items-center justify-between text-sm font-semibold transition-colors ${
                      isOpen
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {subject === 'פיסיקה' && (
                        <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded font-normal">
                          ראשי
                        </span>
                      )}
                      {subject}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {yearKeys.filter((y) => y !== 'כללי').length} שנים{' '}
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {/* Year list */}
                  {isOpen && (
                    <div className="bg-white border-t border-gray-100 pb-1">
                      {subject === 'מתמטיקה' && (
                        <div className="border-b border-indigo-100 bg-emerald-50 px-4 py-3">
                          <p className="text-xs font-semibold text-emerald-900">מתמטיקה · {mathStudyUnits} יח״ל</p>
                          <p className="mt-1 text-xs text-emerald-800">מספרי השאלונים יתאימו לשנת המבחן.</p>
                        </div>
                      )}
                      {yearKeys.map((year) => {
                        const seasons = years[year];
                        const isYearOpen = expandedYear === `${subject}-${year}`;

                        return (
                          <div key={year} className="border-b border-gray-50 last:border-b-0">
                            <button
                              onClick={() => {
                                toggleYear(`${subject}-${year}`);
                                if (subject === 'מתמטיקה') setSelectedQuestionnaire(mathQuestionnairesForYear(mathStudyUnits, year)[0]);
                              }}
                              className={`w-full text-right px-6 py-2.5 flex items-center justify-between text-xs transition-colors ${
                                isYearOpen
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                            >
                              <span className="font-medium">{year === 'כללי' ? '📁 כללי' : `📅 ${year}`}</span>
                              <span className={isYearOpen ? 'text-indigo-400' : 'text-gray-400'}>{isYearOpen ? '▲' : '▼'}</span>
                            </button>

                            {isYearOpen && (
                              <div className="px-8 py-2 bg-indigo-50 space-y-2">
                                <div className="flex flex-wrap gap-1.5">{seasons.map((s) => seasonBadge(s))}</div>
                                {subject === 'מתמטיקה' && (
                                  <div>
                                    <p className="mb-1 text-xs text-gray-600">שאלון</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {mathQuestionnairesForYear(mathStudyUnits, year).map((questionnaire) => (
                                        <button
                                          key={questionnaire}
                                          type="button"
                                          onClick={() => setSelectedQuestionnaire(questionnaire)}
                                          className={`rounded px-2 py-1 text-xs ${selectedQuestionnaire === questionnaire ? 'bg-emerald-700 text-white' : 'border border-emerald-300 bg-white text-emerald-900'}`}
                                        >
                                          {questionnaire}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {seasons.map((season) => (
                                  <button key={`ask-${season}`} onClick={() => askFromExam(subject, year, season)} className="w-full text-xs bg-indigo-600 text-white rounded-md px-2 py-2 hover:bg-indigo-700">
                                    צור שאלת תרגול · {season}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <p className="text-xs text-gray-400 text-center">
              בחר מקצוע ומבחן כדי להתחיל לתרגל
            </p>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
