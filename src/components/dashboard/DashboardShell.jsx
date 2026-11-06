import { useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
    BookOpen,
    Boxes,
    Building2,
    ChevronDown,
    Grid2x2,
    KeyRound,
    LogOut,
    Moon,
    PlaySquare,
    ScrollText,
    Settings,
    SunMedium,
    User,
    Webhook,
} from 'lucide-react';

import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { DOCS_URL } from '@/lib/appLinks';
import { useTheme } from '@/hooks/useTheme';
import { getUserDisplayName, getUserInitials } from '@/lib/userIdentity';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navigation = [
    { label: 'Dashboard', to: '/dashboard', icon: Grid2x2 },
    { label: 'Users', to: '/dashboard/users', icon: User },
    { label: 'API Keys', to: '/dashboard/api-keys', icon: KeyRound },
    { label: 'Webhooks', to: '/dashboard/webhooks', icon: Webhook },
    { label: 'Audit Logs', to: '/dashboard/audit-logs', icon: ScrollText },
    { label: 'Settings', to: '/dashboard/settings', icon: Settings },
    { label: 'Playground', to: '/runtime-playground', icon: PlaySquare, external: true },
];

const organizationOnboardingNavigation = [
    { label: 'Create Organization', to: '/dashboard/create-organization', icon: Building2 },
];

const projectOnboardingNavigation = [
    { label: 'Create Project', to: '/dashboard/create-project', icon: Boxes },
];

const titleMap = [
    { match: '/dashboard/create-organization', title: 'Create Organization' },
    { match: '/dashboard/create-project', title: 'Create Project' },
    { match: '/dashboard/users', title: 'Users' },
    { match: '/dashboard/api-keys', title: 'API Keys' },
    { match: '/dashboard/webhooks', title: 'Webhooks' },
    { match: '/dashboard/audit-logs', title: 'Audit Logs' },
    { match: '/dashboard/settings', title: 'Settings' },
];

function resolveTitle(pathname) {
    const matched = titleMap.find((item) => pathname.startsWith(item.match));
    return matched?.title || 'Dashboard';
}

