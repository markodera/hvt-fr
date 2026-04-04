import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';

export function DashboardLayout() {
    const location = useLocation();
    const { user } = useAuth();
    const hasOrganization = Boolean(user?.organization);
    const isCreateOrganizationRoute = location.pathname === '/dashboard/create-organization';

    if (user && !hasOrganization && !isCreateOrganizationRoute) {
        return <Navigate to="/dashboard/create-organization" replace />;
    }

    if (user && hasOrganization && isCreateOrganizationRoute) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <DashboardShell>
            <Outlet />
        </DashboardShell>
    );
}
