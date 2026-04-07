import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ExternalLink, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';

import { Logo } from '@/components/Logo';
import { HVTApiError, HVTClient } from '@/lib/hvt';

const CONFIG_STORAGE_KEY = 'hvt.runtime_playground.config';
const PROVIDERS_STORAGE_KEY = 'hvt.runtime_playground.providers';
const SOCIAL_PENDING_STORAGE_KEY = 'hvt.runtime_playground.pending_social';

const AUTH_SURFACE = {
    backgroundImage:
        'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2718%27 height=%2718%27 viewBox=%270 0 18 18%27%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%2327272a%27 /%3E%3C/svg%3E")',
    backgroundRepeat: 'repeat',
};

const socialCallbackRequests = new Map();

function getDefaultOrigin() {
    if (typeof window === 'undefined') return 'https://hvts.app';
    return window.location.origin;
}

function getDefaultConfig() {
    const origin = getDefaultOrigin();
    return {
        baseUrl: import.meta.env.VITE_API_URL || 'https://api.hvts.app',
        apiKey: '',
        googleCallbackUrl: `${origin}/runtime-playground/callback/google`,
        githubCallbackUrl: `${origin}/runtime-playground/callback/github`,
    };
}

function loadConfig() {
    if (typeof window === 'undefined') return getDefaultConfig();

    try {
        const saved = JSON.parse(localStorage.getItem(CONFIG_STORAGE_KEY) || '{}');
        return {
            ...getDefaultConfig(),
            ...saved,
        };
    } catch {
        return getDefaultConfig();
    }
}

function saveConfig(config) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

function saveProviders(providers) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
}

function loadProviders() {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(sessionStorage.getItem(PROVIDERS_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function savePendingSocial(payload) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(SOCIAL_PENDING_STORAGE_KEY, JSON.stringify(payload));
}

function loadPendingSocial() {
    if (typeof window === 'undefined') return null;
    try {
        return JSON.parse(sessionStorage.getItem(SOCIAL_PENDING_STORAGE_KEY) || 'null');
    } catch {
        return null;
    }
}

function clearPendingSocial() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(SOCIAL_PENDING_STORAGE_KEY);
}

function createClient(config) {
    return new HVTClient({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        credentials: 'omit',
        fetch: (...args) => fetch(...args),
    });
}

function runtimeRegister(client, payload) {
    return client.request('/api/v1/auth/runtime/register/', {
        method: 'POST',
        auth: 'apiKey',
        body: payload,
    });
}

function getProviderLabel(provider) {
    if (provider === 'google') return 'Google';
    if (provider === 'github') return 'GitHub';
    return 'Social provider';
}

function extractFirstErrorMessage(value) {
    if (typeof value === 'string' && value.trim()) {
        return value.trim();
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            const message = extractFirstErrorMessage(item);
            if (message) return message;
        }
        return '';
    }

    if (!value || typeof value !== 'object') {
        return '';
    }

    if (Array.isArray(value.non_field_errors)) {
        return extractFirstErrorMessage(value.non_field_errors);
    }

    for (const nestedValue of Object.values(value)) {
        const message = extractFirstErrorMessage(nestedValue);
        if (message) return message;
    }

    return '';
}

function formatErrorDetails(value) {
    if (!value || typeof value !== 'object') {
        return '';
    }

    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return '';
    }
}

function getErrorMessage(error) {
    if (error instanceof HVTApiError) {
        if (typeof error.detail === 'string' && error.detail.trim()) return error.detail;
        const nestedDetailMessage = extractFirstErrorMessage(error.detail);
        if (nestedDetailMessage) return nestedDetailMessage;
        if (error.body && typeof error.body === 'object' && error.body !== null) {
            const nestedBodyMessage = extractFirstErrorMessage(error.body);
            if (nestedBodyMessage) return nestedBodyMessage;
            try {
                return JSON.stringify(error.body, null, 2);
            } catch {
                return error.message;
            }
        }
        return error.message;
    }

    if (error instanceof Error) return error.message;
    return 'An unexpected error occurred.';
}

