// SPDX-License-Identifier: Apache-2.0
import { Check, Copy, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/StatusBadge';
import { CopyButton } from '@/components/CopyButton';
import { formatDate, formatRelativeTime } from '@/lib/utils';

export function WebhookDeliveryDrawer({ delivery, open, onOpenChange }) {
    if (!delivery) {
        return null;
    }

    const payloadString = typeof delivery.payload === 'object'
        ? JSON.stringify(delivery.payload, null, 2)
        : String(delivery.payload || '{}');

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <div className="flex items-center justify-between gap-3 pr-6">
                        <SheetTitle className="font-mono text-base break-all">
                            {delivery.event_type}
                        </SheetTitle>
                        <StatusBadge status={delivery.status} />
                    </div>
                    <SheetDescription>
                        Delivery attempt {delivery.attempt_count} of {delivery.max_attempts || 5} •{' '}
                        {formatRelativeTime(delivery.delivered_at || delivery.created_at)}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {/* Status & Timing summary */}
                    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-bg-tertiary p-4 text-sm">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Response Code</p>
                            <p className="mt-1 font-mono text-base font-bold text-text-primary">
                                {delivery.response_status_code ? (
                                    <span className={delivery.response_status_code >= 200 && delivery.response_status_code < 300 ? 'text-emerald-400' : 'text-rose-400'}>
                                        {delivery.response_status_code}
                                    </span>
                                ) : (
                                    <span className="text-text-muted">-</span>
                                )}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Delivered At</p>
                            <p className="mt-1 font-mono text-xs text-text-secondary">
                                {delivery.delivered_at ? formatDate(delivery.delivered_at) : 'Not delivered'}
                            </p>
                        </div>
                    </div>

                    {/* Error message callout if present */}
                    {delivery.error_message && (
                        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                            <div className="flex items-center gap-2 text-rose-400">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <h4 className="text-xs font-semibold uppercase tracking-wider">Delivery Failure</h4>
                            </div>
                            <pre className="mt-2 text-xs font-mono text-rose-300 whitespace-pre-wrap break-all">
                                {delivery.error_message}
                            </pre>
                        </div>
                    )}

                    {/* Next retry notice */}
                    {delivery.status === 'retrying' && delivery.next_retry_at && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                            Next retry scheduled at: <span className="font-mono font-medium">{formatDate(delivery.next_retry_at)}</span>
                        </div>
                    )}

                    {/* Request Payload */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                                Event Payload (JSON)
                            </h4>
                            <CopyButton text={payloadString} />
                        </div>
                        <div className="overflow-hidden rounded-xl border border-border bg-[#0d0d10] p-4">
                            <pre className="max-h-[360px] overflow-auto font-mono text-xs text-zinc-300">
                                {payloadString}
                            </pre>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
