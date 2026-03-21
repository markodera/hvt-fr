import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonRow({ columns = 4 }) {
    return (
        <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                </td>
            ))}
        </tr>
    );
}
