import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserDisplayName, getUserInitials } from '@/lib/userIdentity';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/dashboard/create-organization': 'Create Organisation',
    '/dashboard/users': 'Users',
    '/dashboard/api-keys': 'API Keys',
    '/dashboard/webhooks': 'Webhooks',
    '/dashboard/audit-logs': 'Audit Logs',
    '/dashboard/settings': 'Settings',
};

export function Header() {
    const location = useLocation();
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();

    // Derive page title from path
    const title =
        pageTitles[location.pathname] ||
        Object.entries(pageTitles).find(([path]) =>
            location.pathname.startsWith(path) && path !== '/dashboard'
        )?.[1] ||
        'Dashboard';

    return (
        <header className="h-16 border-b border-border bg-bg-primary/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-30">
            <h1 className="text-2xl font-extrabold text-text-primary">{title}</h1>

            <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>

                {/* User dropdown */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="gap-2">
                                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                                    {getUserInitials(user)}
                                </div>
                                <span className="text-sm text-text-primary hidden sm:inline">
                                    {getUserDisplayName(user)}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div>
                                    <p className="text-sm font-medium text-text-primary">{getUserDisplayName(user)}</p>
                                    <p className="text-xs text-text-muted">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout} className="text-danger focus:text-danger">
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
