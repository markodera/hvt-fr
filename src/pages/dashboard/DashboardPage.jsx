import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Users,
    Key,
    ScrollText,
    Activity,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    ShieldCheck,
    Webhook,
    Settings,
} from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { SkeletonRow } from '@/components/SkeletonRow';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { listAuditLogs } from '@/api/auditLogs';
import { listUsers } from '@/api/users';
import { listApiKeys } from '@/api/apiKeys';
import { formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const launchChecklist = [
    {
        title: 'Create at least one live API key',
        description: 'Verify your production services can authenticate before go-live.',
        to: '/dashboard/api-keys',
        icon: Key,
    },
    {
        title: 'Configure webhook endpoint(s)',
        description: 'Receive auth and security events in your backend or SIEM.',
        to: '/dashboard/webhooks',
        icon: Webhook,
    },
    {
        title: 'Review org security settings',
        description: 'Confirm allowed domains, roles, and admin ownership are final.',
        to: '/dashboard/settings',
        icon: ShieldCheck,
    },
];

function formatActor(log) {
    return log.actor_email || log.actor_api_key_name || 'System';
}

export function DashboardPage() {
    const { user } = useAuth();

    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users', { page: 1, page_size: 1 }],
        queryFn: () => listUsers({ page: 1, page_size: 1 }),
    });

    const { data: keysData, isLoading: keysLoading } = useQuery({
        queryKey: ['apiKeys', { page: 1, page_size: 1 }],
        queryFn: () => listApiKeys({ page: 1, page_size: 1 }),
    });

    const {
        data: auditData,
        isLoading: auditLoading,
        isError: auditError,
        refetch: refetchAudit,
        isFetching: auditRefreshing,
    } = useQuery({
        queryKey: ['auditLogs', { page: 1, page_size: 5 }],
        queryFn: () => listAuditLogs({ page: 1, page_size: 5 }),
    });

    const recentEvents = auditData?.results ?? [];

    return (
        <div className="space-y-8">
            <section className="rounded-xl border border-border bg-bg-secondary p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm text-text-secondary">Welcome back</p>
                        <h2 className="text-2xl font-bold text-text-primary">
                            {user?.full_name || user?.email || 'Team'}
                        </h2>
                        <p className="mt-1 text-sm text-text-muted">
                            Here&apos;s your launch-readiness snapshot for this workspace.
                        </p>
                    </div>
                    <Button asChild>
                        <Link to="/dashboard/audit-logs" className="inline-flex items-center gap-2">
                            Open full audit log
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Users"
                    value={usersLoading ? '…' : usersData?.count ?? '—'}
                    icon={Users}
                    description="registered users"
                />
                <StatCard
                    title="API Keys"
                    value={keysLoading ? '…' : keysData?.count ?? '—'}
                    icon={Key}
                    description="active keys"
                />
                <StatCard
                    title="Recent Events"
                    value={auditLoading ? '…' : auditData?.count ?? '—'}
                    icon={Activity}
                    description="total audit events"
                />
            </div>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {launchChecklist.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className="group rounded-xl border border-border bg-bg-secondary p-4 transition-colors hover:border-primary/60"
                        >
                            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary">{item.title}</h3>
                            <p className="mt-1 text-xs text-text-secondary">{item.description}</p>
                        </Link>
                    );
                })}
            </section>

            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-text-primary">Recent Activity</h2>
                    {!auditError && (
                        <StatusBadge
                            status="active"
                            label={auditRefreshing ? 'Refreshing…' : 'Live'}
                        />
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-tertiary">
                            <tr>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Event</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Actor</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Status</th>
                                <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLoading && Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} columns={4} />
                            ))}
                            {auditError && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8">
                                        <div className="mx-auto max-w-xl rounded-lg border border-warning/40 bg-warning/5 p-4 text-center">
                                            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning">
                                                <AlertTriangle className="h-4 w-4" />
                                            </div>
                                            <p className="text-sm font-semibold text-text-primary">Couldn&apos;t load recent activity</p>
                                            <p className="mt-1 text-xs text-text-secondary">
                                                Your account can still use the dashboard. Retry now or check audit log permissions.
                                            </p>
                                            <Button size="sm" variant="outline" className="mt-3" onClick={() => refetchAudit()}>
                                                Retry
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!auditLoading && !auditError && recentEvents.length === 0 && (
                                <tr>
                                    <td colSpan={4}>
                                        <EmptyState
                                            icon={ScrollText}
                                            title="No activity yet"
                                            description="Events will appear here as users interact with the platform."
                                        />
                                    </td>
                                </tr>
                            )}
                            {recentEvents.map((log) => (
                                <tr key={log.id} className="border-b border-border hover:bg-bg-tertiary/50 transition-colors">
                                    <td className="px-4 py-3 text-sm text-text-primary font-medium">{log.event_type}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{formatActor(log)}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={log.success ? 'active' : 'failed'} label={log.success ? 'Success' : 'Failed'} />
                                    </td>
                                    <td className="px-4 py-3 text-sm text-text-muted">{formatRelativeTime(log.created_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <section className="rounded-xl border border-border bg-bg-secondary p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Launch prep note
                </h3>
                <p className="text-sm text-text-secondary">
                    Before launch, run one end-to-end smoke test: user signup/login, API key auth, webhook delivery, and audit visibility.
                </p>
                <div className="mt-3">
                    <Button asChild variant="outline" size="sm">
                        <Link to="/dashboard/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Review launch settings
                        </Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
