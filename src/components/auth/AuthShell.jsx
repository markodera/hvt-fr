import { Loader2 } from 'lucide-react';

import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

export const AUTH_INPUT_CLASS =
    'h-10 w-full rounded-lg border border-[#27272a] bg-[#0c0c0e] px-3 text-xs text-white outline-none transition-colors duration-150 placeholder:text-[#71717a] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500';

export const AUTH_PRIMARY_BUTTON_CLASS =
    'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#7c3aed] px-4 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition-colors duration-150 hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-60';

export const AUTH_GHOST_BUTTON_CLASS =
    'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#27272a] bg-[#18181b] px-4 text-xs font-medium text-zinc-200 transition-colors duration-150 hover:border-[#3f3f46] hover:bg-[#202025] hover:text-white disabled:cursor-not-allowed disabled:opacity-60';

export const AUTH_TEXT_LINK_CLASS =
    'text-xs text-[#a1a1aa] transition-colors duration-150 hover:text-white';

export function ButtonSpinner({ className = '' }) {
    return <Loader2 className={cn('h-4 w-4 animate-spin', className)} aria-hidden="true" />;
}

export function AuthPageShell({ children, topLeftLogo = false, topLeftHref = '/', contentClassName = '' }) {
    return (
        <div className="relative min-h-screen bg-[#09090b] px-4 py-8 text-white sm:px-6">
            {topLeftLogo ? (
                <div className="relative z-10 mx-auto flex max-w-7xl justify-start">
                    <Logo href={topLeftHref} className="mt-1" />
                </div>
            ) : null}

            <div
                className={cn(
                    'relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center',
                    contentClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}

export function AuthCard({ children, className = '' }) {
    return (
        <div
            className={cn(
                'w-full max-w-[480px] rounded-2xl border border-[#27272a] bg-[#121215] p-6 shadow-xl sm:p-8',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function AuthCardHeader({ title, subtitle, children }) {
    return (
        <div className="space-y-4 text-center">
            <Logo align="center" className="mx-auto" />
            {children}
            <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
                {subtitle ? <p className="text-xs text-[#a1a1aa] leading-relaxed">{subtitle}</p> : null}
            </div>
        </div>
    );
}

export function AuthDivider({ label = 'or continue with email' }) {
    return (
        <div className="flex items-center gap-3 text-xs text-[#71717a]">
            <div className="h-px flex-1 bg-[#27272a]" />
            <span className="text-[11px] uppercase tracking-wider">{label}</span>
            <div className="h-px flex-1 bg-[#27272a]" />
        </div>
    );
}

export function AuthStatusPill({ children }) {
    return (
        <div className="inline-flex items-center justify-center rounded-full border border-[#27272a] bg-[#18181b] px-3 py-1 text-xs font-medium text-[#e4e4e7]">
            {children}
        </div>
    );
}

export function AuthFieldError({ children }) {
    if (!children) return null;
    return <p className="text-xs text-rose-400 mt-1">{children}</p>;
}
