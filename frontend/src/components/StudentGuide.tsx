import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface GuideItem {
  title: string;
  description: string;
  tips: string[];
  keywords: string;
}

interface GuideCategory {
  id: string;
  title: string;
  icon: string;
  items: GuideItem[];
}

const GUIDE_CATEGORIES: GuideCategory[] = [
  {
    id: 'start', title: 'מתחילים נכון', icon: '🚀', items: [
      {
        title: 'איך שואלים שאלה טובה?',
        description: 'כתבו מה נתון, מה צריך למצוא ובאיזה שלב נתקעתם. אפשר לצרף צילום או מסמך במקום להעתיק שאלה ארוכה.',
        tips: ['ציינו יחידות מידה.', 'כתבו גם את הניסיון שלכם — אפילו אם הוא לא נכון.', 'שאלה אחת ממוקדת תיתן תשובה מדויקת יותר.'],
        keywords: 'שאלה נתונים יחידות צילום מסמך התחלה',
      },
      {
        title: 'בחירת נושא ותת־נושא',
        description: 'בחרו את התחום המתאים לפני שליחת השאלה. כך SmarterAI מתאים את ההסבר, הנוסחאות והתרגול לחומר הנכון.',
        tips: ['אם אינכם בטוחים, בחרו בנושא הקרוב ביותר.', 'אפשר לשנות נושא לפני כל שאלה.'],
        keywords: 'מקצוע נושא תת נושא פיזיקה מתמטיקה בחירה',
      },
    ],
  },
  {
    id: 'modes', title: 'מצבי הלמידה', icon: '🧠', items: [
      {
        title: 'שלב־אחר־שלב',
        description: 'המערכת מפרקת את הפתרון לשלבים ומסבירה את הדרך. מתאים כשלומדים נושא חדש או כשלא יודעים מאיפה להתחיל.',
        tips: ['נסו לבצע כל שלב בעצמכם לפני שקוראים את הבא.', 'בקשו דוגמה נוספת אם שלב מסוים עדיין לא ברור.'],
        keywords: 'שלב אחר שלב הסבר למידה דרך פתרון',
      },
      {
        title: 'פתרון מלא',
        description: 'מציג פתרון מלא ומהיר, כולל נתונים, נוסחאות, הצבה ותוצאה. מתאים לבדיקת תשובה שכבר פתרתם.',
        tips: ['אל תסתפקו בתוצאה — השוו את הדרך לפתרון שלכם.', 'בדקו שהיחידות והתוצאה הגיוניות.'],
        keywords: 'פתרון מלא תשובה נוסחה הצבה תוצאה',
      },
      {
        title: 'אבחון טעות',
        description: 'הדביקו או כתבו את הדרך שלכם, והמערכת תזהה היכן הטעות ומה צריך לתקן.',
        tips: ['אל תמחקו את הטעות לפני השליחה.', 'כתבו מה חשבתם בכל שלב כדי לקבל הסבר מדויק.'],
        keywords: 'אבחון טעות תיקון דרך פתרון',
      },
      {
        title: 'הסבר מושג',
        description: 'מסביר רעיון לימודי בשפה פשוטה, עם דוגמאות, משמעות ונוסחאות.',
        tips: ['בקשו הסבר ברמה קלה יותר אם צריך.', 'נסו להסביר את המושג במילים שלכם אחרי הקריאה.'],
        keywords: 'מושג הסבר פשוט דוגמה נוסחה הבנה',
      },
    ],
  },
  {
    id: 'media', title: 'תמונה, מסמך וקול', icon: '📎', items: [
      {
        title: 'צילום שאלה',
        description: 'צרפו תמונה ברורה של התרגיל. המערכת יכולה לקרוא את השאלה ולנתח תרשימים ונתונים.',
        tips: ['צלמו באור טוב וללא צל.', 'ודאו שכל השאלה והתרשים נכנסים לתמונה.', 'בדקו שהמספרים חדים לפני השליחה.'],
        keywords: 'תמונה צילום מצלמה תרגיל תרשים',
      },
      {
        title: 'העלאת מסמך',
        description: 'אפשר לצרף PDF, Word או קובץ טקסט ולהפנות לשאלה או לעמוד מסוים במסמך.',
        tips: ['כתבו לאיזה עמוד או תרגיל להתייחס.', 'העלו רק חומר שרלוונטי לשאלה הנוכחית.'],
        keywords: 'מסמך PDF Word קובץ העלאה',
      },
      {
        title: 'הכתבה והקראה בעברית',
        description: 'כפתור המיקרופון ממלא את השאלה באמצעות דיבור. כפתור הרמקול מקריא את התשובה בקול.',
        tips: ['דברו לאט ובמשפטים קצרים.', 'עברו על הטקסט שזוהה לפני השליחה.', 'הקראה עוזרת כשקשה להתרכז בטקסט ארוך.'],
        keywords: 'קול מיקרופון הכתבה הקראה רמקול עברית',
      },
    ],
  },
  {
    id: 'tools', title: 'כלי עזר', icon: '🧰', items: [
      {
        title: 'מחשבון מדעי',
        description: 'המחשבון זמין מכל עמוד באמצעות הכפתור הצף. הוא כולל פונקציות טריגונומטריות, חזקות, שורשים וקבועים פיזיקליים.',
        tips: ['בדקו אם המחשבון עובד במעלות או ברדיאנים.', 'שמרו יחידות מחוץ לחישוב ורשמו אותן בתשובה.', 'השתמשו במחשבון לבדיקה, לא במקום כתיבת הדרך.'],
        keywords: 'מחשבון מדעי sin cos מעלות רדיאנים קבועים',
      },
      {
        title: 'סימולציות PhET',
        description: 'בפיזיקה, לאחר בחירת נושא, עשויות להופיע סימולציות אינטראקטיביות שממחישות את התופעה.',
        tips: ['שנו משתנה אחד בכל פעם.', 'נסו לנחש מה יקרה לפני הפעלת הסימולציה.', 'חזרו לשאלה והסבירו מה גיליתם.'],
        keywords: 'PhET סימולציה ניסוי אינטראקטיבי',
      },
      {
        title: 'מאגר בגרויות',
        description: 'המאגר מאפשר למצוא שאלות ממבחנים קודמים ולתרגל לפי נושא ורמה.',
        tips: ['התחילו ללא שעון, ובהמשך תרגלו בזמן אמת.', 'סמנו שאלות שהתקשיתם בהן וחזרו אליהן.'],
        keywords: 'בגרות מבחן שאלון תרגול מאגר',
      },
    ],
  },
  {
    id: 'studio', title: 'Studio ומקורות', icon: '📚', items: [
      {
        title: 'עבודה עם מקורות',
        description: 'ב־Studio בוחרים חומרי לימוד שהועלו או נשמרו ב־Drive, ומפיקים מהם סיכום או שאלות תרגול.',
        tips: ['השתמשו בחיפוש כדי למצוא מקור במהירות.', 'בחרו עד עשרה מקורות שעוסקים באותו נושא.', 'בדקו את הסיכום מול חומר המקור.'],
        keywords: 'Studio מקורות Drive סיכום חיפוש חומר לימוד',
      },
      {
        title: 'יצירת תרגול ממוקד',
        description: 'בחרו מקורות רלוונטיים ולחצו על יצירת תרגול. כך השאלות מבוססות על החומר שאתם באמת לומדים.',
        tips: ['ענו לפני שמבקשים פתרון.', 'אחרי טעות, בקשו שאלה דומה נוספת.'],
        keywords: 'Studio תרגול שאלות מקורות',
      },
    ],
  },
  {
    id: 'history', title: 'שיחות והתקדמות', icon: '📈', items: [
      {
        title: 'ניהול היסטוריית שיחות',
        description: 'אפשר לחפש שיחה, לשנות את שמה, להעביר אותה לתיקיית נושא או למחוק אותה.',
        tips: ['תנו לשיחה שם שמכיל את הנושא והתרגיל.', 'צרו תיקיות לפי מקצוע ופרק.', 'חזרו לשיחות שבהן טעיתם לפני מבחן.'],
        keywords: 'היסטוריה שיחה תיקייה שינוי שם מחיקה חיפוש',
      },
      {
        title: 'מעקב התקדמות',
        description: 'עמוד ההתקדמות מציג את רמת השליטה בנושאים ומדגיש תחומים שכדאי לחזק.',
        tips: ['התמקדו בכל פעם בתחום חלש אחד.', 'בדקו שוב את המפה אחרי כמה תרגולים.', 'שיפור עקבי חשוב יותר מציון של תרגיל בודד.'],
        keywords: 'התקדמות ELO מפת ידע פערים שליטה',
      },
    ],
  },
  {
    id: 'habits', title: 'איך משתפרים באמת?', icon: '🎯', items: [
      {
        title: 'שיטת עבודה מומלצת',
        description: 'למדו במחזורים קצרים: הבנת מושג, דוגמה מודרכת, פתרון עצמאי, בדיקת טעות וחזרה כעבור יום.',
        tips: ['למדו 20–30 דקות ואז קחו הפסקה קצרה.', 'פתרו בעצמכם לפני צפייה בפתרון המלא.', 'כתבו במחברת נוסחאות וטעויות שחוזרות.', 'לפני מבחן תרגלו גם בלי עזרת המערכת.'],
        keywords: 'טיפים שיפור לימודים מבחן ריכוז הרגלים חזרה',
      },
      {
        title: 'זכרו: SmarterAI הוא מאמן, לא קיצור דרך',
        description: 'המטרה היא להבין ולפתח ביטחון בפתרון. התשובה מועילה ביותר כשמשתמשים בה כדי ללמוד את הדרך.',
        tips: ['שאלו „למה?” ולא רק „מה התשובה?”.', 'סכמו כל פתרון במשפט אחד משלכם.', 'אם תשובה נראית לא הגיונית — בדקו ושאלו שוב.'],
        keywords: 'אחריות בדיקה הבנה למידה עצמאית',
      },
    ],
  },
];

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('he-IL');
}

