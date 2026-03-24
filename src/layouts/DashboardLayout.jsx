import { Outlet } from 'react-router-dom';

import { DashboardShell } from '@/components/dashboard/DashboardShell';

export function DashboardLayout() {
    return (
        <DashboardShell>
            <Outlet />
        </DashboardShell>
    );
}
