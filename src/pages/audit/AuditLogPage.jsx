import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { ScrollText, ChevronDown, ChevronRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { listAuditLogs } from '@/api/auditLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonRow';
import { Pagination } from '@/components/Pagination';
import { ResourcePageHeader } from '@/components/ResourcePageHeader';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { EVENT_TYPES } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

export function AuditLogPage() {
    const { user } = useAuth();
    const canViewAuditLogs = user?.role === 'owner' || user?.role === 'admin';
    const [searchParams, setSearchParams] = useSearchParams();
    const page = Number(searchParams.get('page')) || 1;
    const eventType = searchParams.get('event_type') || '';
    const success = searchParams.get('success') || '';
    const dateFrom = searchParams.get('date_from') || '';
    const dateTo = searchParams.get('date_to') || '';
    const [expandedId, setExpandedId] = useState(null);

    const params = { page, page_size: 15 };
    if (eventType) params.event_type = eventType;
    if (success) params.success = success;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo) params.date_to = dateTo;

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery({
        queryKey: ['auditLogs', params],
        queryFn: () => listAuditLogs(params),
        placeholderData: keepPreviousData,
        enabled: canViewAuditLogs,
    });

    const errorMessage = getErrorMessage(error);
    const statusCode = error?.response?.status;

    const updateParam = (key, value) => {
        setSearchParams((prev) => {
            if (value) prev.set(key, value);
            else prev.delete(key);
            prev.set('page', '1');
            return prev;
        });
    };

    return (
        <div className="space-y-6">
            <ResourcePageHeader
                title="Audit Logs"
                description="Review authentication and security events across your organization."
            />

            {!canViewAuditLogs && (
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-5">
                    <div className="flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-warning mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-text-primary">Audit logs are restricted</h3>
                            <p className="mt-1 text-sm text-text-secondary">Only owner and admin roles can access this page.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={eventType}
                    onChange={(e) => updateParam('event_type', e.target.value)}
                    disabled={!canViewAuditLogs}
                    className="h-10 rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-primary focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                >
                    <option value="">All events</option>
                    {EVENT_TYPES.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                </select>
                <select
                    value={success}
                    onChange={(e) => updateParam('success', e.target.value)}
                    disabled={!canViewAuditLogs}
                    className="h-10 rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-primary focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                >
                    <option value="">All outcomes</option>
                    <option value="true">Success</option>
                    <option value="false">Failed</option>
                </select>
                <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => updateParam('date_from', e.target.value)}
                    className="w-auto"
                    placeholder="From"
                    disabled={!canViewAuditLogs}
                />
                <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => updateParam('date_to', e.target.value)}
                    className="w-auto"
                    placeholder="To"
                    disabled={!canViewAuditLogs}
                />
            </div>

            {/* Table */}
            <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-bg-tertiary">
                        <tr>
                            <th className="w-8 px-2 py-3" />
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Event</th>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Actor</th>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Status</th>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">IP</th>
                            <th className="text-xs uppercase tracking-wider text-text-secondary font-semibold px-4 py-3 text-left">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!canViewAuditLogs && (
                            <tr>
                                <td colSpan={6} className="px-4 py-10 text-center text-sm text-text-secondary">
                                    Access denied for your role.
                                </td>
                            </tr>
                        )}
                        {canViewAuditLogs && isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={6} />)}
                        {canViewAuditLogs && isError && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8">
                                    <div className="mx-auto max-w-2xl rounded-lg border border-warning/40 bg-warning/5 p-4 text-center">
                                        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-warning/20 text-warning">
                                            <AlertTriangle className="h-4 w-4" />
                                        </div>
                                        <p className="text-sm font-semibold text-text-primary">Failed to load audit logs</p>
                                        <p className="mt-1 text-xs text-text-secondary">
                                            {statusCode ? `HTTP ${statusCode} — ` : ''}{errorMessage}
                                        </p>
                                        <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()} disabled={isFetching}>
                                            {isFetching ? 'Retrying…' : 'Retry'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {canViewAuditLogs && data?.results?.length === 0 && (
                            <tr><td colSpan={6}><EmptyState icon={ScrollText} title="No audit logs" description="Events will appear as users interact with the platform." /></td></tr>
                        )}
                        {canViewAuditLogs && data?.results?.map((log) => (
                            <Fragment key={log.id}>
                                <tr
                                    className="border-b border-border hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                >
                                    <td className="px-2 py-3 text-text-muted">
                                        {expandedId === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-text-primary">{log.event_type}</td>
                                    <td className="px-4 py-3 text-sm text-text-secondary">{log.actor_email || log.actor_api_key_name || '—'}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={log.success ? 'active' : 'failed'} label={log.success ? 'Success' : 'Failed'} />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-text-muted">{log.ip_address}</td>
                                    <td className="px-4 py-3 text-sm text-text-muted">{formatDate(log.created_at)}</td>
                                </tr>
                                {expandedId === log.id && (
                                    <tr className="bg-bg-tertiary/30">
                                        <td colSpan={6} className="px-8 py-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">User Agent</p>
                                                    <p className="text-text-secondary text-xs break-all">{log.user_agent || '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-muted mb-1">Target</p>
                                                    <p className="text-text-secondary text-xs">{log.target_type} ({log.target_object_id})</p>
                                                </div>
                                                {log.error_message && (
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-text-muted mb-1">Error</p>
                                                        <p className="text-danger text-xs">{log.error_message}</p>
                                                    </div>
                                                )}
                                                {log.event_data && Object.keys(log.event_data).length > 0 && (
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-text-muted mb-1">Event Data</p>
                                                        <pre className="text-xs bg-bg-secondary p-3 rounded-lg overflow-auto text-text-secondary">
                                                            {JSON.stringify(log.event_data, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
                {canViewAuditLogs && data && <Pagination count={data.count} page={page} pageSize={15} onPageChange={(p) => setSearchParams((prev) => { prev.set('page', p); return prev; })} />}
            </div>
        </div>
    );
}
