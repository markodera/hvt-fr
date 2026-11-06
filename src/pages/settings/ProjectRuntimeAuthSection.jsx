import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Fingerprint,
    Mail,
    ShieldCheck,
    CheckCircle2,
    Code2,
    ExternalLink,
    Play,
    Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/CopyButton';

const RUNTIME_AUTH_METHODS = [
    {
        id: 'passkeys',
        title: 'Passkeys & Hardware Biometrics',
        subtitle: 'FIDO2 / WebAuthn / Touch ID / Face ID / Windows Hello / YubiKey',
        badge: 'Native & Phishing Resistant',
        icon: Fingerprint,
        iconBg: 'bg-[#7c3aed]/10 text-[#a78bfa] border-[#7c3aed]/20',
        description:
            'Enable your users to log in instantly using built-in device biometrics or physical security keys without ever typing a password.',
        capabilities: [
            'Passwordless biometric sign-in',
            'Hardware-bound cryptographic keys',
            'User enrollment on active sessions',
            'Zero server secrets to breach',
        ],
        codeSnippet: `// 1. Authenticate user with Passkey:
const { user, access } = await hvt.auth.runtimeLoginWithPasskey({
  email: 'user@example.com' // Optional for discoverable credentials
});

// 2. Register a new Passkey inside user settings:
await hvt.auth.runtimeRegisterPasskey({
  name: 'MacBook Touch ID'
});`,
        endpoints: [
            { method: 'POST', path: '/api/v1/auth/runtime/passkey/authenticate/options/' },
            { method: 'POST', path: '/api/v1/auth/runtime/passkey/authenticate/verify/' },
            { method: 'POST', path: '/api/v1/auth/runtime/passkey/register/options/' },
            { method: 'POST', path: '/api/v1/auth/runtime/passkey/register/verify/' },
        ],
    },
    {
        id: 'magic-link',
        title: 'Passwordless Magic Links',
        subtitle: 'Single-use cryptographic email sign-in tokens',
        badge: 'Zero Passwords',
        icon: Mail,
        iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        description:
            'Send secure, time-limited magic links to your users’ email addresses. Works seamlessly alongside or as an alternative to passwords.',
        capabilities: [
            'Timing-safe cryptographic token generation',
            'Configurable 15-minute token expiry',
            'Works with Resend, SMTP, and Console email',
            'Customizable callback and redirect URLs',
        ],
        codeSnippet: `// 1. Request a magic link:
await hvt.auth.runtimeRequestMagicLink({
  email: 'user@example.com',
  role_slug: 'customer' // optional initial role
});

// 2. When user opens link with ?token=...:
const { user, access } = await hvt.auth.runtimeVerifyMagicLink({
  token: tokenFromUrl
});`,
        endpoints: [
            { method: 'POST', path: '/api/v1/auth/runtime/magic-link/request/' },
            { method: 'POST', path: '/api/v1/auth/runtime/magic-link/verify/' },
        ],
    },
    {
        id: 'mfa-2fa',
        title: 'Two-Factor Authentication (2FA / TOTP)',
        subtitle: 'RFC 6238 Time-Based One-Time Passwords & QR code scanning',
        badge: 'Enterprise Security',
        icon: ShieldCheck,
        iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        description:
            'Protect high-value runtime customer accounts with standard 6-digit TOTP codes compatible with Google Authenticator, 1Password, and Apple Keychain.',
        capabilities: [
            'Instant provisioning with otpauth:// URI and QR code',
            'Time-skew compensation (valid window +/- 1 interval)',
            'Confirmation step to prevent lockout',
            'Audit logging for setup, verify, and disable events',
        ],
        codeSnippet: `// 1. Initiate 2FA setup in user profile:
const { secret, otpauth_url } = await hvt.auth.setupMFA();
// Render QR code from otpauth_url or display secret base32 key

// 2. Verify 6-digit code to activate 2FA:
await hvt.auth.verifyMFA(code);

// 3. Check 2FA status:
const { is_mfa_enabled } = await hvt.auth.mfaStatus();`,
        endpoints: [
            { method: 'GET', path: '/api/v1/auth/mfa/totp/status/' },
            { method: 'POST', path: '/api/v1/auth/mfa/totp/setup/' },
            { method: 'POST', path: '/api/v1/auth/mfa/totp/verify/' },
            { method: 'POST', path: '/api/v1/auth/mfa/totp/disable/' },
        ],
    },
];

