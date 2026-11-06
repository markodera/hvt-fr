// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Building2,
  ExternalLink,
  Fingerprint,
  GitBranchPlus,
  Github,
  KeyRound,
  LockKeyhole,
  Menu,
  ScrollText,
  ShieldCheck,
  Users,
  Webhook,
  X,
} from 'lucide-react';

import { HvtLogoMark, Logo } from '@/components/Logo';
import { CHANGELOG_URL, DOCS_URL, GITHUB_URL, SITE_URL, STATUS_URL } from '@/lib/appLinks';

const DOT_GRID_STYLE = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2718%27 height=%2718%27 viewBox=%270 0 18 18%27%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%2327272a%27 /%3E%3C/svg%3E")',
  backgroundRepeat: 'repeat',
};

const SEO_TITLE = 'HVT | Multi-Tenant Identity & RBAC Engine for Platforms and Marketplaces';
const SEO_DESCRIPTION =
  'Open-source multi-tenant identity engine with project-scoped composite auth, dynamic RBAC, API keys, WebAuthn passkeys, audit trails, and webhooks.';

const featureStripItems = [
  'Open-source Apache 2.0',
  'Project-scoped runtime',
  'Dual-plane API keys',
  'FIDO2 WebAuthn passkeys',
  'TOTP MFA + backup codes',
  'Roles and permissions',
  'Google and GitHub login',
  'Signed webhooks',
  'Audit history',
];

const chainNodes = ['Organisation', 'Project', 'Roles', 'Permissions', 'Runtime user'];

const controlPlaneNodes = [
  {
    title: 'Organisation',
    description: 'Create the ownership boundary for one company, team, or product.',
  },
  {
    title: 'Projects',
    description: 'Give each app or environment its own signup rules, runtime context, and keys.',
  },
  {
    title: 'Dual-plane API keys',
    description: 'Keep management keys (hvt_mgmt_*) separate from customer runtime keys (hvt_live_*).',
  },
  {
    title: 'Invitations and roles',
    description: 'Invite owners, admins, and members with the right level of access.',
  },
  {
    title: 'Social login config',
    description: 'Enable Google or GitHub only on the projects that should expose it.',
  },
];

const runtimeNodes = [
  {
    title: 'Register & login',
    description: 'Let end users authenticate with email/password, magic links, or WebAuthn passkeys.',
  },
  {
    title: 'MFA & recovery codes',
    description: 'Validate RFC 6238 TOTP codes with encrypted secret storage and single-use backup codes.',
  },
  {
    title: 'Verification and reset',
    description: 'Handle email verification and password reset flows without third-party services.',
  },
  {
    title: 'Social login',
    description: 'Authenticate via Google or GitHub scoped strictly to that specific project.',
  },
  {
    title: 'Signed webhooks',
    description: 'Deliver HMAC-SHA256 signed identity events into the rest of your stack.',
  },
  {
    title: 'Audit events',
    description: 'Keep a tamper-evident log of sign-ins, key changes, and security events.',
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Open-source and self-hostable',
    description:
      'Run HVT yourself under Apache 2.0 with Docker Compose, or use the hosted cloud. Zero per-MAU tax brackets.',
  },
  {
    icon: Boxes,
    title: 'Zero Cross-Tenant Data Leakage',
    description:
      'HVT uses database-level partitioning with composite unique indexes. Build multi-app systems with fully isolated user pools.',
  },
  {
    icon: KeyRound,
    title: 'Project-scoped runtime',
    description:
      'True data isolation ensures a user signing up for Project A has zero crossover with Project B, even if they share the exact same email address.',
  },
  {
    icon: GitBranchPlus,
    title: 'Dual-plane API keys',
    description:
      'Control-plane operations use management keys (hvt_mgmt_*); client traffic uses live runtime keys (hvt_live_*). Leaked runtime keys cannot alter settings.',
  },
  {
    icon: Fingerprint,
    title: 'FIDO2 WebAuthn Passkeys',
    description:
      'Native hardware biometrics (Touch ID, Face ID, Windows Hello, YubiKey) with per-project origin configuration and zero vendor redirects.',
  },
  {
    icon: Users,
    title: 'Google and GitHub per project',
    description:
      'Configure social OAuth providers per project. Prevent cross-project account linking collisions.',
  },
  {
    icon: LockKeyhole,
    title: 'Roles and permissions per project',
    description:
      'Define roles, assign granular permissions, and enforce access checks scoped directly to the target project.',
  },
  {
    icon: ScrollText,
    title: 'Audit logs and signed webhooks',
    description:
      'See what changed in an append-only audit log, and stream lifecycle events with HMAC-SHA256 signatures.',
  },
];

