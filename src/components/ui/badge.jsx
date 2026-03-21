import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-primary-muted text-primary',
                success: 'bg-success-muted text-success',
                danger: 'bg-danger-muted text-danger',
                warning: 'bg-warning-muted text-warning',
                secondary: 'bg-bg-tertiary text-text-secondary',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export function Badge({ className, variant, ...props }) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}
