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
  Laptop,
  LogOut,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { HvtLogoMark } from '@/components/Logo';
import { Footer } from '@/components/layout/Footer';
import { DOCS_URL, GITHUB_URL } from '@/lib/appLinks';

export default function FeatureSessionsPage() {
  const [copiedCurl, setCopiedCurl] = useState(false);

  const curlSessionRevoke = `# 1. List active devices for the authenticated user
curl -s https://api.hvt.dev/api/v1/auth/sessions/ \\
  -H "Authorization: Bearer <user_jwt>"

# 2. Revoke a single compromised device session
curl -X DELETE https://api.hvt.dev/api/v1/auth/sessions/f726eaa0-2ee1-4a33-b8fc-ad2d276e9011/ \\
  -H "Authorization: Bearer <user_jwt>"

# 3. Remote Global Logout (Terminates all sessions across all devices except current)
curl -X POST https://api.hvt.dev/api/v1/auth/sessions/revoke-all/ \\
  -H "Authorization: Bearer <user_jwt>"`;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>Active Device Registry & Instant Session Revocation — HVT Architecture</title>
        <meta
          name="description"
          content="Real-time device tracking, granular session termination, refresh token family rotation, and instant remote logout across distributed microservices with HVT."
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
            <span className="text-xs font-mono text-zinc-400">Architecture: Session Registry</span>
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
              Active Device Registry & Session Revocation
            </h1>

            <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-[#a1a1aa]">
              Stateless JWTs often suffer from one critical flaw: the inability to revoke access immediately when a laptop is lost or credentials are leaked.
              HVT pairs short-lived RS256 access claims with real-time device tracking and refresh token family rotation.
            </p>
          </div>

          {/* Interactive Mock Device Grid */}
          <div className="mt-12 rounded-2xl border border-[#27272a] bg-[#111114] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
              <div>
                <span className="text-xs font-semibold text-white">Active Device Fleet</span>
                <p className="text-[11px] text-zinc-400">Tracked across Control Plane and Runtime apps</p>
              </div>
              <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
                2 devices connected
              </span>
            </div>

            <div className="space-y-3">
              {/* Device 1 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#27272a] bg-[#161619] gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[#27272a] text-zinc-300">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Chrome on macOS (Current)</span>
                      <span className="rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 font-medium border border-emerald-500/30">
                        This Device
                      </span>
                    </div>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      IP: 198.51.100.42 • Last active: 2 minutes ago
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-500 sm:text-right">session: f726eaa0...</span>
              </div>

              {/* Device 2 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#27272a] bg-[#161619] gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-lg bg-[#27272a] text-zinc-300">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Safari on iPhone 15</span>
                      <span className="text-[10px] text-zinc-500">San Francisco, CA</span>
                    </div>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      IP: 198.51.100.2 • Last active: 3 hours ago
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded px-2.5 py-1 text-xs font-medium text-rose-400 border border-rose-900/40 bg-rose-950/20">
                    Revoke Device
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Content */}
      <section className="px-5 py-16 sm:px-8 max-w-5xl mx-auto space-y-16">
        {/* Token Family Rotation */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            1. Refresh Token Family Rotation (Automatic Theft Detection)
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
            HVT employs strict cryptographic refresh token rotation (RFC 6749 Section 10.4). Every time a client exchanges a refresh token for a new access token, the old refresh token is invalidated and a replacement is issued.
          </p>

          <div className="rounded-xl border border-[#27272a] bg-[#121215] p-6 space-y-4">
            <h3 className="text-base font-semibold text-white">Automatic Compromise Detection:</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              If an attacker steals a previously used refresh token and attempts to replay it, HVT detects that a revoked token from an existing token family was presented.
              HVT immediately assumes a compromised device, invalidates the entire token family, and terminates all active sessions associated with that user.
            </p>
          </div>
        </div>

        {/* Remote Logout Execution */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            2. Programmatic Session Endpoints
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Easily build remote logout, "Sign out everywhere", and security dashboard experiences into your application using HVT's standard REST endpoints.
          </p>

          <div className="rounded-xl border border-[#27272a] bg-[#111114] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161619] border-b border-[#27272a] text-xs font-mono text-zinc-400">
              <span>cURL Session Management</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(curlSessionRevoke);
                  setCopiedCurl(true);
                  setTimeout(() => setCopiedCurl(false), 2000);
                }}
                className="hover:text-white"
              >
                {copiedCurl ? 'Copied' : 'Copy cURL'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed bg-[#0a0a0c]">
              {curlSessionRevoke}
            </pre>
          </div>
        </div>

        {/* Navigation */}
        <div className="pt-4 flex items-center justify-between border-t border-[#27272a]">
          <Link
            to="/features/passkeys"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous: Passkeys & WebAuthn</span>
          </Link>
          <Link
            to="/features/byo-email"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <span>Next: Bring-Your-Own Email</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Rich Sitemaps Footer */}
      <Footer />
    </div>
  );
}
