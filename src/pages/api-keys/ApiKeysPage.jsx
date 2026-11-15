import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Check,
    Copy,
    KeyRound,
    Plus,
    Shield,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { createApiKey, listApiKeys, revokeApiKey } from '@/api/apiKeys';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useProject } from '@/hooks/useProject';
import { formatDate, getErrorMessage } from '@/lib/utils';

const RUNTIME_SCOPES = [
    {
        id: 'auth:runtime',
        label: 'auth:runtime',
        desc: 'Authenticate runtime users, exchange tokens, and manage sessions.',
    },
    {
        id: 'organization:read',
        label: 'organization:read',
        desc: 'Read organization public profile.',
    },
    {
        id: 'users:read',
        label: 'users:read',
        desc: 'Read end-user profile details.',
    },
];

const MANAGEMENT_SCOPES = [
    {
        id: 'schema:sync',
        label: 'schema:sync',
        desc: 'Sync roles, permissions, and provider manifests via HVT CLI.',
    },
    {
        id: 'roles:read',
        label: 'roles:read',
        desc: 'Inspect existing role definitions.',
    },
    {
        id: 'roles:write',
        label: 'roles:write',
        desc: 'Create, update, and delete custom project roles.',
    },
    {
        id: 'permissions:read',
        label: 'permissions:read',
        desc: 'Inspect granted and available permission namespaces.',
    },
    {
        id: 'permissions:write',
        label: 'permissions:write',
        desc: 'Assign and revoke permission assignments.',
    },
    {
        id: 'providers:read',
        label: 'providers:read',
        desc: 'Inspect configured OAuth and IdP providers.',
    },
    {
        id: 'providers:write',
        label: 'providers:write',
        desc: 'Configure and rotate OAuth provider secrets.',
    },
    {
        id: 'webhooks:read',
        label: 'webhooks:read',
        desc: 'Read webhook configurations and delivery logs.',
    },
    {
        id: 'audit_logs:read',
        label: 'audit_logs:read',
        desc: 'Read audit log activity stream.',
    },
];

function getApiKeyStatus(apiKey) {
    if (!apiKey?.is_active) {
        return 'revoked';
    }
    if (apiKey?.expires_at && new Date(apiKey.expires_at).getTime() <= Date.now()) {
        return 'expired';
    }
    return 'active';
}

