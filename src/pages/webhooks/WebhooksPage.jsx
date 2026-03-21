import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Webhook, ExternalLink } from 'lucide-react';
import { listWebhooks, createWebhook, deleteWebhook } from '@/api/webhooks';
import { createWebhookSchema } from '@/lib/schemas';
import { EVENT_TYPES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonRow';
import { Pagination } from '@/components/Pagination';
import { ResourcePageHeader } from '@/components/ResourcePageHeader';
import { formatDate, getErrorMessage, truncate } from '@/lib/utils';

export function WebhooksPage() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['webhooks', { page }],
        queryFn: () => listWebhooks({ page, page_size: 10 }),
        placeholderData: keepPreviousData,
    });

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createWebhookSchema),
        defaultValues: { url: '', events: [], description: '' },
    });

    const selectedEvents = watch('events') || [];

    const createMutation = useMutation({
        mutationFn: createWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setCreateOpen(false);
            reset();
            toast.success('Webhook created');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setDeleteTarget(null);
            toast.success('Webhook deleted');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const toggleEvent = (event) => {
        const current = selectedEvents;
        if (current.includes(event)) {
            setValue('events', current.filter((e) => e !== event));
        } else {
            setValue('events', [...current, event]);
        }
    };

    return (
        <div className="space-y-6">
            <ResourcePageHeader
                title="Webhooks"
                description="Manage webhook endpoints for real-time event notifications."
                action={(
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create webhook
                    </Button>
                )}
            />

            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary">
                            <tr>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">URL</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Events</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Status</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Success / Fail</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} columns={5} />)}
                            {isError && (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-text-secondary">Failed to load webhooks.</td></tr>
                            )}
                            {data?.results?.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <EmptyState icon={Webhook} title="No webhooks" description="Create a webhook to receive event notifications." actionLabel="Create webhook" onAction={() => setCreateOpen(true)} />
                                    </td>
                                </tr>
                            )}
                            {data?.results?.map((wh) => (
                                <tr key={wh.id} className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link to={`/dashboard/webhooks/${wh.id}`} className="text-sm font-mono text-primary hover:underline flex items-center gap-1">
                                            {truncate(wh.url, 40)}
                                            <ExternalLink className="h-3 w-3" />
                                        </Link>
                                        {wh.description && <p className="text-xs text-text-muted mt-0.5">{truncate(wh.description, 50)}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{wh.events?.length} events</td>
                                    <td className="px-4 py-3"><StatusBadge status={wh.is_active ? 'active' : 'inactive'} /></td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className="text-success">{wh.success_count}</span>
                                        <span className="text-text-muted"> / </span>
                                        <span className="text-danger">{wh.failure_count}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(wh)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {data && <Pagination count={data.count} page={page} pageSize={10} onPageChange={(p) => setSearchParams({ page: p })} />}
            </div>

            {/* Create modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Webhook</DialogTitle>
                        <DialogDescription>Add a webhook endpoint to receive event notifications.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="wh-url">Endpoint URL</Label>
                            <Input id="wh-url" placeholder="https://example.com/webhook" {...register('url')} />
                            {errors.url && <p className="text-xs text-danger">{errors.url.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wh-desc">Description (optional)</Label>
                            <Input id="wh-desc" placeholder="e.g. Slack notifications" {...register('description')} />
                        </div>
                        <div className="space-y-2">
                            <Label>Events</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                                {EVENT_TYPES.map((evt) => (
                                    <button key={evt.value} type="button" onClick={() => toggleEvent(evt.value)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${selectedEvents.includes(evt.value) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-secondary hover:border-border-hover'
                                            }`}
                                    >
                                        {evt.label}
                                    </button>
                                ))}
                            </div>
                            {errors.events && <p className="text-xs text-danger">{errors.events.message}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? 'Creating…' : 'Create webhook'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} title="Delete webhook" description={`Delete webhook for "${deleteTarget?.url}"? This action cannot be undone.`} confirmLabel="Delete" onConfirm={() => deleteMutation.mutate(deleteTarget.id)} isLoading={deleteMutation.isPending} />
        </div>
    );
}
