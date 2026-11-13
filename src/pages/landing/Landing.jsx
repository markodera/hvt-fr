// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  Fingerprint,
  GitBranch,
  Github,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Menu,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { HvtLogoMark } from '@/components/Logo';
import { Footer } from '@/components/layout/Footer';
import { CHANGELOG_URL, DOCS_URL, GITHUB_URL, SITE_URL, STATUS_URL } from '@/lib/appLinks';

const SEO_TITLE = 'HVT — In-Memory Identity Engine for Modern APIs';
const SEO_DESCRIPTION =
  'Open-source authentication and authorization engine. HVT signs fine-grained permissions directly into cryptographic RS256 JWTs so microservices and edge workers evaluate access in memory with zero database round-trips.';

// ─── Code Integration Examples ──────────────────────────────────────────────
const INTEGRATION_SNIPPETS = {
  typescript: {
    filename: 'middleware/auth.ts',
    lang: 'typescript',
    code: `import { HVTClient } from '@hvt/sdk';

const hvt = new HVTClient({
  projectId: process.env.HVT_PROJECT_ID!,
  apiKey: process.env.HVT_LIVE_KEY!,
});

// Middleware or route handler — 0ms DB overhead
export async function authenticateRequest(req: Request) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401 });

  // Cryptographic in-memory verification against cached public JWKS
  const claims = await hvt.tokens.verify(token);

  // Instant local permission check — zero network round trips
  if (!claims.hasPermission('orders:refund')) {
    return new Response(JSON.stringify({ error: 'Missing permission: orders:refund' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return { actor: claims.sub, orgId: claims.org_id };
}`,
  },
  python: {
    filename: 'api/endpoints/orders.py',
    lang: 'python',
    code: `import os
from fastapi import FastAPI, Header, HTTPException, status
from hvt import HVTClient

client = HVTClient(
    project_id=os.environ["HVT_PROJECT_ID"],
    api_key=os.environ["HVT_LIVE_KEY"],
)

@app.post("/v1/orders/{order_id}/refund")
def refund_order(order_id: str, authorization: str = Header(...)):
    # Local RSA signature verification via cached JWKS public key
    token = authorization.replace("Bearer ", "")
    claims = client.tokens.verify(token)
    
    # 0ms database lookup — evaluated strictly in memory
    if not claims.has_permission("orders:refund"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing permission: orders:refund",
        )
        
    return {"status": "refunded", "actor": claims.sub, "org_id": claims.org_id}`,
  },
  go: {
    filename: 'handlers/orders.go',
    lang: 'go',
    code: `package main

import (
    "net/http"
    "os"
    "github.com/hvt-dev/hvt-go"
)

var client = hvt.NewClient(hvt.Config{
    ProjectID: os.Getenv("HVT_PROJECT_ID"),
    APIKey:    os.Getenv("HVT_LIVE_KEY"),
})

func RefundHandler(w http.ResponseWriter, r *http.Request) {
    // Verify asymmetric signature offline in memory
    claims, err := client.Tokens.Verify(r.Header.Get("Authorization"))
    if err != nil || !claims.HasPermission("orders:refund") {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(\`{"status":"refunded","org_id":"\` + claims.OrgID + \`"}\`))
}`,
  },
  curl: {
    filename: 'Terminal',
    lang: 'bash',
    code: `# 1. Fetch HVT public JWKS keys for offline verification
curl -s https://api.hvt.dev/.well-known/jwks.json | jq .

# 2. Runtime authentication request (client plane)
curl -X POST https://api.hvt.dev/api/v1/auth/runtime/login/ \\
  -H "X-API-Key: hvt_live_948f21bc90a..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "engineer@company.com",
    "password": "UserSecurePassword123!"
  }'

# 3. Synchronize permissions as code via Management Plane (CI/CD)
hvt sync --project team-6 --schema ./hvt.schema.json`,
  },
};

