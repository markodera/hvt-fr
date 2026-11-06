import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Database,
  ExternalLink,
  Fingerprint,
  Github,
  LockKeyhole,
  Menu,
  Lock,
  ScrollText,
  ShieldCheck,
  Terminal,
  Webhook,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { HvtLogoMark, Logo } from '@/components/Logo';
import { CHANGELOG_URL, DOCS_URL, GITHUB_URL, SITE_URL, STATUS_URL } from '@/lib/appLinks';

const DOT_GRID_STYLE = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 20 20%27%3E%3Ccircle cx=%2710%27 cy=%2710%27 r=%271.2%27 fill=%27%2327272a%27 /%3E%3C/svg%3E")',
  backgroundRepeat: 'repeat',
};

const SEO_TITLE = 'HVT | Multi-Tenant Identity & RBAC Engine';
const SEO_DESCRIPTION =
  'Open-source multi-tenant identity and access management. Database-level project isolation, dual-plane API keys, WebAuthn passkeys, and declarative RBAC with zero MAU tax.';

const featureStripItems = [
  'Dual-Plane Keys (hvt_mgmt / hvt_live)',
  'PostgreSQL Compound Tenant Isolation',
  'FIDO2 WebAuthn Passkeys',
  'RFC 6238 TOTP + 8 Recovery Codes',
  'Declarative CLI Schema Sync',
  'HMAC-SHA256 Webhooks',
  'Zero MAU Tax — Apache 2.0',
];

const sandboxTabs = [
  {
    id: 'sdk',
    label: 'TypeScript SDK',
    content: `import { HVTClient } from '@hvt/sdk';

// Initialize with runtime live key (project-scoped)
const hvt = new HVTClient({
  baseUrl: 'https://auth.company.internal',
  projectKey: process.env.HVT_LIVE_KEY!, // hvt_live_9d81f...
});

// Authenticate with password or hardware passkey
export async function handleLogin(email: string, passkey?: any) {
  const session = await hvt.login({ email, passkey });
  return {
    userId: session.user.id,
    roles:  session.roles,  // ['buyer', 'verified_merchant']
    token:  session.accessToken,
  };
}`,
  },
  {
    id: 'curl',
    label: 'Runtime API',
    content: `# Runtime login scoped to a specific project
curl -X POST https://api.hvts.app/api/v1/runtime/auth/login/ \\
  -H "Content-Type: application/json" \\
  -H "X-HVT-Project-Key: hvt_live_7a3f81e9b20c..." \\
  -d '{
    "email": "developer@tenant.com",
    "password": "CorrectHorseBatteryStaple#2026"
  }'

# 200 OK
# {
#   "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "token_type": "Bearer",
#   "expires_in": 3600
# }`,
  },
  {
    id: 'jwt',
    label: 'Token Claims',
    content: `{
  "sub":        "usr_01j7m8x9p3q4r5t6",
  "email":      "developer@tenant.com",
  "org_id":     "org_northstar_holdings",
  "project_id": "prj_storefront_production",
  "roles": [
    "marketplace_vendor",
    "payout_verified"
  ],
  "permissions": [
    "products:create",
    "products:update",
    "inventory:adjust",
    "orders:view"
  ],
  "iss": "https://api.hvts.app",
  "aud": "prj_storefront_production",
  "exp": 1794291600
}`,
  },
  {
    id: 'cli',
    label: 'CLI GitOps',
    content: `$ hvt push --config ./hvt.config.json --apply

✔ Reading manifest: ./hvt.config.json
✔ Authenticated (hvt_mgmt_...)
✔ Diff detected:
  + Role: "marketplace_vendor" (permissions: 6)
  + Permission: "inventory:adjust"
  ~ Policy: require_mfa = true, allow_passkeys = true
✔ Applying schema to database...
✔ Synchronized in 280ms. Project live.`,
  },
];

function upsertMeta(selector, factory, updater) {
  let el = document.head.querySelector(selector);
  if (!el) { el = factory(); document.head.appendChild(el); }
  updater(el);
}

