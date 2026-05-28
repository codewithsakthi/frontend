import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));

import ConsentScreen from './components/ConsentScreen';
import GeminiChat from './components/GeminiChat.jsx';
import { ROLES, getDefaultRouteForRole } from './routes/config';

function GitHubCallbackHandler() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const encodedCode = code ? encodeURIComponent(code) : null;
  return <Navigate to={encodedCode ? `/dashboard?tab=Professional&code=${encodedCode}` : '/dashboard?tab=Professional'} replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 300000,
    },
  },
});

function App() {
  const { user, logout, hasConsented, setConsent } = useAuthStore();
  const { theme } = useThemeStore();
  const isAuthenticated = !!user;
  const userRole = (user?.role?.name || user?.role || 'student').toLowerCase();

  const getRedirectPath = () => getDefaultRouteForRole(userRole);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };


  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <PwaInstallPrompt />
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm font-semibold text-muted-foreground">Loading workspace...</div>}>
              <Routes>
                <Route
                  path="/login"
                  element={isAuthenticated ? <Navigate to={getRedirectPath()} replace /> : <Login />}
                />

                <Route
                  path="/auth/github/callback"
                  element={<GitHubCallbackHandler />}
                />
                
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <DashboardLayout>
                        <AdminDashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.FACULTY, ROLES.HOD, ROLES.DIRECTOR]}>
                      <DashboardLayout>
                        <StaffDashboard />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                {/* GeminiChat is now global, not a route */}
                <Route path="*" element={<Navigate to={isAuthenticated ? getRedirectPath() : '/login'} replace />} />
              </Routes>
            </Suspense>

            {/* Floating Gemini Chat appears everywhere when authenticated */}
            {isAuthenticated && <GeminiChat />}
          </div>
        </Router>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;

