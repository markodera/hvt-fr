import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Key, Copy, AlertTriangle } from 'lucide-react';
import { listApiKeys, createApiKey, revokeApiKey } from '@/api/apiKeys';
import { createKeySchema } from '@/lib/schemas';
import { SCOPES, ENVIRONMENTS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { CopyButton } from '@/components/CopyButton';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonRow';
import { Pagination } from '@/components/Pagination';
import { ResourcePageHeader } from '@/components/ResourcePageHeader';
import { formatDate, getErrorMessage } from '@/lib/utils';

export function ApiKeysPage() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const [createOpen, setCreateOpen] = useState(false);
    const [revealedKey, setRevealedKey] = useState(null);
    const [revokeTarget, setRevokeTarget] = useState(null);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['apiKeys', { page }],
        queryFn: () => listApiKeys({ page, page_size: 10 }),
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
        resolver: zodResolver(createKeySchema),
        defaultValues: {
            name: '',
            environment: 'test',
            scopes: [],
            expires_at: null,
        },
    });

    const selectedScopes = watch('scopes') || [];

    const createMutation = useMutation({
        mutationFn: createApiKey,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            setCreateOpen(false);
            reset();
            setRevealedKey(data.key);
            toast.success('API key created');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const revokeMutation = useMutation({
        mutationFn: revokeApiKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            setRevokeTarget(null);
            toast.success('Key revoked');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    const handleScopeToggle = (scope) => {
        const current = selectedScopes;
        if (current.includes(scope)) {
            setValue('scopes', current.filter((s) => s !== scope));
        } else {
            setValue('scopes', [...current, scope]);
        }
    };

    return (
        <div className="space-y-6">
            <ResourcePageHeader
                title="API Keys"
                description="Manage your API keys for programmatic access."
                action={(
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create key
                    </Button>
                )}
            />

            {/* Table */}
            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary">
                            <tr>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Name</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Key prefix</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Environment</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Status</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Created</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading && Array.from({ length: 3 }).map((_, i) => (
                                <SkeletonRow key={i} columns={6} />
                            ))}
                            {isError && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary">Failed to load API keys.</td>
                                </tr>
                            )}
                            {data?.results?.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            icon={Key}
                                            title="No API keys"
                                            description="Create your first API key to get started."
                                            actionLabel="Create key"
                                            onAction={() => setCreateOpen(true)}
                                        />
                                    </td>
                                </tr>
                            )}
                            {data?.results?.map((key) => (
                                <tr key={key.id} className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{key.name}</td>
                                    <td className="px-4 py-3 font-mono text-sm text-text-secondary">{key.prefix}…</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={key.environment === 'live' ? 'warning' : 'secondary'}>
                                            {key.environment_display || key.environment}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={key.is_active ? 'active' : 'revoked'} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-muted">{formatDate(key.created_at, { hour: undefined, minute: undefined })}</td>
                                    <td className="px-4 py-3 text-right">
                                        {key.is_active && (
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => setRevokeTarget(key)}
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {data && (
                    <Pagination count={data.count} page={page} pageSize={10} onPageChange={(p) => setSearchParams({ page: p })} />
                )}
            </div>

            {/* Create key modal */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>Generate a new API key for programmatic access.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="key-name">Name</Label>
                            <Input id="key-name" placeholder="e.g. Production backend" {...register('name')} />
                            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label>Environment</Label>
                            <div className="flex gap-2">
                                {ENVIRONMENTS.map((env) => (
                                    <Button
                                        key={env.value}
                                        type="button"
                                        variant={watch('environment') === env.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setValue('environment', env.value)}
                                    >
                                        {env.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Scopes</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {SCOPES.map((scope) => (
                                    <button
                                        key={scope.value}
                                        type="button"
                                        onClick={() => handleScopeToggle(scope.value)}
                                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left ${selectedScopes.includes(scope.value)
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border text-text-secondary hover:border-border-hover'
                                            }`}
                                    >
                                        {scope.label}
                                    </button>
                                ))}
                            </div>
                            {errors.scopes && <p className="text-xs text-danger">{errors.scopes.message}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting || createMutation.isPending}>
                                {createMutation.isPending ? 'Creating…' : 'Create key'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* One-time key reveal modal */}
            <Dialog open={!!revealedKey} onOpenChange={() => setRevealedKey(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>API Key Created</DialogTitle>
                        <DialogDescription className="flex items-start gap-2 mt-2">
                            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                            <span>Copy this key now — it won't be shown again.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-bg-tertiary rounded-lg flex items-center gap-2">
                        <code className="text-sm font-mono text-text-primary flex-1 break-all">{revealedKey}</code>
                        <CopyButton value={revealedKey} />
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setRevealedKey(null)}>Done</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke confirm */}
            <ConfirmDialog
                open={!!revokeTarget}
                onOpenChange={() => setRevokeTarget(null)}
                title="Revoke API key"
                description={`Are you sure you want to revoke "${revokeTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Revoke"
                onConfirm={() => revokeMutation.mutate(revokeTarget.id)}
                isLoading={revokeMutation.isPending}
            />
        </div>
    );
}
