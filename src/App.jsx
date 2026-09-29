import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';

// Page components
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SparksPage from './pages/sparks/SparksPage';
import VideosPage from './pages/videos/VideosPage';
import AudiosPage from './pages/audios/AudiosPage';
import RecommendationsPage from './pages/recommendations/RecommendationsPage';
import DailyContentPage from './pages/dailyContent/DailyContentPage';
import UsersPage from './pages/users/UsersPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import VipPassPage from './pages/vipPass/VipPassPage';

export const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Admin Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="sparks" element={<SparksPage />} />
              <Route path="videos" element={<VideosPage />} />
              <Route path="audios" element={<AudiosPage />} />
              <Route path="recommendations" element={<RecommendationsPage />} />
              <Route path="daily-content" element={<DailyContentPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="vip-pass" element={<VipPassPage />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
