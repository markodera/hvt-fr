import { ShieldAlert } from 'lucide-react';

/**
 * Displays a friendly message when the user lacks permission to access a feature.
 * Used consistently across all restricted pages (API Keys, Users, Webhooks, Audit Logs, Settings).
 */
export function PermissionDenied({ featureName = 'This feature' }) {
    return (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#27272a] bg-[#111111] text-[#71717a]">
                <ShieldAlert className="h-6 w-6" />
            </div>
            <p className="max-w-md text-sm leading-6 text-[#71717a]">
                {featureName} is not available to your account. Contact your organization owner for access.
            </p>
        </div>
    );
}
