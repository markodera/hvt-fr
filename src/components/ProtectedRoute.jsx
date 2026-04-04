import { Navigate, useLocation } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const ORGANIZATION_ONBOARDING_PATH = '/dashboard/create-organization';

export function ProtectedRoute({ children }) {
    const location = useLocation();
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const onOrganizationOnboarding = location.pathname === ORGANIZATION_ONBOARDING_PATH;

    if (!user?.organization && !onOrganizationOnboarding) {
        return <Navigate to={ORGANIZATION_ONBOARDING_PATH} replace state={{ from: location }} />;
    }

    if (user?.organization && onOrganizationOnboarding) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
