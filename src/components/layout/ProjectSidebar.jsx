// SPDX-License-Identifier: Apache-2.0
import { Link, useLocation } from 'react-router-dom';
import {
    BookOpen,
    Globe,
    Grid2x2,
    Key,
    KeyRound,
    LockKeyhole,
    Mail,
    PlaySquare,
    ScrollText,
    Settings,
    ShieldCheck,
    Users,
    Webhook,
} from 'lucide-react';

import { Logo } from '@/components/Logo';
import { useProject } from '@/hooks/useProject';
import { DOCS_URL } from '@/lib/appLinks';

const navSections = [
    {
        title: 'Core',
        items: [
            { label: 'Overview', to: '/dashboard', icon: Grid2x2, exact: true },
        ],
    },
    {
        title: 'Product Configuration',
        items: [
            { label: 'Email Delivery', to: '/dashboard/email', icon: Mail },
            { label: 'Social Providers', to: '/dashboard/settings?tab=projects&section=social-providers', icon: Globe },
            { label: 'Runtime Auth & Security', to: '/dashboard/settings?tab=projects&section=runtime-auth', icon: ShieldCheck },
            { label: 'Roles & App Access', to: '/dashboard/settings?tab=projects&section=app-access', icon: LockKeyhole },
        ],
    },
    {
        title: 'Developers',
        items: [
            { label: 'API Keys', to: '/dashboard/api-keys', icon: KeyRound },
            { label: 'Personal Access Tokens', to: '/dashboard/tokens', icon: Key },
            { label: 'Webhooks', to: '/dashboard/webhooks', icon: Webhook },
            { label: 'Audit Logs', to: '/dashboard/audit-logs', icon: ScrollText },
            { label: 'Playground', to: '/runtime-playground', icon: PlaySquare, external: true },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Users & Team', to: '/dashboard/users', icon: Users },
            { label: 'General Settings', to: '/dashboard/settings', icon: Settings },
        ],
    },
];

export function ProjectSidebar({ onCloseMobile }) {
    const { activeProject, activeProjectId } = useProject();
    const location = useLocation();
    const currentParams = new URLSearchParams(location.search);
    const currentTab = currentParams.get('tab') || 'account';
    const currentSection = currentParams.get('section') || '';

    // NavLink ignores query strings, so settings deep-links need manual matching.
    const isItemActive = (item) => {
        const [path, query = ''] = item.to.split('?');
        if (query) {
            const itemParams = new URLSearchParams(query);
            return (
                location.pathname === path &&
                (itemParams.get('tab') || 'account') === currentTab &&
                (itemParams.get('section') || '') === currentSection
            );
        }
        if (path === '/dashboard/settings') {
            return location.pathname === path && currentTab === 'account' && !currentSection;
        }
        if (item.exact) {
            return location.pathname === path;
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <aside className="flex h-full w-[240px] flex-col border-r border-[#27272a] bg-[#111111]">
            {/* Header / Brand */}
            <div className="flex h-14 items-center border-b border-[#27272a] px-5">
                <Logo href="/dashboard" />
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto px-3 py-4">
                <div className="space-y-6">
                    {navSections.map((section) => (
                        <div key={section.title} className="space-y-1">
                            <h3 className="px-3 text-[11px] font-semibold text-[#71717a] uppercase tracking-wider">
                                {section.title}
                            </h3>
                            <div className="space-y-0.5 pt-1">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    if (item.external) {
                                        return (
                                            <a
                                                key={item.label}
                                                href={item.to}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[#71717a] transition-colors hover:bg-[#18181b] hover:text-[#a1a1aa]"
                                            >
                                                <Icon className="h-4 w-4 text-[#71717a] group-hover:text-[#a1a1aa]" />
                                                <span>{item.label}</span>
                                            </a>
                                        );
                                    }
                                    const isActive = isItemActive(item);
                                    return (
                                        <Link
                                            key={item.label}
                                            to={item.to}
                                            onClick={onCloseMobile}
                                            aria-current={isActive ? 'page' : undefined}
                                            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                                                isActive
                                                    ? 'bg-[#18181b] text-white font-semibold'
                                                    : 'text-[#71717a] hover:bg-[#18181b] hover:text-[#a1a1aa]'
                                            }`}
                                        >
                                            {isActive ? (
                                                <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-white" />
                                            ) : null}
                                            <Icon
                                                className={`h-4 w-4 transition-colors ${
                                                    isActive
                                                        ? 'text-white'
                                                        : 'text-[#71717a] group-hover:text-[#a1a1aa]'
                                                }`}
                                            />
                                            <span className="truncate">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom: Active Project Summary Pill */}
            <div className="border-t border-[#27272a] p-3">
                <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-3">
                    <p className="truncate text-xs font-semibold text-white">
                        {activeProject?.name || 'No project'}
                    </p>
                    <p className="truncate font-mono text-[11px] text-[#71717a]">
                        {activeProject?.slug || activeProjectId || 'loading...'}
                    </p>
                </div>
            </div>
        </aside>
    );
}
