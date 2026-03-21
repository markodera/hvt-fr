import { Outlet } from 'react-router-dom';

export function AuthLayout() {
    return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
            {/* Subtle background grid pattern */}
            <div className="fixed inset-0 bg-[radial-gradient(#1A1D27_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <a href="/" className="inline-flex items-center gap-2">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                            <span className="text-white font-extrabold text-lg">H</span>
                        </div>
                        <span className="text-2xl font-extrabold text-text-primary">HVT</span>
                    </a>
                </div>

                {/* Card */}
                <div className="bg-bg-secondary border border-border rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