function StatusBadge({ status }) {
    if (status === 'revoked') {
        return (
            <span className="inline-flex items-center rounded-md border border-[#27272a] bg-[#111111] px-2 py-0.5 text-xs font-medium text-[#71717a]">
                Revoked
            </span>
        );
    }
    if (status === 'expired') {
        return (
            <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                Expired
            </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Active
        </span>
    );
}

export default function ApiKeysPage() {
    usePageTitle('API Keys');
    const { projects, activeProjectId, environment } = useProject();
    const queryClient = useQueryClient();

    // Tab state: 'runtime' or 'management'
    const [activeTab, setActiveTab] = useState('runtime');
    const [createOpen, setCreateOpen] = useState(false);
    const [revokeTarget, setRevokeTarget] = useState(null);
    const [createdKeyData, setCreatedKeyData] = useState(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedEnv, setCopiedEnv] = useState(false);

    // Form state
    const [keyType, setKeyType] = useState('runtime');
    const [keyName, setKeyName] = useState('');
    const [keyEnvironment, setKeyEnvironment] = useState(environment);
    const [keyProjectId, setKeyProjectId] = useState(activeProjectId);
    const [keyExpiresAt, setKeyExpiresAt] = useState('');
    const [selectedScopes, setSelectedScopes] = useState(['auth:runtime']);

    // Keep form environment and project in sync with global header selections
    useEffect(() => {
        setKeyEnvironment(environment);
    }, [environment]);

    useEffect(() => {
        if (activeProjectId) {
            setKeyProjectId(activeProjectId);
        }
    }, [activeProjectId]);

    // Query API keys filtered by project and environment
    const apiKeysQuery = useQuery({
        queryKey: ['api-keys', { project_id: activeProjectId, environment }],
        queryFn: () =>
            listApiKeys({
                project_id: activeProjectId,
                environment,
                page_size: 100,
            }),
        enabled: Boolean(activeProjectId),
    });

    const keysList = useMemo(() => {
        const raw = apiKeysQuery.data?.results ?? apiKeysQuery.data ?? [];
        return Array.isArray(raw) ? raw : [];
    }, [apiKeysQuery.data]);

    // Partition keys by key_type plane: 'runtime' vs 'management'
    const filteredKeys = useMemo(() => {
        return keysList.filter((k) => {
            const isMgmt = k.key_type === 'management';
            if (activeTab === 'management') {
                return isMgmt;
            }
            return !isMgmt;
        });
    }, [keysList, activeTab]);

    const handleKeyTypeChange = (nextType) => {
        setKeyType(nextType);
        if (nextType === 'runtime') {
            setSelectedScopes(['auth:runtime']);
        } else {
            // Default management scopes: schema sync + reading definitions
            setSelectedScopes(['schema:sync', 'roles:read', 'permissions:read']);
        }
    };

    const toggleScope = (scopeId) => {
        if (selectedScopes.includes(scopeId)) {
            // Don't allow deselecting auth:runtime for runtime keys
            if (keyType === 'runtime' && scopeId === 'auth:runtime') {
                toast.info('Runtime keys require auth:runtime scope to function.');
                return;
            }
            setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
        } else {
            setSelectedScopes([...selectedScopes, scopeId]);
        }
    };

    const createMutation = useMutation({
        mutationFn: (data) => createApiKey(data),
        onSuccess: (newKey) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setCreatedKeyData(newKey);
            toast.success('API key generated successfully');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err) || 'Failed to create API key');
        },
    });

    const revokeMutation = useMutation({
        mutationFn: (id) => revokeApiKey(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] });
            setRevokeTarget(null);
            toast.success('API key revoked');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err) || 'Failed to revoke API key');
        },
    });

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!keyProjectId) {
            toast.error('Select a project for this key');
            return;
        }
        if (!keyName.trim()) {
            toast.error('Enter a key name');
            return;
        }

        // Defensive scope enforcement
        let scopesToSubmit = [...selectedScopes];
        if (keyType === 'runtime' && !scopesToSubmit.includes('auth:runtime')) {
            scopesToSubmit.push('auth:runtime');
        }
        if (keyType === 'management') {
            // Management keys should NEVER contain auth:runtime
            scopesToSubmit = scopesToSubmit.filter((s) => s !== 'auth:runtime');
            if (!scopesToSubmit.length) {
                scopesToSubmit = ['schema:sync'];
            }
        }

        createMutation.mutate({
            name: keyName.trim(),
            project: keyProjectId,
            environment: keyEnvironment,
            key_type: keyType,
            scopes: scopesToSubmit,
            expires_at: keyExpiresAt ? new Date(keyExpiresAt).toISOString() : null,
        });
    };

    const handleCopyRawKey = async () => {
        if (!createdKeyData?.key) return;
        try {
            await navigator.clipboard.writeText(createdKeyData.key);
            setCopiedKey(true);
            toast.success('Secret key copied to clipboard');
            setTimeout(() => setCopiedKey(false), 2000);
        } catch {
            toast.error('Failed to copy key');
        }
    };

    const handleCopyEnvBlock = async () => {
        if (!createdKeyData?.key) return;
        const envBlock = [
            `HVT_BASE_URL=${apiBaseUrl}`,
            `HVT_PROJECT_ID=${activeProjectId}`,
            `HVT_API_KEY=${createdKeyData.key}`,
        ].join('\n');

        try {
            await navigator.clipboard.writeText(envBlock);
            setCopiedEnv(true);
            toast.success('Environment variables copied to clipboard');
            setTimeout(() => setCopiedEnv(false), 2000);
        } catch {
            toast.error('Failed to copy environment block');
        }
    };

    const handleCloseCreateModal = () => {
        setCreateOpen(false);
        setCreatedKeyData(null);
        setKeyName('');
        setKeyExpiresAt('');
        setKeyType('runtime');
        setSelectedScopes(['auth:runtime']);
    };

    const apiBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';

    return (
        <div className="space-y-6">
            {/* Top: Integration Triad Card (Neutral Zinc styling) */}
            <div className="rounded-2xl border border-[#27272a] bg-[#18181b] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Developer Integration Triad</h2>
                        <p className="mt-1 text-xs text-[#a1a1aa]">
                            Configure your backend service, mobile app, or HVT CLI using these connection variables.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(apiBaseUrl);
                                toast.success('Base URL copied');
                            }}
                            className="inline-flex w-full sm:w-80 h-8 items-center justify-between rounded-lg border border-[#27272a] bg-[#111111] px-3 font-mono text-xs text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <span className="text-[#71717a] font-semibold">BASE:</span>
                                <span className="truncate text-zinc-300">{apiBaseUrl}</span>
                            </div>
                            <Copy className="h-3.5 w-3.5 shrink-0 text-[#71717a]" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (activeProjectId) {
                                    navigator.clipboard.writeText(activeProjectId);
                                    toast.success('Project ID copied');
                                }
                            }}
                            className="inline-flex w-full sm:w-80 h-8 items-center justify-between rounded-lg border border-[#27272a] bg-[#111111] px-3 font-mono text-xs text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <span className="text-[#71717a] font-semibold">PROJECT_ID:</span>
                                <span className="truncate text-zinc-300">
                                    {activeProjectId ? `${activeProjectId.slice(0, 14)}...` : 'None'}
                                </span>
                            </div>
                            <Copy className="h-3.5 w-3.5 shrink-0 text-[#71717a]" />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard.writeText(environment || 'test');
                                toast.success('Environment mode copied');
                            }}
                            className="inline-flex w-full sm:w-80 h-8 items-center justify-between rounded-lg border border-[#27272a] bg-[#111111] px-3 font-mono text-xs text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white"
                        >
                            <div className="flex items-center gap-2 truncate">
                                <span className="text-[#71717a] font-semibold">ENV:</span>
                                <span className="truncate text-zinc-300">{environment === 'live' ? 'live (production)' : 'test (sandbox)'}</span>
                            </div>
                            <Copy className="h-3.5 w-3.5 shrink-0 text-[#71717a]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Dual-Plane Segmented Tabs & Action Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-xl border border-[#27272a] bg-[#111111] p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('runtime')}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'runtime'
                                ? 'bg-[#18181b] text-white shadow-sm border border-[#27272a]'
                                : 'text-[#71717a] hover:text-[#a1a1aa]'
                        }`}
                    >
                        <KeyRound className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Runtime Client Keys</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('management')}
                        className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                            activeTab === 'management'
                                ? 'bg-[#18181b] text-white shadow-sm border border-[#27272a]'
                                : 'text-[#71717a] hover:text-[#a1a1aa]'
                        }`}
                    >
                        <Shield className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Management / CI Keys</span>
                    </button>
                </div>

                <Button
                    type="button"
                    onClick={() => {
                        handleKeyTypeChange(activeTab);
                        setCreateOpen(true);
                    }}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#7c3aed] px-4 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9]"
                >
                    <Plus className="h-4 w-4" />
                    <span>Create new API key</span>
                </Button>
            </div>

            {/* Security Notice for Management Keys */}
            {activeTab === 'management' ? (
                <div className="flex items-start gap-3 rounded-xl border border-[#27272a] bg-[#111111] p-4 text-xs text-zinc-300">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    <div>
                        <p className="font-semibold text-white">Elevated Management Privilege Scope</p>
                        <p className="mt-0.5 text-zinc-400 leading-relaxed">
                            Management keys (`hvt_mgmt_...`) carry schema-sync and administrative provisioning rights.
                            They bypass end-user runtime permissions and must strictly be held in CI/CD secrets or backend servers.
                            Never expose management keys in frontend web or mobile client code.
                        </p>
                    </div>
                </div>
            ) : null}

            {/* Keys Data Table (Clean Neutral Zinc Cards) */}
            <div className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#18181b]">
                {apiKeysQuery.isLoading ? (
                    <div className="p-8 text-center text-sm text-[#71717a]">Loading API keys...</div>
                ) : filteredKeys.length === 0 ? (
                    <EmptyState
                        title={`No ${activeTab === 'runtime' ? 'Runtime' : 'Management'} Keys`}
                        description={`No ${activeTab} keys issued for this project in ${environment} mode.`}
                        actionLabel="Create new API key"
                        onAction={() => {
                            handleKeyTypeChange(activeTab);
                            setCreateOpen(true);
                        }}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-[#27272a] bg-[#111111]/70 text-[#71717a]">
                                <tr>
                                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Name & Prefix</th>
                                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Environment</th>
                                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Status</th>
                                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Scopes</th>
                                    <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-[11px]">Created</th>
                                    <th className="px-4 py-3.5 text-right font-semibold uppercase tracking-wider text-[11px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#27272a]">
                                {filteredKeys.map((k) => {
                                    const status = getApiKeyStatus(k);
                                    const isMgmt = k.key_type === 'management';
                                    const prefixDisplay = isMgmt
                                        ? `hvt_mgmt_${k.environment}_${k.prefix}...`
                                        : `hvt_${k.environment}_${k.prefix}...`;

                                    return (
                                        <tr key={k.id} className="transition-colors hover:bg-[#202024]/50">
                                            <td className="px-4 py-3.5">
                                                <p className="font-semibold text-white">{k.name}</p>
                                                <p className="mt-0.5 font-mono text-[11px] text-[#71717a]">
                                                    {prefixDisplay}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                                                        isMgmt
                                                            ? 'border border-zinc-700/80 bg-zinc-800/80 text-zinc-200'
                                                            : 'border border-[#27272a] bg-[#111111] text-[#a1a1aa]'
                                                    }`}
                                                >
                                                    {isMgmt ? 'Management' : 'Runtime'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span
                                                    className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                                        k.environment === 'live'
                                                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                            : 'border border-zinc-700/80 bg-zinc-800/80 text-zinc-300'
                                                    }`}
                                                >
                                                    {k.environment.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <StatusBadge status={status} />
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="font-mono text-[11px] text-[#a1a1aa]">
                                                    {Array.isArray(k.scopes) ? k.scopes.length : 0} scope(s)
                                                </span>
                                            </td>
                                            <td className="px-4 py-3.5 text-[#71717a]">
                                                {formatDate(k.created_at)}
                                            </td>
                                            <td className="px-4 py-3.5 text-right">
                                                {status === 'active' ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setRevokeTarget(k)}
                                                        className="h-8 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                                                    >
                                                        Revoke
                                                    </Button>
                                                ) : (
                                                    <span className="text-[#3f3f46]">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal 1: Issue New API Key Dialog */}
            <Dialog open={createOpen} onOpenChange={(open) => (open ? setCreateOpen(true) : handleCloseCreateModal())}>
                <DialogContent className="border-[#27272a] bg-[#18181b] text-white shadow-2xl sm:max-w-2xl">
                    {!createdKeyData ? (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-base font-bold text-white">
                                    Issue New API Key
                                </DialogTitle>
                                <DialogDescription className="text-xs text-[#a1a1aa]">
                                    Generate an authentication key for application runtime or schema provisioning.
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-5">
                                {/* Key Type Selector */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-[#a1a1aa]">Key Type</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleKeyTypeChange('runtime')}
                                            className={`rounded-xl border p-3.5 text-left transition ${
                                                keyType === 'runtime'
                                                    ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-white shadow-sm ring-1 ring-[#7c3aed]/40'
                                                    : 'border-[#27272a] bg-[#111111] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
                                            }`}
                                        >
                                            <p className="font-semibold text-xs text-white">Runtime Client Key</p>
                                            <p className="mt-1 text-[11px] text-[#71717a] leading-snug">
                                                For web, mobile, and client apps to log users in. Prefixed `hvt_...`
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleKeyTypeChange('management')}
                                            className={`rounded-xl border p-3.5 text-left transition ${
                                                keyType === 'management'
                                                    ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-white shadow-sm ring-1 ring-[#7c3aed]/40'
                                                    : 'border-[#27272a] bg-[#111111] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
                                            }`}
                                        >
                                            <p className="font-semibold text-xs text-zinc-200">Management / CI Key</p>
                                            <p className="mt-1 text-[11px] text-[#71717a] leading-snug">
                                                For CI/CD and CLI schema sync. Prefixed `hvt_mgmt_...`
                                            </p>
                                        </button>
                                    </div>
                                </div>

                                {/* Project & Environment Pickers */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-[#a1a1aa]">Project</Label>
                                        <select
                                            value={keyProjectId}
                                            onChange={(e) => setKeyProjectId(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs text-white outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                            required
                                        >
                                            <option value="">Select a project</option>
                                            {projects.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-[#a1a1aa]">Environment</Label>
                                        <select
                                            value={keyEnvironment}
                                            onChange={(e) => setKeyEnvironment(e.target.value)}
                                            className="h-10 w-full rounded-lg border border-[#27272a] bg-[#111111] px-3 text-xs text-white outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                        >
                                            <option value="test">Test Mode (Sandbox)</option>
                                            <option value="live">Live Mode (Production)</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Name & Expiration */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-[#a1a1aa]">Key Name</Label>
                                        <Input
                                            value={keyName}
                                            onChange={(e) => setKeyName(e.target.value)}
                                            placeholder={keyType === 'runtime' ? 'Storefront Frontend' : 'GitHub Actions Sync'}
                                            className="h-10 border-[#27272a] bg-[#111111] text-xs text-white placeholder:text-[#71717a] focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-[#a1a1aa]">Expiration (Optional)</Label>
                                        <Input
                                            type="datetime-local"
                                            value={keyExpiresAt}
                                            onChange={(e) => setKeyExpiresAt(e.target.value)}
                                            className="h-10 border-[#27272a] bg-[#111111] text-xs text-white focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                                        />
                                    </div>
                                </div>

                                {/* Scopes Selection */}
                                <div className="space-y-2 rounded-xl border border-[#27272a] bg-[#111111] p-3.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-white">
                                            {keyType === 'runtime' ? 'Runtime Scopes' : 'Management Scopes'}
                                        </Label>
                                        <span className="text-[11px] text-[#71717a]">
                                            {selectedScopes.length} selected
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto sm:grid-cols-2">
                                        {(keyType === 'runtime' ? RUNTIME_SCOPES : MANAGEMENT_SCOPES).map((s) => {
                                            const isChecked = selectedScopes.includes(s.id);
                                            return (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => toggleScope(s.id)}
                                                    className={`flex items-start gap-2.5 rounded-lg border p-2 text-left transition ${
                                                        isChecked
                                                            ? 'border-zinc-400 bg-zinc-800/90 text-white'
                                                            : 'border-[#27272a] bg-[#18181b] text-[#a1a1aa] hover:border-[#3f3f46]'
                                                    }`}
                                                >
                                                    <div
                                                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                            isChecked
                                                                ? 'border-[#7c3aed] bg-[#7c3aed] text-white shadow-sm shadow-[#7c3aed]/25'
                                                                : 'border-[#27272a] bg-[#111111]'
                                                        }`}
                                                    >
                                                        {isChecked ? <Check className="h-3 w-3" /> : null}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-mono text-xs font-semibold text-white">
                                                            {s.label}
                                                        </p>
                                                        <p className="text-[11px] text-[#71717a] leading-snug line-clamp-1">
                                                            {s.desc}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseCreateModal}
                                        className="border-[#27272a] bg-transparent text-xs text-[#a1a1aa] hover:bg-[#202024] hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createMutation.isPending || !selectedScopes.length}
                                        className="bg-[#7c3aed] text-xs font-semibold text-white hover:bg-[#6d28d9] shadow-sm shadow-[#7c3aed]/25 transition"
                                    >
                                        {createMutation.isPending ? 'Generating...' : 'Generate API Key'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </>
                    ) : (
                        /* Modal State 2: Show-Once Secret Reveal */
                        <div className="space-y-4">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                    <span>API Key Created</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-zinc-400">
                                    Save this secret key now. For security, it will never be displayed again.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Raw Full Key Display */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-[#a1a1aa]">Raw API Key</Label>
                                <div className="flex items-center gap-2 rounded-xl border border-[#27272a] bg-[#111111] p-3">
                                    <code className="flex-1 font-mono text-xs font-semibold text-emerald-400 break-all select-all">
                                        {createdKeyData.key}
                                    </code>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleCopyRawKey}
                                        className="shrink-0 bg-[#7c3aed] text-xs font-semibold text-white hover:bg-[#6d28d9] transition"
                                    >
                                        {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        <span className="ml-1.5">{copiedKey ? 'Copied' : 'Copy'}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Pre-formatted .env Snippet */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-semibold text-[#a1a1aa]">Integration .env Block</Label>
                                    <button
                                        type="button"
                                        onClick={handleCopyEnvBlock}
                                        className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:underline"
                                    >
                                        {copiedEnv ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                        <span>{copiedEnv ? 'Copied block' : 'Copy .env variables'}</span>
                                    </button>
                                </div>
                                <pre className="rounded-xl border border-[#27272a] bg-[#111111] p-3 font-mono text-xs text-[#f4f4f5] overflow-x-auto">
{`HVT_BASE_URL=${apiBaseUrl}
HVT_PROJECT_ID=${activeProjectId}
HVT_API_KEY=${createdKeyData.key}`}
                                </pre>
                            </div>

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    onClick={handleCloseCreateModal}
                                    className="w-full bg-[#27272a] text-xs font-semibold text-white hover:bg-[#3f3f46]"
                                >
                                    I have stored this key securely
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal 2: Revoke Confirmation Dialog */}
            <ConfirmDialog
                open={Boolean(revokeTarget)}
                onOpenChange={(open) => !open && setRevokeTarget(null)}
                title="Revoke API Key"
                description={`Are you sure you want to revoke "${revokeTarget?.name}"? Any application or script authenticating with this key will immediately fail.`}
                confirmLabel="Revoke Key"
                variant="destructive"
                onConfirm={() => revokeTarget && revokeMutation.mutate(revokeTarget.id)}
            />
        </div>
    );
}
