// SPDX-License-Identifier: Apache-2.0
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  KeyRound,
  Layers,
  Lock,
  Radio,
  Server,
  Shield,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { HvtLogoMark } from '@/components/Logo';
import { Footer } from '@/components/layout/Footer';
import { DOCS_URL, GITHUB_URL } from '@/lib/appLinks';

const CODE_EXAMPLES = {
  fastapi: {
    title: 'FastAPI (Python)',
    code: `import jwt
from jwt import PyJWKClient
from fastapi import FastAPI, Header, HTTPException, status

app = FastAPI()

# Cache public JWKS keys in memory for offline verification
jwks_client = PyJWKClient("https://api.hvt.dev/.well-known/jwks.json", cache_keys=True)

@app.post("/v1/orders/{order_id}/refund")
def refund_order(order_id: str, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")

    # Mathematical in-memory verification against cached public JWKS (0.1ms)
    # Zero database or network calls made
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    claims = jwt.decode(token, signing_key.key, algorithms=["RS256"])

    if "orders:refund" not in claims.get("app_permissions", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Missing permission: orders:refund"
        )

    return {"status": "refunded", "actor": claims["sub"], "org_id": claims["org_id"]}`,
  },
  nextjs: {
    title: 'Next.js Edge Runtime',
    code: `import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

// Cache public JWKS keys in memory across edge invocations
const JWKS = createRemoteJWKSet(
  new URL('https://api.hvt.dev/.well-known/jwks.json')
);

export async function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 0ms edge verification — verified cryptographically in memory
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'https://api.hvt.dev',
    audience: process.env.HVT_PROJECT_ID,
  });

  const permissions = (payload.app_permissions as string[]) || [];
  if (!permissions.includes('orders:refund')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.next();
}`,
  },
  golang: {
    title: 'Go (net/http)',
    code: `package main

import (
    "net/http"
    "strings"

    "github.com/MicahParks/keyfunc/v3"
    "github.com/golang-jwt/jwt/v5"
)

// Cache public JWKS keys in memory for offline verification
var jwks, _ = keyfunc.NewDefault([]string{"https://api.hvt.dev/.well-known/jwks.json"})

func RefundHandler(w http.ResponseWriter, r *http.Request) {
    tokenString := strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
    claims := jwt.MapClaims{}

    // Verified offline in memory — zero database round-trips
    token, err := jwt.ParseWithClaims(tokenString, claims, jwks.Keyfunc,
        jwt.WithValidMethods([]string{"RS256"}))
    if err != nil || !token.Valid {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    perms, _ := claims["app_permissions"].([]interface{})
    allowed := false
    for _, p := range perms {
        if p == "orders:refund" {
            allowed = true
        }
    }
    if !allowed {
        http.Error(w, "Forbidden", http.StatusForbidden)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(\`{"status":"refunded"}\`))
}`,
  },
};

