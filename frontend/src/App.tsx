import React, { lazy, Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { GoogleCallbackPage } from '@/features/auth/pages/GoogleCallbackPage';
import { QuestionWorkspacePage } from '@/features/question/pages/QuestionWorkspacePage';
import { UploadPage } from '@/features/knowledge/pages/UploadPage';
import { PracticePage } from '@/features/practice/pages/PracticePage';
import { BagruyotSidebar } from '@/components/BagruyotSidebar';
import { ScientificCalculator } from '@/components/calculator/ScientificCalculator';
import { StudentGuide } from '@/components/StudentGuide';
import { MathStudyUnits } from '@/config/subjects';
import { useSelectedSubject } from '@/features/subjects/useSelectedSubject';

const queryClient = new QueryClient();
const ProgressDashboard = lazy(() => import('@/features/progress/pages/ProgressDashboard').then((module) => ({ default: module.ProgressDashboard })));
const StudioPage = lazy(() => import('@/features/studio/pages/StudioPage').then((module) => ({ default: module.StudioPage })));

function PageLoader() {
  return <div className="mx-auto mt-12 h-48 max-w-5xl animate-pulse rounded-2xl bg-gray-100 dark:bg-slate-800" aria-label="העמוד נטען" />;
}

function GlobalHeader({ theme, onToggleTheme }: { theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  const { subject, mathStudyUnits } = useSelectedSubject();
  return (
    <header className="fixed inset-x-0 top-0 z-[7400] h-16 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <Link to="/dashboard" className="absolute right-3 top-1.5 rounded-lg border border-blue-100 bg-white p-1 shadow dark:border-slate-600 dark:bg-slate-800" aria-label="SmarterAI — דף הבית">
        <img src="/efroni-projects-logo.png" alt="Efroni Projects" className="h-11 w-11 rounded-md object-cover" />
      </Link>
      {/* Keep global utilities together so they remain easy to find on every page. */}
      <div className="absolute right-20 top-2.5 flex items-center gap-2" dir="rtl">
        <Link
          to="/dashboard"
          className={`hidden h-10 items-center rounded-lg border px-3 text-sm font-semibold shadow-sm md:flex ${subject.accent === 'green' ? 'border-green-200 bg-green-50 text-green-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}
          aria-label={`הקשר לימודי: ${subject.nameHe}${subject.id === 'math' ? `, ${mathStudyUnits} יחידות לימוד` : ''}. שינוי בדף הבית`}
        >
          {subject.icon} {subject.nameHe}{subject.id === 'math' ? ` · ${mathStudyUnits} יח״ל` : ''}
        </Link>
        <button onClick={onToggleTheme} className="flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 sm:px-3 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700" aria-label={theme === 'light' ? 'עבור למצב כהה' : 'עבור למצב בהיר'}>
          <span aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="ms-1 hidden sm:inline">{theme === 'light' ? 'כהה' : 'בהיר'}</span>
        </button>
        <BagruyotSidebar />
        <StudentGuide />
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-gray-200 bg-slate-50 px-4 py-5 dark:border-slate-700 dark:bg-slate-900" dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
        <img src="/efroni-projects-logo.png" alt="Efroni Projects" className="h-8 w-8 rounded object-cover" />
        <span>© 2025 Efroni Projects. כל הזכויות שמורות.</span>
        <span aria-hidden="true">•</span>
        <a href="mailto:efroniprogects@gmail.com" className="text-blue-700 hover:underline">efroniprogects@gmail.com</a>
      </div>
    </footer>
  );
}

function DashboardPage() {
  const { subjectId, subject, mathStudyUnits, setSubjectId, setMathStudyUnits } = useSelectedSubject();
  const isMath = subjectId === 'math';
  const cardClass = isMath
    ? 'border-green-200 bg-green-50/60 hover:border-green-500 dark:bg-green-950/30'
    : 'border-blue-200 bg-blue-50/60 hover:border-blue-500 dark:bg-blue-950/30';
  const modules = [
    { to: '/ask', icon: subject.icon, title: 'שאל שאלה', description: 'הסבר שלב-אחר-שלב, פתרון מלא, אבחון טעות' },
    { to: '/practice', icon: '📝', title: 'תרגול', description: 'תרגילים מותאמים אישית עם מעקב ELO' },
    { to: '/upload', icon: '📤', title: 'העלה חומרים', description: 'PDF, דפי עבודה, מבחני בגרות עבר' },
    { to: '/progress', icon: '📊', title: 'התקדמות', description: 'מעקב שליטה ואזורים שצריך לחזק' },
    { to: '/studio', icon: '📚', title: 'Studio', description: 'יצירת סיכומים ושאלות תרגול מחומרי הלימוד שלך', wide: true },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 px-4" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">SmarterAI 🧠</h1>
        <p className="text-gray-500 text-sm">סביבת למידה חכמה לפיזיקה ולמתמטיקה</p>
      </div>
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:bg-slate-900" aria-labelledby="learning-context-title">
        <h2 id="learning-context-title" className="mb-3 text-lg font-bold">מה לומדים עכשיו?</h2>
        <div className="flex flex-wrap items-center gap-3" role="group" aria-label="בחירת מקצוע">
          <button type="button" onClick={() => setSubjectId('physics')} aria-pressed={subjectId === 'physics'} className={`border px-5 py-3 font-bold ${subjectId === 'physics' ? 'border-blue-700 bg-blue-600 text-white ring-2 ring-blue-200' : 'border-gray-300 bg-white text-gray-700 hover:border-blue-500'}`}>🔬 פיזיקה</button>
          <button type="button" onClick={() => setSubjectId('math')} aria-pressed={isMath} className={`border px-5 py-3 font-bold ${isMath ? 'border-green-700 bg-green-600 text-white ring-2 ring-green-200' : 'border-gray-300 bg-white text-gray-700 hover:border-green-500'}`}>📐 מתמטיקה</button>
          {isMath && (
            <label className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 font-medium text-green-900">
              יחידות לימוד
              <select value={mathStudyUnits} onChange={(event) => setMathStudyUnits(Number(event.target.value) as MathStudyUnits)} className="rounded-md border border-green-300 bg-white px-3 py-1 font-bold" aria-label="מספר יחידות לימוד במתמטיקה">
                <option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
              </select>
            </label>
          )}
        </div>
        <p className="mt-3 text-sm text-gray-600">כל המודולים ייפתחו עבור {subject.nameHe}{isMath ? ` ברמת ${mathStudyUnits} יח״ל` : ''}.</p>
      </section>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map((module) => (
          <Link key={module.to} to={module.to} className={`block rounded-xl border p-6 transition-all hover:shadow-lg ${cardClass} ${module.wide ? 'sm:col-span-2' : ''}`}>
            <div className="mb-3 text-3xl">{module.icon}</div>
            <h2 className="mb-1 text-lg font-semibold">{module.title}</h2>
            <p className="text-sm text-gray-600">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Draggable + resizable calculator panel
function DraggableCalculator({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState({ x: 24, y: window.innerHeight - 600 });
  const [size, setSize] = useState({ w: 300, h: 560 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - size.w, dragRef.current.origX + ev.clientX - dragRef.current.startX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.origY + ev.clientY - dragRef.current.startY)),
      });
    };
    const onUp = () => { dragRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos, size.w]);

  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: size.w, origH: size.h };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      setSize({
        w: Math.max(260, resizeRef.current.origW + ev.clientX - resizeRef.current.startX),
        h: Math.max(300, resizeRef.current.origH + ev.clientY - resizeRef.current.startY),
      });
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size]);

  return (
    <div
      ref={panelRef}
      className="calculator-panel"
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: size.w,
        height: size.h,
        zIndex: 8500,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{ background: '#1a1a2e', padding: '6px 12px', cursor: 'grab', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}
      >
        <span style={{ color: '#aaa', fontSize: 12 }}>⠿ מחשבון מדעי</span>
        <button onClick={onClose} style={{ color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      {/* Calculator content — scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#1a1a2e' }}>
        <ScientificCalculator />
      </div>

      {/* Resize handle — bottom-right corner */}
      <div
        onMouseDown={onResizeStart}
        style={{
          position: 'absolute', bottom: 0, right: 0,
          width: 18, height: 18, cursor: 'se-resize',
          background: 'linear-gradient(135deg, transparent 50%, #555 50%)',
          borderRadius: '0 0 16px 0',
        }}
      />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <nav className="fixed top-3 left-3 z-[7500] flex gap-2" dir="rtl" aria-label="ניווט ראשי">
        {location.pathname !== '/dashboard' && (
          <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50" aria-label="חזור לעמוד הקודם">
            ↩ חזור
          </button>
        )}
        <button onClick={() => navigate('/dashboard')} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-blue-700" aria-label="חזרה לדף הבית">
          🏠 בית
        </button>
      </nav>
      {children}
      {/* Calculator toggle button */}
      <button
        onClick={() => setCalcOpen(v => !v)}
        style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 8000 }}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center text-2xl touch-manipulation select-none"
        title="מחשבון מדעי"
      >
        {calcOpen ? '✕' : '🧮'}
      </button>

      {calcOpen && <DraggableCalculator onClose={() => setCalcOpen(false)} />}
    </>
  );
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('smarterai-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('smarterai-theme', theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 dark:text-slate-100">
          <GlobalHeader theme={theme} onToggleTheme={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} />
          <main className="flex-1 pt-16">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
              <Route path="/ask" element={<ProtectedRoute><Layout><QuestionWorkspacePage /></Layout></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><Layout><UploadPage /></Layout></ProtectedRoute>} />
              <Route path="/practice" element={<ProtectedRoute><Layout><PracticePage /></Layout></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><Layout><Suspense fallback={<PageLoader />}><ProgressDashboard /></Suspense></Layout></ProtectedRoute>} />
              <Route path="/studio" element={<ProtectedRoute><Layout><Suspense fallback={<PageLoader />}><StudioPage /></Suspense></Layout></ProtectedRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
