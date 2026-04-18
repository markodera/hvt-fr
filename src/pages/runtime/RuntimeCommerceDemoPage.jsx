import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    ArrowLeft,
    Boxes,
    KeyRound,
    Loader2,
    Lock,
    Mail,
    PackageCheck,
    ShieldCheck,
    ShoppingBag,
    Store,
    Truck,
    UserRound,
} from 'lucide-react';

import { CopyButton } from '@/components/CopyButton';
import { Logo } from '@/components/Logo';
import { PermissionGate } from '@/components/PermissionGate';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HVTApiError, HVTClient } from '@/lib/hvt';
import { getErrorMessage } from '@/lib/utils';
import { usePageTitle } from '@/hooks/usePageTitle';

const CONFIG_STORAGE_KEY = 'hvt.runtime_demo.config';
const SESSION_STORAGE_KEY = 'hvt.runtime_demo.session';

const AUTH_SURFACE = {
    backgroundImage:
        'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2718%27 height=%2718%27 viewBox=%270 0 18 18%27%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%2327272a%27 /%3E%3C/svg%3E")',
    backgroundRepeat: 'repeat',
};

const PERMISSION_BLUEPRINT = [
    { slug: 'catalog.read', label: 'Catalog read', description: 'Lets the user see the storefront catalog.' },
    { slug: 'orders.create', label: 'Order create', description: 'Lets the user place a new order.' },
    { slug: 'orders.read.own', label: 'Own orders', description: 'Lets the user view only orders they created.' },
    { slug: 'products.create', label: 'Product create', description: 'Lets the seller add new products.' },
    { slug: 'products.update.own', label: 'Own products', description: 'Lets the seller edit only products they own.' },
    { slug: 'orders.read.store', label: 'Store orders', description: 'Lets the seller see orders for their store.' },
    { slug: 'deliveries.read.assigned', label: 'Assigned deliveries', description: 'Lets the rider see deliveries assigned to them.' },
    { slug: 'deliveries.update.status', label: 'Delivery updates', description: 'Lets the rider update delivery progress.' },
    { slug: 'admin.manage', label: 'Admin manage', description: 'Lets app admins manage the marketplace operations desk.' },
];

const SAMPLE_PRODUCTS = [
    { id: 'sku-1', name: 'Market Tote', store: 'North Pier', price: '$48' },
    { id: 'sku-2', name: 'Cold Brew Kit', store: 'Bean District', price: '$34' },
    { id: 'sku-3', name: 'Courier Jacket', store: 'Rush Supply', price: '$89' },
];

const SAMPLE_CUSTOMER_ORDERS = [
    { id: 'ord-1001', item: 'Market Tote', status: 'Packing' },
    { id: 'ord-1002', item: 'Cold Brew Kit', status: 'Delivered' },
];

const SAMPLE_STORE_ORDERS = [
    { id: 'ord-2001', customer: 'Ada B.', total: '$120', status: 'Ready to ship' },
    { id: 'ord-2002', customer: 'Jon P.', total: '$48', status: 'Packing' },
];

const SAMPLE_DELIVERIES = [
    { id: 'del-3101', route: 'Marina -> Lekki', status: 'Picked up' },
    { id: 'del-3102', route: 'Yaba -> Ikeja', status: 'Awaiting pickup' },
];

const SAMPLE_ADMIN_ALERTS = [
    '2 pending seller approvals',
    '1 webhook retry waiting',
    '3 orders need manual review',
];

function SectionCard({ title, eyebrow, description, children, className = '' }) {
    return (
        <section className={`rounded-3xl border border-[#27272a] bg-[#111114] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] ${className}`}>
            {eyebrow ? <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71717a]">{eyebrow}</p> : null}
            <div className="mt-2">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description ? <p className="mt-1 text-sm text-[#a1a1aa]">{description}</p> : null}
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function LockedPanel({ title, copy }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#3f3f46] bg-[#0f0f12] p-5">
            <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-[#27272a] bg-[#17171c] p-2 text-[#a1a1aa]">
                    <Lock className="h-4 w-4" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm text-[#8b8b94]">{copy}</p>
                </div>
            </div>
        </div>
    );
}

function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string') {
        return {};
    }

    try {
        const [, payload] = token.split('.');
        if (!payload) {
            return {};
        }
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
        return JSON.parse(atob(padded));
    } catch {
        return {};
    }
}

