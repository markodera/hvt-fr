import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Pagination({ count, page, pageSize = 10, onPageChange }) {
    const totalPages = Math.ceil(count / pageSize);

    if (totalPages <= 1) return null;

    const canPrev = page > 1;
    const canNext = page < totalPages;

    return (
        <div className="flex items-center justify-between px-4 py-3">
            <p className="text-sm text-text-secondary">
                Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, count)} of {count}
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={!canPrev}
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                        pageNum = i + 1;
                    } else if (page <= 3) {
                        pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                    } else {
                        pageNum = page - 2 + i;
                    }
                    return (
                        <Button
                            key={pageNum}
                            variant={pageNum === page ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                            className="w-8"
                        >
                            {pageNum}
                        </Button>
                    );
                })}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={!canNext}
                    aria-label="Next page"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
