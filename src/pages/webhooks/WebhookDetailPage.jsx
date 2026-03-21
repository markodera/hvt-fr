import { useParams, useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
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

    const { data: deliveries, isLoading: dLoading } = useQuery({
        queryKey: ['webhookDeliveries', id, { page }],
        queryFn: () => getWebhookDeliveries(id, { page, page_size: 10 }),
        placeholderData: keepPreviousData,
    });

    if (isLoading) {
        return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    }

    if (!webhook) {
        return (
            <div className="text-center py-20">
                <p className="text-text-secondary">Webhook not found.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/webhooks')} className="mt-4">Back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate('/dashboard/webhooks')}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-text-primary font-mono">{webhook.url}</h2>
                        {webhook.description && <p className="text-sm text-text-secondary mt-1">{webhook.description}</p>}
                    </div>
                    <StatusBadge status={webhook.is_active ? 'active' : 'inactive'} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Events</p>
                        <div className="flex flex-wrap gap-1">{webhook.events?.map((e) => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}</div>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Success / Fail</p>
                        <p className="text-sm"><span className="text-success">{webhook.success_count}</span> / <span className="text-danger">{webhook.failure_count}</span></p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Created</p>
                        <p className="text-sm text-text-primary">{formatDate(webhook.created_at, { hour: undefined, minute: undefined })}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Secret</p>
                        <div className="flex items-center gap-1">
                            <code className="text-xs font-mono text-text-secondary">{webhook.secret?.slice(0, 12)}…</code>
                            <CopyButton value={webhook.secret} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <h3 className="text-base font-semibold text-text-primary">Delivery Log</h3>
                </div>
                <table className="w-full">
                    <thead className="bg-bg-tertiary">
                        <tr>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Event</th>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Status</th>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Response</th>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={4} />)}
                        {deliveries?.results?.length === 0 && (
                            <tr><td colSpan={4}><EmptyState icon={Webhook} title="No deliveries" description="Deliveries appear here when events trigger." /></td></tr>
                        )}
                        {deliveries?.results?.map((d) => (
                            <tr key={d.id} className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
                                <td className="px-4 py-3 text-sm text-text-primary">{d.event_type}</td>
                                <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                                <td className="px-4 py-3 text-sm text-text-secondary">{d.response_status_code ?? '—'}</td>
                                <td className="px-4 py-3 text-sm text-text-muted">{formatRelativeTime(d.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {deliveries && <Pagination count={deliveries.count} page={page} pageSize={10} onPageChange={(p) => setSearchParams({ page: p })} />}
            </div>
        </div>
    );
}