function getFriendlyRuntimeSocialErrorMessage(message, provider, callbackUrl) {
    const providerLabel = getProviderLabel(provider);

    if (message === 'These credentials do not belong to the API key organization.') {
        return `This ${providerLabel} account is already linked to a different organization. Use an account that belongs to this API key, or try a fresh ${providerLabel} account.`;
    }

    if (message === 'These credentials do not belong to the API key project.') {
        return `This ${providerLabel} account belongs to the same organization but a different project. Use an account linked to this project, or switch the runtime API key to the matching project.`;
    }

    if (message === 'This user is not assigned to an organization.') {
        return `This ${providerLabel} account is not linked to a runtime organization yet. Use an invited account for this project, or try a fresh ${providerLabel} account.`;
    }

    if (message === 'A valid callback_url is required for runtime social login.') {
        return `The ${providerLabel} callback URL was missing. Start the flow again from the runtime playground.`;
    }

    if (message === 'This callback URL is not allowed for the configured provider.') {
        return `This ${providerLabel} callback URL is not in the project allowlist. Add ${callbackUrl} in Settings > Social Providers before retrying.`;
    }

    if (message.includes('is not configured.')) {
        return `No ${providerLabel} social provider is configured for this project. Go to Settings > Social Providers to add ${providerLabel} credentials.`;
    }

    if (message.includes('is misconfigured.')) {
        return `The ${providerLabel} provider is configured, but the backend settings are incomplete. Check the project credentials and registered redirect URI, then try again.`;
    }

    if (message.includes('configuration is ambiguous')) {
        return `More than one ${providerLabel} provider configuration matches this request. Keep only one active ${providerLabel} config for this project.`;
    }

    return message;
}

function getOAuthProviderErrorMessage(provider, oauthError, oauthErrorDescription) {
    const providerLabel = getProviderLabel(provider);
    const normalizedError = (oauthError || '').toLowerCase();
    const normalizedDescription = (oauthErrorDescription || '').trim();

    if (normalizedError === 'access_denied') {
        return `${providerLabel} sign-in was cancelled before access was granted.`;
    }

    if (normalizedDescription) {
        return `${providerLabel} returned an OAuth error: ${normalizedDescription}`;
    }

    if (normalizedError) {
        return `${providerLabel} returned an OAuth error: ${normalizedError}`;
    }

    return `${providerLabel} sign-in failed before the callback could be completed.`;
}

function getRuntimeSocialErrorState(error, { provider, callbackUrl }) {
    const rawMessage = getErrorMessage(error);
    const message = getFriendlyRuntimeSocialErrorMessage(rawMessage, provider, callbackUrl);

    if (error instanceof HVTApiError) {
        return {
            message,
            details: formatErrorDetails(error.body || error.detail),
        };
    }

    return {
        message,
        details: '',
    };
}

function createSocialState(provider) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `${provider}:${crypto.randomUUID()}`;
    }
    return `${provider}:${Date.now()}`;
}

function buildProviderAuthUrl(providerConfig, callbackUrl) {
    const state = createSocialState(providerConfig.provider);
    const params = new URLSearchParams({
        client_id: providerConfig.client_id,
        redirect_uri: callbackUrl,
        scope: (providerConfig.scope || []).join(' '),
        state,
    });

    if (providerConfig.provider === 'google') {
        params.set('response_type', 'code');
        params.set('access_type', 'offline');
        params.set('prompt', 'consent');
    }

    return {
        url: `${providerConfig.authorization_url}?${params.toString()}`,
        state,
    };
}

function inputClassName() {
    return 'h-10 w-full rounded-lg border border-[#27272a] bg-[#18181b] px-3 text-sm text-white outline-none transition focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed40]';
}

function buttonClassName(variant = 'primary') {
    if (variant === 'secondary') {
        return 'inline-flex h-10 items-center justify-center rounded-lg border border-[#27272a] bg-transparent px-4 text-sm font-medium text-white transition hover:border-[#3f3f46] hover:bg-[#18181b]';
    }
    return 'inline-flex h-10 items-center justify-center rounded-lg bg-[#7c3aed] px-4 text-sm font-semibold text-white transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-60';
}