function upsertMeta(selector, factory, updater) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = factory();
    document.head.appendChild(element);
  }
  updater(element);
}

function CodeLine({ children }) {
  return <div className="whitespace-pre">{children}</div>;
}

const codeTabs = {
  runtime: {
    label: 'Runtime flow',
    caption:
      'The runtime side stays tied to the organisation, project, and runtime API key you configured.',
    code: (
      <>
        <CodeLine>1. Your app targets a project with its runtime key (hvt_live_*).</CodeLine>
        <CodeLine>2. A visitor creates an account, uses a passkey, or signs in.</CodeLine>
        <CodeLine>3. HVT enforces that project's authentication and MFA policies.</CodeLine>
        <CodeLine>4. HVT verifies credentials and issues project-scoped JWT claims.</CodeLine>
        <CodeLine>5. WebAuthn, verification, and password reset stay in the same flow.</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>Runtime capabilities</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>- Email + password registration & login</CodeLine>
        <CodeLine>- FIDO2 WebAuthn passkeys (biometric & hardware keys)</CodeLine>
        <CodeLine>- TOTP 2FA + encrypted secrets + 8 backup codes</CodeLine>
        <CodeLine>- Magic links with single-use cryptographic tokens</CodeLine>
        <CodeLine>- Scoped Google & GitHub OAuth</CodeLine>
      </>
    ),
  },
  key: {
    label: 'Control plane',
    caption:
      'Your team configures the structure once, then every app and user flow inherits it.',
    code: (
      <>
        <CodeLine>1. Create an organisation (root workspace boundary).</CodeLine>
        <CodeLine>2. Add a project for each app or environment (Store, Admin, Mobile).</CodeLine>
        <CodeLine>3. Invite teammates with the appropriate administrative role.</CodeLine>
        <CodeLine>4. Configure email login, Google, GitHub, or WebAuthn origins.</CodeLine>
        <CodeLine>5. Mint the runtime API keys your client backend will use.</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>What your team manages</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>- Organisations and tenant projects</CodeLine>
        <CodeLine>- Staff access & team permissions</CodeLine>
        <CodeLine>- Dual-plane API keys (hvt_mgmt_* vs hvt_live_*)</CodeLine>
        <CodeLine>- Per-project social OAuth credentials</CodeLine>
        <CodeLine>- Declarative schemas via @hvt/cli</CodeLine>
      </>
    ),
  },
  webhook: {
    label: 'Events & history',
    caption:
      'HVT records every event and delivers HMAC-signed webhooks to your infrastructure.',
    code: (
      <>
        <CodeLine>When an identity event occurs, HVT records it and dispatches webhooks.</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>Dispatched events</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>- user.created (new registration)</CodeLine>
        <CodeLine>- user.authenticated (successful login)</CodeLine>
        <CodeLine>- user.lockout (brute force mitigation)</CodeLine>
        <CodeLine>- api_key.created / api_key.revoked</CodeLine>
        <CodeLine>- passkey.registered / passkey.deleted</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>All webhooks include an HMAC-SHA256 signature for verification.</CodeLine>
      </>
    ),
  },
};

function Wordmark() {
  return (
    <Link to="/" className="inline-flex items-center gap-3">
      <HvtLogoMark className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <div className="font-mono text-[1.08rem] font-bold tracking-[-0.03em] text-[#f4f4f5]">HVT</div>
        <div className="mt-1 text-[11px] text-[#71717a]">hvts.app</div>
      </div>
    </Link>
  );
}

function NavLink({ href, children, mobile = false, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`transition-colors hover:text-white ${mobile ? 'block py-2 text-base text-[#d4d4d8]' : 'text-sm text-[#a1a1aa]'}`}
    >
      {children}
    </a>
  );
}

