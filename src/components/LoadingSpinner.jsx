import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-10 w-10',
};

export function LoadingSpinner({ size = 'md', className }) {
    return (
        <Loader2
            className={cn('animate-spin text-primary', sizes[size], className)}
            role="status"
            aria-label="Loading"
        />
    );
}
