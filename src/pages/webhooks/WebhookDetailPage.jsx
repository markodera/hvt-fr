import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Webhook } from 'lucide-react';

import { getWebhook, getWebhookDeliveries } from '@/api/webhooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { CopyButton } from '@/components/CopyButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SkeletonRow } from '@/components/SkeletonRow';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export function WebhookDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;

    const { data: webhook, isLoading } = useQuery({
        queryKey: ['webhook', id],
        queryFn: () => getWebhook(id),
    });

    const { data: deliveries, isLoading: deliveriesLoading } = useQuery({
        queryKey: ['webhookDeliveries', id, { page }],
        queryFn: () => getWebhookDeliveries(id, { page, page_size: 10 }),
        placeholderData: keepPreviousData,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!webhook) {
        return (
            <div className="py-20 text-center">
                <p className="text-text-secondary">Webhook not found.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/webhooks')} className="mt-4">
                    Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard/webhooks')}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>

            <div className="rounded-xl border border-border bg-bg-secondary p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="break-all font-mono text-lg font-bold text-text-primary">{webhook.url}</h2>
                        {webhook.description ? (
                            <p className="mt-1 text-sm text-text-secondary">{webhook.description}</p>
                        ) : null}
                    </div>
                    <StatusBadge status={webhook.is_active ? 'active' : 'inactive'} />
                </div>

                <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Events</p>
                        <div className="flex flex-wrap gap-1">
                            {webhook.events?.map((eventType) => (
                                <Badge key={eventType} variant="secondary" className="text-xs">
                                    {eventType}
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Success / Fail</p>
                        <p className="text-sm">
                            <span className="text-success">{webhook.success_count}</span> /{' '}
                            <span className="text-danger">{webhook.failure_count}</span>
                        </p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Created</p>
                        <p className="text-sm text-text-primary">
                            {formatDate(webhook.created_at, { hour: undefined, minute: undefined })}
                        </p>
                    </div>
                    <div>
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text-secondary">Secret</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <code className="break-all text-xs font-mono text-text-secondary">
                                {webhook.secret?.slice(0, 12)}...
                            </code>
                            <CopyButton value={webhook.secret} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-bg-secondary">
                <div className="border-b border-border px-6 py-4">
                    <h3 className="text-base font-semibold text-text-primary">Delivery Log</h3>
                </div>

                <div className="divide-y divide-border md:hidden">
                    {deliveriesLoading &&
                        Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="px-4 py-4">
                                <div className="h-20 animate-pulse rounded-xl bg-bg-tertiary" />
                            </div>
                        ))}

                    {!deliveriesLoading && deliveries?.results?.length === 0 ? (
                        <EmptyState icon={Webhook} title="No deliveries" description="Deliveries appear here when events trigger." />
                    ) : null}

                    {deliveries?.results?.map((delivery) => (
                        <div key={delivery.id} className="space-y-3 px-4 py-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <p className="min-w-0 break-words text-sm font-medium text-text-primary">
                                    {delivery.event_type}
                                </p>
                                <StatusBadge status={delivery.status} />
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-sm text-text-secondary sm:grid-cols-2">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-text-muted">Response</p>
                                    <p className="mt-1 text-text-primary">{delivery.response_status_code ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-text-muted">Time</p>
                                    <p className="mt-1">{formatRelativeTime(delivery.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[640px]">
                        <thead className="bg-bg-tertiary">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Event</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Response</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveriesLoading &&
                                Array.from({ length: 5 }).map((_, index) => (
                                    <SkeletonRow key={index} columns={4} />
                                ))}
                            {deliveries?.results?.length === 0 ? (
                                <tr>
                                    <td colSpan={4}>
                                        <EmptyState
                                            icon={Webhook}
                                            title="No deliveries"
                                            description="Deliveries appear here when events trigger."
                                        />
                                    </td>
                                </tr>
                            ) : null}
                            {deliveries?.results?.map((delivery) => (
                                <tr
                                    key={delivery.id}
                                    className="border-b border-border transition-colors hover:bg-bg-tertiary/50"
                                >
                                    <td className="px-4 py-3 text-sm text-text-primary">{delivery.event_type}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={delivery.status} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">
                                        {delivery.response_status_code ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-muted">
                                        {formatRelativeTime(delivery.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {deliveries ? (
                    <Pagination
                        count={deliveries.count}
                        page={page}
                        pageSize={10}
                        onPageChange={(nextPage) => setSearchParams({ page: nextPage })}
                    />
                ) : null}
            </div>
        </div>
    );
}
