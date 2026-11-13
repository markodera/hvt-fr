import { useState } from 'react';

import { GlobalHeader } from './GlobalHeader';
import { ProjectSidebar } from './ProjectSidebar';

export function AppShell({ children }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Desktop Persistent Left Sidebar */}
            <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
                <ProjectSidebar />
            </div>

            {/* Mobile Slide-Over Drawer */}
            {mobileMenuOpen ? (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-hidden="true"
                    />
                    <div className="relative flex w-full max-w-xs flex-1 flex-col bg-[#111111]">
                        <ProjectSidebar onCloseMobile={() => setMobileMenuOpen(false)} />
                    </div>
                </div>
            ) : null}

            {/* Main Content Viewport Area */}
            <div className="flex flex-1 flex-col lg:pl-[240px]">
                <GlobalHeader onMobileMenuToggle={() => setMobileMenuOpen(true)} />
                <main className="flex-1 p-4 md:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </div>
    );
}
