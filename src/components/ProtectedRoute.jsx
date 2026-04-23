import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

const ORGANIZATION_ONBOARDING_PATH = '/dashboard/create-organization';

export function ProtectedRoute({ children }) {
    const location = useLocation();
    const { user, isAuthenticated, isLoading, refreshSession } = useAuth();
    const hasTriedRecoveryRef = useRef(false);
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        if (isLoading || isAuthenticated || hasTriedRecoveryRef.current) {
            return undefined;
        }

        hasTriedRecoveryRef.current = true;
        let cancelled = false;
        setIsRecovering(true);

        refreshSession({ clearOnError: false })
            .catch(() => null)
            .finally(() => {
                if (!cancelled) {
                    setIsRecovering(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, isLoading, refreshSession]);

    if (isLoading || isRecovering) {
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
