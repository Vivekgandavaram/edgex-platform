import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import { canAccessRoute } from './lib/permissions';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import OtpLogin from './pages/auth/OtpLogin';

import Dashboard from './pages/Dashboard';
import Live from './pages/Live';
import Devices from './pages/Devices';
import DeviceDetail from './pages/DeviceDetail';
import Sensors from './pages/Sensors';
import Locations from './pages/Locations';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import ApiManagement from './pages/ApiManagement';
import ApiDocumentation from './pages/ApiDocumentation';
import Users from './pages/Users';
import Admins from './pages/Admins';
import RolesPermissions from './pages/RolesPermissions';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function AppRoutes() {
  const { user, status } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/otp-login" element={<OtpLogin />} />

      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live" element={<Live />} />
        <Route path="/devices" element={canAccessRoute(user, '/devices') ? <Devices /> : <Navigate to="/" replace />} />
        <Route path="/devices/:id" element={canAccessRoute(user, '/devices/:id') ? <DeviceDetail /> : <Navigate to="/" replace />} />
        <Route path="/sensors" element={canAccessRoute(user, '/sensors') ? <Sensors /> : <Navigate to="/" replace />} />
        <Route path="/locations" element={canAccessRoute(user, '/locations') ? <Locations /> : <Navigate to="/" replace />} />
        <Route path="/analytics" element={canAccessRoute(user, '/analytics') ? <Analytics /> : <Navigate to="/" replace />} />
        <Route path="/alerts" element={canAccessRoute(user, '/alerts') ? <Alerts /> : <Navigate to="/" replace />} />
        <Route path="/api-management" element={canAccessRoute(user, '/api-management') ? <ApiManagement /> : <Navigate to="/" replace />} />
        <Route path="/api-docs" element={canAccessRoute(user, '/api-docs') ? <ApiDocumentation /> : <Navigate to="/" replace />} />
        <Route path="/users" element={canAccessRoute(user, '/users') ? <Users /> : <Navigate to="/" replace />} />
        <Route path="/admins" element={canAccessRoute(user, '/admins') ? <Admins /> : <Navigate to="/" replace />} />
        <Route path="/roles" element={canAccessRoute(user, '/roles') ? <RolesPermissions /> : <Navigate to="/" replace />} />
        <Route path="/audit-logs" element={canAccessRoute(user, '/audit-logs') ? <AuditLogs /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={canAccessRoute(user, '/settings') ? <Settings /> : <Navigate to="/" replace />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
