import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}) {
    return (
        <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
            {Icon && (
                <div className="mb-4 rounded-full bg-bg-tertiary p-4">
                    <Icon className="h-8 w-8 text-text-muted" />
                </div>
            )}
            <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-text-secondary max-w-sm mb-4">{description}</p>
            )}
            {actionLabel && onAction && (
                <Button onClick={onAction} size="sm">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
