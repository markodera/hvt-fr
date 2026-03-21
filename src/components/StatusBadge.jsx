import { cn } from '@/lib/utils';

const variants = {
    active: {
        dot: 'bg-success',
        bg: 'bg-success-muted',
        text: 'text-success',
        label: 'Active',
    },
    inactive: {
        dot: 'bg-text-muted',
        bg: 'bg-bg-tertiary',
        text: 'text-text-muted',
        label: 'Inactive',
    },
    revoked: {
        dot: 'bg-danger',
        bg: 'bg-danger-muted',
        text: 'text-danger',
        label: 'Revoked',
    },
    delivered: {
        dot: 'bg-success',
        bg: 'bg-success-muted',
        text: 'text-success',
        label: 'Delivered',
    },
    failed: {
        dot: 'bg-danger',
        bg: 'bg-danger-muted',
        text: 'text-danger',
        label: 'Failed',
    },
    pending: {
        dot: 'bg-warning',
        bg: 'bg-warning-muted',
        text: 'text-warning',
        label: 'Pending',
    },
    retrying: {
        dot: 'bg-warning',
        bg: 'bg-warning-muted',
        text: 'text-warning',
        label: 'Retrying',
    },
};

export function StatusBadge({ status, label, className }) {
    const variant = variants[status] ?? variants.inactive;
    const displayLabel = label ?? variant.label;

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                variant.bg,
                variant.text,
                className
            )}
        >
            <span className={cn('w-1.5 h-1.5 rounded-full', variant.dot)} />
            {displayLabel}
        </span>
    );
}
