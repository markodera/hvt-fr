import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Sparkles,
    Terminal,
    CheckCircle2,
    Circle,
    ArrowRight,
    Copy,
    Check,
    RotateCw,
    Clock,
    ShieldAlert,
    ExternalLink,
    KeyRound,
    UserPlus,
    Radio,
    FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';

import { getProjectOnboarding, generateSetupPrompt } from '@/api/organizations';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/lib/utils';

export function OnboardingQuickstart({ project }) {
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isCliModalOpen, setIsCliModalOpen] = useState(false);

    // Live checklist polling every 3 seconds while tab is active
    const { data: onboarding, isLoading, refetch } = useQuery({
        queryKey: ['project-onboarding', project?.id],
        queryFn: () => getProjectOnboarding(project.id),
        enabled: Boolean(project?.id),
        refetchInterval: () => (typeof document !== 'undefined' && document.visibilityState === 'visible' ? 3000 : false),
    });

    const canUseSetupPrompt = project?.can_use_setup_prompt ?? onboarding?.can_use_setup_prompt ?? true;
    const setupPromptNotice = project?.setup_prompt_notice ?? onboarding?.setup_prompt_notice;

    const allCompleted = Boolean(onboarding?.all_completed);

    return (
        <div className="space-y-4">
            {/* One-line explanations in the UI: test mode is a safe sandbox, live mode is for real users */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs sm:text-sm text-amber-300">
                <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 shrink-0 text-amber-400" />
                    <span>
                        <strong className="font-semibold text-amber-200">Test mode:</strong> Test mode is a safe sandbox, live mode is for real users.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Project: <strong className="text-text-primary">{project?.name || 'Default'}</strong></span>
                </div>
            </div>

            {/* Quickstart Card */}
            <div className="rounded-2xl border border-border bg-bg-secondary p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-text-primary">
                            {allCompleted ? 'Onboarding Complete!' : 'Quickstart: Integrate Authentication'}
                        </h2>
                        <p className="mt-1 text-sm text-text-muted">
                            {allCompleted
                                ? 'All 4 onboarding milestones verified. Your project is ready for development or live rollout.'
                                : 'Connect your application using modern AI coding agents or the command line in under 5 minutes.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => setIsAiModalOpen(true)}
                            disabled={!canUseSetupPrompt}
                            title={!canUseSetupPrompt ? setupPromptNotice : 'Generate copy-paste prompt for AI agents'}
                            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
                        >
                            <Sparkles className="h-4 w-4 text-purple-200" />
                            Set up with AI
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsCliModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl border border-border bg-bg-primary px-3.5 py-2.5 text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary hover:border-text-muted transition"
                        >
                            <Terminal className="h-4 w-4 text-text-muted" />
                            Set up with the CLI
                        </button>
                    </div>
                </div>

                {!canUseSetupPrompt && setupPromptNotice && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                        <span>{setupPromptNotice}</span>
                    </div>
                )}

                {/* Live Checklist */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <ChecklistItem
                        title="1. Project created"
                        description="Safe test sandbox ready"
                        done={true}
                    />
                    <ChecklistItem
                        title="2. Schema synced"
                        description={onboarding?.schema_synced ? 'Roles & methods configured' : 'Awaiting initial schema sync'}
                        done={Boolean(onboarding?.schema_synced)}
                        pendingAction="Sync via AI or CLI"
                        onAction={() => setIsAiModalOpen(true)}
                    />
                    <ChecklistItem
                        title="3. First sign-up"
                        description={onboarding?.first_signup ? 'Test user registered' : 'No runtime users registered yet'}
                        done={Boolean(onboarding?.first_signup)}
                        link="/runtime-playground"
                        linkLabel="Test in Playground"
                    />
                    <ChecklistItem
                        title="4. First login"
                        description={onboarding?.first_login ? 'Test authentication verified' : 'Awaiting first test login'}
                        done={Boolean(onboarding?.first_login)}
                    />
                </div>

                {/* Next Steps Card: Shown after all 4 steps are complete */}
                {allCompleted && (
                    <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                        <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
                            <CheckCircle2 className="h-5 w-5" />
                            <h3 className="font-semibold text-text-primary">Next Steps: Take Your Auth to Production</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-text-muted mb-4">
                            Your runtime authentication pipeline is verified. Customize your authentication methods, invite teammates, or graduate to production:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Link
                                to="/dashboard/settings"
                                className="flex items-center justify-between rounded-lg border border-border bg-bg-primary p-3.5 text-xs sm:text-sm font-medium text-text-primary hover:border-purple-500 transition group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <Radio className="h-4 w-4 text-purple-400" />
                                    Add Google / Social Login
                                </span>
                                <ArrowRight className="h-4 w-4 text-text-muted group-hover:translate-x-0.5 transition" />
                            </Link>
                            <Link
                                to="/dashboard/settings"
                                className="flex items-center justify-between rounded-lg border border-border bg-bg-primary p-3.5 text-xs sm:text-sm font-medium text-text-primary hover:border-purple-500 transition group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <UserPlus className="h-4 w-4 text-purple-400" />
                                    Invite a Teammate
                                </span>
                                <ArrowRight className="h-4 w-4 text-text-muted group-hover:translate-x-0.5 transition" />
                            </Link>
                            <Link
                                to="/dashboard/api-keys"
                                className="flex items-center justify-between rounded-lg border border-border bg-bg-primary p-3.5 text-xs sm:text-sm font-medium text-text-primary hover:border-purple-500 transition group"
                            >
                                <span className="flex items-center gap-2.5">
                                    <KeyRound className="h-4 w-4 text-emerald-400" />
                                    Go Live (Issue Live Keys)
                                </span>
                                <ArrowRight className="h-4 w-4 text-text-muted group-hover:translate-x-0.5 transition" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Setup Prompt Modal */}
            <AISetupModal
                project={project}
                isOpen={isAiModalOpen}
                onClose={() => setIsAiModalOpen(false)}
                onSuccess={() => refetch()}
            />

            {/* CLI Setup Modal */}
            <CLISetupModal
                project={project}
                isOpen={isCliModalOpen}
                onClose={() => setIsCliModalOpen(false)}
            />
        </div>
    );
}

function ChecklistItem({ title, description, done, pendingAction, onAction, link, linkLabel }) {
    return (
        <div className={`rounded-xl border p-4 transition ${done ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-border bg-bg-primary/50'}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-text-primary">{title}</span>
                {done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                    <Circle className="h-4 w-4 text-text-muted shrink-0" />
                )}
            </div>
            <p className="mt-1.5 text-xs text-text-muted line-clamp-2">{description}</p>
            {!done && pendingAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-2.5 text-xs font-medium text-purple-400 hover:text-purple-300 transition"
                >
                    {pendingAction} &rarr;
                </button>
            )}
            {!done && link && (
                <Link
                    to={link}
                    className="mt-2.5 inline-block text-xs font-medium text-purple-400 hover:text-purple-300 transition"
                >
                    {linkLabel} &rarr;
                </Link>
            )}
        </div>
    );
}

function AISetupModal({ project, isOpen, onClose, onSuccess }) {
    // SECURITY INVARIANT:
    // Prompt data & raw API key exist ONLY in memory (component state).
    // Never write to localStorage, sessionStorage, logs, or analytics.
    const [promptData, setPromptData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(900);

    const loadPrompt = useCallback(async () => {
        if (!project?.id) return;
        setLoading(true);
        setError(null);
        setCopied(false);
        try {
            const data = await generateSetupPrompt(project.id);
            setPromptData(data);
            setSecondsRemaining(data.expires_in_seconds || 900);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to generate AI setup prompt.');
        } finally {
            setLoading(false);
        }
    }, [project?.id, onSuccess]);

    useEffect(() => {
        if (isOpen) {
            loadPrompt();
        } else {
            // Clear memory when modal closes
            setPromptData(null);
            setCopied(false);
        }
    }, [isOpen, loadPrompt]);

    // Expiry countdown timer
    useEffect(() => {
        if (!isOpen || !promptData || secondsRemaining <= 0) return;
        const timer = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen, promptData, secondsRemaining]);

    const formatTimer = (totalSec) => {
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleCopy = async () => {
        if (!promptData?.prompt) return;
        try {
            await navigator.clipboard.writeText(promptData.prompt);
            setCopied(true);
            toast.success('Setup prompt copied to clipboard! Paste it into Claude Code, Cursor, Copilot, or Antigravity.');
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error('Failed to copy to clipboard.');
        }
    };

    const isExpired = secondsRemaining <= 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        Set Up With AI (Claude Code, Cursor, Copilot)
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        One-click setup prompt for autonomous AI coding assistants. Integrates HVT into your app in under 5 minutes.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <RotateCw className="h-8 w-8 animate-spin text-purple-400 mb-3" />
                        <p className="text-sm font-medium text-text-primary">Minting temporary test management key...</p>
                        <p className="text-xs text-text-muted mt-1">Bound to test sandbox with 15-minute expiration.</p>
                    </div>
                ) : error ? (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs sm:text-sm text-red-300">
                        <p className="font-semibold text-red-200">Unable to generate setup prompt</p>
                        <p className="mt-1">{error}</p>
                        <button
                            type="button"
                            onClick={loadPrompt}
                            className="mt-3 inline-flex items-center gap-1.5 font-medium text-red-200 underline hover:no-underline"
                        >
                            <RotateCw className="h-3.5 w-3.5" /> Try again
                        </button>
                    </div>
                ) : promptData ? (
                    <div className="space-y-4">
                        {/* Masked key preview and expiry countdown */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-bg-primary p-3.5 text-xs">
                            <div className="space-y-1">
                                <span className="text-text-muted">Temporary Test Key (Shown Once):</span>
                                <div className="font-mono text-purple-300 font-semibold tracking-wide">
                                    {promptData.masked_key}
                                </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-300'}`}>
                                    <Clock className="h-3 w-3" />
                                    {isExpired ? 'Key Expired' : `Expires: ${formatTimer(secondsRemaining)}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={loadPrompt}
                                    title="Regenerate key"
                                    className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-bg-secondary transition"
                                >
                                    <RotateCw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Security Disclaimer */}
                        <p className="text-[11px] text-text-muted">
                            <strong className="text-text-secondary">Security note:</strong> This key is generated once in memory with test provisioning scopes and strictly never stored in localStorage, cookies, or analytics.
                        </p>

                        {/* Preview box */}
                        <div className="relative rounded-xl border border-border bg-[#101012] p-3 text-xs font-mono text-neutral-300 max-h-48 overflow-y-auto">
                            <pre className="whitespace-pre-wrap">{promptData.prompt}</pre>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={loadPrompt}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-bg-primary transition"
                            >
                                <RotateCw className="h-3.5 w-3.5" /> Regenerate
                            </button>

                            <button
                                type="button"
                                onClick={handleCopy}
                                disabled={isExpired}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500 disabled:opacity-50"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4 text-emerald-300" />
                                        Prompt Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" />
                                        Copy AI Prompt
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}

function CLISetupModal({ project, isOpen, onClose }) {
    const [copiedIndex, setCopiedIndex] = useState(null);

    const commands = [
        {
            title: '1. Authenticate with HVT CLI',
            cmd: 'npx @hvt/cli login',
        },
        {
            title: '2. Pull or inspect project schema',
            cmd: `npx @hvt/cli schema pull --project ${project?.slug || 'default'}`,
        },
        {
            title: '3. Preview declarative authentication plan (dry-run)',
            cmd: 'npx @hvt/cli schema plan',
        },
        {
            title: '4. Apply schema & mint runtime client keys',
            cmd: 'npx @hvt/cli schema sync',
        },
    ];

    const copyCmd = (cmd, index) => {
        navigator.clipboard.writeText(cmd);
        setCopiedIndex(index);
        toast.success('Command copied to clipboard');
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Terminal className="h-5 w-5 text-purple-400" />
                        Set Up With the HVT CLI
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                        Use <code className="text-purple-300">@hvt/cli</code> for declarative, scriptable authentication management in your terminal or CI/CD pipelines.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3.5 mt-3">
                    {commands.map((c, i) => (
                        <div key={i} className="space-y-1">
                            <span className="text-xs font-medium text-text-secondary">{c.title}</span>
                            <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-[#101012] px-3 py-2 font-mono text-xs text-purple-300">
                                <code>{c.cmd}</code>
                                <button
                                    type="button"
                                    onClick={() => copyCmd(c.cmd, i)}
                                    title="Copy command"
                                    className="p-1 rounded text-text-muted hover:text-white transition"
                                >
                                    {copiedIndex === i ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                        <Copy className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
