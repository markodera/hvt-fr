import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { listProjects } from '@/api/organizations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/hooks/useAuth';

export function DashboardLayout() {
    const location = useLocation();
    const { user } = useAuth();
    const hasOrganization = Boolean(user?.organization);
    const isCreateOrganizationRoute = location.pathname === '/dashboard/create-organization';
    const isCreateProjectRoute = location.pathname === '/dashboard/create-project';

    const projectsQuery = useQuery({
        queryKey: ['projects', { page_size: 1, source: 'dashboard-layout' }],
        queryFn: () => listProjects({ page_size: 1 }),
        enabled: hasOrganization,
        staleTime: 30_000,
    });

    if (user && !hasOrganization && !isCreateOrganizationRoute) {
        return <Navigate to="/dashboard/create-organization" replace />;
    }

    if (user && hasOrganization && projectsQuery.isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const projectCount =
        projectsQuery.data?.count ??
        projectsQuery.data?.results?.length ??
        projectsQuery.data?.length ??
        0;
    const hasProjects = projectCount > 0;

    if (user && hasOrganization && !projectsQuery.isError && !hasProjects && !isCreateProjectRoute) {
        return <Navigate to="/dashboard/create-project" replace />;
    }

    if (user && hasOrganization && isCreateOrganizationRoute) {
        return <Navigate to={hasProjects ? '/dashboard' : '/dashboard/create-project'} replace />;
    }

    if (user && hasOrganization && !projectsQuery.isError && hasProjects && isCreateProjectRoute) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <DashboardShell>
            <Outlet />
        </DashboardShell>
    );
}
