import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { LandingLayout } from '@/layouts/LandingLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RoleGate } from '@/components/RoleGate';

// Pages
import { LandingPage } from '@/pages/landing/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailNoticePage } from '@/pages/auth/VerifyEmailNoticePage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { GoogleCallbackPage } from '@/pages/auth/GoogleCallbackPage';
import { GitHubCallbackPage } from '@/pages/auth/GitHubCallbackPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { GetStartedPage } from '@/pages/onboarding/GetStartedPage';
import { UsersPage } from '@/pages/users/UsersPage';
import { UserDetailPage } from '@/pages/users/UserDetailPage';
import { ApiKeysPage } from '@/pages/api-keys/ApiKeysPage';
import { WebhooksPage } from '@/pages/webhooks/WebhooksPage';
import { WebhookDetailPage } from '@/pages/webhooks/WebhookDetailPage';
import { AuditLogPage } from '@/pages/audit/AuditLogPage';
import { OrgSettingsPage } from '@/pages/settings/OrgSettingsPage';

const router = createBrowserRouter([
  // Public — Landing
  {
    element: <LandingLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
    ],
  },

  // Auth pages
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/auth/verify-email-notice', element: <VerifyEmailNoticePage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/auth/password-reset/:key', element: <ResetPasswordPage /> },
    ],
  },

  // Independent public paths
  { path: '/auth/verify-email/:key', element: <VerifyEmailPage /> },

  // OAuth callbacks (no layout — they redirect immediately)
  { path: '/auth/google/callback', element: <GoogleCallbackPage /> },
  { path: '/auth/github/callback', element: <GitHubCallbackPage /> },

  // Dashboard — protected
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/dashboard/get-started', element: <GetStartedPage /> },
      { path: '/dashboard/users', element: <UsersPage /> },
      { path: '/dashboard/users/:id', element: <UserDetailPage /> },
      { path: '/dashboard/api-keys', element: <ApiKeysPage /> },
      { path: '/dashboard/webhooks', element: <WebhooksPage /> },
      { path: '/dashboard/webhooks/:id', element: <WebhookDetailPage /> },
      { path: '/dashboard/audit-logs', element: <AuditLogPage /> },
      { path: '/dashboard/settings', element: <OrgSettingsPage /> },
    ],
  },

  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
