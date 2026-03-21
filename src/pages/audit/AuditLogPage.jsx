import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { ScrollText, ChevronDown, ChevronRight } from 'lucide-react';
import { listAuditLogs } from '@/api/auditLogs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonRow } from '@/components/SkeletonRow';
import { Pagination } from '@/components/Pagination';
import { formatDate } from '@/lib/utils';
import { EVENT_TYPES } from '@/lib/constants';

export function AuditLogPage() {
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

    const { data, isLoading, isError } = useQuery({
        queryKey: ['auditLogs', params],
        queryFn: () => listAuditLogs(params),
        placeholderData: keepPreviousData,
    });

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
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <select
                    value={eventType}
                    onChange={(e) => updateParam('event_type', e.target.value)}
                    className="h-10 rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-primary focus:ring-2 focus:ring-primary/50"
                >
                    <option value="">All events</option>
                    {EVENT_TYPES.map((e) => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                </select>
                <select
                    value={success}
                    onChange={(e) => updateParam('success', e.target.value)}
                    className="h-10 rounded-lg border border-border bg-bg-secondary px-3 text-sm text-text-primary focus:ring-2 focus:ring-primary/50"
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
                />
                <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => updateParam('date_to', e.target.value)}
                    className="w-auto"
                    placeholder="To"
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
                        {isLoading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={6} />)}
                        {isError && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-text-secondary">Failed to load audit logs.</td></tr>
                        )}
                        {data?.results?.length === 0 && (
                            <tr><td colSpan={6}><EmptyState icon={ScrollText} title="No audit logs" description="Events will appear as users interact with the platform." /></td></tr>
                        )}
                        {data?.results?.map((log) => (
                            <>
                                <tr
                                    key={log.id}
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
                                    <tr key={`${log.id}-detail`} className="bg-bg-tertiary/30">
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
                            </>
                        ))}
                    </tbody>
                </table>
                {data && <Pagination count={data.count} page={page} pageSize={15} onPageChange={(p) => setSearchParams((prev) => { prev.set('page', p); return prev; })} />}
            </div>
        </div>
    );
}