function ChainDiagram({ compact = false }) {
  return (
    <div
      className={`rounded-[18px] border border-[#27272a] bg-[#111111]/88 ${compact ? 'p-4' : 'p-5'} transition-[border-color,box-shadow,transform] duration-200 hover:border-[rgba(124,58,237,0.5)]`}
      style={{
        animation: compact ? undefined : 'heroFloat 7.5s ease-in-out infinite',
        boxShadow: compact ? undefined : '0 18px 48px rgba(0,0,0,0.35)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {chainNodes.map((node, index) => (
          <div key={node} className="contents">
            <div
              className={`rounded-full border border-[#3f3f46] bg-[#18181b] px-4 py-2 ${compact ? 'text-xs' : 'text-sm'} font-medium text-[#e4e4e7] transition-colors hover:border-[#7c3aed]/50`}
              style={{
                animation: compact ? undefined : `heroFadeUp 0.7s ease-out ${0.18 + index * 0.08}s both`,
              }}
            >
              {node}
            </div>
            {index < chainNodes.length - 1 ? (
              <div className={`flex items-center ${compact ? 'w-8' : 'w-10 sm:w-14'}`}>
                <div className="relative h-px w-full overflow-hidden rounded-full bg-[#7c3aed]/20">
                  <div
                    className="absolute inset-0 bg-[#7c3aed]/60"
                    style={{ animation: `connectorPulse 2.8s ease-in-out ${index * 0.25}s infinite` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureStrip() {
  const loopItems = [...featureStripItems, ...featureStripItems];

  return (
    <div
      className="relative overflow-hidden rounded-full border border-[#27272a] bg-[#111111]/88 px-4 py-3"
      style={{
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
      }}
    >
      <div className="hidden items-center justify-center gap-3 md:flex">
        {featureStripItems.map((item, index) => (
          <div key={item} className="flex items-center gap-3 text-sm text-[#71717a]">
            {index > 0 ? <span className="text-[#3f3f46]">·</span> : null}
            <span className="hover:text-[#a1a1aa] transition-colors">{item}</span>
          </div>
        ))}
      </div>
      <div className="md:hidden">
        <div className="flex min-w-max gap-8" style={{ animation: 'featureMarquee 20s linear infinite' }}>
          {loopItems.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-2 text-sm whitespace-nowrap text-[#71717a]">
              <span>{item}</span>
              <span className="text-[#3f3f46]">·</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaneNode({ title, description, accent = false }) {
  return (
    <div className={`rounded-lg border px-4 py-4 transition-colors duration-150 hover:border-[rgba(124,58,237,0.5)] ${accent ? 'border-[#3f3f46] bg-[#18181b]' : 'border-[#27272a] bg-[#111111]'}`}>
      <div className="text-sm font-semibold text-[#f4f4f5]">{title}</div>
      <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{description}</p>
    </div>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('runtime');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = SEO_TITLE;

    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      return meta;
    }, (meta) => {
      meta.content = SEO_DESCRIPTION;
    });

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    }, (meta) => {
      meta.setAttribute('content', SEO_TITLE);
    });

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    }, (meta) => {
      meta.setAttribute('content', SEO_DESCRIPTION);
    });

    upsertMeta('meta[name="twitter:title"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'twitter:title';
      return meta;
    }, (meta) => {
      meta.content = SEO_TITLE;
    });

    upsertMeta('meta[name="twitter:description"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'twitter:description';
      return meta;
    }, (meta) => {
      meta.content = SEO_DESCRIPTION;
    });

    upsertMeta('meta[property="og:url"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:url');
      return meta;
    }, (meta) => {
      meta.setAttribute('content', `${SITE_URL}/`);
    });

    upsertMeta('meta[name="theme-color"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      return meta;
    }, (meta) => {
      meta.content = '#0a0a0a';
    });

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE_URL}/`;
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f4f4f5]">
      <style>{`
        @keyframes heroFadeUp {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes heroGlowPulse {
          0%, 100% { opacity: 0.65; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.03); }
        }

        @keyframes featureMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes connectorPulse {
          0%, 100% { opacity: 0.2; transform: scaleX(0.85); }
          50% { opacity: 0.8; transform: scaleX(1); }
        }
      `}</style>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-200 ${
          scrolled ? 'border-[#27272a] bg-[#0a0a0a]/88 backdrop-blur-xl' : 'border-transparent bg-[#0a0a0a]/72 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto grid h-[60px] max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <div className="justify-self-start">
            <Wordmark />
          </div>

          <nav className="hidden items-center justify-center gap-8 justify-self-center md:flex">
            <a href="#features" className="text-sm text-[#a1a1aa] transition-colors duration-150 hover:text-white">
              Features
            </a>
            <a href="#system" className="text-sm text-[#a1a1aa] transition-colors duration-150 hover:text-white">
              Architecture
            </a>
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="text-sm text-[#a1a1aa] transition-colors duration-150 hover:text-white">
              Docs
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-sm text-[#a1a1aa] transition-colors duration-150 hover:text-white">
              GitHub
            </a>
          </nav>

          <div className="hidden items-center gap-3 justify-self-end md:flex">
            <Link to="/login" className="px-2 py-2 text-sm font-medium text-[#d4d4d8] transition-colors duration-150 hover:text-white">
              Sign in
            </Link>
            <Link
              to="/signup"
              className="rounded-full border border-[#3f3f46] bg-[#18181b] px-4 py-2 text-sm font-semibold text-[#f4f4f5] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.26)] transition-[border-color,background-color] duration-150 hover:border-[rgba(124,58,237,0.45)] hover:bg-[#1d1d22]"
            >
              Get started free
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center justify-self-end rounded-md border border-[#27272a] bg-[#111111] text-[#d4d4d8] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] hover:text-white md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#27272a] bg-[#0a0a0a]/96 md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
              <NavLink href="#features" mobile onClick={() => setMenuOpen(false)}>Features</NavLink>
              <NavLink href="#system" mobile onClick={() => setMenuOpen(false)}>Architecture</NavLink>
              <NavLink href={DOCS_URL} mobile onClick={() => setMenuOpen(false)}>Docs</NavLink>
              <NavLink href={GITHUB_URL} mobile onClick={() => setMenuOpen(false)}>GitHub</NavLink>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-2 rounded-md border border-[#27272a] px-4 py-3 text-center text-sm font-medium text-[#d4d4d8]">
                Sign in
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="rounded-md bg-[#7c3aed] px-4 py-3 text-center text-sm font-semibold text-white">
                Get started free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main id="top">
        {/* HERO SECTION with restored dot-grid and ambient radial gradient */}
        <section className="relative overflow-hidden border-b border-[#27272a]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at top center, rgba(124,58,237,0.18), transparent 60%)',
              animation: 'heroGlowPulse 8s ease-in-out infinite',
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              ...DOT_GRID_STYLE,
              WebkitMaskImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.94) 58%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.94) 58%, transparent 100%)',
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
            <div className="max-w-5xl">
              {/* No uppercase pill tag above heading (removed per user instruction) */}
              <h1
                className="max-w-5xl text-4xl font-extrabold leading-tight tracking-[-0.04em] bg-gradient-to-b from-[#f4f4f5] via-[#e4e4e7] to-[#a1a1aa] bg-clip-text text-transparent sm:text-5xl lg:text-7xl"
                style={{ animation: 'heroFadeUp 0.7s ease-out 0.1s both' }}
              >
                Authentication infrastructure that gives every project its own world.
              </h1>

              <p
                className="mt-6 max-w-3xl text-sm leading-7 text-[#a1a1aa] sm:text-base"
                style={{ animation: 'heroFadeUp 0.7s ease-out 0.18s both' }}
              >
                Building multi-tenant auth from scratch takes months. Proprietary providers punish your growth with MAU pricing. HVT gives you composite tenant isolation, dual-plane API keys, and granular RBAC out of the box.
              </p>

              <p
                className="mt-4 max-w-3xl text-base leading-8 text-[#71717a] sm:text-lg"
                style={{ animation: 'heroFadeUp 0.7s ease-out 0.22s both' }}
              >
                Open source under Apache 2.0 with zero MAU penalties. Manage organizations, projects, API keys, WebAuthn passkeys, and runtime auth in one explicit model.
              </p>

              <div className="mt-8 max-w-3xl" style={{ animation: 'heroFadeUp 0.8s ease-out 0.28s both' }}>
                <div className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-[#71717a]">
                  Project model
                </div>
                <ChainDiagram />
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row" style={{ animation: 'heroFadeUp 0.8s ease-out 0.36s both' }}>
                <Link to="/signup" className="inline-flex items-center justify-center rounded-md bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(124,58,237,0.3)] transition-all duration-150 hover:bg-[#6d28d9] hover:shadow-[0_0_32px_rgba(124,58,237,0.45)]">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md border border-[#27272a] px-5 py-3 text-sm font-semibold text-[#d4d4d8] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] hover:text-white">
                  View on GitHub
                </a>
              </div>

              <div className="mt-8 max-w-3xl" style={{ animation: 'heroFadeUp 0.8s ease-out 0.44s both' }}>
                <FeatureStrip />
              </div>
            </div>
          </div>
        </section>

        {/* AT A GLANCE: Code workbench */}
        <section className="border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">At a glance</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] bg-gradient-to-b from-[#f4f4f5] to-[#a1a1aa] bg-clip-text text-transparent sm:text-4xl">
                One model from setup to sign-in.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                HVT is split into a control plane for your team and a runtime plane for your apps and users. That
                makes the architecture straightforward to reason about during initial setup and at runtime scale.
              </p>
            </div>

            <div className="mt-10 rounded-[18px] border border-[#27272a] bg-[#111111] transition-colors duration-150 hover:border-[rgba(124,58,237,0.5)]">
              <div className="flex flex-wrap gap-2 border-b border-[#27272a] px-4 py-4 sm:px-6">
                {Object.entries(codeTabs).map(([key, tab]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${activeTab === key ? 'bg-[#7c3aed] text-white shadow-sm' : 'bg-[#18181b] text-[#a1a1aa] hover:text-white'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="px-4 py-5 sm:px-6">
                <p className="mb-4 text-sm text-[#a1a1aa]">{codeTabs[activeTab].caption}</p>
                <div className="overflow-x-auto rounded-[14px] border border-[#27272a] bg-[#0a0a0a] px-4 py-4 font-mono text-[13px] leading-6 text-[#d4d4d8] sm:px-5">
                  {codeTabs[activeTab].code}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="system" className="scroll-mt-24 border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">How it works</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] bg-gradient-to-b from-[#f4f4f5] to-[#a1a1aa] bg-clip-text text-transparent sm:text-4xl">
                One control plane. One runtime plane.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                Your team configures organisations, projects, keys, invites, and social login. Your applications then use
                that structure to register users, sign them in, issue tokens, and receive signed webhooks.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)] lg:items-stretch">
              <div className="rounded-[18px] border border-[#27272a] bg-[#111111] p-6 transition-colors duration-150 hover:border-[rgba(124,58,237,0.5)]">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[#a78bfa]" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">For your team</div>
                    <div className="mt-1 text-lg font-semibold text-[#f4f4f5]">Configure organisations, projects, keys, and staff access</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {controlPlaneNodes.map((node) => (
                    <PlaneNode key={node.title} title={node.title} description={node.description} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center lg:block">
                <div className="flex justify-center lg:hidden">
                  <div className="rounded-[18px] border border-[#3f3f46] bg-[#18181b] px-4 py-3 text-center">
                    <div className="text-xs font-medium uppercase tracking-[0.18em] text-[#a78bfa]">
                      Roles and permissions
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[#a1a1aa]">
                      Define roles and permission sets scoped to each project.
                    </div>
                  </div>
                </div>
                <div className="hidden h-full flex-col items-center lg:flex">
                  <div className="min-h-10 w-px flex-1 bg-[#27272a]" />
                  <div className="my-4 rounded-[18px] border border-[#3f3f46] bg-[#18181b] px-4 py-3 text-center">
                    <div className="whitespace-nowrap text-xs font-medium uppercase tracking-[0.18em] text-[#a78bfa]">
                      Roles and permissions
                    </div>
                    <div className="mt-1 text-xs leading-5 text-[#a1a1aa]">
                      Define roles and permission sets scoped to each project.
                    </div>
                  </div>
                  <div className="min-h-10 w-px flex-1 bg-[#27272a]" />
                </div>
              </div>

              <div className="rounded-[18px] border border-[#3f3f46] bg-[#18181b] p-6 transition-colors duration-150 hover:border-[rgba(124,58,237,0.5)]">
                <div className="flex items-center gap-3">
                  <Boxes className="h-5 w-5 text-[#a78bfa]" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">For your users</div>
                    <div className="mt-1 text-lg font-semibold text-[#f4f4f5]">Register users, sign them in, and track what happens</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {runtimeNodes.map((node) => (
                    <PlaneNode key={node.title} title={node.title} description={node.description} accent />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="scroll-mt-24 border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">Why HVT feels different</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] bg-gradient-to-b from-[#f4f4f5] to-[#a1a1aa] bg-clip-text text-transparent sm:text-4xl">
                The model is the product, not an add-on.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                HVT is built around one explicit model: organisation, project, roles, permissions, runtime auth,
                passkeys, audit logs, and webhooks. That is the default shape of the platform, not an enterprise upgrade.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="group rounded-[18px] border border-[#27272a] bg-[#111111] p-6 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[rgba(124,58,237,0.5)] hover:shadow-[0_4px_24px_rgba(124,58,237,0.14)]">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#18181b] text-[#a78bfa] transition-shadow duration-150 group-hover:shadow-[0_0_18px_rgba(124,58,237,0.24)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-[#f4f4f5]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRICING & SELF-HOSTING */}
        <section id="pricing" className="scroll-mt-24 border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">Start here</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] bg-gradient-to-b from-[#f4f4f5] to-[#a1a1aa] bg-clip-text text-transparent sm:text-4xl">
                Start hosted. Self-host when you need to.
              </h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                The hosted and self-hosted paths follow the same product model. You do not need to rewrite your integration
                later if you decide to deploy on your own infrastructure.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col rounded-[18px] border border-[#27272a] bg-[#111111] p-6 transition-[border-color,box-shadow] duration-150 hover:border-[rgba(124,58,237,0.5)]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Self-hosted</div>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-[#d4d4d8]">
                    <p>
                      HVT is open-source under Apache 2.0, so your team can run the auth stack on your own infrastructure with complete control.
                    </p>
                    <p>
                      Deploy with Docker Compose against standard PostgreSQL. Keep user data, credentials, and compliance completely inside your own VPC.
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] transition-colors duration-150 hover:bg-[#6d28d9]"
                  >
                    Get started free
                  </Link>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-[#27272a] px-4 py-3 text-sm font-semibold text-[#d4d4d8] transition-colors duration-150 hover:border-[rgba(124,58,237,0.5)] hover:text-white"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>

              <div className="relative flex flex-col overflow-hidden rounded-[18px] border border-[rgba(124,58,237,0.4)] bg-[#18181b] p-6 shadow-[0_0_30px_rgba(124,58,237,0.12)] transition-[border-color,box-shadow] duration-150 hover:border-[rgba(124,58,237,0.7)] hover:shadow-[0_0_40px_rgba(124,58,237,0.2)]">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7c3aed] opacity-20 blur-[80px]"></div>
                <div className="relative z-10 flex h-full flex-col">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#a78bfa] font-semibold">Hosted by HVT</div>
                    <h3 className="mt-4 bg-gradient-to-r from-[#f4f4f5] to-[#a78bfa] bg-clip-text text-xl font-bold text-transparent">Free to try today</h3>
                    <p className="mt-3 text-sm leading-7 text-[#a1a1aa]">
                      Create an account, test login flows, configure WebAuthn passkeys, and evaluate the product model
                      before setting up dedicated infrastructure.
                    </p>
                    <div className="mt-6 rounded-2xl border border-[rgba(124,58,237,0.2)] bg-[#111111] px-4 py-4 text-sm text-[#d4d4d8]">
                      Hosted pricing is coming soon. Right now, <strong className="text-[#a78bfa]">you can sign up and use HVT for free while evaluating the platform.</strong>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <Link
                      to="/signup"
                      className="inline-flex w-full items-center justify-center rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-colors duration-150 hover:bg-[#6d28d9]"
                    >
                      Try for Free
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_0.7fr] lg:px-8">
          <div>
            <Logo href="/" />
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#a1a1aa]">
              Project-scoped auth with roles, permissions, audit logs, and webhooks.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Links</div>
              <div className="mt-4 space-y-3">
                <a href={DOCS_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <BookOpen className="h-4 w-4" /> Docs
                </a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <Github className="h-4 w-4" /> GitHub
                </a>
                <Link to="/privacy-policy" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <ShieldCheck className="h-4 w-4" /> Privacy Policy
                </Link>
                <Link to="/terms-of-service" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <ScrollText className="h-4 w-4" /> Terms of Service
                </Link>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Ops</div>
              <div className="mt-4 space-y-3">
                <a href={CHANGELOG_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <ExternalLink className="h-4 w-4" /> Changelog
                </a>
                <a href={STATUS_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <ExternalLink className="h-4 w-4" /> API health
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-start md:col-span-2 xl:col-span-1 xl:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#111111] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#a1a1aa]">
              <LockKeyhole className="h-3.5 w-3.5 text-[#a78bfa]" /> Apache 2.0 Licensed
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