export function ProjectRuntimeAuthSection({ projects = [] }) {
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [activeTab, setActiveTab] = useState('passkeys');

    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) {
            setSelectedProjectId(projects[0].id);
        }
    }, [projects, selectedProjectId]);

    const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
    const activeMethod = RUNTIME_AUTH_METHODS.find((m) => m.id === activeTab) || RUNTIME_AUTH_METHODS[0];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#27272a] bg-[#111111] p-4">
                <div>
                    <p className="text-sm font-medium text-white">Target Project</p>
                    <p className="text-xs text-[#71717a]">
                        Configure and review runtime authentication methods for apps connecting to this project.
                    </p>
                </div>
                {projects.length > 1 ? (
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="h-10 rounded-lg border border-[#27272a] bg-[#18181b] px-3 text-sm text-white focus:border-[#7c3aed] focus:outline-none"
                    >
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.slug})
                            </option>
                        ))}
                    </select>
                ) : (
                    <Badge variant="outline" className="border-[#27272a] text-[#a78bfa] font-mono">
                        {activeProject?.name || 'Default Project'}
                    </Badge>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <Link
                    to="/runtime-playground"
                    className="flex items-center justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-4 transition-all hover:border-[#7c3aed]/50 hover:bg-[#18181f]"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7c3aed]/30 bg-[#7c3aed]/10 text-[#a78bfa]">
                            <Play className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Runtime Playground</p>
                            <p className="text-xs text-[#71717a]">Interactive testbench for Passkeys, Magic Link & OAuth</p>
                        </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#71717a]" />
                </Link>

                <Link
                    to="/runtime-demo"
                    className="flex items-center justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-4 transition-all hover:border-[#7c3aed]/50 hover:bg-[#18181f]"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Marketplace Storefront Demo</p>
                            <p className="text-xs text-[#71717a]">End-to-end commerce app with role-based UI gating</p>
                        </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-[#71717a]" />
                </Link>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-[#27272a] pb-3">
                {RUNTIME_AUTH_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isActive = activeTab === method.id;
                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => setActiveTab(method.id)}
                            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                                isActive
                                    ? 'border-[#7c3aed] bg-[#7c3aed]/15 text-white'
                                    : 'border-[#27272a] bg-[#111111] text-[#a1a1aa] hover:border-[#3f3f46] hover:text-white'
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{method.title.split(' ')[0]}</span>
                        </button>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-[#27272a] bg-[#111114] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${activeMethod.iconBg}`}>
                            <activeMethod.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-semibold text-white">{activeMethod.title}</h3>
                                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10px]">
                                    {activeMethod.badge}
                                </Badge>
                            </div>
                            <p className="mt-1 text-xs text-[#a1a1aa]">{activeMethod.subtitle}</p>
                            <p className="mt-2 text-sm text-[#d4d4d8] leading-relaxed">{activeMethod.description}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {activeMethod.capabilities.map((cap, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-[#a1a1aa]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{cap}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Code2 className="h-4 w-4 text-[#a78bfa]" />
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71717a]">
                                SDK Integration (@hvt/sdk)
                            </span>
                        </div>
                        <CopyButton text={activeMethod.codeSnippet} />
                    </div>
                    <pre className="rounded-xl border border-[#27272a] bg-[#0d0d10] p-4 font-mono text-xs text-[#e4e4e7] overflow-x-auto">
                        <code>{activeMethod.codeSnippet}</code>
                    </pre>
                </div>

                <div className="mt-5 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#71717a]">REST API Endpoints</p>
                    <div className="grid gap-1.5">
                        {activeMethod.endpoints.map((ep, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 rounded-lg border border-[#27272a] bg-[#0d0d10] px-3 py-1.5 font-mono text-xs"
                            >
                                <span className="font-bold text-[#a78bfa]">{ep.method}</span>
                                <span className="text-[#a1a1aa] break-all">{ep.path}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