function NavItem({ item, mobile = false }) {
    const Icon = item.icon;
    return (
        <NavLink
            to={item.to}
            end={item.to === '/dashboard'}
            className={({ isActive }) =>
                [
                    'group relative flex items-center gap-3 transition-all duration-150',
                    mobile
                        ? 'min-w-0 flex-1 flex-col justify-center rounded-xl px-2 py-2 text-[11px] font-medium'
                        : 'rounded-lg px-4 py-3 text-sm font-medium',
                    isActive
                        ? 'bg-[#18181b] text-white'
                        : 'text-[#71717a] hover:bg-[#18181b] hover:text-[#a1a1aa]',
                ].join(' ')
            }
        >
            {({ isActive }) => (
                <>
                    {!mobile && isActive ? (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-[#7c3aed]" />
                    ) : null}
                    <Icon className="h-4 w-4" />
                    <span className={mobile ? 'truncate' : ''}>{item.label}</span>
                </>
            )}
        </NavLink>
    );
}

export function DashboardShell({ children }) {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const hasOrganization = Boolean(user?.organization);
    const isCreateOrganizationRoute = location.pathname === '/dashboard/create-organization';
    const isCreateProjectRoute = location.pathname === '/dashboard/create-project';
    let shellNavigation = navigation;
    if (isCreateOrganizationRoute || !hasOrganization) {
        shellNavigation = organizationOnboardingNavigation;
    } else if (isCreateProjectRoute) {
        shellNavigation = projectOnboardingNavigation;
    }
    const pageTitle = useMemo(() => resolveTitle(location.pathname), [location.pathname]);
    const displayName = getUserDisplayName(user);
    const initials = getUserInitials(user);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] border-r border-[#27272a] bg-[#111111] md:flex md:flex-col">
                <div className="border-b border-[#27272a] px-5 py-5">
                    <Logo href="/" />
                </div>

                <nav className="flex-1 space-y-1 px-3 py-4">
                    {shellNavigation.map((item) => (
                        <NavItem key={item.to} item={item} />
                    ))}
                    <a
                        href={DOCS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-[#71717a] transition-all duration-150 hover:bg-[#18181b] hover:text-[#a1a1aa]"
                    >
                        <BookOpen className="h-4 w-4" />
                        <span>Docs</span>
                    </a>
                </nav>

                <div className="border-t border-[#27272a] px-4 py-4">
                    <div className="flex items-center gap-3 rounded-xl border border-[#27272a] bg-[#111111] px-3 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#7c3aed]/50 bg-[#18181b] text-sm font-semibold text-[#a78bfa]">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{displayName}</p>
                            <p className="truncate text-xs text-[#71717a]">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={logout}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#a1a1aa] transition-colors hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Sign out
                    </button>
                </div>
            </aside>

            <div className="md:pl-[220px]">
                <header className="sticky top-0 z-20 h-14 border-b border-[#27272a] bg-[#111111]/95 backdrop-blur">
                    <div className="flex h-full items-center justify-between px-4 md:px-6">
                        <h1 className="text-base font-semibold text-white">{pageTitle}</h1>
                        <div className="flex items-center gap-3">
                            <a
                                href={DOCS_URL}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-9 items-center gap-2 rounded-full border border-[#27272a] bg-[#18181b] px-3 text-sm font-medium text-[#a1a1aa] transition-colors hover:border-[#3f3f46] hover:text-white"
                            >
                                <BookOpen className="h-4 w-4" />
                                <span className="hidden sm:inline">Docs</span>
                            </a>
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#27272a] bg-[#18181b] text-[#a1a1aa] transition-colors hover:border-[#3f3f46] hover:text-white"
                                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="hidden cursor-pointer items-center gap-2.5 rounded-full border border-[#27272a] bg-[#18181b] px-3 py-1.5 text-left transition hover:border-[#3f3f46] hover:bg-[#27272a]/50 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 md:flex"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#7c3aed]/40 bg-[#111111] text-xs font-semibold text-[#a78bfa]">
                                            {initials}
                                        </div>
                                        <div className="text-left">
                                            <p className="max-w-[150px] truncate text-sm font-medium text-white">{displayName}</p>
                                            <p className="max-w-[150px] truncate text-xs text-[#71717a]">{user?.email}</p>
                                        </div>
                                        <ChevronDown className="h-3.5 w-3.5 text-[#71717a]" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 border-[#27272a] bg-[#111111] text-white">
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-semibold leading-none text-white">{displayName}</p>
                                            <p className="text-xs leading-none text-[#71717a]">{user?.email}</p>
                                            {user?.organization ? (
                                                <p className="mt-1 text-[11px] text-[#a78bfa]">
                                                    {typeof user.organization === 'object' ? user.organization.name : user.organization}
                                                </p>
                                            ) : null}
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-[#27272a]" />
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem asChild>
                                            <Link to="/dashboard/settings?tab=account" className="flex w-full cursor-pointer items-center gap-2 text-sm text-[#d4d4d8] hover:text-white">
                                                <User className="h-4 w-4 text-[#a1a1aa]" />
                                                <span>Account & Security</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/dashboard/settings?tab=projects" className="flex w-full cursor-pointer items-center gap-2 text-sm text-[#d4d4d8] hover:text-white">
                                                <Boxes className="h-4 w-4 text-[#a1a1aa]" />
                                                <span>Projects & Runtime</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to="/dashboard/settings?tab=organization" className="flex w-full cursor-pointer items-center gap-2 text-sm text-[#d4d4d8] hover:text-white">
                                                <Building2 className="h-4 w-4 text-[#a1a1aa]" />
                                                <span>Organization</span>
                                            </Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                    <DropdownMenuSeparator className="bg-[#27272a]" />
                                    <DropdownMenuItem asChild>
                                        <a
                                            href={DOCS_URL}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex w-full cursor-pointer items-center gap-2 text-sm text-[#d4d4d8] hover:text-white"
                                        >
                                            <BookOpen className="h-4 w-4 text-[#a1a1aa]" />
                                            <span>Documentation</span>
                                        </a>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-[#27272a]" />
                                    <DropdownMenuItem
                                        onClick={logout}
                                        className="cursor-pointer text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Sign out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <button
                                type="button"
                                onClick={logout}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#27272a] bg-[#18181b] px-3 text-xs font-medium text-[#a1a1aa] transition-colors hover:border-[#ef4444]/40 hover:bg-[#ef4444]/10 hover:text-[#f87171]"
                                title="Sign out"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>

            <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#27272a] bg-[#111111]/95 px-2 py-2 backdrop-blur md:hidden">
                <div className="flex items-center gap-1">
                    {shellNavigation.map((item) => (
                        <NavItem key={item.to} item={item} mobile />
                    ))}
                </div>
            </nav>
        </div>
    );
}
