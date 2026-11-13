// SPDX-License-Identifier: Apache-2.0
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Copy,
  ExternalLink,
  GitBranch,
  KeyRound,
  Layers,
  Lock,
  Radio,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { HvtLogoMark } from '@/components/Logo';
import { Footer } from '@/components/layout/Footer';
import { DOCS_URL, GITHUB_URL } from '@/lib/appLinks';

export default function FeatureDualPlanePage() {
  const [copiedMgmt, setCopiedMgmt] = useState(false);
  const [copiedRuntime, setCopiedRuntime] = useState(false);

  const mgmtSnippet = `# .github/workflows/auth-sync.yml
# Management keys (hvt_mgmt_...) are strictly for CI/CD and Terraform
name: Sync Auth Schema
on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install HVT CLI
        run: curl -sSf https://get.hvt.dev | sh
      - name: Synchronize Roles as Code
        env:
          HVT_MANAGEMENT_KEY: \${{ secrets.HVT_PROD_MGMT_KEY }}
        run: |
          hvt sync \\
            --project prj_live_948f21 \\
            --schema ./auth/roles.schema.json \\
            --webhooks ./auth/webhooks.json`;

  const runtimeSnippet = `// src/lib/authClient.ts
// Runtime client keys (hvt_live_...) are public-safe and restricted to end-user flows
import { createHvtClient } from '@hvt/browser';

export const auth = createHvtClient({
  projectId: process.env.NEXT_PUBLIC_HVT_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_HVT_LIVE_KEY, // hvt_live_c10b...
  // Automatically locked by CORS to https://app.yourcompany.com
});

// Authenticate customer runtime users
export async function handleLogin(email, password) {
  const { session, user } = await auth.login({ email, password });
  return { session, user };
}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>Dual-Plane Architecture — Control vs Runtime Plane | HVT</title>
        <meta
          name="description"
          content="Learn why HVT enforces a strict cryptographic boundary between the Management Plane (CI/CD schema sync) and Application Runtime Plane (client end-user auth)."
        />
      </Helmet>

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#27272a] bg-[#09090b]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5">
              <HvtLogoMark className="h-6 w-6 text-white" />
              <span className="font-semibold tracking-tight text-white">HVT</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-mono text-zinc-400">Architecture: Dual-Plane Keys</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Overview</span>
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-8 items-center rounded-lg bg-[#7c3aed] px-3 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9]"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#27272a] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Dual-Plane Architecture
            </h1>

            <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-[#a1a1aa]">
              Traditional identity platforms give developers a single monolithic API key that is capable of both logging in end users and wiping production projects.
              HVT mathematically separates administrative provisioning from application runtime authentication.
            </p>
          </div>

          {/* ASCII Isolation Diagram */}
          <div className="mt-12 rounded-xl border border-[#27272a] bg-[#0c0c0e] p-6 font-mono text-xs text-zinc-300 shadow-2xl overflow-x-auto leading-normal">
            <div className="text-zinc-500 pb-2">// Security Boundary & Blast Radius Containment</div>
            <pre className="text-zinc-300">
{`┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        CONTROL PLANE  (Administrative & CI/CD)                         │
│  Prefix: hvt_mgmt_...                                                                  │
│  Target: POST /api/v1/projects/:id/sync                                                │
│  Scope:  Roles, Webhooks, Provider Secrets, Audit Logs, Org Tenancy                    │
│  Rule:   NEVER SHIPPED TO CLIENT BROWSERS OR MOBILE APPS                               │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │  Cryptographic Schema Barrier
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        RUNTIME PLANE  (End-User Client Apps)                           │
│  Prefix: hvt_test_... / hvt_live_...                                                   │
│  Target: POST /api/v1/auth/runtime/login/                                              │
│  Scope:  End-User Sign-up, Biometric WebAuthn, Token Refresh, Magic Links              │
│  Rule:   CORS-Restricted to Allowed Origins; Zero Schema Modification Rights          │
└────────────────────────────────────────────────────────────────────────────────────────┘`}
            </pre>
          </div>
        </div>
      </section>

      {/* Plane Comparison */}
      <section className="px-5 py-16 sm:px-8 max-w-5xl mx-auto space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plane 1: Management */}
          <div className="rounded-2xl border border-[#27272a] bg-[#111114] p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-zinc-300" />
                <h2 className="text-lg font-bold text-white">Management Plane</h2>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                hvt_mgmt_...
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Management keys are long-lived administrative credentials stored strictly in your CI/CD repository secrets (GitHub Actions, GitLab CI), Terraform manifests, or local developer keychains.
            </p>

            <div className="space-y-2 border-t border-[#27272a] pt-4">
              <span className="text-xs font-semibold text-zinc-300">Permitted Operations:</span>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Declarative permission schema sync via CLI</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Webhook endpoint subscriptions and HMAC rotation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400" />
                  <span>OAuth provider secret provisioning (Google/GitHub)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Immutable audit log query and export</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#0a0a0c] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#161619] border-b border-[#27272a] text-[11px] font-mono text-zinc-400">
                <span>CI/CD Usage</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mgmtSnippet);
                    setCopiedMgmt(true);
                    setTimeout(() => setCopiedMgmt(false), 2000);
                  }}
                  className="hover:text-white"
                >
                  {copiedMgmt ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-normal">
                {mgmtSnippet}
              </pre>
            </div>
          </div>

          {/* Plane 2: Runtime */}
          <div className="rounded-2xl border border-[#27272a] bg-[#111114] p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Runtime Plane</h2>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#092215] text-emerald-300 border border-emerald-500/30">
                hvt_live_... / hvt_test_...
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Runtime keys are client-safe identifiers baked into your frontend web apps, React Native apps, or Swift iOS apps. They are scoped strictly to end-user authentication requests.
            </p>

            <div className="space-y-2 border-t border-[#27272a] pt-4">
              <span className="text-xs font-semibold text-zinc-300">Permitted Operations:</span>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Customer sign-up, login, and logout</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>WebAuthn FIDO2 biometrics ceremonies</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Refresh token rotation and session renewal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Passwordless magic link dispatch</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#0a0a0c] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#161619] border-b border-[#27272a] text-[11px] font-mono text-zinc-400">
                <span>Client App Usage</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(runtimeSnippet);
                    setCopiedRuntime(true);
                    setTimeout(() => setCopiedRuntime(false), 2000);
                  }}
                  className="hover:text-white"
                >
                  {copiedRuntime ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto leading-normal">
                {runtimeSnippet}
              </pre>
            </div>
          </div>
        </div>

        {/* Security Matrix */}
        <div className="rounded-2xl border border-[#27272a] bg-[#121215] p-8 space-y-6">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Perimeter Security & Blast Radius Comparison
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-[#27272a] text-zinc-400 font-mono">
                  <th className="py-3 pr-6">Vector / Capability</th>
                  <th className="py-3 px-6 text-zinc-300">Management Key (hvt_mgmt_)</th>
                  <th className="py-3 pl-6 text-emerald-400">Runtime Key (hvt_live_)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] text-zinc-300">
                <tr>
                  <td className="py-3 pr-6 font-medium text-white">Browser / Mobile Exposure</td>
                  <td className="py-3 px-6 text-rose-400">Strictly prohibited (Never)</td>
                  <td className="py-3 pl-6 text-emerald-400">Safe for client bundle</td>
                </tr>
                <tr>
                  <td className="py-3 pr-6 font-medium text-white">CORS Restriction</td>
                  <td className="py-3 px-6 text-zinc-400">Server-to-Server Only</td>
                  <td className="py-3 pl-6 text-emerald-400">Origin-Locked to Project URLs</td>
                </tr>
                <tr>
                  <td className="py-3 pr-6 font-medium text-white">Role & Permission Schema Sync</td>
                  <td className="py-3 px-6 text-emerald-400">Full Access</td>
                  <td className="py-3 pl-6 text-rose-400">Hard 403 Forbidden</td>
                </tr>
                <tr>
                  <td className="py-3 pr-6 font-medium text-white">Issue End-User Auth Tokens</td>
                  <td className="py-3 px-6 text-zinc-400">No (Separation of concern)</td>
                  <td className="py-3 pl-6 text-emerald-400">Full Access</td>
                </tr>
                <tr>
                  <td className="py-3 pr-6 font-medium text-white">Blast Radius if Leaked</td>
                  <td className="py-3 px-6 text-rose-400">Project configuration change</td>
                  <td className="py-3 pl-6 text-emerald-400">Zero admin access; rotate in 1-click</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-[#27272a]">
            <Link
              to="/features/engine"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous: In-Memory Engine</span>
            </Link>
            <Link
              to="/features/passkeys"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              <span>Next: Passkeys & WebAuthn</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Rich Sitemaps Footer */}
      <Footer />
    </div>
  );
}
