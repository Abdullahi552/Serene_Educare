import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import PublicLayout from '@/components/layout/PublicLayout';
import { FullPageSpinner } from '@/components/ui/Feedback';

// Route-level code splitting keeps the first load small.
const Landing = lazy(() => import('@/pages/public/Landing'));
const Login = lazy(() => import('@/pages/public/Login'));
const Signup = lazy(() => import('@/pages/public/Signup'));
const ForgotPassword = lazy(() => import('@/pages/public/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/public/ResetPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const Dashboard = lazy(() => import('@/pages/app/Dashboard'));
const ActivityTracker = lazy(() => import('@/pages/app/ActivityTracker'));
const IncidentReport = lazy(() => import('@/pages/app/IncidentReport'));
const IncidentLog = lazy(() => import('@/pages/app/IncidentLog'));
const Reports = lazy(() => import('@/pages/app/Reports'));
const Training = lazy(() => import('@/pages/app/Training'));
const SchoolProfile = lazy(() => import('@/pages/app/SchoolProfile'));
const AiChat = lazy(() => import('@/pages/app/AiChat'));

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
        <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="activities" element={<ActivityTracker />} />
          <Route path="incidents" element={<IncidentReport />} />
          <Route path="incidents/log" element={<IncidentLog />} />
          <Route path="reports" element={<Reports />} />
          <Route path="training" element={<Training />} />
          <Route path="profile" element={<SchoolProfile />} />
          <Route path="ai" element={<AiChat />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
