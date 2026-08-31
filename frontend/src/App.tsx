import React, { useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { GoogleCallbackPage } from '@/features/auth/pages/GoogleCallbackPage';
import { QuestionWorkspacePage } from '@/features/question/pages/QuestionWorkspacePage';
import { UploadPage } from '@/features/knowledge/pages/UploadPage';
import { PracticePage } from '@/features/practice/pages/PracticePage';
import { ProgressDashboard } from '@/features/progress/pages/ProgressDashboard';
import { BagruyotSidebar } from '@/components/BagruyotSidebar';
import { ScientificCalculator } from '@/components/calculator/ScientificCalculator';

const queryClient = new QueryClient();

function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">פיזיקיו 🔬</h1>
        <p className="text-gray-500 text-sm">מורה פרטי לפיזיקה — בגרות 5 יח"ל</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/ask" className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 transition-all block">
          <div className="text-3xl mb-3">🔬</div>
          <h2 className="text-lg font-semibold mb-1">שאל שאלה</h2>
          <p className="text-gray-500 text-sm">הסבר שלב-אחר-שלב, פתרון מלא, אבחון טעות</p>
        </Link>
        <Link to="/practice" className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 transition-all block">
          <div className="text-3xl mb-3">📝</div>
          <h2 className="text-lg font-semibold mb-1">תרגול</h2>
          <p className="text-gray-500 text-sm">תרגילים מותאמים אישית עם מעקב ELO</p>
        </Link>
        <Link to="/upload" className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 transition-all block">
          <div className="text-3xl mb-3">📤</div>
          <h2 className="text-lg font-semibold mb-1">העלה חומרים</h2>
          <p className="text-gray-500 text-sm">PDF, דפי עבודה, מבחני בגרות עבר</p>
        </Link>
        <Link to="/progress" className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-400 transition-all block">
          <div className="text-3xl mb-3">📊</div>
          <h2 className="text-lg font-semibold mb-1">התקדמות</h2>
          <p className="text-gray-500 text-sm">מעקב שליטה ואזורים שצריך לחזק</p>
        </Link>
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
      <BagruyotSidebar />

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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/ask" element={<ProtectedRoute><Layout><QuestionWorkspacePage /></Layout></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Layout><UploadPage /></Layout></ProtectedRoute>} />
          <Route path="/practice" element={<ProtectedRoute><Layout><PracticePage /></Layout></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Layout><ProgressDashboard /></Layout></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
