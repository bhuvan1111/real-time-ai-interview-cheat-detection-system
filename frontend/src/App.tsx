import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { AssessmentSessionPage } from './pages/AssessmentSession';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLiveMonitor } from './pages/AdminLiveMonitor';
import { AdminAssessments } from './pages/AdminAssessments';
import { AdminSessionDetail } from './pages/AdminSessionDetail';
import { AdminAnalytics } from './pages/AdminAnalytics';

// Protected Route Component
const ProtectedRoute: React.FC<{ allowedRoles?: ('candidate' | 'admin')[] }> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} replace />;
  }

  return <Outlet />;
};

// Portal Layout with Navbar and Sidebar
const PortalLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Root Redirector
const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/candidate'} replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Candidate Coding Session (Full screen without portal chrome) */}
          <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
            <Route path="/candidate/session/:sessionId" element={<AssessmentSessionPage />} />
          </Route>

          {/* Candidate Portal Routes */}
          <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/candidate" element={<CandidateDashboard />} />
              <Route path="/candidate/assessments" element={<CandidateDashboard />} />
              <Route path="/candidate/history" element={<CandidateDashboard />} />
            </Route>
          </Route>

          {/* Admin Evaluation Console Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<PortalLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/live" element={<AdminLiveMonitor />} />
              <Route path="/admin/assessments" element={<AdminAssessments />} />
              <Route path="/admin/sessions" element={<AdminDashboard />} />
              <Route path="/admin/sessions/:sessionId" element={<AdminSessionDetail />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