export default function FeatureEnginePage() {
  const [activeLang, setActiveLang] = useState('fastapi');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CODE_EXAMPLES[activeLang].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>In-Memory Cryptographic Engine — HVT Architecture</title>
        <meta
          name="description"
          content="Deep dive into HVT's RS256 in-memory cryptographic authorization engine. Sign fine-grained permissions into JWT access tokens for 0.1ms verification with 0 database queries."
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
            <span className="text-xs font-mono text-zinc-400">Architecture: In-Memory Engine</span>
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

      {/* Hero Section - No Eyebrow, No Purple Radial */}
      <section className="relative overflow-hidden border-b border-[#27272a] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              Cryptographic In-Memory Engine
            </h1>

            <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-[#a1a1aa]">
              Traditional authentication systems force every API request to query a shared database or Redis cache to verify session tokens and fetch user roles.
              HVT eliminates this bottleneck by signing the complete permission matrix directly into asymmetric RS256 JWTs.
            </p>
          </div>

          {/* Quick Metrics Comparison */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Edge Verification Latency</span>
              <div className="text-3xl font-bold font-mono text-emerald-400">0.1 ms</div>
              <p className="text-xs text-zinc-400">Evaluated purely via mathematical RSA public-key verification</p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Database Queries per Request</span>
              <div className="text-3xl font-bold font-mono text-white">0 Queries</div>
              <p className="text-xs text-zinc-400">Zero round-trips to PostgreSQL, Redis, or central auth service</p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Key Rotation Standard</span>
              <div className="text-3xl font-bold font-mono text-zinc-200">RFC 7517</div>
              <p className="text-xs text-zinc-400">Automated JWKS discovery endpoint with seamless rotation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Content */}
      <section className="px-5 py-16 sm:px-8 max-w-5xl mx-auto space-y-16">
        {/* Section 1: The Problem with Centralized Session Lookups */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            1. The Centralized Session Trap
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
            In modern distributed architectures—microservices, Kubernetes pods, serverless functions, and Cloudflare Edge workers—an incoming HTTP request often touches 3 to 10 downstream services before a response is returned.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-rose-900/30 bg-rose-950/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <Database className="h-4 w-4" />
                <span>The Legacy Bottleneck</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If each microservice must execute a <code className="text-rose-300">SELECT * FROM sessions WHERE token = ?</code> or reach back to an authentication microservice over the network, your cluster suffers:
              </p>
              <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
                <li><strong className="text-zinc-200">15ms to 80ms</strong> latency penalty on every hop</li>
                <li>Database connection pool exhaustion during traffic surges</li>
                <li>Single Point of Failure: If the auth database stutters, every service goes down</li>
              </ul>
            </div>

            <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Zap className="h-4 w-4" />
                <span>The HVT In-Memory Model</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                HVT issues short-lived (15-minute) self-contained RS256 JWTs embedding the complete role and permission tree. Microservices verify the signature using HVT's cached public key:
              </p>
              <ul className="space-y-1.5 text-xs text-zinc-400 list-disc list-inside">
                <li><strong className="text-zinc-200">&lt; 0.1ms</strong> CPU mathematical execution</li>
                <li>Zero database connection overhead</li>
                <li>Zero network traffic: Service remains 100% operational even if HVT is offline</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 2: Token Anatomy */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            2. Anatomy of an HVT Signed Claim
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            Below is an authentic HVT access token payload. When a user authenticates, HVT resolves their membership in the organization and active project, compiles all granted permission strings, and signs the payload with the project's private RSA key.
          </p>

          <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 font-mono text-xs overflow-x-auto leading-relaxed">
            <div className="text-zinc-500 pb-2">// Decoded RS256 JWT Payload (Claims)</div>
            <pre className="text-zinc-300">
{`{
  "sub": "usr_8779ebc8-0bec-4691-a075-8bdd1151ac6d",
  "email": "engineer@company.com",
  "org_id": "org_fccbdb63-3cb6-4ecb-b243-9570b9bfeb3c",
  "project_id": "prj_918608b9-876d-4aee-85b1-53026099a9e9",
  "environment": "test",
  "app_roles": [
    "admin",
    "billing_manager"
  ],
  "app_permissions": [
    "users:read",
    "users:invite",
    "apikeys:provision",
    "webhooks:manage",
    "orders:refund"
  ],
  "session_id": "ses_f726eaa0-2ee1-4a33-b8fc-ad2d276e9011",
  "iss": "https://api.hvt.dev",
  "aud": "prj_918608b9-876d-4aee-85b1-53026099a9e9",
  "iat": 1731148800,
  "exp": 1731149700
}`}
            </pre>
          </div>
        </div>

        {/* Section 3: Verification Implementation Across Stacks */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                3. Code Implementation
              </h2>
              <p className="text-sm text-zinc-400">
                Plug HVT directly into your favorite framework without installing bloated dependencies.
              </p>
            </div>

            {/* Language Selector */}
            <div className="inline-flex rounded-lg border border-[#27272a] bg-[#111114] p-1">
              {Object.keys(CODE_EXAMPLES).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveLang(key)}
                  className={`rounded-md px-3 py-1 text-xs font-mono font-medium transition ${
                    activeLang === key
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {CODE_EXAMPLES[key].title}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#111114] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#27272a] px-4 py-2 bg-[#161619]">
              <span className="text-xs font-mono text-zinc-400">{CODE_EXAMPLES[activeLang].title}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono text-zinc-400 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed bg-[#0a0a0c]">
              {CODE_EXAMPLES[activeLang].code}
            </pre>
          </div>
        </div>

        {/* Section 4: Public JWKS Rotation */}
        <div className="rounded-2xl border border-[#27272a] bg-[#121215] p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-5 w-5 text-zinc-300" />
            <h3 className="text-lg font-bold text-white">Public JWKS Key Discovery (RFC 7517)</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            HVT exposes an RFC 7517 compliant JSON Web Key Set endpoint at <code className="text-zinc-300">/.well-known/jwks.json</code>.
            Standard API gateways such as Kong, Envoy, Traefik, and AWS API Gateway can natively cache these public keys and enforce cryptographic verification at the cluster boundary before requests even enter your VPC.
          </p>

          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              to="/features/dual-plane"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              <span>Next: Explore Dual-Plane Architecture</span>
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
