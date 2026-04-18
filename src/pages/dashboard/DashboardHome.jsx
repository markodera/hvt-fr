import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Activity,
    Boxes,
    KeyRound,
    ScrollText,
    Users,
    Webhook,
} from 'lucide-react';

import { listApiKeys } from '@/api/apiKeys';
import { listAuditLogs } from '@/api/auditLogs';
import { listProjects } from '@/api/organizations';
import { listUsers } from '@/api/users';
import { getWebhookSummary } from '@/api/webhooks';
import { formatDate, formatRelativeTime } from '@/lib/utils';

function Card({ children, className = '' }) {
    return (
        <section
            className={[
                'rounded-2xl border border-[#27272a] bg-[#18181b] transition-colors duration-150 hover:border-[#3f3f46]',
                className,
            ].join(' ')}
        >
            {children}
        </section>
    );
}

function EmptyState({ icon: Icon, message, cta }) {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 px-6 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#27272a] bg-[#111111] text-[#71717a]">
                <Icon className="h-6 w-6" />
            </div>
            <p className="max-w-md text-sm leading-6 text-[#71717a]">{message}</p>
            {cta}
        </div>
    );
}

function SkeletonBlock({ className = '' }) {
    return <div className={`animate-pulse rounded-xl bg-[#1c1c1f] ${className}`} />;
}

