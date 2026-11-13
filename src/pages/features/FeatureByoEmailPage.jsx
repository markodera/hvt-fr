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
  Globe,
  Mail,
  Send,
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

export default function FeatureByoEmailPage() {
  const [activeTab, setActiveTab] = useState('resend');
  const [copiedPayload, setCopiedPayload] = useState(false);

  const PROVIDER_CONFIGS = {
    resend: {
      name: 'Resend',
      payload: `{
  "provider": "resend",
  "from_email": "auth@mycompany.com",
  "from_name": "MyCompany Auth",
  "resend_api_key": "re_123456789abcdef..."
}`,
    },
    postmark: {
      name: 'Postmark',
      payload: `{
  "provider": "postmark",
  "from_email": "security@mycompany.com",
  "from_name": "MyCompany Identity",
  "postmark_api_key": "25a892b1-9f20-4123..."
}`,
    },
    ses: {
      name: 'AWS SES',
      payload: `{
  "provider": "ses",
  "from_email": "no-reply@mycompany.com",
  "from_name": "MyCompany Access",
  "aws_access_key_id": "AKIAIOSFODNN7EXAMPLE",
  "aws_secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "aws_region": "us-east-1"
}`,
    },
    smtp: {
      name: 'Custom SMTP',
      payload: `{
  "provider": "smtp",
  "from_email": "auth@internal.corp",
  "from_name": "Enterprise SSO",
  "smtp_host": "smtp.mailgun.org",
  "smtp_port": 587,
  "smtp_username": "postmaster@internal.corp",
  "smtp_password": "SuperSecretSMTPPassword123!",
  "smtp_use_tls": true
}`,
    },
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>Bring-Your-Own Email Transports (Resend, SES, Postmark) — HVT Architecture</title>
        <meta
          name="description"
          content="Zero vendor lock-in. Connect Resend, AWS SES, Postmark, or custom SMTP to send transactional authentication emails directly from your verified domain."
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
            <span className="text-xs font-mono text-zinc-400">Architecture: BYO Email</span>
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
              Bring-Your-Own Email Transports
            </h1>

            <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-[#a1a1aa]">
              Most authentication platforms force you into their proprietary shared email pools—risking spam folder placement and charging arbitrary markups on every email.
              HVT routes all verification emails, password resets, and magic links through your own verified email provider.
            </p>
          </div>

          {/* Supported Providers Grid */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['Resend', 'Postmark', 'AWS SES', 'Custom SMTP'].map((prov) => (
              <div key={prov} className="rounded-xl border border-[#27272a] bg-[#111114] p-4 text-center space-y-1">
                <span className="text-xs font-semibold text-white">{prov}</span>
                <p className="text-[11px] text-zinc-500">Native Driver</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive Content */}
      <section className="px-5 py-16 sm:px-8 max-w-5xl mx-auto space-y-16">
        {/* Why BYO Email Matters */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            1. Why Domain Reputation & Deliverability Matter
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
            When onboarding new users, verification email arrival speed dictates user activation. If your auth provider shares IPs with thousands of untrusted tenants, spam blocks directly cost you sign-ups.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-2">
              <span className="text-xs font-semibold text-white">Full DKIM & SPF Alignment</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Emails originate from your authenticated DNS records (e.g. <code className="text-zinc-300">auth@yourcompany.com</code>), eliminating DMARC failure flags.
              </p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-2">
              <span className="text-xs font-semibold text-white">Zero Email Markups</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Pay your email provider directly at wholesale API rates without paying per-active-user authentication email taxes.
              </p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-2">
              <span className="text-xs font-semibold text-white">Per-Project Isolation</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Configure separate email drivers for staging vs production, or separate sender addresses across individual apps.
              </p>
            </div>
          </div>
        </div>

        {/* Configuration API & Payload */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                2. Configuration Payload by Provider
              </h2>
              <p className="text-sm text-zinc-400">
                Update email settings via the dashboard or patch the Control Plane REST API.
              </p>
            </div>

            <div className="inline-flex rounded-lg border border-[#27272a] bg-[#111114] p-1">
              {Object.keys(PROVIDER_CONFIGS).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    activeTab === key
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {PROVIDER_CONFIGS[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#111114] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161619] border-b border-[#27272a] text-xs font-mono text-zinc-400">
              <span>PATCH /api/v1/organizations/current/projects/:id/email-config/</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(PROVIDER_CONFIGS[activeTab].payload);
                  setCopiedPayload(true);
                  setTimeout(() => setCopiedPayload(false), 2000);
                }}
                className="hover:text-white"
              >
                {copiedPayload ? 'Copied' : 'Copy payload'}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed bg-[#0a0a0c]">
              {PROVIDER_CONFIGS[activeTab].payload}
            </pre>
          </div>
        </div>

        {/* Test Email Sandbox */}
        <div className="rounded-2xl border border-[#27272a] bg-[#121215] p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <Send className="h-5 w-5 text-zinc-300" />
            <h3 className="text-lg font-bold text-white">Live Delivery Test Sandbox</h3>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            HVT includes an integrated test endpoint: <code className="text-zinc-300">POST .../email-config/test/</code>.
            Trigger a real transactional email to your developer inbox with one click to confirm SMTP handshake, TLS encryption, and API keys before opening public registration.
          </p>

          <div className="pt-4 flex items-center justify-between border-t border-[#27272a]">
            <Link
              to="/features/sessions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous: Active Device Registry</span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              <span>Back to HVT Overview</span>
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
