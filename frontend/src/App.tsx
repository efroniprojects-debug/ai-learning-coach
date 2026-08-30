import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
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

function Layout({ children }: { children: React.ReactNode }) {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <>
      {children}
      <BagruyotSidebar />

      {/* Calculator button — fixed bottom-left */}
      <button
        onClick={() => setCalcOpen(v => !v)}
        style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 8000 }}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-xl flex items-center justify-center text-2xl transition-colors touch-manipulation select-none"
        title="מחשבון מדעי"
        aria-label="מחשבון מדעי"
      >
        {calcOpen ? '✕' : '🧮'}
      </button>

      {/* Calculator panel — scrollable, max height */}
      {calcOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            left: '24px',
            zIndex: 8500,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
          }}
          className="drop-shadow-2xl rounded-2xl"
        >
          <ScientificCalculator />
        </div>
      )}
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
