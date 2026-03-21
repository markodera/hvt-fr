import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getCurrentOrg } from '@/api/organizations';
import { listApiKeys } from '@/api/apiKeys';
import { listWebhooks } from '@/api/webhooks';
import { listAuditLogs } from '@/api/auditLogs';
import { Button } from '@/components/ui/button';

export function GetStartedPage() {
    const { user } = useAuth();
    const isOwner = user?.role === 'owner';
    const { state, steps, completedCount, totalCount, isComplete, updateState } = useOnboarding(user?.organization);

    const { data: org } = useQuery({
        queryKey: ['organization'],
        queryFn: getCurrentOrg,
        enabled: isOwner,
    });

    const { data: keysData } = useQuery({
        queryKey: ['apiKeys', { page: 1, page_size: 1 }],
        queryFn: () => listApiKeys({ page: 1, page_size: 1 }),
        enabled: isOwner,
    });

    const { data: webhookData } = useQuery({
        queryKey: ['webhooks', { page: 1, page_size: 1 }],
        queryFn: () => listWebhooks({ page: 1, page_size: 1 }),
        enabled: isOwner,
    });

    const { data: auditData } = useQuery({
        queryKey: ['auditLogs', { page: 1, page_size: 1 }],
        queryFn: () => listAuditLogs({ page: 1, page_size: 1 }),
        enabled: isOwner,
    });

    useEffect(() => {
        if (!isOwner) return;
        if (org?.id) updateState({ orgProfileCompleted: true });
    }, [isOwner, org?.id, updateState]);

    useEffect(() => {
        if (!isOwner) return;
        if ((keysData?.count || 0) > 0) updateState({ apiKeyCreated: true });
    }, [isOwner, keysData?.count, updateState]);

    useEffect(() => {
        if (!isOwner) return;
        if ((webhookData?.count || 0) > 0) updateState({ webhookConfigured: true });
    }, [isOwner, webhookData?.count, updateState]);

    useEffect(() => {
        if (!isOwner) return;
        if ((auditData?.count || 0) > 0) updateState({ testEventVerified: true });
    }, [isOwner, auditData?.count, updateState]);

    if (!isOwner) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="max-w-3xl space-y-6">
            <section className="rounded-xl border border-border bg-bg-secondary p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Getting started</p>
                        <h1 className="mt-1 text-2xl font-extrabold text-text-primary">Launch checklist</h1>
                        <p className="mt-2 text-sm text-text-secondary">
                            Complete these steps to activate your workspace and validate end-to-end auth flows.
                        </p>
                    </div>
                    <div className="rounded-lg border border-border px-3 py-2 text-right">
                        <p className="text-xs text-text-secondary">Progress</p>
                        <p className="text-lg font-bold text-text-primary">{completedCount}/{totalCount}</p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
                <ul>
                    {steps.map((step, index) => {
                        const done = state[step.key];
                        return (
                            <li key={step.key} className="border-b border-border last:border-b-0 px-5 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    {done ? (
                                        <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-text-muted mt-0.5" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">{index + 1}. {step.label}</p>
                                        {step.key === 'orgProfileCompleted' && (
                                            <p className="text-xs text-text-secondary mt-1">Set org name/slug in settings.</p>
                                        )}
                                        {step.key === 'apiKeyCreated' && (
                                            <p className="text-xs text-text-secondary mt-1">Generate a key to authenticate your service.</p>
                                        )}
                                        {step.key === 'webhookConfigured' && (
                                            <p className="text-xs text-text-secondary mt-1">Point events to your backend endpoint.</p>
                                        )}
                                        {step.key === 'testEventVerified' && (
                                            <p className="text-xs text-text-secondary mt-1">Login once and confirm activity appears in audit logs.</p>
                                        )}
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    {step.key === 'orgProfileCompleted' && (
                                        <Button asChild size="sm" variant="outline"><Link to="/dashboard/settings">Open settings</Link></Button>
                                    )}
                                    {step.key === 'apiKeyCreated' && (
                                        <Button asChild size="sm" variant="outline"><Link to="/dashboard/api-keys">Open API keys</Link></Button>
                                    )}
                                    {step.key === 'webhookConfigured' && (
                                        <Button asChild size="sm" variant="outline"><Link to="/dashboard/webhooks">Open webhooks</Link></Button>
                                    )}
                                    {step.key === 'testEventVerified' && (
                                        <Button asChild size="sm" variant="outline"><Link to="/dashboard/audit-logs">Open audit logs</Link></Button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {isComplete ? (
                <section className="rounded-xl border border-success/40 bg-success/10 p-5">
                    <h2 className="text-sm font-semibold text-success flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Integration complete
                    </h2>
                    <p className="mt-2 text-sm text-text-primary">
                        Your workspace passed the initial setup flow. Continue to the dashboard for day-to-day operations.
                    </p>
                    <Button asChild className="mt-4">
                        <Link to="/dashboard">
                            Go to dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </section>
            ) : (
                <section className="rounded-xl border border-border bg-bg-secondary p-5">
                    <p className="text-sm text-text-secondary">Complete all steps to unlock the final success state.</p>
                </section>
            )}
        </div>
    );
}