function StatCard({ icon: Icon, label, value, helper }) {
    return (
        <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-[13px] font-medium text-[#71717a]">{label}</p>
                    <p className="mt-3 text-[28px] font-bold tracking-[-0.03em] text-white">{value}</p>
                    <p className="mt-2 text-xs text-[#71717a]">{helper}</p>
                </div>
                <div className="rounded-xl border border-[#7c3aed]/25 bg-[#111111] p-3 text-[#a78bfa]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </Card>
    );
}

function auditResource(log) {
    return log.target_type || log.project || 'system';
}

import { usePageTitle } from '@/hooks/usePageTitle';

export default function DashboardHome() {
    usePageTitle('Dashboard');
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['dashboard-users-count'],
        queryFn: () => listUsers({ page: 1, page_size: 1 }),
    });

    const { data: projectsData, isLoading: projectsLoading } = useQuery({
        queryKey: ['dashboard-projects'],
        queryFn: listProjects,
    });

    const { data: apiKeysData, isLoading: apiKeysLoading } = useQuery({
        queryKey: ['dashboard-api-keys'],
        queryFn: () => listApiKeys({ page: 1, page_size: 3, ordering: '-last_used_at' }),
    });

    const {
        data: auditData,
        isLoading: auditLoading,
        isError: auditError,
    } = useQuery({
        queryKey: ['dashboard-audit-events'],
        queryFn: () => listAuditLogs({ page_size: 5 }),
    });

    const {
        data: webhookSummary,
        isLoading: webhookSummaryLoading,
        isError: webhookSummaryError,
    } = useQuery({
        queryKey: ['dashboard-webhook-summary'],
        queryFn: getWebhookSummary,
    });

    const projects = useMemo(() => projectsData?.results ?? projectsData ?? [], [projectsData]);
    const apiKeys = useMemo(() => apiKeysData?.results ?? [], [apiKeysData]);
    const auditEvents = useMemo(() => auditData?.results ?? [], [auditData]);
    const activeProjects = projects.filter((project) => project.is_active).length;
    const webhookEvents24h =
        webhookSummary?.total_deliveries_24h ??
        webhookSummary?.deliveries_24h ??
        webhookSummary?.webhook_events_24h ??
        webhookSummary?.count_24h ??
        0;

    return (
        <div className="space-y-6">
            <section className="grid gap-4 lg:grid-cols-4">
                {usersLoading ? (
                    <SkeletonBlock className="h-[132px]" />
                ) : (
                    <StatCard
                        icon={Users}
                        label="Total Users"
                        value={usersData?.count ?? 0}
                        helper="All users in the current organisation"
                    />
                )}
                {projectsLoading ? (
                    <SkeletonBlock className="h-[132px]" />
                ) : (
                    <StatCard
                        icon={Boxes}
                        label="Active Projects"
                        value={activeProjects}
                        helper={`${projects.length} total project${projects.length === 1 ? '' : 's'}`}
                    />
                )}
                {apiKeysLoading ? (
                    <SkeletonBlock className="h-[132px]" />
                ) : (
                    <StatCard
                        icon={KeyRound}
                        label="API Keys Issued"
                        value={apiKeysData?.count ?? 0}
                        helper="Project-scoped keys available to your apps"
                    />
                )}
                {webhookSummaryLoading ? (
                    <SkeletonBlock className="h-[132px]" />
                ) : webhookSummaryError ? (
                    <StatCard
                        icon={Webhook}
                        label="Webhook Events"
                        value="-"
                        helper="Could not load 24h deliveries"
                    />
                ) : (
                    <StatCard
                        icon={Webhook}
                        label="Webhook Events"
                        value={webhookEvents24h}
                        helper="Deliveries in the last 24 hours"
                    />
                )}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
                <Card className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#27272a] px-5 py-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                Recent Audit Events
                            </p>
                            <p className="mt-1 text-sm text-[#a1a1aa]">
                                Latest control-plane and runtime activity across your organisation.
                            </p>
                        </div>
                        <ScrollText className="h-4 w-4 text-[#a78bfa]" />
                    </div>

                    {auditLoading ? (
                        <div className="space-y-3 px-5 py-5">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <SkeletonBlock key={index} className="h-12" />
                            ))}
                        </div>
                    ) : auditError ? (
                        <EmptyState
                            icon={Activity}
                            message="Audit events could not be loaded right now."
                        />
                    ) : auditEvents.length === 0 ? (
                        <EmptyState
                            icon={ScrollText}
                            message="No audit events yet. Events are recorded when users sign in, keys are issued, or settings change."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-[#27272a] text-left text-[11px] uppercase tracking-[0.18em] text-[#71717a]">
                                        <th className="px-5 py-3 font-medium">Event</th>
                                        <th className="px-5 py-3 font-medium">Actor</th>
                                        <th className="px-5 py-3 font-medium">Resource</th>
                                        <th className="px-5 py-3 font-medium">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditEvents.map((log) => (
                                        <tr key={log.id} className="border-b border-[#27272a] last:border-b-0">
                                            <td className="px-5 py-3 text-sm font-medium text-white">{log.event_type}</td>
                                            <td className="px-5 py-3 text-sm text-[#a1a1aa]">
                                                {log.actor_email || log.actor_api_key_name || 'System'}
                                            </td>
                                            <td className="px-5 py-3 text-sm text-[#a1a1aa]">{auditResource(log)}</td>
                                            <td className="px-5 py-3 font-mono text-xs text-[#71717a]">
                                                {formatRelativeTime(log.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                <Card className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#27272a] px-5 py-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                Projects
                            </p>
                            <p className="mt-1 text-sm text-[#a1a1aa]">
                                Project boundaries define API keys, runtime auth, and provider configuration.
                            </p>
                        </div>
                        <Boxes className="h-4 w-4 text-[#a78bfa]" />
                    </div>

                    {projectsLoading ? (
                        <div className="space-y-3 px-5 py-5">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <SkeletonBlock key={index} className="h-14" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <EmptyState
                            icon={Boxes}
                            message="No projects yet. Create a project to issue scoped API keys and social provider settings."
                            cta={
                                <Link
                                    to="/dashboard/settings"
                                    className="inline-flex h-10 items-center justify-center rounded-md border border-[#7c3aed]/40 px-4 text-sm font-semibold text-[#a78bfa] transition-colors hover:bg-[#18181b]"
                                >
                                    + New project
                                </Link>
                            }
                        />
                    ) : (
                        <div className="space-y-3 px-5 py-5">
                            {projects.slice(0, 5).map((project) => (
                                <div
                                    key={project.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-[#27272a] bg-[#111111] px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-white">{project.name}</p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <span className="rounded-full border border-[#3f3f46] bg-[#18181b] px-2 py-0.5 font-mono text-[11px] text-[#a78bfa]">
                                                {project.slug}
                                            </span>
                                            {project.is_default ? (
                                                <span className="rounded-full border border-[#27272a] px-2 py-0.5 text-[11px] text-[#a1a1aa]">
                                                    default
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-xs text-[#a1a1aa]">
                                        <span
                                            className={`h-2 w-2 rounded-full ${
                                                project.is_active ? 'bg-emerald-400' : 'bg-[#52525b]'
                                            }`}
                                        />
                                        {project.is_active ? 'Active' : 'Inactive'}
                                    </div>
                                </div>
                            ))}
                            <Link
                                to="/dashboard/settings"
                                className="inline-flex h-10 items-center justify-center rounded-md border border-[#7c3aed]/30 px-4 text-sm font-semibold text-[#a78bfa] transition-colors hover:bg-[#111111]"
                            >
                                + New project
                            </Link>
                        </div>
                    )}
                </Card>
            </section>

            <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#27272a] px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                            Recent API Key Activity
                        </p>
                        <p className="mt-1 text-sm text-[#a1a1aa]">
                            Latest key usage across projects. HTTP method is not exposed by the current API, so this view uses the last-used timestamp.
                        </p>
                    </div>
                    <KeyRound className="h-4 w-4 text-[#a78bfa]" />
                </div>

                {apiKeysLoading ? (
                    <div className="grid gap-4 px-5 py-5 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <SkeletonBlock key={index} className="h-28" />
                        ))}
                    </div>
                ) : apiKeys.length === 0 ? (
                    <EmptyState
                        icon={KeyRound}
                        message="No API key activity yet. Generate a key and call the runtime endpoints to see usage here."
                        cta={
                            <Link
                                to="/dashboard/api-keys"
                                className="inline-flex h-10 items-center justify-center rounded-md border border-[#7c3aed]/40 px-4 text-sm font-semibold text-[#a78bfa] transition-colors hover:bg-[#18181b]"
                            >
                                Issue new key
                            </Link>
                        }
                    />
                ) : (
                    <div className="grid gap-4 px-5 py-5 lg:grid-cols-3">
                        {apiKeys.map((key) => (
                            <div
                                key={key.id}
                                className="rounded-2xl border border-[#27272a] bg-[#111111] p-4"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <span className="font-mono text-sm text-[#a1a1aa]">{key.prefix}...</span>
                                    <span
                                        className={`rounded-full px-2 py-1 text-[11px] font-medium ${
                                            key.environment === 'live'
                                                ? 'border border-amber-500/30 bg-amber-500/10 text-amber-300'
                                                : 'border border-[#27272a] bg-[#18181b] text-[#a1a1aa]'
                                        }`}
                                    >
                                        {key.environment}
                                    </span>
                                </div>
                                <p className="mt-3 text-sm font-medium text-white">{key.name}</p>
                                <p className="mt-2 font-mono text-xs text-[#71717a]">{key.project_slug || 'default'}</p>
                                <p className="mt-6 text-xs text-[#71717a]">
                                    {key.last_used_at ? formatDate(key.last_used_at) : 'Not used yet'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}
