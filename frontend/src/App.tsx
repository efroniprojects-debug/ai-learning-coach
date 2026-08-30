import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { GoogleCallbackPage } from '@/features/auth/pages/GoogleCallbackPage';
import { AISettingsPanel } from '@/features/ai-settings/components/AISettingsPanel';
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

      <div className="mt-6 text-center">
        <Link to="/ai-settings" className="text-xs text-gray-400 hover:text-gray-600">⚙️ הגדרות AI</Link>
      </div>
    </div>
  );
}

function AISettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 mb-6 inline-block text-sm" dir="rtl">← חזרה לדשבורד</Link>
      <AISettingsPanel />
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <>
      {children}
      <BagruyotSidebar />

      {/* Floating calculator button */}
      <button
        onClick={() => setCalcOpen(v => !v)}
        className="fixed bottom-6 left-6 z-[8000] w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center text-2xl transition-all active:scale-95"
        title="מחשבון מדעי"
        aria-label="מחשבון מדעי"
      >
        {calcOpen ? '✕' : '🧮'}
      </button>

      {calcOpen && (
        <div className="fixed bottom-24 left-6 z-[8500] drop-shadow-2xl">
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
          {/* /login and /auth/* just redirect to dashboard — no auth needed */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
          <Route path="/ai-settings" element={<ProtectedRoute><Layout><AISettingsPage /></Layout></ProtectedRoute>} />
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
