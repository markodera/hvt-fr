import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

export function DashboardLayout() {
    return (
        <div className="min-h-screen bg-bg-primary">
            <Sidebar />
            <div className="ml-[240px]">
                <Header />
                <main className="max-w-[1200px] mx-auto px-8 py-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