function CopyableCodePill({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#111114] px-3.5 py-2 font-mono text-xs text-[#a1a1aa] transition hover:border-[#7c3aed]/60 hover:bg-[#181820] hover:text-white"
      title="Click to copy"
    >
      <span className="text-[#7c3aed]">$</span>
      <span className="text-[#e4e4e7]">{text}</span>
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-400" />
        : <Copy className="h-3.5 w-3.5 text-[#71717a] transition group-hover:text-[#a1a1aa]" />
      }
      {label && (
        <span className="ml-1 rounded bg-[#27272a] px-1.5 py-0.5 text-[10px] text-[#71717a]">{label}</span>
      )}
    </button>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSandboxTab, setActiveSandboxTab] = useState('sdk');
  const [activeProjectDemo, setActiveProjectDemo] = useState('storefront');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = SEO_TITLE;
    upsertMeta('meta[name="description"]',
      () => { const m = document.createElement('meta'); m.name = 'description'; return m; },
      (m) => { m.content = SEO_DESCRIPTION; });
    upsertMeta('meta[property="og:title"]',
      () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:title'); return m; },
      (m) => { m.setAttribute('content', SEO_TITLE); });
    upsertMeta('meta[property="og:description"]',
      () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:description'); return m; },
      (m) => { m.setAttribute('content', SEO_DESCRIPTION); });
    upsertMeta('meta[name="twitter:title"]',
      () => { const m = document.createElement('meta'); m.name = 'twitter:title'; return m; },
      (m) => { m.content = SEO_TITLE; });
    upsertMeta('meta[name="twitter:description"]',
      () => { const m = document.createElement('meta'); m.name = 'twitter:description'; return m; },
      (m) => { m.content = SEO_DESCRIPTION; });
    upsertMeta('meta[property="og:url"]',
      () => { const m = document.createElement('meta'); m.setAttribute('property', 'og:url'); return m; },
      (m) => { m.setAttribute('content', `${SITE_URL}/`); });
    upsertMeta('meta[name="theme-color"]',
      () => { const m = document.createElement('meta'); m.name = 'theme-color'; return m; },
      (m) => { m.content = '#0a0a0a'; });
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = `${SITE_URL}/`;
  }, []);

  const currentTab = sandboxTabs.find((t) => t.id === activeSandboxTab) || sandboxTabs[0];

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(currentTab.content);
    setCopiedCode(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f4f4f5]">
      <style>{`
        @keyframes subtleFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ambientGlowPulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(1.06); }
        }
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .anim-fade-up           { animation: subtleFadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .anim-delay-1           { animation-delay: 0.08s; }
        .anim-delay-2           { animation-delay: 0.16s; }
        .anim-delay-3           { animation-delay: 0.24s; }
        .anim-delay-4           { animation-delay: 0.32s; }
      `}</style>

      {/* ─── HEADER ─── */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-200 ${
          scrolled
            ? 'border-[#27272a]/90 bg-[#0a0a0c]/85 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + status */}
          <div className="flex items-center gap-5">
            <Link to="/" className="flex items-center gap-3 group">
              <HvtLogoMark className="h-8 w-8 transition-transform duration-200 group-hover:scale-105" />
              <div className="leading-none">
                <span className="font-mono text-base font-bold tracking-tight text-white">HVT</span>
                <span className="block text-[11px] text-[#71717a]">hvts.app</span>
              </div>
            </Link>
            <div className="hidden items-center gap-2 rounded-full border border-[#27272a] bg-[#111114] px-2.5 py-1 text-xs text-[#a1a1aa] lg:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px]">Engine v0.2.0</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 text-sm text-[#a1a1aa] md:flex">
            <a href="#architecture" className="transition hover:text-white">Architecture</a>
            <a href="#features"     className="transition hover:text-white">Features</a>
            <a href="#dual-plane"   className="transition hover:text-white">Key Separation</a>
            <a href={DOCS_URL}   target="_blank" rel="noreferrer" className="transition hover:text-white">Docs</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">GitHub</a>
          </nav>

          {/* CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#d4d4d8] transition hover:text-white">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#7c3aed]/50 bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition hover:bg-[#6d28d9]"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#27272a] bg-[#111114] text-[#d4d4d8] md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="border-b border-[#27272a] bg-[#0d0d10] px-4 py-6 md:hidden">
            <div className="flex flex-col gap-4 text-sm">
              <a href="#architecture" onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">Architecture</a>
              <a href="#features"     onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">Features</a>
              <a href="#dual-plane"   onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">Key Separation</a>
              <a href={DOCS_URL}   target="_blank" rel="noreferrer" className="text-[#a1a1aa] hover:text-white">Documentation</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-[#a1a1aa] hover:text-white">GitHub</a>
              <div className="mt-2 flex flex-col gap-2 border-t border-[#27272a] pt-4">
                <Link to="/login"  onClick={() => setMenuOpen(false)} className="w-full rounded-lg border border-[#27272a] py-2.5 text-center font-medium text-white">Sign in</Link>
                <Link to="/signup" onClick={() => setMenuOpen(false)} className="w-full rounded-lg bg-[#7c3aed] py-2.5 text-center font-semibold text-white">Get started</Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden border-b border-[#27272a]/80 pb-20 pt-16 lg:pb-32 lg:pt-24">
          {/* Ambient glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[900px] -translate-x-1/2 rounded-full bg-[#7c3aed]/12 blur-[120px]"
            style={{ animation: 'ambientGlowPulse 10s ease-in-out infinite' }}
          />
          {/* Dot grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.38]"
            style={{
              ...DOT_GRID_STYLE,
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-8">

              {/* Left column */}
              <div className="lg:col-span-7 xl:col-span-6 anim-fade-up">
                <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl sm:leading-[1.12]">
                  Identity and RBAC built for multi-tenant applications.
                </h1>

                <p className="mt-6 text-base leading-relaxed text-[#a1a1aa] sm:text-lg anim-fade-up anim-delay-1">
                  Enforce tenant isolation at the database layer. Separate administrative control keys from runtime application traffic. Version-control permissions and roles declaratively in Git.
                </p>

                {/* Three-stat fact row */}
                <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 anim-fade-up anim-delay-2">
                  <div className="rounded-xl border border-[#27272a] bg-[#111114]/90 p-3.5">
                    <div className="text-xs font-medium uppercase tracking-wider text-[#71717a]">Isolation</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-white">Database-Level</div>
                    <div className="mt-0.5 text-[11px] text-[#a1a1aa]">(project_id + email)</div>
                  </div>
                  <div className="rounded-xl border border-[#27272a] bg-[#111114]/90 p-3.5">
                    <div className="text-xs font-medium uppercase tracking-wider text-[#71717a]">Security</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-white">Dual-Plane Keys</div>
                    <div className="mt-0.5 text-[11px] text-[#a1a1aa]">hvt_mgmt / hvt_live</div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-xl border border-[#27272a] bg-[#111114]/90 p-3.5">
                    <div className="text-xs font-medium uppercase tracking-wider text-[#71717a]">License</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-white">Apache 2.0</div>
                    <div className="mt-0.5 text-[11px] text-[#a1a1aa]">Zero MAU penalties</div>
                  </div>
                </div>

                {/* CTA row */}
                <div className="mt-8 flex flex-wrap items-center gap-3 anim-fade-up anim-delay-3">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.35)] transition hover:bg-[#6d28d9]"
                  >
                    Start building free <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#111114] px-5 py-3 text-sm font-semibold text-[#d4d4d8] transition hover:border-[#3f3f46] hover:text-white"
                  >
                    <Github className="h-4 w-4" /> GitHub Source
                  </a>
                </div>

                {/* Quick install */}
                <div className="mt-6 flex flex-wrap items-center gap-2 anim-fade-up anim-delay-4">
                  <span className="text-xs text-[#71717a]">Quickstart:</span>
                  <CopyableCodePill text="npm i @hvt/sdk" label="SDK" />
                  <CopyableCodePill text="npm i -g @hvt/cli" label="CLI" />
                </div>
              </div>

              {/* Right column: Code sandbox */}
              <div className="lg:col-span-5 xl:col-span-6 anim-fade-up anim-delay-2">
                <div className="overflow-hidden rounded-2xl border border-[#27272a] bg-[#101014] shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition hover:border-[#7c3aed]/40">
                  {/* Tab bar */}
                  <div className="flex flex-wrap items-center justify-between border-b border-[#27272a] bg-[#0c0c0f] px-4 py-3 gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {sandboxTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveSandboxTab(tab.id)}
                          className={`rounded-md px-3 py-1.5 font-mono text-xs font-medium transition ${
                            tab.id === activeSandboxTab
                              ? 'bg-[#7c3aed]/20 text-[#c4b5fd] border border-[#7c3aed]/40'
                              : 'text-[#71717a] hover:bg-[#18181f] hover:text-[#d4d4d8]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopySnippet}
                      className="flex items-center gap-1 rounded border border-[#27272a] bg-[#141418] px-2.5 py-1 text-xs text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span className="font-mono text-[11px]">{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Code block */}
                  <div className="p-4 sm:p-5">
                    <pre className="overflow-x-auto font-mono text-xs sm:text-[13px] leading-relaxed text-[#d4d4d8]">
                      <code>{currentTab.content}</code>
                    </pre>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#27272a]/70 pt-3 text-[11px] text-[#71717a]">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-[#7c3aed]" />
                        <span>RS256 signed · verified claims</span>
                      </div>
                      <span className="font-mono">zero_tenant_leakage=true</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─── MARQUEE STRIP ─── */}
        <section className="overflow-hidden border-b border-[#27272a] bg-[#0c0c0f] py-4">
          <div
            className="flex min-w-max gap-8 font-mono text-xs uppercase tracking-wider text-[#71717a]"
            style={{ animation: 'marqueeScroll 30s linear infinite' }}
          >
            {[...featureStripItems, ...featureStripItems, ...featureStripItems].map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex items-center gap-4">
                <span className="text-[#a1a1aa]">{item}</span>
                <span className="text-[#3f3f46]">/</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── ARCHITECTURE: TENANT ISOLATION ─── */}
        <section id="architecture" className="scroll-mt-24 border-b border-[#27272a] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#7c3aed]">
                Tenant Architecture
              </div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Database-level partition. Zero cross-project leakage.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#a1a1aa]">
                Most identity platforms store all users in a single global table. When you build multi-tenant SaaS, marketplaces, or multi-app suites, identities collide. HVT partitions user records, roles, and sessions at the PostgreSQL level using composite unique indexes.
              </p>
            </div>

            <div className="mt-12 overflow-hidden rounded-2xl border border-[#27272a] bg-[#101014] p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#27272a] pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#7c3aed]" />
                    <span className="font-mono text-sm font-semibold text-white">Organization: Acme Holding Corp</span>
                  </div>
                  <div className="mt-1 text-xs text-[#71717a]">Root boundary for billing, staff access, and project provisioning</div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#141418] p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveProjectDemo('storefront')}
                    className={`rounded px-3 py-1.5 font-medium transition ${activeProjectDemo === 'storefront' ? 'bg-[#7c3aed] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
                  >
                    Project A: Storefront
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveProjectDemo('backoffice')}
                    className={`rounded px-3 py-1.5 font-medium transition ${activeProjectDemo === 'backoffice' ? 'bg-[#7c3aed] text-white' : 'text-[#a1a1aa] hover:text-white'}`}
                  >
                    Project B: Vendor Portal
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                {/* Active project box */}
                <div className="rounded-xl border border-[#7c3aed]/40 bg-[#14141c] p-5 shadow-[0_0_25px_rgba(124,58,237,0.1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Boxes className="h-4 w-4 text-[#c4b5fd]" />
                      <span className="font-mono text-sm font-bold text-white">
                        {activeProjectDemo === 'storefront' ? 'Project A (Public Storefront)' : 'Project B (Vendor Portal)'}
                      </span>
                    </div>
                    <span className="rounded border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-2 py-0.5 font-mono text-[11px] text-[#c4b5fd]">
                      {activeProjectDemo === 'storefront' ? 'hvt_live_store_9f...' : 'hvt_live_vendor_3a...'}
                    </span>
                  </div>
                  <div className="mt-4 space-y-3 font-mono text-xs">
                    <div className="rounded-lg border border-[#27272a] bg-[#0c0c0f] p-3">
                      <span className="text-[#71717a]">// Scoped user record</span>
                      <div className="mt-1 text-white">email: <span className="text-[#c4b5fd]">"alex@company.com"</span></div>
                      <div className="text-[#71717a]">project_id: <span className="text-[#a1a1aa]">"{activeProjectDemo === 'storefront' ? 'prj_store_prod' : 'prj_vendor_prod'}"</span></div>
                      <div className="text-[#71717a]">role: <span className="text-emerald-400">{activeProjectDemo === 'storefront' ? '["verified_buyer"]' : '["vendor_operator"]'}</span></div>
                    </div>
                    <div className="rounded-lg border border-[#27272a] bg-[#0c0c0f] p-3">
                      <span className="text-[#71717a]">// PostgreSQL constraint</span>
                      <div className="mt-1 text-[#a1a1aa]">UNIQUE(project_id, email)</div>
                      <div className="mt-1 text-[#71717a]">Password hashes and TOTP seeds are non-transferable.</div>
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="flex flex-col justify-between rounded-xl border border-[#27272a] bg-[#0d0d10] p-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#71717a]" />
                      <span className="font-mono text-sm font-semibold text-white">PostgreSQL Storage Guarantee</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                      <code className="text-white font-mono text-xs">alex@company.com</code> can register in Project A as a shopper and in Project B as a merchant — zero identity collision.
                    </p>
                    <ul className="mt-4 space-y-2.5 text-xs text-[#d4d4d8]">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                        <span>Each user row is bound to its project foreign key.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                        <span>Credential compromise in one project never exposes another.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                        <span>Session revocation is project-scoped, not global.</span>
                      </li>
                    </ul>
                  </div>
                  <div className="mt-6 rounded-lg border border-[#27272a] bg-[#141418] p-3 font-mono text-[11px] text-[#71717a]">
                    SELECT * FROM runtime_users WHERE project_id = $1 AND email = $2;
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DUAL-PLANE KEY SEPARATION ─── */}
        <section id="dual-plane" className="scroll-mt-24 border-b border-[#27272a] bg-[#0b0b0e] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#7c3aed]">Key Separation</div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Two planes. Zero shared credentials.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#a1a1aa]">
                Conventional auth systems share one API key across the entire stack. If your runtime application leaks that credential, the entire identity system is compromised. HVT keeps control and runtime traffic on separate key namespaces by design.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {/* Control Plane */}
              <div className="rounded-2xl border border-[#27272a] bg-[#111115] p-6 lg:p-8 transition hover:border-[#3f3f46]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xs uppercase text-[#71717a]">Administrative Surface</div>
                      <h3 className="text-lg font-bold text-white">Control Plane</h3>
                    </div>
                  </div>
                  <span className="rounded bg-[#27272a] px-2.5 py-1 font-mono text-xs text-[#a1a1aa]">hvt_mgmt_*</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#a1a1aa]">
                  Used by your engineering team, CI/CD runners, and automated deployment pipelines. Never distributed to end-user applications.
                </p>
                <div className="mt-6 space-y-2.5 border-t border-[#27272a] pt-4 font-mono text-xs text-[#d4d4d8]">
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-[#7c3aed]" /><span>Create and destroy tenant projects</span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-[#7c3aed]" /><span>Generate and revoke runtime API keys</span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-[#7c3aed]" /><span>Configure OAuth providers per project</span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-[#7c3aed]" /><span>Push permission schema via CLI (<code>hvt push</code>)</span></div>
                </div>
              </div>

              {/* Runtime Plane */}
              <div className="rounded-2xl border border-[#7c3aed]/40 bg-[#121118] p-6 lg:p-8 shadow-[0_0_30px_rgba(124,58,237,0.08)] transition hover:border-[#7c3aed]/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7c3aed]/20 text-[#c4b5fd]">
                      <Boxes className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-mono text-xs uppercase text-[#7c3aed]">Customer Traffic</div>
                      <h3 className="text-lg font-bold text-white">Runtime Plane</h3>
                    </div>
                  </div>
                  <span className="rounded border border-[#7c3aed]/30 bg-[#7c3aed]/10 px-2.5 py-1 font-mono text-xs text-[#c4b5fd]">hvt_live_*</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[#a1a1aa]">
                  Used by web apps, mobile clients, and edge services to authenticate real end users. Scoped to a single project, unable to touch any administrative endpoint.
                </p>
                <div className="mt-6 space-y-2.5 border-t border-[#27272a] pt-4 font-mono text-xs text-[#d4d4d8]">
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-400" /><span>User registration and login</span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-400" /><span>WebAuthn passkey ceremony and verification</span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-400" /><span>TOTP MFA validation and recovery code check</span></div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-emerald-400" /><span>Scoped JWT issuance with verified role claims</span></div>
                </div>
                <div className="mt-6 rounded-lg border border-[#7c3aed]/30 bg-[#151222] p-3 text-xs text-[#c4b5fd]">
                  Option C Protection: A leaked live key has zero privilege over management APIs or other projects.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES GRID ─── */}
        <section id="features" className="scroll-mt-24 border-b border-[#27272a] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#7c3aed]">Engine Capabilities</div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Built for infrastructure engineers.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#a1a1aa]">
                Identity belongs in your infrastructure stack alongside your database and cache—not in a proprietary black box with per-user tax brackets.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  Icon: Fingerprint,
                  title: 'FIDO2 WebAuthn Passkeys',
                  desc: 'Hardware-backed biometrics (Touch ID, Face ID, Windows Hello, YubiKey) with per-project origin configuration.',
                },
                {
                  Icon: ShieldCheck,
                  title: 'TOTP MFA + 8 Recovery Codes',
                  desc: 'RFC 6238 time-based one-time passwords. AES-256 encrypted secrets paired with 8 single-use hashed backup codes.',
                },
                {
                  Icon: Terminal,
                  title: 'Declarative GitOps CLI',
                  desc: 'Version-control project definitions, permissions, and roles in JSON. Test and apply schema changes in CI with hvt push.',
                },
                {
                  Icon: Webhook,
                  title: 'Signed HMAC Webhooks',
                  desc: 'Stream identity lifecycle events to your event bus with HMAC-SHA256 signatures and timestamp replay protection.',
                },
                {
                  Icon: LockKeyhole,
                  title: 'Argon2id & Adaptive Lockouts',
                  desc: 'Memory-hard password hashing with automated brute-force lockouts protecting against credential stuffing at scale.',
                },
                {
                  Icon: ScrollText,
                  title: 'Immutable Audit Trail',
                  desc: 'Every key minted, policy updated, or member invited is persisted in an append-only log with actor ID and IP provenance.',
                },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="group rounded-2xl border border-[#27272a] bg-[#111114] p-6 transition-all duration-200 hover:border-[#7c3aed]/50 hover:shadow-[0_0_24px_rgba(124,58,237,0.12)]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#27272a] bg-[#18181f] text-[#c4b5fd] transition group-hover:border-[#7c3aed]/40">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-base font-bold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#a1a1aa]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── DEPLOYMENT OPTIONS ─── */}
        <section id="self-host" className="scroll-mt-24 border-b border-[#27272a] bg-[#0a0a0c] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-[#7c3aed]">Deployment Model</div>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Own the infrastructure. Run it anywhere.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#a1a1aa]">
                HVT is 100% open source under Apache 2.0. One Docker container, Kubernetes, or bare metal—the codebase is completely open.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Self-hosted */}
              <div className="flex flex-col rounded-2xl border border-[#27272a] bg-[#111115] p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs uppercase text-[#71717a]">Self-Hosted</div>
                  <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">Apache 2.0</span>
                </div>
                <h3 className="mt-2 text-2xl font-bold text-white">Community Edition</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                  Deploy on your own infrastructure with Docker Compose. Zero telemetry, zero MAU limits, zero proprietary lock-in.
                </p>
                <div className="mt-6 space-y-3 border-t border-[#27272a] pt-6 text-sm text-[#d4d4d8]">
                  <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>Unlimited monthly active users</span></div>
                  <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>Unlimited organizations and projects</span></div>
                  <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>Standard PostgreSQL backend</span></div>
                  <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>Full source code access and modification rights</span></div>
                </div>
                <div className="mt-auto pt-8">
                  <a
                    href={`${GITHUB_URL}#self-hosting`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-lg border border-[#27272a] bg-[#181820] py-3 text-sm font-semibold text-white transition hover:bg-[#20202a]"
                  >
                    View Docker Setup <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Managed Cloud */}
              <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#7c3aed]/40 bg-[#12111c] p-6 sm:p-8 shadow-[0_0_40px_rgba(124,58,237,0.12)]">
                <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7c3aed]/20 blur-[70px]" />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs uppercase text-[#7c3aed]">HVT Managed</div>
                    <span className="rounded border border-[#7c3aed]/40 bg-[#7c3aed]/20 px-2 py-0.5 font-mono text-[11px] text-[#c4b5fd]">Free Developer Preview</span>
                  </div>
                  <h3 className="mt-2 text-2xl font-bold text-white">Managed Cloud</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
                    Instant access with no server provisioning. Automated backups, managed PostgreSQL, and zero maintenance overhead.
                  </p>
                  <div className="mt-6 space-y-3 border-t border-[#27272a] pt-6 text-sm text-[#d4d4d8]">
                    <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>No server provisioning required</span></div>
                    <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>Interactive web dashboard and API console</span></div>
                    <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>Automated security patches</span></div>
                    <div className="flex items-center gap-2.5"><Check className="h-4 w-4 shrink-0 text-emerald-400" /><span>Migrate to self-hosted at any time</span></div>
                  </div>
                  <div className="mt-auto pt-8">
                    <Link
                      to="/signup"
                      className="inline-flex w-full items-center justify-center rounded-lg bg-[#7c3aed] py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition hover:bg-[#6d28d9]"
                    >
                      Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="relative overflow-hidden border-b border-[#27272a] py-20 lg:py-24">
          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Ready to isolate your tenant authentication?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-[#a1a1aa]">
              Start with the hosted developer sandbox in 2 minutes, or pull the Docker image and deploy to your own cluster.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-[#7c3aed] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(124,58,237,0.35)] transition hover:bg-[#6d28d9]"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-[#27272a] bg-[#111114] px-6 py-3.5 text-sm font-semibold text-[#d4d4d8] transition hover:border-[#3f3f46] hover:text-white"
              >
                <BookOpen className="h-4 w-4" /> Read the Documentation
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#070709] py-12 text-[#71717a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="md:col-span-2">
              <Logo href="/" />
              <p className="mt-4 max-w-sm text-sm text-[#a1a1aa]">
                Multi-tenant identity and RBAC infrastructure. Database-level project isolation with zero MAU tax.
              </p>
              <div className="mt-4 flex items-center gap-2 font-mono text-xs">
                <Lock className="h-3 w-3 text-[#7c3aed]" />
                <span>Apache 2.0 Open Source License</span>
              </div>
            </div>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">Resources</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><a href={DOCS_URL}      target="_blank" rel="noreferrer" className="hover:text-white transition">Documentation</a></li>
                <li><a href={GITHUB_URL}    target="_blank" rel="noreferrer" className="hover:text-white transition">GitHub Source</a></li>
                <li><a href={CHANGELOG_URL} target="_blank" rel="noreferrer" className="hover:text-white transition">Changelog</a></li>
                <li><a href={STATUS_URL}    target="_blank" rel="noreferrer" className="hover:text-white transition">System Status</a></li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">Product</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link to="/login"         className="hover:text-white transition">Sign in</Link></li>
                <li><Link to="/signup"        className="hover:text-white transition">Create Account</Link></li>
                <li><Link to="/runtime-demo"  className="hover:text-white transition">Commerce Demo</Link></li>
                <li><Link to="/playground"    className="hover:text-white transition">Runtime Playground</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-white">Legal</div>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li><Link to="/privacy-policy"   className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-white transition">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#27272a] pt-8 text-xs">
            <span>&copy; {new Date().getFullYear()} HVT Contributors. Apache 2.0 License.</span>
            <div className="flex items-center gap-4">
              <span>hvts.app</span>
              <span>·</span>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white transition">github.com/markodera/hvt</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
