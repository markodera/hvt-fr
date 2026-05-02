import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading, refreshSession } = useAuth();
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

    return children;
}
