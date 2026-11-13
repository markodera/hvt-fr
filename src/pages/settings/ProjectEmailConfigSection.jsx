// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { AlertCircle, Check, Key, Mail, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
    getProjectEmailConfig,
    updateProjectEmailConfig,
    testProjectEmailConfig,
} from '@/api/emailConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const PROVIDER_OPTIONS = [
    { value: 'system_default', label: 'System Default (HVT Hosted)', description: 'Uses the default system email delivery configuration.' },
    { value: 'smtp', label: 'Custom SMTP', description: 'Connect your own SMTP host, SendGrid, Mailgun, or corporate mail server.' },
    { value: 'resend', label: 'Resend API', description: 'Deliver transaction emails via Resend HTTP API.' },
    { value: 'postmark', label: 'Postmark API', description: 'Deliver transactional emails via Postmark API token.' },
    { value: 'ses', label: 'Amazon SES', description: 'Deliver transactional emails via AWS Simple Email Service credentials.' },
];

export function ProjectEmailConfigSection({ projects = [] }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [testResult, setTestResult] = useState(null);

    // Editing toggles for write-only sensitive fields
    const [editingSmtpPassword, setEditingSmtpPassword] = useState(false);
    const [editingApiKey, setEditingApiKey] = useState(false);
    const [editingAwsSecret, setEditingAwsSecret] = useState(false);

    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    useEffect(() => {
        if (user?.email) {
            setTestEmail(user.email);
        }
    }, [user?.email]);

    const {
        data: config,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['projectEmailConfig', selectedProjectId],
        queryFn: () => getProjectEmailConfig(selectedProjectId),
        enabled: Boolean(selectedProjectId),
    });

    const { register, handleSubmit, reset, watch } = useForm({
        defaultValues: {
            provider: 'system_default',
            from_email: '',
            from_name: '',
            is_active: true,
            smtp_host: '',
            smtp_port: 587,
            smtp_username: '',
            smtp_password: '',
            smtp_use_tls: true,
            smtp_use_ssl: false,
            api_key: '',
            aws_region: 'us-east-1',
            aws_access_key_id: '',
            aws_secret_access_key: '',
        },
    });

    const currentProvider = watch('provider');

    useEffect(() => {
        if (config) {
            reset({
                provider: config.provider || 'system_default',
                from_email: config.from_email || '',
                from_name: config.from_name || '',
                is_active: config.is_active ?? true,
                smtp_host: config.smtp_host || '',
                smtp_port: config.smtp_port || 587,
                smtp_username: config.smtp_username || '',
                smtp_password: '',
                smtp_use_tls: config.smtp_use_tls ?? true,
                smtp_use_ssl: config.smtp_use_ssl ?? false,
                api_key: '',
                aws_region: config.aws_region || 'us-east-1',
                aws_access_key_id: config.aws_access_key_id || '',
                aws_secret_access_key: '',
            });
            setEditingSmtpPassword(!config.has_smtp_password);
            setEditingApiKey(!config.has_api_key);
            setEditingAwsSecret(!config.has_aws_secret_access_key);
        }
    }, [config, reset]);

    const saveMutation = useMutation({
        mutationFn: (values) => {
            const payload = {
                provider: values.provider,
                from_email: values.from_email,
                from_name: values.from_name,
                is_active: values.is_active,
            };

            if (values.provider === 'smtp') {
                payload.smtp_host = values.smtp_host;
                payload.smtp_port = Number(values.smtp_port) || 587;
                payload.smtp_username = values.smtp_username;
                payload.smtp_use_tls = values.smtp_use_tls;
                payload.smtp_use_ssl = values.smtp_use_ssl;
                if (editingSmtpPassword && values.smtp_password) {
                    payload.smtp_password = values.smtp_password;
                }
            } else if (values.provider === 'resend' || values.provider === 'postmark') {
                if (editingApiKey && values.api_key) {
                    payload.api_key = values.api_key;
                }
            } else if (values.provider === 'ses') {
                payload.aws_region = values.aws_region;
                payload.aws_access_key_id = values.aws_access_key_id;
                if (editingAwsSecret && values.aws_secret_access_key) {
                    payload.aws_secret_access_key = values.aws_secret_access_key;
                }
            }

            return updateProjectEmailConfig(selectedProjectId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectEmailConfig', selectedProjectId] });
            toast.success('Project email configuration saved');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err, 'Failed to save email configuration'));
        },
    });

    const testMutation = useMutation({
        mutationFn: (to_email) => testProjectEmailConfig(selectedProjectId, { to_email }),
        onSuccess: (res) => {
            setTestResult({
                success: true,
                message: res.message || 'Test email dispatched successfully!',
                details: res.details,
            });
            toast.success('Test email dispatched');
        },
        onError: (err) => {
            setTestResult({
                success: false,
                message: getErrorMessage(err, 'Failed to send test email'),
            });
            toast.error('Test email failed');
        },
    });

    function onSubmit(values) {
        saveMutation.mutate(values);
    }

    function handleSendTest(e) {
        e.preventDefault();
        if (!testEmail) {
            toast.error('Recipient email address is required');
            return;
        }
        setTestResult(null);
        testMutation.mutate(testEmail);
    }

    const canSendTest = config && config.provider !== 'system_default' && config.is_active;

    return (
        <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold text-text-primary">
                            Bring-Your-Own Email Configuration
                        </h3>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                        Configure project-specific SMTP or transactional email providers for password resets, verification emails, and magic links.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {projects.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-muted">Project:</span>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="h-9 rounded-lg border border-border bg-bg-primary px-3 text-xs text-text-primary outline-none focus:border-primary"
                            >
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canSendTest}
                        onClick={() => {
                            setTestResult(null);
                            setTestDialogOpen(true);
                        }}
                    >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Send Test Email
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <LoadingSpinner size="md" />
                </div>
            ) : isError ? (
                <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                    Failed to load email settings for this project.
                </div>
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
                    {/* Provider Selector */}
                    <div className="space-y-2">
                        <Label htmlFor="email-provider">Email Provider</Label>
                        <select
                            id="email-provider"
                            {...register('provider')}
                            className="h-10 w-full rounded-md border border-border bg-bg-primary px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                            {PROVIDER_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-text-muted">
                            {PROVIDER_OPTIONS.find((o) => o.value === currentProvider)?.description}
                        </p>
                    </div>

                    {currentProvider !== 'system_default' && (
                        <div className="space-y-5 rounded-xl border border-border bg-bg-tertiary p-5">
                            {/* Sender Details */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="from_email">Sender Email Address (From)</Label>
                                    <Input
                                        id="from_email"
                                        type="email"
                                        placeholder="auth@yourdomain.com"
                                        {...register('from_email')}
                                    />
                                    <p className="text-[11px] text-text-muted">Must be an authorized sender on your email provider.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="from_name">Sender Display Name</Label>
                                    <Input
                                        id="from_name"
                                        type="text"
                                        placeholder="My App Security"
                                        {...register('from_name')}
                                    />
                                </div>
                            </div>

                            {/* SMTP Specific Config */}
                            {currentProvider === 'smtp' && (
                                <div className="space-y-4 border-t border-border pt-4">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="space-y-2 sm:col-span-2">
                                            <Label htmlFor="smtp_host">SMTP Host</Label>
                                            <Input
                                                id="smtp_host"
                                                placeholder="smtp.mailgun.org, smtp.sendgrid.net"
                                                {...register('smtp_host')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="smtp_port">SMTP Port</Label>
                                            <Input
                                                id="smtp_port"
                                                type="number"
                                                placeholder="587"
                                                {...register('smtp_port')}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="smtp_username">SMTP Username</Label>
                                            <Input
                                                id="smtp_username"
                                                placeholder="postmaster@yourdomain.com"
                                                {...register('smtp_username')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor="smtp_password">SMTP Password</Label>
                                                {config?.has_smtp_password && !editingSmtpPassword && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditingSmtpPassword(true)}
                                                        className="text-xs text-primary hover:underline"
                                                    >
                                                        Change password
                                                    </button>
                                                )}
                                            </div>
                                            {config?.has_smtp_password && !editingSmtpPassword ? (
                                                <Input
                                                    id="smtp_password"
                                                    value="••••••••••••••••"
                                                    disabled
                                                    className="opacity-70 font-mono"
                                                />
                                            ) : (
                                                <Input
                                                    id="smtp_password"
                                                    type="password"
                                                    placeholder="Enter SMTP password"
                                                    {...register('smtp_password')}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                                            <input
                                                type="checkbox"
                                                {...register('smtp_use_tls')}
                                                className="rounded border-border bg-bg-primary text-primary focus:ring-primary"
                                            />
                                            <span>Use STARTTLS (Port 587 recommended)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-xs text-text-secondary">
                                            <input
                                                type="checkbox"
                                                {...register('smtp_use_ssl')}
                                                className="rounded border-border bg-bg-primary text-primary focus:ring-primary"
                                            />
                                            <span>Use SSL/TLS (Port 465)</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Resend / Postmark Config */}
                            {(currentProvider === 'resend' || currentProvider === 'postmark') && (
                                <div className="space-y-4 border-t border-border pt-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="api_key">
                                                {currentProvider === 'resend' ? 'Resend API Key' : 'Postmark Server API Token'}
                                            </Label>
                                            {config?.has_api_key && !editingApiKey && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingApiKey(true)}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Change API key
                                                </button>
                                            )}
                                        </div>
                                        {config?.has_api_key && !editingApiKey ? (
                                            <Input
                                                id="api_key"
                                                value="••••••••••••••••••••••••••••••••"
                                                disabled
                                                className="opacity-70 font-mono"
                                            />
                                        ) : (
                                            <Input
                                                id="api_key"
                                                type="password"
                                                placeholder={currentProvider === 'resend' ? 're_...' : '••••••••-••••-••••'}
                                                {...register('api_key')}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SES Config */}
                            {currentProvider === 'ses' && (
                                <div className="space-y-4 border-t border-border pt-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="aws_region">AWS Region</Label>
                                            <Input
                                                id="aws_region"
                                                placeholder="us-east-1, eu-west-1"
                                                {...register('aws_region')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="aws_access_key_id">AWS Access Key ID</Label>
                                            <Input
                                                id="aws_access_key_id"
                                                placeholder="AKIA..."
                                                {...register('aws_access_key_id')}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="aws_secret_access_key">AWS Secret Access Key</Label>
                                            {config?.has_aws_secret_access_key && !editingAwsSecret && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingAwsSecret(true)}
                                                    className="text-xs text-primary hover:underline"
                                                >
                                                    Change secret
                                                </button>
                                            )}
                                        </div>
                                        {config?.has_aws_secret_access_key && !editingAwsSecret ? (
                                            <Input
                                                id="aws_secret_access_key"
                                                value="••••••••••••••••••••••••••••••••"
                                                disabled
                                                className="opacity-70 font-mono"
                                            />
                                        ) : (
                                            <Input
                                                id="aws_secret_access_key"
                                                type="password"
                                                placeholder="Enter AWS Secret Access Key"
                                                {...register('aws_secret_access_key')}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={saveMutation.isPending}
                        >
                            {saveMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Email Configuration
                        </Button>
                    </div>
                </form>
            )}

            {/* Test Email Dialog */}
            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSendTest} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5 text-primary" />
                                Send Test Email
                            </DialogTitle>
                            <DialogDescription>
                                Dispatches an interactive test email using the currently saved provider credentials for this project.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-2">
                            <Label htmlFor="test-recipient">Recipient Email</Label>
                            <Input
                                id="test-recipient"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="developer@example.com"
                                required
                            />
                            <p className="text-[11px] text-text-muted">
                                Defaults to your verified account email to prevent outbound relay abuse.
                            </p>
                        </div>

                        {testResult && (
                            <div
                                className={`rounded-xl border p-4 text-xs ${
                                    testResult.success
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 font-semibold">
                                    {testResult.success ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4" />
                                    )}
                                    <span>{testResult.success ? 'Delivery Succeeded' : 'Delivery Failed'}</span>
                                </div>
                                <p className="mt-1 font-mono text-[11px] break-all">{testResult.message}</p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setTestDialogOpen(false)}
                            >
                                Close
                            </Button>
                            <Button
                                type="submit"
                                disabled={testMutation.isPending}
                            >
                                {testMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Send Test
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
