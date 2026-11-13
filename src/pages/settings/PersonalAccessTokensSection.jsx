// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Check, Key, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { listPATs, revokePAT } from '@/api/pats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatDate, formatRelativeTime, getErrorMessage } from '@/lib/utils';
import { CreatePATModal } from './CreatePATModal';

export function PersonalAccessTokensSection() {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [revokingToken, setRevokingToken] = useState(null);

    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['pats'],
        queryFn: listPATs,
    });

    const revokeMutation = useMutation({
        mutationFn: revokePAT,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pats'] });
            toast.success('Personal access token revoked');
            setRevokingToken(null);
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to revoke token'));
        },
    });

    const tokens = Array.isArray(data) ? data : data?.results || [];

    return (
        <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-text-primary">
                            Personal Access Tokens
                        </h3>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                        Personal credentials for authenticating the HVT CLI, SDKs, and automated deployment pipelines.
                    </p>
                </div>
                <Button
                    onClick={() => setCreateModalOpen(true)}
                    size="sm"
                    className="shrink-0"
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Generate Token
                </Button>
            </div>

            <div className="mt-6">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoadingSpinner size="md" />
                    </div>
                ) : isError ? (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                        Could not load personal access tokens.
                    </div>
                ) : tokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-bg-tertiary text-text-muted">
                            <Key className="h-6 w-6" />
                        </div>
                        <h4 className="mt-3 text-sm font-semibold text-text-primary">
                            No personal access tokens
                        </h4>
                        <p className="mt-1 max-w-sm text-xs text-text-muted">
                            Generate a token to authenticate the <code className="font-mono text-zinc-300">hvt</code> CLI from your terminal or CI environment.
                        </p>
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="mt-4"
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Generate Token
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-border bg-bg-tertiary">
                        <div className="divide-y divide-border md:hidden">
                            {tokens.map((token) => (
                                <div key={token.id} className="space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-text-primary">{token.name}</p>
                                            <p className="font-mono text-xs text-text-muted">{token.prefix}••••</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setRevokingToken(token)}
                                            className="h-8 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {token.scopes?.map((scope) => (
                                            <Badge key={scope} variant="secondary" className="font-mono text-[10px]">
                                                {scope}
                                            </Badge>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-text-muted">
                                        <div>Created: {formatDate(token.created_at)}</div>
                                        <div>
                                            {token.expires_at ? `Expires: ${formatDate(token.expires_at)}` : 'Never expires'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-border bg-bg-secondary text-xs uppercase tracking-wider text-text-muted">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Name & Prefix</th>
                                        <th className="px-4 py-3 font-semibold">Scopes</th>
                                        <th className="px-4 py-3 font-semibold">Created</th>
                                        <th className="px-4 py-3 font-semibold">Expires</th>
                                        <th className="px-4 py-3 font-semibold">Last Used</th>
                                        <th className="px-4 py-3 font-semibold text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {tokens.map((token) => (
                                        <tr key={token.id} className="transition-colors hover:bg-bg-secondary/40">
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-text-primary">{token.name}</p>
                                                <p className="font-mono text-xs text-text-muted">{token.prefix}••••</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex max-w-[240px] flex-wrap gap-1">
                                                    {token.scopes?.slice(0, 3).map((scope) => (
                                                        <Badge key={scope} variant="secondary" className="font-mono text-[10px]">
                                                            {scope}
                                                        </Badge>
                                                    ))}
                                                    {token.scopes?.length > 3 && (
                                                        <Badge variant="outline" className="text-[10px]">
                                                            +{token.scopes.length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-secondary">
                                                {formatDate(token.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-secondary">
                                                {token.expires_at ? formatDate(token.expires_at) : 'Never'}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-text-muted">
                                                {token.last_used_at ? formatRelativeTime(token.last_used_at) : 'Never'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setRevokingToken(token)}
                                                    className="h-8 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                                >
                                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                                    Revoke
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <CreatePATModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
            />

            <ConfirmDialog
                open={Boolean(revokingToken)}
                onOpenChange={(open) => {
                    if (!open) setRevokingToken(null);
                }}
                title="Revoke Personal Access Token"
                description={`Are you sure you want to revoke "${revokingToken?.name}"? Any CLI sessions or automations using this token will immediately stop working.`}
                confirmText="Revoke Token"
                confirmVariant="destructive"
                isPending={revokeMutation.isPending}
                onConfirm={() => {
                    if (revokingToken) {
                        revokeMutation.mutate(revokingToken.id);
                    }
                }}
            />
        </div>
    );
}
