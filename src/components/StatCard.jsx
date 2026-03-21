import { cn } from '@/lib/utils';

export function StatCard({ title, value, icon: Icon, description, trend, className }) {
    return (
        <div className={cn(
            'bg-bg-secondary border border-border rounded-xl p-6 hover:border-border-hover transition-colors',
            className
        )}>
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    {title}
                </p>
                {Icon && (
                    <div className="rounded-lg bg-primary-muted p-2">
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                )}
            </div>
            <p className="text-3xl font-extrabold text-text-primary">{value}</p>
            {(description || trend) && (
                <p className="mt-1 text-sm text-text-secondary">
                    {trend && (
                        <span className={cn(
                            'font-medium mr-1',
                            trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : ''
                        )}>
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                    )}
                    {description}
                </p>
            )}
        </div>
    );
}
