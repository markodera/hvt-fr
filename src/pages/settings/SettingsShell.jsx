import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Profile', path: '/dashboard/settings/profile' },
    { name: 'Security', path: '/dashboard/settings/security' },
    { name: 'Organisation', path: '/dashboard/settings/organisation' },
    { name: 'Projects', path: '/dashboard/settings/projects' },
    { name: 'Social Providers', path: '/dashboard/settings/social-providers' },
    { name: 'Members', path: '/dashboard/settings/members' },
];

export function SettingsShell() {
    return (
        <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)] w-full text-white bg-[#050508] border-t border-[#27272a] md:border-none">
            {/* Sub-nav */}
            <div className="md:w-[200px] flex-shrink-0 bg-[#111111] border-b md:border-b-0 md:border-r border-[#27272a] pt-4 md:min-h-full">
                <nav className="flex md:flex-col overflow-x-auto md:overflow-visible flex-nowrap hide-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center px-4 h-[40px] text-[14px] w-full whitespace-nowrap transition-colors duration-120',
                                    isActive
                                        ? 'text-white bg-[#18181b] border-b-[3px] md:border-b-0 md:border-l-[3px] border-[#7c3aed]'
                                        : 'text-[#71717a] hover:text-[#a1a1aa] hover:bg-[#18181b] border-b-[3px] md:border-b-0 md:border-l-[3px] border-transparent'
                                )
                            }
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            {/* Content area */}
            <div className="flex-1 p-6 md:p-10">
                <div className="max-w-[720px]">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}