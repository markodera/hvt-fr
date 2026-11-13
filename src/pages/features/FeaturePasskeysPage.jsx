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
  Fingerprint,
  KeyRound,
  Lock,
  QrCode,
  Radio,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { HvtLogoMark } from '@/components/Logo';
import { Footer } from '@/components/layout/Footer';
import { DOCS_URL, GITHUB_URL } from '@/lib/appLinks';

export default function FeaturePasskeysPage() {
  const [copiedCode, setCopiedCode] = useState(false);

  const webauthnSnippet = `// Authenticate using Passkeys with HVT SDK
import { HVTClient } from '@hvt/browser';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

const hvt = new HVTClient({ projectId: 'prj_live_948f21', apiKey: 'hvt_live_c10b...' });

// 1. Passwordless Registration Ceremony
export async function registerPasskey(deviceName = 'MacBook Touch ID') {
  // Fetch cryptographic challenge from HVT
  const options = await hvt.passkeys.registerOptions();
  
  // Prompt user biometric sensor (TouchID / Windows Hello / YubiKey)
  const attestation = await startRegistration(options);
  
  // Submit public key credential to HVT
  return await hvt.passkeys.registerVerify({
    device_name: deviceName,
    ...attestation,
  });
}

// 2. Biometric Sign-In Ceremony (Zero Passwords)
export async function loginWithPasskey() {
  const options = await hvt.passkeys.loginOptions();
  const assertion = await startAuthentication(options);
  
  // Exchanges signed assertion for RS256 JWT Token Pair
  const { session, user } = await hvt.passkeys.loginVerify(assertion);
  return { session, user };
}`;

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] antialiased selection:bg-zinc-800 selection:text-white">
      <Helmet>
        <title>Passkeys, WebAuthn & TOTP MFA — HVT Architecture</title>
        <meta
          name="description"
          content="FIDO2 WebAuthn biometric passkeys and RFC 6238 TOTP multi-factor authentication with 10 single-use emergency backup codes built on HVT."
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
            <span className="text-xs font-mono text-zinc-400">Architecture: Passkeys & MFA</span>
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
              Passkeys, WebAuthn & TOTP
            </h1>

            <p className="max-w-3xl text-base sm:text-lg leading-relaxed text-[#a1a1aa]">
              Eliminate password databases, credential stuffing, and SIM-swapping vulnerabilities.
              HVT delivers native FIDO2 WebAuthn biometrics alongside RFC 6238 TOTP authentication and single-use emergency backup recovery codes.
            </p>
          </div>

          {/* Biometric Ceremony Flow */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>Phase 01</span>
                <span className="text-zinc-400">Challenge</span>
              </div>
              <h3 className="text-base font-semibold text-white">Cryptographic Nonce</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                HVT generates a cryptographically random single-use challenge bound to the user's origin domain to prevent replay and man-in-the-middle attacks.
              </p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#161619] p-5 space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>Phase 02</span>
                <span className="text-emerald-400">Secure Enclave</span>
              </div>
              <h3 className="text-base font-semibold text-white">Hardware Biometric Sign</h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                The device's Secure Enclave (Apple Touch ID / Face ID / Windows Hello) verifies the user locally. The private key never leaves physical silicon.
              </p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
                <span>Phase 03</span>
                <span className="text-emerald-400">Token Mint</span>
              </div>
              <h3 className="text-base font-semibold text-white">Assertion & RS256 Issue</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                HVT mathematically verifies the signed assertion against the stored public key credential and issues an authenticated RS256 token pair.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive Content */}
      <section className="px-5 py-16 sm:px-8 max-w-5xl mx-auto space-y-16">
        {/* Passkeys vs Passwords */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            1. Why Passkeys Supersede Passwords
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-zinc-400">
            Passwords are the root cause of over 80% of enterprise security breaches. Passkeys utilize public-key cryptography where the server only ever holds a public key, making database leaks completely harmless.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Zero Stored Passwords</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Because credentials consist of asymmetric keypairs generated in the user's device, an attacker dumping the HVT database gains zero hash tables to crack.
              </p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#111114] p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Domain-Bound Phishing Resistance</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                WebAuthn credentials are tied cryptographically to your registered domain origin (e.g. <code className="text-zinc-300">app.company.com</code>). Even if an employee is tricked into visiting a fake phishing clone, the browser refuses to sign the challenge.
              </p>
            </div>
          </div>
        </div>

        {/* RFC 6238 TOTP & Emergency Codes */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            2. RFC 6238 TOTP 2FA & Emergency Recovery
          </h2>
          <p className="text-sm leading-relaxed text-zinc-400">
            For users on legacy browsers or corporate hardware without biometric enclaves, HVT includes a fully compliant RFC 6238 Time-Based One-Time Password engine.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-[#27272a] bg-[#121215] p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <QrCode className="h-4 w-4 text-zinc-300" />
                <span>Universal Authenticator Compatibility</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Works out of the box with Google Authenticator, 1Password, Bitwarden, and Apple Keychain. HVT provides instant base32 secret provisioning and standard <code className="text-zinc-300">otpauth://totp/...</code> QR code payload generation.
              </p>
            </div>

            <div className="rounded-xl border border-[#27272a] bg-[#121215] p-6 space-y-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <KeyRound className="h-4 w-4 text-zinc-300" />
                <span>10 Hashed Single-Use Backup Codes</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Whenever 2FA is enabled or regenerated, HVT returns 10 single-use emergency backup recovery codes (e.g. <code className="text-zinc-300">A1B2-C3D4</code>). Each code is individually hashed with Argon2id and permanently consumed upon first use.
              </p>
            </div>
          </div>
        </div>

        {/* Code Snippet */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              3. Implementation Snippet
            </h2>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(webauthnSnippet);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-mono text-zinc-400 hover:text-white"
            >
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy code'}</span>
            </button>
          </div>

          <div className="rounded-xl border border-[#27272a] bg-[#111114] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-[#161619] border-b border-[#27272a] text-xs font-mono text-zinc-400">
              <span>auth/passkeys.ts</span>
              <span className="text-[11px] text-zinc-500">TypeScript</span>
            </div>
            <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-200 leading-relaxed bg-[#0a0a0c]">
              {webauthnSnippet}
            </pre>
          </div>
        </div>

        {/* Navigation */}
        <div className="pt-4 flex items-center justify-between border-t border-[#27272a]">
          <Link
            to="/features/dual-plane"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Previous: Dual-Plane Architecture</span>
          </Link>
          <Link
            to="/features/sessions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <span>Next: Active Sessions & Revocation</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Rich Sitemaps Footer */}
      <Footer />
    </div>
  );
}
