import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
  const [open, setOpen] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const toggleSubject = (subject: string) => {
    setExpandedSubject((prev) => (prev === subject ? null : subject));
    setExpandedYear(null);
  };

  const toggleYear = (year: string) => {
    setExpandedYear((prev) => (prev === year ? null : year));
  };

  const askFromExam = (subject: string, year: string, season: string) => {
    setOpen(false);
    navigate('/ask', {
      state: {
        prefilledText: `אני מתרגל ממבחן בגרות ב${subject}, שנת ${year}, מועד ${season}. עזור לי לפתור שאלה מהמבחן.`,
      },
    });
  };

  return (
    <>
      {/* Toggle button — fixed to right edge */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed top-1/2 -translate-y-1/2 right-0 bg-indigo-600 text-white text-xs font-bold py-6 px-2 rounded-l-lg shadow-lg hover:bg-indigo-700 transition-colors touch-manipulation"
        style={{ zIndex: 7000, writingMode: 'vertical-rl', letterSpacing: '0.1em' }}
        aria-label={open ? 'סגור סרגל בגרויות' : 'פתח סרגל בגרויות'}
      >
        {open ? '◀ סגור' : '▶ בגרויות'}
      </button>

      {/* Sidebar panel */}
      {open && (
        <div
          className="fixed top-0 right-0 h-full w-72 bg-white border-l border-gray-200 shadow-2xl z-40 flex flex-col overflow-hidden"
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
            <h2 className="font-bold text-base">📚 בגרויות בעבר</h2>
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
                      {yearKeys.map((year) => {
                        const seasons = years[year];
                        const isYearOpen = expandedYear === `${subject}-${year}`;

                        return (
                          <div key={year} className="border-b border-gray-50 last:border-b-0">
                            <button
                              onClick={() => toggleYear(`${subject}-${year}`)}
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
                                {subject === 'פיסיקה' && seasons.map((season) => (
                                  <button key={`ask-${season}`} onClick={() => askFromExam(subject, year, season)} className="w-full text-xs bg-indigo-600 text-white rounded-md px-2 py-2 hover:bg-indigo-700">
                                    שאל שאלה ממבחן זה · {season}
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
              בחר מבחן פיזיקה כדי להתחיל לתרגל
            </p>
          </div>
        </div>
      )}
    </>
  );
}
