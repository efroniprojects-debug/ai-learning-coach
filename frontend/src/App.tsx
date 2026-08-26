import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { GoogleCallbackPage } from '@/features/auth/pages/GoogleCallbackPage';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { AISettingsPanel } from '@/features/ai-settings/components/AISettingsPanel';
import { QuestionWorkspacePage } from '@/features/question/pages/QuestionWorkspacePage';
import { UploadPage } from '@/features/knowledge/pages/UploadPage';
import { PracticePage } from '@/features/practice/pages/PracticePage';
import { ProgressDashboard } from '@/features/progress/pages/ProgressDashboard';
import { BagruyotSidebar } from '@/components/BagruyotSidebar';

function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-600">Welcome to AI Learning Coach</p>
        </div>
        <Link
          to="/ai-settings"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          ⚙️ Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/ask"
          className="border rounded-lg p-6 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer"
        >
          <h2 className="text-xl font-semibold mb-2">Ask a Question</h2>
          <p className="text-gray-600">Ask your AI tutor anything about physics</p>
        </Link>
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Practice</h2>
          <p className="text-gray-600">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}

function AISettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link to="/dashboard" className="text-blue-600 hover:text-blue-700 mb-6 inline-block">
        ← Back to Dashboard
      </Link>
      <AISettingsPanel />
    </div>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BagruyotSidebar />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <DashboardPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-settings"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <AISettingsPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ask"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <QuestionWorkspacePage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <UploadPage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/practice"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PracticePage />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <ProgressDashboard />
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