function getDefaultConfig() {
    return {
        baseUrl: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
        apiKey: '',
    };
}

function loadConfig() {
    if (typeof window === 'undefined') {
        return getDefaultConfig();
    }

    try {
        const saved = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
        return { ...getDefaultConfig(), ...saved };
    } catch {
        return getDefaultConfig();
    }
}

function saveConfig(config) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    }
}

function loadSession() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
    } catch {
        return null;
    }
}

function saveSession(session) {
    if (typeof window === 'undefined') {
        return;
    }
    if (!session) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function createRuntimeClient({ baseUrl, apiKey, accessToken } = {}) {
    return new HVTClient({
        baseUrl,
        apiKey: apiKey || null,
        accessToken: accessToken || null,
        credentials: 'omit',
        fetch: (...args) => fetch(...args),
    });
}

function deriveFallbackAccess(claims) {
    const roleSlugs = Array.isArray(claims.app_roles) ? claims.app_roles : [];
    return {
        roles: roleSlugs.map((slug) => ({
            id: slug,
            slug,
            name: slug.replace(/\./g, ' ').replace(/_/g, ' '),
        })),
        permissions: Array.isArray(claims.app_permissions) ? claims.app_permissions : [],
    };
}

function getRuntimeRegisterGuidance(message) {
    const normalized = (message || '').toLowerCase();

    if (
        (normalized.includes('already') && normalized.includes('e-mail')) ||
        (normalized.includes('already') && normalized.includes('email')) ||
        normalized.includes('already registered')
    ) {
        return `${message} Existing users cannot join a new project through runtime signup. Sign in instead, accept a project invite, or ask an admin to assign project access.`;
    }

    return message;
}

async function hydrateRuntimeSession(config, accessToken) {
    const claims = decodeJwtPayload(accessToken);
    const client = createRuntimeClient({
        baseUrl: config.baseUrl,
        accessToken,
    });
    const me = await client.auth.me();
    const projectId = me?.project || claims.project_id || null;

    let access = deriveFallbackAccess(claims);
    if (projectId) {
        try {
            access = await client.request(`/api/v1/organizations/current/projects/${projectId}/access/`, {
                method: 'GET',
            });
        } catch (error) {
            if (!(error instanceof HVTApiError)) {
                throw error;
            }
        }
    }

    return {
        accessToken,
        claims,
        me,
        access,
        hydratedAt: new Date().toISOString(),
    };
}

function PermissionChip({ permission, active }) {
    return (
        <div className={`rounded-2xl border px-3 py-3 ${active ? 'border-[#16a34a]/40 bg-[#052e16] text-[#dcfce7]' : 'border-[#27272a] bg-[#151518] text-[#8b8b94]'}`}>
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="font-mono text-xs">{permission.slug}</p>
                    <p className="mt-1 text-xs">{permission.label}</p>
                </div>
                <Badge variant={active ? 'success' : 'secondary'}>{active ? 'active' : 'missing'}</Badge>
            </div>
            <p className="mt-2 text-xs opacity-80">{permission.description}</p>
        </div>
    );
}

export default function RuntimeCommerceDemoPage() {
    usePageTitle('Live Permission Renderer');
    const [config, setConfig] = useState(() => loadConfig());
    const [session, setSession] = useState(() => loadSession());
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [busyAction, setBusyAction] = useState('');
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        saveConfig(config);
    }, [config]);

    useEffect(() => {
        saveSession(session);
    }, [session]);

    const permissions = useMemo(() => session?.access?.permissions || [], [session]);
    const appRoles = useMemo(() => session?.access?.roles || [], [session]);
    const projectId = session?.me?.project || session?.claims?.project_id || null;

    const hasPermission = (slug) => permissions.includes(slug);
    const hasAdminPanel =
        hasPermission('admin.manage') ||
        hasPermission('admin.create.own') ||
        hasPermission('operations.manage');

    const blueprintText = PERMISSION_BLUEPRINT.map((item) => item.slug).join('\n');

    async function reloadAccess() {
        if (!session?.accessToken) {
            return;
        }

        setBusyAction('reload');
        setError('');
        setNotice('');
        try {
            const hydrated = await hydrateRuntimeSession(config, session.accessToken);
            setSession(hydrated);
            setNotice('Live project access reloaded from HVT.');
        } catch (nextError) {
            setError(getErrorMessage(nextError));
        } finally {
            setBusyAction('');
        }
    }

    async function handleRuntimeLogin(event) {
        event.preventDefault();
        setBusyAction('login');
        setError('');
        setNotice('');

        try {
            const client = createRuntimeClient({
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
            });
            const response = await client.auth.runtimeLogin({
                email: form.email,
                password: form.password,
            });

            if (!response?.access) {
                throw new Error('Runtime login did not return an access token.');
            }

            const hydrated = await hydrateRuntimeSession(config, response.access);
            setSession(hydrated);
            setNotice('Runtime session loaded. The app is now enforcing the live HVT permission set.');
        } catch (nextError) {
            setError(getErrorMessage(nextError));
        } finally {
            setBusyAction('');
        }
    }

    async function handleRuntimeRegister(event) {
        event.preventDefault();
        setBusyAction('register');
        setError('');
        setNotice('');

        try {
            const client = createRuntimeClient({
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
            });
            const response = await client.request('/api/v1/auth/runtime/register/', {
                method: 'POST',
                auth: 'apiKey',
                body: {
                    email: form.email,
                    password1: form.password,
                    password2: form.confirmPassword || form.password,
                    first_name: form.first_name,
                    last_name: form.last_name,
                },
            });

            setNotice(response?.detail || 'Runtime registration submitted. Check e-mail verification before login.');
        } catch (nextError) {
            setError(getRuntimeRegisterGuidance(getErrorMessage(nextError)));
        } finally {
            setBusyAction('');
        }
    }

    async function handlePasswordResetRequest() {
        setBusyAction('reset');
        setError('');
        setNotice('');

        try {
            const client = createRuntimeClient({
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
            });
            await client.request('/api/v1/auth/runtime/password/reset/', {
                method: 'POST',
                auth: 'apiKey',
                body: {
                    email: form.email,
                },
            });
            setNotice('If that runtime account exists for this project, a password reset email has been sent.');
        } catch (nextError) {
            setError(getErrorMessage(nextError));
        } finally {
            setBusyAction('');
        }
    }

    async function handleResendVerification() {
        setBusyAction('resend');
        setError('');
        setNotice('');

        try {
            const client = createRuntimeClient({
                baseUrl: config.baseUrl,
                apiKey: config.apiKey,
            });
            await client.request('/api/v1/auth/runtime/register/resend-email/', {
                method: 'POST',
                auth: 'apiKey',
                body: {
                    email: form.email,
                },
            });
            setNotice('If that runtime account is still pending verification in this project, a fresh verification email has been sent.');
        } catch (nextError) {
            setError(getErrorMessage(nextError));
        } finally {
            setBusyAction('');
        }
    }

    function handleLogout() {
        setSession(null);
        setNotice('Runtime session cleared from the demo.');
        setError('');
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white" style={AUTH_SURFACE}>
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at top center, rgba(124,58,237,0.15), transparent 56%)',
                }}
            />
            <Helmet>
                <title>HVT Runtime Demo - Live Permission Renderer</title>
                <meta name="description" content="This page reads the permission slugs embedded in your HVT runtime tokens and renders UI modules based on your exact granted capabilities. It automatically adjusts to whatever roles and permissions you configure in your project." />
            </Helmet>
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6 max-w-3xl">
                    <div className="mb-8 flex flex-col items-start gap-4">
                          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white">
                              <ArrowLeft className="h-4 w-4" />
                              Back to Dashboard
                        </Link>
                        <Logo />
                    </div>
                    <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b8b94]">Runtime Demo</p>
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-white">Live Permission Renderer</h1>
                        <p className="mt-3 text-sm text-white/60 leading-relaxed">
                            This page reads the permission slugs embedded in your HVT runtime tokens and renders UI modules based on your exact granted capabilities. It automatically adjusts to whatever roles and permissions you configure in your project.
                        </p>
                    </div>
                </div>

                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Badge variant="warning">Internal testing surface</Badge>
                    <Badge variant="secondary">Token-only demo</Badge>
                </div>

                <div className="mb-6 rounded-2xl border border-[#4c1d95]/30 bg-[#05020a] p-4 text-sm text-[#d8b4fe]">
                    Do not ship a browser app that exposes a live project API key. This page is only an internal reference surface.
                    A production app should keep the HVT runtime API key on its own backend and forward auth requests server-side.
                </div>

                {notice ? (
                    <div className="mb-4 rounded-2xl border border-[#14532d] bg-[#052e16] px-4 py-3 text-sm text-[#dcfce7]">{notice}</div>
                ) : null}
                {error ? (
                    <div className="mb-4 rounded-2xl border border-[#7f1d1d] bg-[#2a0f12] px-4 py-3 text-sm text-[#fecaca]">{error}</div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <SectionCard
                            eyebrow="Connection"
                            title="Runtime config"
                            description="Point the demo at your HVT API base URL and a project API key with auth:runtime."
                        >
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">API base URL</Label>
                                    <Input
                                        value={config.baseUrl}
                                        onChange={(event) => setConfig((current) => ({ ...current, baseUrl: event.target.value }))}
                                        className="h-11 border-[#27272a] bg-[#0d0d11] text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Project API key</Label>
                                    <Input
                                        value={config.apiKey}
                                        onChange={(event) => setConfig((current) => ({ ...current, apiKey: event.target.value }))}
                                        placeholder="hvt_test_..."
                                        className="h-11 border-[#27272a] bg-[#0d0d11] font-mono text-white"
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Auth"
                            title="Runtime sign-in"
                            description="Register a customer account or log in as an existing runtime user for this project."
                        >
                            <form className="space-y-4" onSubmit={handleRuntimeLogin}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">First name</Label>
                                        <Input
                                            value={form.first_name}
                                            onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                                            className="h-11 border-[#27272a] bg-[#0d0d11] text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Last name</Label>
                                        <Input
                                            value={form.last_name}
                                            onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                                            className="h-11 border-[#27272a] bg-[#0d0d11] text-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Email</Label>
                                    <Input
                                        type="email"
                                        value={form.email}
                                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                        className="h-11 border-[#27272a] bg-[#0d0d11] text-white"
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Password</Label>
                                        <Input
                                            type="password"
                                            value={form.password}
                                            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                                            className="h-11 border-[#27272a] bg-[#0d0d11] text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a] whitespace-nowrap truncate">Confirm</Label>
                                        <Input
                                            type="password"
                                            value={form.confirmPassword}
                                            onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                                            className="h-11 border-[#27272a] bg-[#0d0d11] text-white"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <Button type="submit" disabled={busyAction === 'login'} className="h-11">
                                        {busyAction === 'login' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                        Sign in
                                    </Button>
                                    <Button type="button" variant="secondary" disabled={busyAction === 'register'} className="h-11" onClick={handleRuntimeRegister}>
                                        {busyAction === 'register' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRound className="mr-2 h-4 w-4" />}
                                        Register
                                    </Button>
                                    <Button type="button" variant="secondary" disabled={busyAction === 'reset'} className="h-11" onClick={handlePasswordResetRequest}>
                                        {busyAction === 'reset' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                        Send reset email
                                    </Button>
                                    <Button type="button" variant="outline" disabled={busyAction === 'resend'} className="h-11" onClick={handleResendVerification}>
                                        {busyAction === 'resend' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                                        Resend verification
                                    </Button>
                                </div>

                                <p className="text-xs text-[#71717a]">
                                    Runtime registration still follows HVT verification rules. Existing users must sign in or accept an invite; signup does not attach them to another project.
                                </p>
                            </form>
                        </SectionCard>

                        <SectionCard
                            eyebrow="Access"
                            title="Session snapshot"
                            description="This is the exact runtime context your app code should check before showing protected features."
                        >
                            {session ? (
                                <div className="space-y-4 text-sm">
                                    <div className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-4">
                                        <p className="font-semibold text-white">{session.me?.full_name || session.me?.email}</p>
                                        <p className="mt-1 text-[#8b8b94]">{session.me?.email}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <Badge variant="secondary">Org role: {session.me?.role || 'member'}</Badge>
                                            <Badge variant="secondary">Project: {session.me?.project_slug || session.claims?.project_slug || 'n/a'}</Badge>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">App roles</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {appRoles.length ? (
                                                appRoles.map((role) => (
                                                    <Badge key={role.slug || role.id} variant="default">
                                                        {role.slug || role.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge variant="secondary">No app roles resolved</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Effective permissions</p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {permissions.length ? (
                                                permissions.map((permission) => (
                                                    <Badge key={permission} variant="success">
                                                        {permission}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <Badge variant="secondary">No permissions resolved</Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Button variant="secondary" className="h-11" disabled={busyAction === 'reload'} onClick={reloadAccess}>
                                            {busyAction === 'reload' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                            Reload live access
                                        </Button>
                                        <Button variant="outline" className="h-11" onClick={handleLogout}>
                                            Clear runtime session
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <LockedPanel
                                    title="No runtime session yet"
                                    copy="Sign in with a runtime user to hydrate /auth/me and the live project access endpoint."
                                />
                            )}
                        </SectionCard>
                    </div>

                    <div className="space-y-6">
                        <SectionCard
                            eyebrow="Blueprint"
                            title="Permission contract for this sample"
                            description="These are the slugs this demo checks at runtime. Create them in Project Access, then attach them to whichever roles your app needs."
                        >
                            <div className="mb-4 flex items-center justify-between rounded-2xl border border-[#27272a] bg-[#0d0d11] px-4 py-3">
                                <div>
                                    <p className="text-sm font-medium text-white">Copy all sample slugs</p>
                                    <p className="text-xs text-[#8b8b94]">Paste these into your project permission setup.</p>
                                </div>
                                <CopyButton value={blueprintText} />
                            </div>

                            <div className="grid gap-3 lg:grid-cols-2">
                                {PERMISSION_BLUEPRINT.map((permission) => (
                                    <PermissionChip
                                        key={permission.slug}
                                        permission={permission}
                                        active={permissions.includes(permission.slug)}
                                    />
                                ))}
                            </div>
                        </SectionCard>

                        <SectionCard
                            eyebrow="App"
                            title="Reference storefront"
                            description="Every section below is gated by permission slug. The UI is intentionally split by capability, not by hard-coded role label."
                        >
                            {session ? (
                                <div className="grid gap-4 xl:grid-cols-2">
                                    <PermissionGate
                                        permissions={permissions}
                                        anyOf={['catalog.read']}
                                        fallback={
                                            <LockedPanel
                                                title="Customer storefront locked"
                                                copy="Grant catalog.read before this user can browse the marketplace."
                                            />
                                        }
                                    >
                                        <div className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="rounded-2xl border border-[#27272a] bg-[#17171c] p-2 text-[#c4b5fd]">
                                                    <ShoppingBag className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white">Customer storefront</h3>
                                                    <p className="text-xs text-[#8b8b94]">Browse products and place orders if the token allows it.</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                {SAMPLE_PRODUCTS.map((product) => (
                                                    <div key={product.id} className="rounded-2xl border border-[#1f1f24] bg-[#141419] p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-medium text-white">{product.name}</p>
                                                                <p className="mt-1 text-sm text-[#8b8b94]">{product.store}</p>
                                                            </div>
                                                            <Badge variant="secondary">{product.price}</Badge>
                                                        </div>
                                                        <Button
                                                            className="mt-3 h-9"
                                                            disabled={!hasPermission('orders.create')}
                                                            variant={hasPermission('orders.create') ? 'default' : 'secondary'}
                                                        >
                                                            {hasPermission('orders.create') ? 'Add to order' : 'orders.create required'}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            <PermissionGate
                                                permissions={permissions}
                                                anyOf={['orders.read.own']}
                                                fallback={
                                                    <p className="mt-4 text-sm text-[#8b8b94]">
                                                        This user cannot view personal orders yet. Grant <span className="font-mono text-[#d4d4d8]">orders.read.own</span>.
                                                    </p>
                                                }
                                            >
                                                <div className="mt-5">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Customer order history</p>
                                                    <div className="mt-3 space-y-2">
                                                        {SAMPLE_CUSTOMER_ORDERS.map((order) => (
                                                            <div key={order.id} className="flex items-center justify-between rounded-2xl border border-[#1f1f24] bg-[#141419] px-4 py-3 text-sm">
                                                                <div>
                                                                    <p className="font-medium text-white">{order.item}</p>
                                                                    <p className="text-[#8b8b94]">{order.id}</p>
                                                                </div>
                                                                <Badge variant="success">{order.status}</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </PermissionGate>
                                        </div>
                                    </PermissionGate>
                                    <PermissionGate
                                        permissions={permissions}
                                        anyOf={['products.create', 'products.update.own', 'orders.read.store']}
                                        fallback={
                                            <LockedPanel
                                                title="Seller studio locked"
                                                copy="Grant products.create, products.update.own, or orders.read.store for merchant workflows."
                                            />
                                        }
                                    >
                                        <div className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="rounded-2xl border border-[#27272a] bg-[#17171c] p-2 text-[#93c5fd]">
                                                    <Store className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white">Seller studio</h3>
                                                    <p className="text-xs text-[#8b8b94]">Merchant tools only render when the permission bundle allows them.</p>
                                                </div>
                                            </div>

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div className="rounded-2xl border border-[#1f1f24] bg-[#141419] p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Products</p>
                                                    <p className="mt-2 text-sm text-[#d4d4d8]">Add a new item or update one owned by this seller.</p>
                                                    <div className="mt-3 flex gap-2">
                                                        <Button size="sm" disabled={!hasPermission('products.create')}>
                                                            New product
                                                        </Button>
                                                        <Button size="sm" variant="secondary" disabled={!hasPermission('products.update.own')}>
                                                            Edit own product
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-[#1f1f24] bg-[#141419] p-4">
                                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">Store orders</p>
                                                    <p className="mt-2 text-sm text-[#d4d4d8]">These rows only make sense for store operators.</p>
                                                    <div className="mt-3 space-y-2">
                                                        {SAMPLE_STORE_ORDERS.map((order) => (
                                                            <div key={order.id} className="rounded-xl border border-[#27272a] px-3 py-2 text-sm">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <p className="text-white">{order.customer}</p>
                                                                    <Badge variant="secondary">{order.total}</Badge>
                                                                </div>
                                                                <p className="mt-1 text-[#8b8b94]">{order.status}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </PermissionGate>

                                    <PermissionGate
                                        permissions={permissions}
                                        anyOf={['deliveries.read.assigned', 'deliveries.update.status']}
                                        fallback={
                                            <LockedPanel
                                                title="Delivery board locked"
                                                copy="Grant deliveries.read.assigned or deliveries.update.status for rider workflows."
                                            />
                                        }
                                    >
                                        <div className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="rounded-2xl border border-[#27272a] bg-[#17171c] p-2 text-[#fca5a5]">
                                                    <Truck className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white">Delivery board</h3>
                                                    <p className="text-xs text-[#8b8b94]">Courier access stays limited to assigned deliveries and status updates.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {SAMPLE_DELIVERIES.map((delivery) => (
                                                    <div key={delivery.id} className="rounded-2xl border border-[#1f1f24] bg-[#141419] p-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="font-medium text-white">{delivery.route}</p>
                                                                <p className="mt-1 text-sm text-[#8b8b94]">{delivery.id}</p>
                                                            </div>
                                                            <Badge variant="warning">{delivery.status}</Badge>
                                                        </div>
                                                        <Button className="mt-3 h-9" variant="secondary" disabled={!hasPermission('deliveries.update.status')}>
                                                            {hasPermission('deliveries.update.status') ? 'Update delivery status' : 'deliveries.update.status required'}
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PermissionGate>

                                    <PermissionGate
                                        permissions={permissions}
                                        anyOf={hasAdminPanel ? ['admin.manage', 'admin.create.own', 'operations.manage'] : ['__never__']}
                                        fallback={
                                            <LockedPanel
                                                title="Operations desk locked"
                                                copy="Grant admin.manage or your own equivalent admin slug to unlock the marketplace control module."
                                            />
                                        }
                                    >
                                        <div className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-5">
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="rounded-2xl border border-[#27272a] bg-[#17171c] p-2 text-[#86efac]">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white">Operations desk</h3>
                                                    <p className="text-xs text-[#8b8b94]">This stands in for the project-level admin console inside the customer app.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {SAMPLE_ADMIN_ALERTS.map((alert) => (
                                                    <div key={alert} className="flex items-center gap-3 rounded-2xl border border-[#1f1f24] bg-[#141419] px-4 py-3 text-sm">
                                                        <PackageCheck className="h-4 w-4 text-[#86efac]" />
                                                        <span className="text-[#d4d4d8]">{alert}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PermissionGate>
                                </div>
                            ) : (
                                <LockedPanel
                                    title="No runtime app context"
                                    copy="Once you sign in, this area becomes the customer app and renders only the modules allowed by the HVT permission set."
                                />
                            )}
                        </SectionCard>

                        <SectionCard
                            eyebrow="Pattern"
                            title="How the enforcement works"
                            description="This is the contract the customer app should copy, whether it is written in React, Node, Django, or Laravel."
                        >
                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <Boxes className="h-4 w-4 text-[#c4b5fd]" />
                                        <p className="text-sm font-semibold text-white">UI gating</p>
                                    </div>
                                    <pre className="overflow-x-auto rounded-xl bg-[#09090b] p-4 text-xs text-[#d4d4d8]">{`const canCreateOrder = permissions.includes('orders.create')

if (canCreateOrder) {
  showCheckoutButton()
}`}</pre>
                                </div>

                                <div className="rounded-2xl border border-[#27272a] bg-[#0d0d11] p-4">
                                    <div className="mb-3 flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-[#86efac]" />
                                        <p className="text-sm font-semibold text-white">Server-side scope</p>
                                    </div>
                                    <pre className="overflow-x-auto rounded-xl bg-[#09090b] p-4 text-xs text-[#d4d4d8]">{`if (!permissions.includes('orders.read.own')) {
  return 403
}

return Order.where({ customer_id: currentUser.id })`}</pre>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-[#27272a] bg-[#0d0d11] p-4 text-sm text-[#a1a1aa]">
                                The role label is just the bundle name. The real contract is always permission slug plus record scope.
                                For this session, the current project is <span className="font-mono text-[#d4d4d8]">{projectId || 'not resolved'}</span>.
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </div>
    );
}
