import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Check,
    ChevronDown,
    Copy,
    FolderGit2,
    LogOut,
    Moon,
    Settings,
    SunMedium,
    User,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { useProject } from '@/hooks/useProject';
import { useTheme } from '@/hooks/useTheme';
import { getUserDisplayName, getUserInitials } from '@/lib/userIdentity';
import { DOCS_URL } from '@/lib/appLinks';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function GlobalHeader({ onMobileMenuToggle }) {
    const { user, logout } = useAuth();
    const { toggleTheme, isDark } = useTheme();
    const {
        projects,
        activeProject,
        activeProjectId,
        environment,
        setEnvironment,
        selectProject,
    } = useProject();

    const [copiedId, setCopiedId] = useState(false);

    const displayName = getUserDisplayName(user);
    const initials = getUserInitials(user);
    const orgName = user?.organization?.name || 'Organization';

    const handleCopyProjectId = async (e) => {
        e.stopPropagation();
        if (!activeProjectId) return;
        try {
            await navigator.clipboard.writeText(activeProjectId);
            setCopiedId(true);
            toast.success('Project ID copied to clipboard');
            setTimeout(() => setCopiedId(false), 2000);
        } catch {
            toast.error('Failed to copy Project ID');
        }
    };

    return (
        <header className="sticky top-0 z-30 flex flex-col border-b border-[#27272a] bg-[#111111]/95 backdrop-blur">
            {environment === 'test' ? (
                <div className="flex items-center justify-between border-b border-[#27272a] bg-[#141416] px-4 py-1.5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                            TEST MODE
                        </span>
                        <span className="text-[11px] text-zinc-400">
                            Viewing sandbox data. Live transactions unaffected.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEnvironment('live')}
                        className="text-[11px] font-medium text-zinc-400 transition hover:text-white underline underline-offset-2"
                    >
                        Switch to Live mode
                    </button>
                </div>
            ) : null}
            

            <div className="flex h-14 items-center justify-between px-4 lg:px-6">
                {/* Left: Mobile Toggle & Tenant Breadcrumb Switcher */}
                <div className="flex items-center gap-3">
                    {onMobileMenuToggle ? (
                        <button
                            type="button"
                            onClick={onMobileMenuToggle}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:text-white lg:hidden"
                            aria-label="Open navigation menu"
                        >
                            <FolderGit2 className="h-4 w-4" />
                        </button>
                    ) : null}

                    <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-[#71717a]">{orgName}</span>
                        <span className="text-[#3f3f46]">/</span>

                        {/* Project Switcher Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[#3f3f46] hover:bg-[#202024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                                >
                                    <span className="max-w-[140px] truncate sm:max-w-[200px]">
                                        {activeProject?.name || 'Select project'}
                                    </span>
                                    <ChevronDown className="h-3.5 w-3.5 text-[#71717a]" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-64 border-[#27272a] bg-[#111111] text-white shadow-xl"
                            >
                                <DropdownMenuLabel className="text-xs font-normal text-[#71717a]">
                                    Projects ({projects.length})
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#27272a]" />
                                <DropdownMenuGroup>
                                    {projects.map((p) => {
                                        const isSelected = p.id === activeProjectId;
                                        return (
                                            <DropdownMenuItem
                                                key={p.id}
                                                onClick={() => selectProject(p.id)}
                                                className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-xs ${
                                                    isSelected
                                                        ? 'bg-[#18181b] font-semibold text-white'
                                                        : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                                                }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{p.name}</p>
                                                    <p className="truncate font-mono text-[11px] text-[#71717a]">
                                                        {p.slug}
                                                    </p>
                                                </div>
                                                {isSelected ? (
                                                    <Check className="h-4 w-4 text-zinc-200" />
                                                ) : null}
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator className="bg-[#27272a]" />
                                <DropdownMenuItem asChild>
                                    <Link
                                        to="/dashboard/create-project"
                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#18181b]"
                                    >
                                        + Create new project
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Prominent One-Click Copyable Project ID Pill */}
                        {activeProjectId ? (
                            <button
                                type="button"
                                onClick={handleCopyProjectId}
                                title="Click to copy full Project ID"
                                className="hidden items-center gap-1.5 rounded-lg border border-[#27272a] bg-[#18181b] px-2.5 py-1 font-mono text-xs text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 sm:inline-flex"
                            >
                                <span className="text-[#71717a]">id:</span>
                                <span>{activeProjectId.slice(0, 8)}...</span>
                                {copiedId ? (
                                    <Check className="h-3 w-3 text-emerald-400" />
                                ) : (
                                    <Copy className="h-3 w-3 text-[#71717a]" />
                                )}
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Right: Environment Toggle, Docs, Theme & User Menu */}
                <div className="flex items-center gap-3">
                    {/* Accessible Test / Live Mode Toggle */}
                    <div
                        role="group"
                        aria-label="Environment Mode"
                        className="inline-flex rounded-lg border border-[#27272a] bg-[#18181b] p-0.5"
                    >
                        <button
                            type="button"
                            onClick={() => setEnvironment('test')}
                            role="radio"
                            aria-checked={environment === 'test'}
                            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                                environment === 'test'
                                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 shadow-sm'
                                    : 'text-[#71717a] hover:text-[#a1a1aa]'
                            }`}
                        >
                            Test
                        </button>
                        <button
                            type="button"
                            onClick={() => setEnvironment('live')}
                            role="radio"
                            aria-checked={environment === 'live'}
                            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                                environment === 'live'
                                    ? 'bg-[#7c3aed] text-white font-semibold shadow-sm shadow-[#7c3aed]/25'
                                    : 'text-[#71717a] hover:text-[#a1a1aa]'
                            }`}
                        >
                            Live
                        </button>
                    </div>

                    {/* Docs Link */}
                    <a
                        href={DOCS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="hidden h-9 items-center gap-2 rounded-lg border border-[#27272a] bg-[#18181b] px-3 text-xs font-medium text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white sm:inline-flex"
                    >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>Docs</span>
                    </a>

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={toggleTheme}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181b] text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white"
                        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
                    >
                        {isDark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    {/* User Profile Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#27272a] bg-[#18181b] px-2.5 py-1.5 text-left transition hover:border-[#3f3f46] hover:bg-[#202024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                            >
                                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-[#111111] text-xs font-semibold text-zinc-200">
                                    {initials}
                                </div>
                                <div className="hidden text-left md:block">
                                    <p className="max-w-[130px] truncate text-xs font-semibold text-white">
                                        {displayName}
                                    </p>
                                    <p className="max-w-[130px] truncate text-[11px] text-[#71717a]">
                                        {user?.email}
                                    </p>
                                </div>
                                <ChevronDown className="h-3.5 w-3.5 text-[#71717a]" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 border-[#27272a] bg-[#111111] text-white shadow-xl"
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-xs font-semibold text-white">{displayName}</p>
                                    <p className="text-[11px] text-[#71717a]">{user?.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-[#27272a]" />
                            <DropdownMenuGroup>
                                <DropdownMenuItem asChild>
                                    <Link
                                        to="/dashboard/settings"
                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
                                    >
                                        <Settings className="h-3.5 w-3.5" />
                                        <span>Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link
                                        to="/dashboard/users"
                                        className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        <span>Team Members</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator className="bg-[#27272a]" />
                            <DropdownMenuItem
                                onClick={logout}
                                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span>Sign out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
