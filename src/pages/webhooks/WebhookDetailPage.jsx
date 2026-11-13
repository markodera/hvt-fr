// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Webhook } from 'lucide-react';

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
import { WebhookDeliveryDrawer } from './WebhookDeliveryDrawer';

export function WebhookDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const [selectedDelivery, setSelectedDelivery] = useState(null);

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
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="break-all font-mono text-xl font-bold text-text-primary">
                                {webhook.url}
                            </h2>
                            <StatusBadge status={webhook.is_active ? 'active' : 'inactive'} />
                        </div>
                        <p className="mt-1 text-sm text-text-secondary">
                            Created {formatDate(webhook.created_at)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-border bg-bg-tertiary p-4">
                        <p className="text-xs uppercase tracking-wider text-text-muted">Secret</p>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="font-mono text-sm text-text-secondary">••••••••••••••••</span>
                            {webhook.secret && <CopyButton text={webhook.secret} />}
                        </div>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-tertiary p-4">
                        <p className="text-xs uppercase tracking-wider text-text-muted">Total Deliveries</p>
                        <p className="mt-1 font-mono text-lg font-bold text-text-primary">
                            {deliveries?.count ?? 0}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-bg-tertiary p-4 sm:col-span-2 lg:col-span-1">
                        <p className="text-xs uppercase tracking-wider text-text-muted">Subscribed Events</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {webhook.events?.map((evt) => (
                                <Badge key={evt} variant="secondary">
                                    {evt}
                                </Badge>
                            ))}
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
                        <div
                            key={delivery.id}
                            onClick={() => setSelectedDelivery(delivery)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    setSelectedDelivery(delivery);
                                }
                            }}
                            className="space-y-3 px-4 py-4 cursor-pointer hover:bg-bg-tertiary/40 transition-colors focus-visible:outline-none focus-visible:bg-bg-tertiary/60"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <p className="min-w-0 break-words font-mono text-xs font-medium text-text-primary">
                                    {delivery.event_type}
                                </p>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={delivery.status} />
                                    <ChevronRight className="h-4 w-4 text-text-muted" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 text-sm text-text-secondary sm:grid-cols-2">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-text-muted">Response</p>
                                    <p className="mt-1 font-mono text-sm text-text-primary">{delivery.response_status_code ?? '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-text-muted">Time</p>
                                    <p className="mt-1 text-xs">{formatRelativeTime(delivery.created_at)}</p>
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
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">Inspect</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveriesLoading &&
                                Array.from({ length: 5 }).map((_, index) => (
                                    <SkeletonRow key={index} columns={5} />
                                ))}
                            {deliveries?.results?.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>
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
                                    onClick={() => setSelectedDelivery(delivery)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            setSelectedDelivery(delivery);
                                        }
                                    }}
                                    className="border-b border-border transition-colors hover:bg-bg-tertiary/50 cursor-pointer focus-visible:outline-none focus-visible:bg-bg-tertiary/60"
                                >
                                    <td className="px-4 py-3 font-mono text-xs text-text-primary">{delivery.event_type}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={delivery.status} />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">
                                        {delivery.response_status_code ?? '-'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-text-muted">
                                        {formatRelativeTime(delivery.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="inline-flex items-center text-xs font-medium text-primary hover:underline">
                                            View <ChevronRight className="ml-1 h-3.5 w-3.5" />
                                        </span>
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

            <WebhookDeliveryDrawer
                delivery={selectedDelivery}
                open={Boolean(selectedDelivery)}
                onOpenChange={(open) => {
                    if (!open) setSelectedDelivery(null);
                }}
            />
        </div>
    );
}
