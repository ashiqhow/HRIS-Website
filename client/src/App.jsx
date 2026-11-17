import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UsersManagement from './pages/UsersManagement';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import LeaveManagement from './pages/LeaveManagement';
import Attendance from './pages/Attendance';
import Recruitment from './pages/Recruitment';
import Payroll from './pages/Payroll';
import Performance from './pages/Performance';
import Training from './pages/Training';

// Main Authenticated Layout
const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // If loading session, show splash spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Initializing HRIS Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />

      {/* Protected App Routes inside Main Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['HR Admin', 'Manager']}>
            <MainLayout>
              <UsersManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/leaves"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LeaveManagement />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Attendance />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recruitment"
        element={
          <ProtectedRoute allowedRoles={['HR Admin', 'Manager']}>
            <MainLayout>
              <Recruitment />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Payroll />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Performance />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/training"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Training />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Notifications />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
