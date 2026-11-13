// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Copy, Key, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { createPAT } from '@/api/pats';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/CopyButton';
import { getErrorMessage } from '@/lib/utils';

const AVAILABLE_SCOPES = [
    { id: 'auth:read', label: 'auth:read', description: 'Read user authentication settings and sessions' },
    { id: 'auth:write', label: 'auth:write', description: 'Modify auth settings and revoke sessions' },
    { id: 'projects:read', label: 'projects:read', description: 'Read projects and environment configs' },
    { id: 'projects:write', label: 'projects:write', description: 'Modify projects and settings' },
    { id: 'schema:sync', label: 'schema:sync', description: 'Execute CLI declarative schema synchronization' },
    { id: 'users:read', label: 'users:read', description: 'View organization and project members' },
    { id: 'users:write', label: 'users:write', description: 'Invite, update, or remove users' },
    { id: 'audit:read', label: 'audit:read', description: 'Inspect audit trail logs' },
];

const EXPIRATION_OPTIONS = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
    { label: '1 year', days: 365 },
    { label: 'Never expires', days: null },
];

export function CreatePATModal({ open, onOpenChange, onSuccess }) {
    const [name, setName] = useState('');
    const [selectedScopes, setSelectedScopes] = useState(['projects:read', 'schema:sync']);
    const [expirationDays, setExpirationDays] = useState(30);
    const [createdToken, setCreatedToken] = useState(null);

    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: createPAT,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['pats'] });
            setCreatedToken(data.token);
            toast.success('Personal access token generated');
            if (onSuccess) {
                onSuccess();
            }
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to create token'));
        },
    });

    function toggleScope(scopeId) {
        setSelectedScopes((prev) =>
            prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
        );
    }

    function handleReset() {
        setName('');
        setSelectedScopes(['projects:read', 'schema:sync']);
        setExpirationDays(30);
        setCreatedToken(null);
        onOpenChange(false);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Token name is required');
            return;
        }
        if (selectedScopes.length === 0) {
            toast.error('Select at least one scope');
            return;
        }

        let expires_at = null;
        if (expirationDays) {
            const date = new Date();
            date.setDate(date.getDate() + expirationDays);
            expires_at = date.toISOString();
        }

        createMutation.mutate({
            name: name.trim(),
            scopes: selectedScopes,
            expires_at,
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) {
                    handleReset();
                } else {
                    onOpenChange(true);
                }
            }}
        >
            <DialogContent className="max-w-xl">
                {createdToken ? (
                    <div className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-emerald-400">
                                <Key className="h-5 w-5" />
                                Personal Access Token Created
                            </DialogTitle>
                            <DialogDescription>
                                Copy this token now. It will not be shown again and cannot be retrieved.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                            <div className="flex items-center gap-2 font-semibold">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>Security Notice</span>
                            </div>
                            <p className="mt-1">
                                Treat this token like a password. It provides direct API access to HVT resources matching the configured scopes.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-text-secondary">Token Value</Label>
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-[#0d0d10] p-3 font-mono text-xs text-emerald-300 break-all select-all">
                                <span className="flex-1">{createdToken}</span>
                                <CopyButton text={createdToken} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleReset} className="w-full sm:w-auto">
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <DialogHeader>
                            <DialogTitle>Create Personal Access Token</DialogTitle>
                            <DialogDescription>
                                Generate a personal token for authenticating CLI workflows and external automation scripts.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Label htmlFor="pat-name">Token Name</Label>
                            <Input
                                id="pat-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. MacBook CLI, GitHub Actions Sync"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pat-expiration">Expiration</Label>
                            <select
                                id="pat-expiration"
                                value={expirationDays === null ? 'never' : expirationDays}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setExpirationDays(val === 'never' ? null : Number(val));
                                }}
                                className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                                {EXPIRATION_OPTIONS.map((opt) => (
                                    <option key={opt.label} value={opt.days === null ? 'never' : opt.days}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Scopes & Permissions</Label>
                            <div className="max-h-52 overflow-y-auto rounded-xl border border-border bg-bg-tertiary divide-y divide-border p-1">
                                {AVAILABLE_SCOPES.map((scope) => {
                                    const checked = selectedScopes.includes(scope.id);
                                    return (
                                        <label
                                            key={scope.id}
                                            className="flex items-start gap-3 p-2.5 cursor-pointer hover:bg-bg-secondary/60 rounded-lg transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleScope(scope.id)}
                                                className="mt-0.5 rounded border-border bg-bg-primary text-primary focus:ring-primary"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-mono text-xs font-semibold text-text-primary">
                                                    {scope.label}
                                                </p>
                                                <p className="text-[11px] text-text-muted">
                                                    {scope.description}
                                                </p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleReset}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Generate Token
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
