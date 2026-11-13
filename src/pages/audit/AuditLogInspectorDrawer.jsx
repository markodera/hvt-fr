// SPDX-License-Identifier: Apache-2.0
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CopyButton } from '@/components/CopyButton';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { Shield, User, Key, Globe, Database, Calendar } from 'lucide-react';

export function AuditLogInspectorDrawer({ log, open, onOpenChange }) {
    if (!log) {
        return null;
    }

    const eventDataString = typeof log.event_data === 'object'
        ? JSON.stringify(log.event_data, null, 2)
        : String(log.event_data || '{}');

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center justify-between gap-3 pr-6">
                        <SheetTitle className="font-mono text-base break-all">
                            {log.event_type}
                        </SheetTitle>
                    </div>
                    <SheetDescription>
                        {formatDate(log.created_at)} ({formatRelativeTime(log.created_at)})
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-bg-tertiary p-4 text-xs sm:grid-cols-2">
                        <div>
                            <div className="flex items-center gap-1.5 text-text-muted">
                                {log.actor_api_key_name ? <Key className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                <span className="font-semibold uppercase tracking-wider">Actor</span>
                            </div>
                            <p className="mt-1 font-medium text-text-primary">
                                {log.actor_email || log.actor_api_key_name || 'System'}
                            </p>
                            {(log.actor_user_id || log.actor_api_key_id) && (
                                <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                                    ID: {log.actor_user_id || log.actor_api_key_id}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 text-text-muted">
                                <Globe className="h-3.5 w-3.5" />
                                <span className="font-semibold uppercase tracking-wider">IP Address</span>
                            </div>
                            <p className="mt-1 font-mono text-text-primary">
                                {log.ip_address || 'Not recorded'}
                            </p>
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 text-text-muted">
                                <Database className="h-3.5 w-3.5" />
                                <span className="font-semibold uppercase tracking-wider">Target Resource</span>
                            </div>
                            <p className="mt-1 font-medium text-text-primary">
                                {log.target_type || 'system'}
                            </p>
                            {log.target_id && (
                                <p className="mt-0.5 font-mono text-[11px] text-text-muted">
                                    ID: {log.target_id}
                                </p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-1.5 text-text-muted">
                                <Shield className="h-3.5 w-3.5" />
                                <span className="font-semibold uppercase tracking-wider">Project / Scope</span>
                            </div>
                            <p className="mt-1 font-mono text-text-primary">
                                {log.project ? String(log.project) : 'Organization-level'}
                            </p>
                        </div>
                    </div>

                    {/* Structured Event Data */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                                Event Payload Details (JSON)
                            </h4>
                            <CopyButton text={eventDataString} />
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border bg-[#0d0d10] p-4">
                            <pre className="max-h-[380px] overflow-auto font-mono text-xs text-zinc-300">
                                {eventDataString}
                            </pre>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