export function StudentGuide() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const filteredCategories = useMemo(() => {
    const term = normalize(query);
    if (!term) return GUIDE_CATEGORIES;
    return GUIDE_CATEGORIES.map((category) => ({
      ...category,
      items: category.items.filter((item) => normalize(`${category.title} ${item.title} ${item.description} ${item.tips.join(' ')} ${item.keywords}`).includes(term)),
    })).filter((category) => category.items.length > 0);
  }, [query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-lg border border-violet-500 bg-violet-600 text-lg text-white shadow-sm hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
        aria-label="פתיחת מדריך השימוש"
        title="מדריך שימוש וטיפים"
      >
        ❔
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="student-guide-title" dir="rtl" className="flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:h-[88vh] sm:max-w-4xl sm:rounded-2xl lg:max-w-5xl">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6">
              <div>
                <h2 id="student-guide-title" className="text-lg font-bold text-gray-900 sm:text-2xl">מדריך SmarterAI</h2>
                <p className="hidden text-xs text-gray-500 sm:block">כל הכלים והטיפים שיעזרו לך ללמוד טוב יותר</p>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600" aria-label="סגירת המדריך">✕ סגור</button>
            </header>

            <div className="shrink-0 border-b border-gray-100 bg-gray-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800 sm:px-6">
              <label htmlFor="guide-search" className="sr-only">חיפוש במדריך</label>
              <input id="guide-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="🔎 חיפוש במדריך: מחשבון, צילום, תרגול..." className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
            </div>

            <div className="guide-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
              {filteredCategories.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
                  <p className="text-3xl">🔍</p><p className="mt-2 font-medium">לא מצאנו תוצאה לחיפוש הזה</p><button type="button" onClick={() => setQuery('')} className="mt-3 text-sm text-blue-700 underline">נקה חיפוש</button>
                </div>
              )}
              <div className="space-y-7">
                {filteredCategories.map((category) => (
                  <section key={category.id} aria-labelledby={`guide-${category.id}`}>
                    <h3 id={`guide-${category.id}`} className="mb-3 flex items-center gap-2 text-xl font-bold text-gray-900"><span aria-hidden="true">{category.icon}</span>{category.title}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {category.items.map((item) => (
                        <article key={item.title} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                          <h4 className="font-bold text-gray-900">{item.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                          <ul className="mt-3 space-y-1.5 text-sm text-gray-700">
                            {item.tips.map((tip) => <li key={tip} className="flex gap-2"><span className="text-emerald-600" aria-hidden="true">✓</span><span>{tip}</span></li>)}
                          </ul>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