function SectionCard({ title, description, children }) {
    return (
        <section className="rounded-2xl border border-[#27272a] bg-[#111111] p-5 shadow-[0_0_0_1px_rgba(124,58,237,0.04)]">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description ? <p className="mt-1 text-sm text-[#a1a1aa]">{description}</p> : null}
            </div>
            {children}
        </section>
    );
}

function JsonPanel({ label, value }) {
    return (
        <div className="rounded-2xl border border-[#27272a] bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-[#27272a] px-4 py-3">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#71717a]">{label}</span>
            </div>
            <pre className="max-h-[32rem] overflow-auto px-4 py-4 text-xs leading-6 text-[#e4e4e7]">{value}</pre>
        </div>
    );
}

function RuntimeCallbackCard() {
    const { provider } = useParams();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('idle');
    const [result, setResult] = useState(null);
    const [error, setError] = useState({ message: '', details: '' });

    useEffect(() => {
        document.title = `Runtime ${provider} callback | HVT`;
    }, [provider]);

    useEffect(() => {
        const code = searchParams.get('code');
        const callbackState = searchParams.get('state');
        const oauthError = searchParams.get('error');
        const oauthErrorDescription = searchParams.get('error_description');
        const pending = loadPendingSocial();

        if (oauthError) {
            setStatus('error');
            setError({
                message: getOAuthProviderErrorMessage(provider, oauthError, oauthErrorDescription),
                details: '',
            });
            return;
        }

        if (!provider || !code) {
            setStatus('error');
            setError({
                message: 'Missing provider or authorization code in the callback URL.',
                details: '',
            });
            return;
        }

        if (!pending?.apiKey || !pending?.baseUrl || !pending?.callbackUrl) {
            setStatus('error');
            setError({
                message: 'Missing saved runtime test configuration. Start the flow again from the runtime playground.',
                details: '',
            });
            return;
        }

        if (pending.provider !== provider) {
            setStatus('error');
            setError({
                message: 'The callback provider does not match the provider that started the flow.',
                details: '',
            });
            return;
        }

        if (pending.state && callbackState && pending.state !== callbackState) {
            setStatus('error');
            setError({
                message: 'OAuth state mismatch. Start the provider flow again.',
                details: '',
            });
            return;
        }

        const cacheKey = `${provider}:${code}:${pending.callbackUrl}`;
        let request = socialCallbackRequests.get(cacheKey);
        if (!request) {
            const client = createClient({
                baseUrl: pending.baseUrl,
                apiKey: pending.apiKey,
            });

            request =
                provider === 'google'
                    ? client.auth.runtimeGoogle({ code, callback_url: pending.callbackUrl })
                    : client.auth.runtimeGithub({ code, callback_url: pending.callbackUrl });

            socialCallbackRequests.set(cacheKey, request);
        }

        setStatus('loading');
        request
            .then((payload) => {
                setResult(payload);
                setStatus('success');
                clearPendingSocial();
            })
            .catch((requestError) => {
                setError(
                    getRuntimeSocialErrorState(requestError, {
                        provider,
                        callbackUrl: pending.callbackUrl,
                    }),
                );
                setStatus('error');
            });
    }, [provider, searchParams]);

    return (
        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-xl items-center px-4 py-12">
            <div className="w-full rounded-3xl border border-[#27272a] bg-[#111111]/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
                <Logo className="mb-8" />
                {status === 'loading' ? (
                    <div className="space-y-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#27272a] bg-[#18181b] text-[#a78bfa]">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Finishing runtime sign-in...</h1>
                            <p className="mt-2 text-sm text-[#a1a1aa]">
                                Exchanging the provider code for an HVT runtime session.
                            </p>
                        </div>
                    </div>
                ) : null}

                {status === 'success' ? (
                    <div className="space-y-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#14532d] bg-[#052e16] text-[#4ade80]">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Runtime sign-in complete</h1>
                            <p className="mt-2 text-sm text-[#a1a1aa]">
                                The provider callback succeeded. Tokens and user payload are shown below.
                            </p>
                        </div>
                        <JsonPanel label="Runtime response" value={JSON.stringify(result, null, 2)} />
                    </div>
                ) : null}

                {status === 'error' ? (
                    <div className="space-y-5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#7f1d1d] bg-[#450a0a] text-[#f87171]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Runtime social sign-in failed</h1>
                            <p className="mt-2 whitespace-pre-wrap text-sm text-[#fca5a5]">{error.message}</p>
                        </div>
                        {error.details ? <JsonPanel label="Error details" value={error.details} /> : null}
                    </div>
                ) : null}

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link to="/runtime-playground" className={buttonClassName()}>
                        Back to runtime playground
                    </Link>
                    <a href="https://docs.hvts.app" target="_blank" rel="noreferrer" className={buttonClassName('secondary')}>
                        Read docs
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function RuntimePlaygroundPage() {
    const { provider } = useParams();
    const [config, setConfig] = useState(() => loadConfig());
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [providers, setProviders] = useState(() => loadProviders());
    const [outputLabel, setOutputLabel] = useState('Result');
    const [output, setOutput] = useState('Run a runtime auth action to see the response here.');
    const [busyAction, setBusyAction] = useState('');

    const callbackUrls = useMemo(
        () => ({
            google: config.googleCallbackUrl,
            github: config.githubCallbackUrl,
        }),
        [config.githubCallbackUrl, config.googleCallbackUrl],
    );

    useEffect(() => {
        if (provider) return;
        document.title = 'Runtime playground | HVT';
    }, [provider]);

    if (provider) {
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
                <RuntimeCallbackCard />
            </div>
        );
    }

    const runAction = async (label, action) => {
        setBusyAction(label);
        setOutputLabel(label);
        try {
            const result = await action();
            const normalized = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
            setOutput(normalized);
        } catch (error) {
            setOutput(getErrorMessage(error));
        } finally {
            setBusyAction('');
        }
    };

    const handleConfigChange = (field, value) => {
        const next = {
            ...config,
            [field]: value,
        };
        setConfig(next);
        saveConfig(next);
    };

    const handleFormChange = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const fetchProviders = () =>
        runAction('Runtime social providers', async () => {
            const response = await createClient(config).auth.listRuntimeSocialProviders();
            setProviders(response.providers || []);
            saveProviders(response.providers || []);
            return response;
        });

    const startProvider = async (providerName) => {
        const currentProviders = providers.length
            ? providers
            : (await createClient(config).auth.listRuntimeSocialProviders()).providers || [];
        if (!providers.length) {
            setProviders(currentProviders);
            saveProviders(currentProviders);
        }
        const providerConfig = currentProviders.find((item) => item.provider === providerName);
        if (!providerConfig) {
            setOutputLabel('Runtime social providers');
            setOutput(
                `No ${getProviderLabel(providerName)} social provider is configured for this project.\n\nGo to Settings > Social Providers and add ${getProviderLabel(providerName)} credentials before retrying.`,
            );
            return;
        }

        const callbackUrl = callbackUrls[providerName];
        if (!callbackUrl) {
            setOutputLabel('Runtime social providers');
            setOutput(`Missing callback URL for ${providerName}.`);
            return;
        }

        if (Array.isArray(providerConfig.redirect_uris) && !providerConfig.redirect_uris.includes(callbackUrl)) {
            setOutputLabel('Runtime social providers');
            setOutput(
                `The ${getProviderLabel(providerName)} callback URL on this playground is not in the project allowlist.\n\nAdd this callback URL in Settings > Social Providers:\n${callbackUrl}\n\nCurrent allowlist:\n${(providerConfig.redirect_uris || []).join('\n')}`,
            );
            return;
        }

        const { url, state } = buildProviderAuthUrl(providerConfig, callbackUrl);
        savePendingSocial({
            provider: providerName,
            state,
            callbackUrl,
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            createdAt: new Date().toISOString(),
        });
        window.location.assign(url);
    };

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

            <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col items-start gap-4">
                        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#a1a1aa] transition hover:text-white">
                            <ArrowLeft className="h-4 w-4" />
                            Back to hvts.app
                        </Link>
                        <Logo />
                    </div>
                    <div className="rounded-full border border-[#27272a] bg-[#111111] px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#a78bfa]">
                        Internal runtime test surface
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <SectionCard
                            title="Runtime auth playground"
                            description="Use this page to test the real SDK against api.hvts.app before wiring your own app. Keep live keys here only in your own browser."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-[#a1a1aa] md:col-span-2">
                                    <span className="block font-medium text-white">API base URL</span>
                                    <input
                                        className={inputClassName()}
                                        value={config.baseUrl}
                                        onChange={(event) => handleConfigChange('baseUrl', event.target.value)}
                                        placeholder="https://api.hvts.app"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-[#a1a1aa] md:col-span-2">
                                    <span className="block font-medium text-white">Runtime API key</span>
                                    <input
                                        className={inputClassName()}
                                        value={config.apiKey}
                                        onChange={(event) => handleConfigChange('apiKey', event.target.value)}
                                        placeholder="hvt_live_..."
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-[#a1a1aa]">
                                    <span className="block font-medium text-white">Google callback URL</span>
                                    <input
                                        className={inputClassName()}
                                        value={config.googleCallbackUrl}
                                        onChange={(event) => handleConfigChange('googleCallbackUrl', event.target.value)}
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-[#a1a1aa]">
                                    <span className="block font-medium text-white">GitHub callback URL</span>
                                    <input
                                        className={inputClassName()}
                                        value={config.githubCallbackUrl}
                                        onChange={(event) => handleConfigChange('githubCallbackUrl', event.target.value)}
                                    />
                                </label>
                            </div>
                            <div className="mt-4 rounded-xl border border-[#312e81] bg-[#1e1b4b] px-4 py-3 text-sm text-[#c4b5fd]">
                                Add those exact callback URLs to the project social provider redirect URI allowlist before testing runtime Google or GitHub.
                            </div>
                            <div className="mt-4 rounded-xl border border-[#14532d] bg-[#052e16] px-4 py-3 text-sm text-[#bbf7d0]">
                                Runtime test requests on this page are token-only on purpose. They do not reuse or overwrite the dashboard cookie session.
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Email and password"
                            description="Register a runtime user under the API key project, then sign that same user in through the SDK."
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm text-[#a1a1aa]">
                                    <span className="block font-medium text-white">First name</span>
                                    <input
                                        className={inputClassName()}
                                        value={form.firstName}
                                        onChange={(event) => handleFormChange('firstName', event.target.value)}
                                        placeholder="Ada"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-[#a1a1aa]">
                                    <span className="block font-medium text-white">Last name</span>
                                    <input
                                        className={inputClassName()}
                                        value={form.lastName}
                                        onChange={(event) => handleFormChange('lastName', event.target.value)}
                                        placeholder="Lovelace"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-[#a1a1aa] md:col-span-2">
                                    <span className="block font-medium text-white">Email</span>
                                    <input
                                        className={inputClassName()}
                                        value={form.email}
                                        onChange={(event) => handleFormChange('email', event.target.value)}
                                        placeholder="user@example.com"
                                        type="email"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-[#a1a1aa]">
                                    <span className="block font-medium text-white">Password</span>
                                    <input
                                        className={inputClassName()}
                                        value={form.password}
                                        onChange={(event) => handleFormChange('password', event.target.value)}
                                        placeholder="Strongpass123!"
                                        type="password"
                                    />
                                </label>
                                <label className="space-y-2 text-sm text-[#a1a1aa]">
                                    <span className="block font-medium text-white">Confirm password</span>
                                    <input
                                        className={inputClassName()}
                                        value={form.confirmPassword}
                                        onChange={(event) => handleFormChange('confirmPassword', event.target.value)}
                                        placeholder="Strongpass123!"
                                        type="password"
                                    />
                                </label>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className={buttonClassName()}
                                    disabled={busyAction === 'Runtime register'}
                                    onClick={() =>
                                        runAction('Runtime register', () =>
                                            runtimeRegister(createClient(config), {
                                                email: form.email,
                                                password1: form.password,
                                                password2: form.confirmPassword,
                                                first_name: form.firstName,
                                                last_name: form.lastName,
                                            }),
                                        )
                                    }
                                >
                                    {busyAction === 'Runtime register' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                    Register runtime user
                                </button>
                                <button
                                    type="button"
                                    className={buttonClassName('secondary')}
                                    disabled={busyAction === 'Runtime login'}
                                    onClick={() =>
                                        runAction('Runtime login', () =>
                                            createClient(config).auth.runtimeLogin({
                                                email: form.email,
                                                password: form.password,
                                            }),
                                        )
                                    }
                                >
                                    {busyAction === 'Runtime login' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                    Sign runtime user in
                                </button>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Runtime social auth"
                            description="Load the project-scoped provider config through the SDK, then launch Google or GitHub with the callback URLs above."
                        >
                            <div className="mb-4 flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    className={buttonClassName()}
                                    disabled={busyAction === 'Runtime social providers'}
                                    onClick={fetchProviders}
                                >
                                    {busyAction === 'Runtime social providers' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    Load runtime providers
                                </button>
                                <button type="button" className={buttonClassName('secondary')} onClick={() => startProvider('google')}>
                                    Continue with Google
                                </button>
                                <button type="button" className={buttonClassName('secondary')} onClick={() => startProvider('github')}>
                                    Continue with GitHub
                                </button>
                            </div>

                            <div className="space-y-3">
                                {providers.length ? (
                                    providers.map((providerConfig) => (
                                        <div key={providerConfig.provider} className="rounded-xl border border-[#27272a] bg-[#18181b] p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{providerConfig.provider}</div>
                                                    <div className="mt-1 font-mono text-xs text-[#a1a1aa]">{providerConfig.project_slug}</div>
                                                </div>
                                                <a
                                                    href={providerConfig.authorization_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-[#a78bfa]"
                                                >
                                                    Provider authorize URL
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </div>
                                            <div className="mt-3 space-y-1 text-xs text-[#a1a1aa]">
                                                <div>Allowed redirect URIs</div>
                                                <ul className="space-y-1 font-mono text-[11px] text-[#d4d4d8]">
                                                    {(providerConfig.redirect_uris || []).map((uri) => (
                                                        <li key={uri}>{uri}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="rounded-xl border border-dashed border-[#27272a] bg-[#111111] px-4 py-6 text-sm text-[#71717a]">
                                        No runtime providers loaded yet. Use a project API key with <span className="font-mono text-[#d4d4d8]">auth:runtime</span>, then click <span className="text-white">Load runtime providers</span>.
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                    </div>

                    <div className="space-y-6">
                        <SectionCard
                            title="Test vs live keys"
                            description="This is what the code enforces today."
                        >
                            <div className="space-y-4 text-sm text-[#a1a1aa]">
                                <p>
                                    <span className="font-semibold text-white">Test keys</span> use the prefix <span className="font-mono text-[#d4d4d8]">hvt_test_*</span> and are intended for sandbox traffic.
                                </p>
                                <p>
                                    <span className="font-semibold text-white">Live keys</span> use the prefix <span className="font-mono text-[#d4d4d8]">hvt_live_*</span> and are intended for production traffic.
                                </p>
                                <p>
                                    The environment is real at the API key level. The backend reads it directly from the prefix and validates against the stored key environment before allowing the request.
                                </p>
                                <p>
                                    Honest note: today this is stronger as <span className="text-white">key-mode separation</span> than as a fully independent live/test data plane. Use test keys for playground work and live keys only for real production flows.
                                </p>
                            </div>
                        </SectionCard>

                        <JsonPanel label={outputLabel} value={output} />
                    </div>
                </div>
            </div>
        </div>
    );
}