// ─── Interactive Claims Data ────────────────────────────────────────────────
const DEMO_ROLES = [
  {
    id: 'developer',
    name: 'Developer',
    sub: 'usr_dev_48a912',
    permissions: ['repos:read', 'deploy:preview', 'logs:read'],
  },
  {
    id: 'lead',
    name: 'Tech Lead',
    sub: 'usr_lead_71c084',
    permissions: ['repos:read', 'deploy:preview', 'deploy:production', 'secrets:read', 'logs:read'],
  },
  {
    id: 'secops',
    name: 'Security Admin',
    sub: 'usr_sec_99b310',
    permissions: ['repos:read', 'secrets:read', 'audit:read', 'members:revoke', 'apikeys:provision'],
  },
];

const ROUTE_CHECKS = [
  { method: 'GET', path: '/v1/repos/core', perm: 'repos:read', description: 'Read repository source' },
  { method: 'POST', path: '/v1/deploy/preview', perm: 'deploy:preview', description: 'Trigger preview deployment' },
  { method: 'POST', path: '/v1/deploy/production', perm: 'deploy:production', description: 'Promote to production' },
  { method: 'DELETE', path: '/v1/apikeys/revoke', perm: 'apikeys:provision', description: 'Revoke management API key' },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSnippetKey, setActiveSnippetKey] = useState('typescript');
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(1);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    document.title = SEO_TITLE;
  }, []);

  const currentRole = DEMO_ROLES[selectedRoleIndex];
  const activeSnippet = INTEGRATION_SNIPPETS[activeSnippetKey];

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet.code);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      // noop
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>{SEO_TITLE}</title>
        <meta name="description" content={SEO_DESCRIPTION} />
      </Helmet>

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#27272a] bg-[#09090b]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <HvtLogoMark className="h-6 w-6 text-white" />
              <span className="font-semibold tracking-tight text-white">HVT</span>
            </Link>

            <span className="hidden sm:inline-flex items-center rounded-md border border-[#27272a] bg-[#121215] px-2 py-0.5 text-[11px] font-mono text-[#a1a1aa]">
              Apache 2.0 Open Source
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-[#a1a1aa]">
            <Link to="/features/engine" className="transition hover:text-white">In-Memory Engine</Link>
            <Link to="/features/dual-plane" className="transition hover:text-white">Dual-Plane</Link>
            <Link to="/features/passkeys" className="transition hover:text-white">Passkeys</Link>
            <Link to="/features/sessions" className="transition hover:text-white">Device Registry</Link>
            <Link to="/features/byo-email" className="transition hover:text-white">BYO Email</Link>
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">Docs</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 transition hover:text-white">
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </a>
          </nav>

          {/* Action CTAs - Purple on primary button only */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-xs font-medium text-[#a1a1aa] transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-8 items-center rounded-lg bg-[#7c3aed] px-3.5 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9]"
            >
              Get started
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden rounded-lg border border-[#27272a] p-1.5 text-[#a1a1aa] hover:text-white"
            aria-label="Toggle Navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Panel */}
        {menuOpen && (
          <div className="border-b border-[#27272a] bg-[#111114] px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm">
              <Link to="/features/engine" onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">In-Memory Engine</Link>
              <Link to="/features/dual-plane" onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">Dual-Plane</Link>
              <Link to="/features/passkeys" onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">Passkeys</Link>
              <Link to="/features/sessions" onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">Device Registry</Link>
              <Link to="/features/byo-email" onClick={() => setMenuOpen(false)} className="text-[#a1a1aa] hover:text-white">BYO Email</Link>
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="text-[#a1a1aa] hover:text-white">Documentation</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-[#a1a1aa] hover:text-white">GitHub Repository</a>
              <div className="pt-3 border-t border-[#27272a] flex flex-col gap-2">
                <Link to="/login" className="flex h-9 items-center justify-center rounded-lg border border-[#27272a] text-xs font-medium text-white">
                  Sign in
                </Link>
                <Link to="/signup" className="flex h-9 items-center justify-center rounded-lg bg-[#7c3aed] text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9]">
                  Get started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[#27272a] px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl space-y-5">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.08]">
              Auth without the database bottleneck.
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-[#a1a1aa] max-w-2xl">
              HVT signs your project’s complete role and permission matrix directly into asymmetric RS256 JWTs.
              Every microservice, edge worker, and backend API verifies access in memory in 0.1ms with zero database round-trips.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/signup"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#7c3aed] px-5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9]"
              >
                <span>Start free project</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#27272a] bg-[#121215] px-4 text-xs sm:text-sm font-medium text-zinc-300 transition hover:border-[#3f3f46] hover:text-white"
              >
                <span>Read documentation</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
              </a>
            </div>
          </div>

          {/* Clean Monospace ASCII Architecture Terminal (Quiet & Monochromatic) */}
          <div className="mt-12 rounded-2xl border border-[#27272a] bg-[#0c0c0e] overflow-hidden shadow-2xl">
            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between border-b border-[#27272a] bg-[#141416] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-zinc-700 inline-block" />
                <span className="h-3 w-3 rounded-full bg-zinc-700 inline-block" />
                <span className="h-3 w-3 rounded-full bg-zinc-700 inline-block" />
                <span className="ml-2 font-mono text-xs text-zinc-400">
                  bash — hvt-engine-architecture (v2.2.2)
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-zinc-500 hidden sm:inline">ALGO: RS256</span>
                <span className="text-emerald-400">LATENCY: 0.1ms</span>
                <span className="text-zinc-400">DB QUERIES: 0</span>
              </div>
            </div>

            {/* Clean Monochromatic Monospace ASCII Schematic */}
            <div className="p-5 font-mono text-[11px] sm:text-xs leading-relaxed text-zinc-300 overflow-x-auto bg-[#09090b]">
              <pre className="text-zinc-300">
{`┌─────────────────────────── CONTROL PLANE (CI/CD & CLI) ───────────────────────────┐
│  hvt_mgmt_9a4f... ──► POST /api/v1/projects/:id/sync                              │
│                       ├── Declarative Roles & Permissions Schema                  │
│                       └── Outbox Webhook Subscriptions (HMAC-SHA256)              │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │  [Asymmetric RS256 Private Key Sign]
                                         ▼
┌─────────────────────────── RUNTIME AUTH ENGINE (EDGE) ────────────────────────────┐
│  hvt_live_c10b... ──► POST /api/v1/auth/runtime/login/                            │
│                       ├── WebAuthn Passkeys / Biometrics (Apple TouchID, Hello)   │
│                       ├── Issues Self-Contained RS256 Access Token Pair           │
│                       └── Public Key Distribution: /.well-known/jwks.json         │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │  In-Memory Signature Verification (0.1ms)
                                         ▼
┌─────────────────────────── DISTRIBUTED DOWNSTREAM SERVICES ───────────────────────┐
│  FastAPI • Next.js • Go • Rust • Cloudflare Edge • Envoy API Gateway              │
│  claims = hvt.tokens.verify(jwt) ──► 0 DATABASE CALLS ──► 200 OK GRANTED          │
└───────────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </div>

          {/* Interactive Token Claims & Verification Console */}
          <div id="architecture" className="mt-10 rounded-2xl border border-[#27272a] bg-[#111114] overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#27272a] px-5 py-3 gap-3 bg-[#161619]">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-zinc-300">Live Claims Evaluator</span>
                <span className="rounded bg-[#27272a] px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                  algorithm: RS256
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  signature: valid
                </span>
              </div>

              {/* Persona Switcher Buttons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">Active Role:</span>
                {DEMO_ROLES.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRoleIndex(i)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      selectedRoleIndex === i
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#27272a]">
              {/* Left Column: Signed Token Payload */}
              <div className="lg:col-span-6 p-5 font-mono text-xs leading-relaxed bg-[#0c0c0e]">
                <div className="text-zinc-500 pb-2">// Decoded JWT Access Token Claims</div>
                <div className="text-zinc-500">{'{'}</div>
                <div className="pl-4 space-y-1">
                  <div><span className="text-zinc-400">"sub"</span>: <span className="text-zinc-100">"{currentRole.sub}"</span>,</div>
                  <div><span className="text-zinc-400">"org_id"</span>: <span className="text-zinc-100">"org_bravo_6"</span>,</div>
                  <div><span className="text-zinc-400">"project_id"</span>: <span className="text-zinc-100">"prj_production"</span>,</div>
                  <div><span className="text-zinc-400">"app_roles"</span>: [<span className="text-zinc-100">"{currentRole.id}"</span>],</div>
                  <div><span className="text-zinc-400">"app_permissions"</span>: [</div>
                  <div className="pl-4 space-y-0.5">
                    {currentRole.permissions.map((p, idx) => (
                      <div key={p}>
                        <span className="text-emerald-400">"{p}"</span>
                        {idx < currentRole.permissions.length - 1 ? <span className="text-zinc-500">,</span> : null}
                      </div>
                    ))}
                  </div>
                  <div>],</div>
                  <div><span className="text-zinc-400">"iat"</span>: <span className="text-zinc-300">1731148800</span>,</div>
                  <div><span className="text-zinc-400">"exp"</span>: <span className="text-zinc-300">1731149700</span></div>
                </div>
                <div className="text-zinc-500">{'}'}</div>

                <div className="mt-4 pt-3 border-t border-[#27272a] text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Verified via cached JWKS</span>
                  <span className="font-mono text-zinc-400">/.well-known/jwks.json</span>
                </div>
              </div>

              {/* Right Column: In-Memory Route Execution Matrix */}
              <div className="lg:col-span-6 p-5 bg-[#111114]">
                <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
                  <span className="text-xs font-semibold text-zinc-300">API Route Decision Matrix</span>
                  <span className="text-[11px] font-mono text-emerald-400">0ms DB queries</span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {ROUTE_CHECKS.map((route) => {
                    const hasPerm = currentRole.permissions.includes(route.perm);
                    return (
                      <div
                        key={route.path}
                        className="flex items-center justify-between rounded-lg border border-[#27272a] bg-[#16161a] px-3.5 py-2.5 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            route.method === 'GET' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800 text-zinc-200'
                          }`}>
                            {route.method}
                          </span>
                          <span className="text-zinc-200 truncate">{route.path}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-zinc-500 hidden sm:inline">{route.perm}</span>
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${
                            hasPerm
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          }`}>
                            {hasPerm ? '200 OK' : '403 Forbidden'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="mt-4 text-[11px] text-zinc-500 leading-normal">
                  Your services verify claims mathematically using HVT’s public JWKS. The database is never touched during API request evaluation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS (CLEAN & MONOCHROMATIC - NO PURPLE, NO EYEBROWS) ─── */}
      <section className="border-b border-[#27272a] px-5 py-20 sm:px-8 bg-[#0c0c0e]">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Engineered for developer autonomy.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Explore in-depth specifications, cryptographic models, and code implementations for each core pillar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1: In-Memory Engine */}
            <div className="group flex flex-col justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-6 space-y-4 hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#18181b] w-fit text-zinc-300 border border-[#27272a]">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Cryptographic In-Memory Engine</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Eliminate database bottlenecks. Sign roles and permissions into RS256 JWTs for 0.1ms offline authorization via RFC 7517 public JWKS.
                </p>
              </div>
              <Link
                to="/features/engine"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white pt-2 transition"
              >
                <span>Read technical spec</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition" />
              </Link>
            </div>

            {/* Pillar 2: Dual-Plane Architecture */}
            <div className="group flex flex-col justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-6 space-y-4 hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#18181b] w-fit text-zinc-300 border border-[#27272a]">
                  <GitBranch className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Dual-Plane Key Architecture</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Strict cryptographic separation between the Management Plane (<code className="text-zinc-300">hvt_mgmt_</code>) for CI/CD and the Runtime Plane (<code className="text-zinc-300">hvt_live_</code>) for clients.
                </p>
              </div>
              <Link
                to="/features/dual-plane"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white pt-2 transition"
              >
                <span>Inspect blast radius</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition" />
              </Link>
            </div>

            {/* Pillar 3: Passkeys & WebAuthn */}
            <div className="group flex flex-col justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-6 space-y-4 hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#18181b] w-fit text-zinc-300 border border-[#27272a]">
                  <Fingerprint className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Passkeys & WebAuthn</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Phishing-resistant biometric authentication via Apple Touch ID, Face ID, Windows Hello, and YubiKeys. Includes RFC 6238 TOTP fallback.
                </p>
              </div>
              <Link
                to="/features/passkeys"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white pt-2 transition"
              >
                <span>View WebAuthn flow</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition" />
              </Link>
            </div>

            {/* Pillar 4: Session & Device Registry */}
            <div className="group flex flex-col justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-6 space-y-4 hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#18181b] w-fit text-zinc-300 border border-[#27272a]">
                  <Users className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Active Device Registry</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Granular tracking of user devices with IP and user-agent profiling, individual session revocation, and instant global remote logout.
                </p>
              </div>
              <Link
                to="/features/sessions"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white pt-2 transition"
              >
                <span>Learn about revocation</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition" />
              </Link>
            </div>

            {/* Pillar 5: BYO Email Transports */}
            <div className="group flex flex-col justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-6 space-y-4 hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#18181b] w-fit text-zinc-300 border border-[#27272a]">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Bring-Your-Own Email</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Zero vendor lock-in. Connect Resend, Postmark, AWS SES, or custom SMTP to send transactional emails directly from your company domain.
                </p>
              </div>
              <Link
                to="/features/byo-email"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white pt-2 transition"
              >
                <span>Configure drivers</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition" />
              </Link>
            </div>

            {/* Pillar 6: Runtime Playground */}
            <div className="group flex flex-col justify-between rounded-2xl border border-[#27272a] bg-[#111114] p-6 space-y-4 hover:border-zinc-700 transition">
              <div className="space-y-3">
                <div className="p-2.5 rounded-lg bg-[#18181b] w-fit text-zinc-300 border border-[#27272a]">
                  <Terminal className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white">Interactive Playground</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Test live sign-ups, magic link dispatches, social OAuth logins, and token exchanges directly inside an interactive sandbox console.
                </p>
              </div>
              <Link
                to="/runtime-playground"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white pt-2 transition"
              >
                <span>Launch playground</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SDK & QUICKSTART ──────────────────────────────────────────────── */}
      <section id="quickstart" className="border-b border-[#27272a] px-5 py-16 sm:px-8 lg:py-20 bg-[#09090b]">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Integrate in minutes with any language or framework
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Use our official TypeScript, Python, and Go SDKs or query standard HTTP endpoints directly from cURL, Next.js Edge, Cloudflare Workers, or Django.
              </p>

              <div className="pt-2">
                <Link
                  to="/signup"
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#7c3aed] px-4 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9]"
                >
                  <span>Create free developer account</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="lg:col-span-7 rounded-xl border border-[#27272a] bg-[#111114] overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#27272a] px-4 py-2.5 bg-[#161619]">
                <div className="flex items-center gap-1">
                  {Object.keys(INTEGRATION_SNIPPETS).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveSnippetKey(key)}
                      className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                        activeSnippetKey === key
                          ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {key.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed bg-[#0a0a0c]">
                <pre>{activeSnippet.code}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RICH DEVELOPER FOOTER ─────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
