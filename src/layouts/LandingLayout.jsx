import { Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function NavLink({ to, children, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
            {children}
        </Link>
    );
}

function LandingNav() {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-primary/60 backdrop-blur-xl border-b border-border shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                            <span className="text-white font-extrabold text-sm">H</span>
                        </div>
                        <span className="text-xl font-extrabold text-text-primary tracking-tight">HVT<span className="text-primary">.dev</span></span>
                    </Link>

                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-8 bg-bg-secondary/50 px-6 py-2 rounded-full border border-border/50">
                        <NavLink to="/#features">Features</NavLink>
                        <NavLink to="/#pricing">Pricing</NavLink>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                        >
                            Docs
                        </a>
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button variant="ghost" className="font-semibold text-text-secondary hover:text-text-primary" asChild>
                            <Link to="/login">Sign in</Link>
                        </Button>
                        <Button className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-sans" asChild>
                            <Link to="/register">Get started <span className="ml-1 text-primary-muted group-hover:translate-x-0.5 transition-transform">→</span></Link>
                        </Button>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-text-primary p-2 -mr-2 rounded-lg hover:bg-bg-secondary transition-colors"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden border-t border-border py-4 space-y-4">
                        <NavLink to="/#features" onClick={() => setMobileOpen(false)}>Features</NavLink>
                        <NavLink to="/#pricing" onClick={() => setMobileOpen(false)}>Pricing</NavLink>
                        <div className="flex flex-col gap-2 pt-2">
                            <Button variant="outline" asChild className="w-full">
                                <Link to="/login">Sign in</Link>
                            </Button>
                            <Button asChild className="w-full">
                                <Link to="/register">Get started</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

function LandingFooter() {
    return (
        <footer className="border-t border-border bg-bg-secondary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="text-white font-extrabold text-sm">H</span>
                            </div>
                            <span className="text-lg font-extrabold text-text-primary">HVT.dev</span>
                        </div>
                        <p className="text-sm text-text-secondary">
                            Open-source authentication platform for modern applications.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Product</h4>
                        <ul className="space-y-2">
                            <li><a href="/#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">Features</a></li>
                            <li><a href="/#pricing" className="text-sm text-text-muted hover:text-text-primary transition-colors">Pricing</a></li>
                            <li><a href="/#how-it-works" className="text-sm text-text-muted hover:text-text-primary transition-colors">How it works</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Resources</h4>
                        <ul className="space-y-2">
                            <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-text-primary transition-colors">GitHub</a></li>
                            <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">Documentation</a></li>
                            <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">API Reference</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">Privacy</a></li>
                            <li><a href="#" className="text-sm text-text-muted hover:text-text-primary transition-colors">Terms</a></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border">
                    <p className="text-sm text-text-muted text-center">
                        © {new Date().getFullYear()} HVT. Open source under the MIT License.
                    </p>
                </div>
            </div>
        </footer>
    );
}

export function LandingLayout() {
    return (
        <div className="min-h-screen bg-bg-primary">
            <LandingNav />
            <main className="pt-16">
                <Outlet />
            </main>
            <LandingFooter />
        </div>
    );
}
