// SPDX-License-Identifier: Apache-2.0
import { Link } from 'react-router-dom';
import { Github, ExternalLink, ShieldCheck, Terminal } from 'lucide-react';
import { HvtLogoMark } from '@/components/Logo';
import { DOCS_URL, GITHUB_URL, CHANGELOG_URL, STATUS_URL } from '@/lib/appLinks';

export function Footer() {
  return (
    <footer className="border-t border-[#27272a] bg-[#070709] text-xs text-[#a1a1aa]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5 lg:gap-12">
          {/* Brand & Mission */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <HvtLogoMark className="h-7 w-7" />
              <span className="text-base font-bold tracking-tight text-white">HVT</span>
            </Link>
            <p className="max-w-sm text-xs text-zinc-400 leading-relaxed">
              Open-source cryptographic identity and access control engine.
              Signing fine-grained permission matrices directly into RS256 JWTs for 0.1ms offline authorization with zero database round-trips.
            </p>

            <div className="pt-1 flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                All systems operational
              </span>
              <span className="rounded-md border border-[#27272a] bg-[#121215] px-2 py-1 text-[11px] font-mono text-zinc-400">
                Apache 2.0
              </span>
            </div>
          </div>

          {/* Column 1: Product Features */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white tracking-wide">Product</p>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <Link to="/features/engine" className="transition hover:text-white">
                  In-Memory Engine
                </Link>
              </li>
              <li>
                <Link to="/features/dual-plane" className="transition hover:text-white">
                  Dual-Plane Keys
                </Link>
              </li>
              <li>
                <Link to="/features/passkeys" className="transition hover:text-white">
                  Passkeys & WebAuthn
                </Link>
              </li>
              <li>
                <Link to="/features/sessions" className="transition hover:text-white">
                  Session & Device Revoke
                </Link>
              </li>
              <li>
                <Link to="/features/byo-email" className="transition hover:text-white">
                  Bring-Your-Own Email
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Developers */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white tracking-wide">Developers</p>
            <ul className="space-y-2 text-zinc-400">
              <li>
                <a href={DOCS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-white">
                  <span>Documentation</span>
                  <ExternalLink className="h-3 w-3 text-zinc-600" />
                </a>
              </li>
              <li>
                <a href={`${DOCS_URL}#sdks`} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  TypeScript SDK
                </a>
              </li>
              <li>
                <a href={`${DOCS_URL}#python`} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  Python SDK
                </a>
              </li>
              <li>
                <a href={`${DOCS_URL}#go`} target="_blank" rel="noreferrer" className="transition hover:text-white">
                  Go SDK
                </a>
              </li>
              <li>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 transition hover:text-white">
                  <Github className="h-3 w-3" />
                  <span>GitHub Repository</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Standards & Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-white tracking-wide">Standards & Legal</p>
            <ul className="space-y-2 text-zinc-400">
              <li className="font-mono text-[11px] text-zinc-500">RFC 7519 (JWT)</li>
              <li className="font-mono text-[11px] text-zinc-500">RFC 7517 (JWKS)</li>
              <li className="font-mono text-[11px] text-zinc-500">RFC 6238 (TOTP)</li>
              <li className="font-mono text-[11px] text-zinc-500">W3C WebAuthn Level 3</li>
              <li className="pt-1">
                <Link to="/privacy-policy" className="transition hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="transition hover:text-white">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#1e1e24] pt-6 gap-4 text-[11px] text-zinc-500">
          <div>
            © {new Date().getFullYear()} HVT Identity Platform. Open-source software released under the Apache 2.0 License.
          </div>
          <div className="flex items-center gap-4">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">GitHub</a>
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="transition hover:text-white">API Reference</a>
            <Link to="/login" className="transition hover:text-white">Sign in</Link>
            <Link to="/signup" className="text-zinc-300 transition hover:text-white font-medium">Create project</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
