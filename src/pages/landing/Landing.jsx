import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Building2,
  Check,
  ExternalLink,
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

const SITE_URL = 'https://hvts.app';
const GITHUB_URL = 'https://github.com/markodera/hvt';
const DOCS_URL = `${SITE_URL}/api/docs/`;
const CHANGELOG_URL = 'https://github.com/markodera/hvt/commits/main';
const STATUS_URL = `${SITE_URL}/healthz/`;

const DOT_GRID_STYLE = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2718%27 height=%2718%27 viewBox=%270 0 18 18%27%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%2327272a%27 /%3E%3C/svg%3E")',
  backgroundRepeat: 'repeat',
};

const featureStripItems = [
  'JWT rotation',
  'Multi-tenancy',
  'RBAC',
  'Webhooks',
  'Audit logs',
  'AGPL v3',
];

const chainNodes = ['Org', 'Project', 'API Key', 'Runtime', 'Token'];

const controlPlaneNodes = [
  {
    title: 'Organization',
    description: 'Team ownership, current settings, and the top-level tenant boundary.',
  },
  {
    title: 'Project',
    description: 'App or environment scope inside the organization with its own signup toggle.',
  },
  {
    title: 'API Key',
    description: 'Server credential with environment, scopes, and project context.',
  },
  {
    title: 'Invitations',
    description: 'Owner-managed invites for admin and member access to the control plane.',
  },
  {
    title: 'Social config',
    description: 'Per-project Google and GitHub credentials with allowed redirect URIs.',
  },
];

const runtimeNodes = [
  {
    title: 'Register',
    description: 'Runtime signup uses /auth/register/ and attaches the new user to the calling key context.',
  },
  {
    title: 'Login',
    description: 'Runtime login uses X-API-Key and rejects the wrong organization or project before issuing cookies.',
  },
  {
    title: 'Social auth',
    description: 'Runtime provider lists and callback validation are scoped to the current project.',
  },
  {
    title: 'Token refresh',
    description: 'Refresh revalidates org and project membership before restamping JWT claims.',
  },
  {
    title: 'Webhooks',
    description: 'Project-scoped deliveries carry event metadata, signed headers, and retry status.',
  },
  {
    title: 'Audit',
    description: 'Audit logs record auth, project, invitation, API key, and webhook activity.',
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'JWT hardening',
    description:
      'Access and refresh tokens carry org_id, project_id, project_slug, role, and email claims, with refresh-time revalidation.',
  },
  {
    icon: KeyRound,
    title: 'Project-scoped keys',
    description:
      'API keys belong to an organization and project, support test and live modes, and can drive runtime auth from the backend.',
  },
  {
    icon: GitBranchPlus,
    title: 'Social auth per project',
    description:
      'Google and GitHub provider configs are stored per project with explicit redirect URIs and active-state controls.',
  },
  {
    icon: Users,
    title: 'RBAC and invitations',
    description:
      'Owners, admins, and members are explicit roles, and invitation acceptance is tokenised, email-bound, and auditable.',
  },
  {
    icon: Webhook,
    title: 'Webhook delivery',
    description:
      'Deliveries include signed headers, retry state, response metadata, and auto-disable logic after repeated failures.',
  },
  {
    icon: ScrollText,
    title: 'Audit trail',
    description:
      'Audit logs separate org, project, invitation, auth, and API key events so operational history is readable when something changes.',
  },
];

const pricingTiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For developers learning, experimenting, or building side projects.',
    bullets: [
      'Low MAU cap',
      'Basic auth only',
      'No webhooks',
      'No audit logs',
      'Simple control-plane setup',
    ],
    cta: 'Get started free',
    featured: false,
  },
  {
    name: 'Starter',
    price: '$5',
    period: '/mo',
    description: 'For developers building real projects on a tight budget.',
    bullets: [
      'Core features unlocked',
      'Modest MAU limit',
      'Webhooks included',
      'Project-scoped API keys',
      'Runtime login and register',
    ],
    cta: 'Choose Starter',
    featured: false,
  },
  {
    name: 'Builder',
    price: '$15',
    period: '/mo',
    description: 'Full feature access for developers who are serious but not flush.',
    bullets: [
      'Webhooks and audit logs',
      'All social providers',
      'Higher MAU allowance',
      'Project-first tenant controls',
      'Full hosted feature set',
    ],
    cta: 'Choose Builder',
    featured: true,
    badge: 'Recommended',
  },
  {
    name: 'Pro',
    price: '$35',
    period: '/mo',
    description: 'For growing startups protecting early users.',
    bullets: [
      'Higher usage limits',
      'Priority support',
      'Advanced RBAC configuration',
      'Webhooks and audit logs',
      'All social providers',
    ],
    cta: 'Choose Pro',
    featured: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For teams that need private deployment help and direct support.',
    bullets: [
      'Unlimited MAU',
      'SLA-backed support',
      'Dedicated support',
      'Private deployment assistance',
      'Hosted or self-hosted rollout help',
    ],
    cta: 'Contact sales',
    featured: false,
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

function Kw({ children }) {
  return <span className="text-[#c4b5fd]">{children}</span>;
}

function PathToken({ children }) {
  return <span className="text-white">{children}</span>;
}

function Str({ children }) {
  return <span className="text-[#a78bfa]">{children}</span>;
}

function Prop({ children }) {
  return <span className="text-[#e4e4e7]">{children}</span>;
}

function Num({ children }) {
  return <span className="text-[#ddd6fe]">{children}</span>;
}

function Comment({ children }) {
  return <span className="text-[#71717a]">{children}</span>;
}

function CodeLine({ children }) {
  return <div className="whitespace-pre">{children}</div>;
}

const codeTabs = {
  runtime: {
    label: 'Runtime login',
    caption:
      'Runtime login is API-key-scoped and the issued JWT cookies carry org and project claims from the current project.',
    code: (
      <>
        <CodeLine><Kw>POST</Kw> <PathToken>/api/v1/auth/runtime/login/</PathToken></CodeLine>
        <CodeLine><Prop>X-API-Key</Prop>: <Str>hvt_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</Str></CodeLine>
        <CodeLine><Prop>Content-Type</Prop>: <Str>application/json</Str></CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>{'{'}</CodeLine>
        <CodeLine>  <Prop>"email"</Prop>: <Str>"customer@example.com"</Str>,</CodeLine>
        <CodeLine>  <Prop>"password"</Prop>: <Str>"Strongpass123!"</Str></CodeLine>
        <CodeLine>{'}'}</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine><Num>200 OK</Num></CodeLine>
        <CodeLine><Prop>Set-Cookie</Prop>: <Str>auth-token=...</Str></CodeLine>
        <CodeLine><Prop>Set-Cookie</Prop>: <Str>refresh-token=...</Str></CodeLine>
      </>
    ),
  },
  key: {
    label: 'Issue API key',
    caption:
      'API keys are created under the current organization, can target a specific project, and return the full secret once.',
    code: (
      <>
        <CodeLine><Kw>POST</Kw> <PathToken>/api/v1/organizations/current/keys/</PathToken></CodeLine>
        <CodeLine><Prop>Authorization</Prop>: <Str>Bearer {'<owner-jwt>'}</Str></CodeLine>
        <CodeLine><Prop>Content-Type</Prop>: <Str>application/json</Str></CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>{'{'}</CodeLine>
        <CodeLine>  <Prop>"name"</Prop>: <Str>"Storefront backend"</Str>,</CodeLine>
        <CodeLine>  <Prop>"environment"</Prop>: <Str>"live"</Str>,</CodeLine>
        <CodeLine>  <Prop>"project_id"</Prop>: <Str>"{'<project-uuid>'}"</Str>,</CodeLine>
        <CodeLine>  <Prop>"scopes"</Prop>: [<Str>"auth:runtime"</Str>, <Str>"users:read"</Str>]</CodeLine>
        <CodeLine>{'}'}</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine><Num>201 Created</Num> <Comment># response includes id, project_slug, and key</Comment></CodeLine>
      </>
    ),
  },
  webhook: {
    label: 'Webhook payload',
    caption:
      'Webhook deliveries are project-scoped JSON payloads signed with X-HVT-Signature and tagged with delivery metadata.',
    code: (
      <>
        <CodeLine>{'{'}</CodeLine>
        <CodeLine>  <Prop>"event"</Prop>: <Str>"user.registered"</Str>,</CodeLine>
        <CodeLine>  <Prop>"delivery_id"</Prop>: <Str>"{'<delivery-uuid>'}"</Str>,</CodeLine>
        <CodeLine>  <Prop>"timestamp"</Prop>: <Str>"2026-03-24T12:00:00+00:00"</Str>,</CodeLine>
        <CodeLine>  <Prop>"organization_id"</Prop>: <Str>"{'<org-uuid>'}"</Str>,</CodeLine>
        <CodeLine>  <Prop>"project_id"</Prop>: <Str>"{'<project-uuid>'}"</Str>,</CodeLine>
        <CodeLine>  <Prop>"project_slug"</Prop>: <Str>"storefront-prod"</Str>,</CodeLine>
        <CodeLine>  <Prop>"data"</Prop>: {'{'}</CodeLine>
        <CodeLine>    <Prop>"user_id"</Prop>: <Str>"{'<user-uuid>'}"</Str>,</CodeLine>
        <CodeLine>    <Prop>"email"</Prop>: <Str>"customer@example.com"</Str>,</CodeLine>
        <CodeLine>    <Prop>"registration_method"</Prop>: <Str>"email"</Str></CodeLine>
        <CodeLine>  {'}'}</CodeLine>
        <CodeLine>{'}'}</CodeLine>
      </>
    ),
  },
};

function Wordmark() {
  return (
    <a href="#top" className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-md bg-[#7c3aed]" />
      <div>
        <div className="text-sm font-semibold tracking-[0.22em] text-[#a78bfa]">HVT</div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#71717a]">hvts.app</div>
      </div>
    </a>
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
    <div className={`rounded-[18px] border border-[#27272a] bg-[#111111]/88 ${compact ? 'p-4' : 'p-5'} transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)]`}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {chainNodes.map((node, index) => (
          <div key={node} className="contents">
            <div className={`rounded-full border border-[#3f3f46] bg-[#18181b] px-4 py-2 ${compact ? 'text-xs' : 'text-sm'} font-medium text-[#e4e4e7]`}>
              {node}
            </div>
            {index < chainNodes.length - 1 ? (
              <div className={`flex items-center ${compact ? 'w-8' : 'w-10 sm:w-14'}`}>
                <div className="relative h-px w-full overflow-hidden rounded-full bg-[#7c3aed]/15">
                  <div
                    className="absolute inset-0 bg-[#7c3aed]/50"
                    style={{ animation: `connectorPulse 2.8s ease-in-out ${index * 0.2}s infinite` }}
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
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="md:hidden">
        <div className="flex min-w-max gap-8" style={{ animation: 'featureMarquee 18s linear infinite' }}>
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
    <div className={`rounded-lg border px-4 py-4 transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] ${accent ? 'border-[#3f3f46] bg-[#18181b]' : 'border-[#27272a] bg-[#111111]'}`}>
      <div className="text-sm font-semibold text-white">{title}</div>
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
    document.title = 'HVT | Auth infrastructure that\'s entirely yours';

    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      return meta;
    }, (meta) => {
      meta.content = 'HVT is AGPL v3 auth infrastructure with an explicit organization to project to runtime model, available self-hosted or as a managed service at hvts.app.';
    });

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    }, (meta) => {
      meta.setAttribute('content', 'HVT | Auth infrastructure that\'s entirely yours');
    });

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    }, (meta) => {
      meta.setAttribute('content', 'Open-source auth infrastructure with explicit org, project, API key, social config, token, audit, and webhook boundaries.');
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <style>{`
        @keyframes featureMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes connectorPulse {
          0%, 100% { opacity: 0.16; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <header
        className={`sticky top-0 z-50 border-b transition-all ${scrolled ? 'border-[#27272a] bg-[#0a0a0a]/90 backdrop-blur-xl' : 'border-transparent bg-[#0a0a0a]/75 backdrop-blur-sm'}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Wordmark />

          <nav className="hidden items-center gap-6 md:flex">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="text-sm text-[#a1a1aa] transition-colors hover:text-white">GitHub</a>
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="text-sm text-[#a1a1aa] transition-colors hover:text-white">Docs</a>
            <Link to="/login" className="rounded-md border border-[#27272a] px-4 py-2 text-sm font-medium text-[#d4d4d8] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] hover:text-white">
              Sign in
            </Link>
            <Link to="/signup" className="rounded-md bg-[#7c3aed] px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9]">
              Get started free
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#27272a] bg-[#111111] text-[#d4d4d8] md:hidden"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#27272a] bg-[#0a0a0a] md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:px-6">
              <NavLink href={GITHUB_URL} mobile onClick={() => setMenuOpen(false)}>GitHub</NavLink>
              <NavLink href={DOCS_URL} mobile onClick={() => setMenuOpen(false)}>Docs</NavLink>
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
        <section className="relative overflow-hidden border-b border-[#27272a]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at top center, rgba(124,58,237,0.15), transparent 58%)',
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

          <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-32">
            <div className="max-w-5xl">
              <div className="inline-flex items-center rounded-full border border-[#27272a] bg-[#111111]/88 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#a78bfa]">
                Open-source auth infrastructure for developers and teams
              </div>
              <h1 className="mt-8 max-w-5xl text-4xl font-extrabold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl">
                Auth infrastructure that&apos;s entirely yours. The code, the model, the runtime - all of it.
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#a1a1aa] sm:text-lg">
                HVT gives teams a self-hosted auth stack with an explicit org -&gt; project -&gt; runtime chain, licensed under AGPL v3 and available as a managed service at hvts.app when they do not want to operate it themselves.
              </p>

              <div className="mt-8 max-w-3xl">
                <ChainDiagram />
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link to="/signup" className="inline-flex items-center justify-center rounded-md bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9]">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-md border border-[#27272a] px-5 py-3 text-sm font-semibold text-[#d4d4d8] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] hover:text-white">
                  View on GitHub
                </a>
              </div>

              <div className="mt-8 max-w-3xl">
                <FeatureStrip />
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">Integration demo</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">The API surface is explicit because the product model is explicit.</h2>
            </div>

            <div className="mt-10 rounded-[18px] border border-[#27272a] bg-[#111111] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)]">
              <div className="flex flex-wrap gap-2 border-b border-[#27272a] px-4 py-4 sm:px-6">
                {Object.entries(codeTabs).map(([key, tab]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${activeTab === key ? 'bg-[#7c3aed] text-white' : 'bg-[#18181b] text-[#a1a1aa] hover:text-white'}`}
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

        <section id="system" className="scroll-mt-24 border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">How it works</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">System model</h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                HVT is easiest to reason about when you separate the developer control plane from the auth runtime plane and keep the boundary visible.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="rounded-[18px] border border-[#27272a] bg-[#111111] p-6 transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)]">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[#a78bfa]" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Developer control plane</div>
                    <div className="mt-1 text-lg font-semibold text-white">Org -&gt; Project -&gt; API Key -&gt; Invitations -&gt; Social config</div>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {controlPlaneNodes.map((node) => (
                    <PlaneNode key={node.title} title={node.title} description={node.description} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="hidden h-full w-px bg-[#27272a] lg:block" />
                <div className="rounded-full border border-[#3f3f46] bg-[#18181b] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#a78bfa] lg:absolute">
                  Boundary
                </div>
              </div>

              <div className="rounded-[18px] border border-[#3f3f46] bg-[#18181b] p-6 transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)]">
                <div className="flex items-center gap-3">
                  <Boxes className="h-5 w-5 text-[#a78bfa]" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Auth runtime plane</div>
                    <div className="mt-1 text-lg font-semibold text-white">Register -&gt; Login -&gt; Social auth -&gt; Token refresh -&gt; Webhooks -&gt; Audit</div>
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

        <section id="features" className="scroll-mt-24 border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">Feature grid</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">What is already in the codebase.</h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="group rounded-[18px] border border-[#27272a] bg-[#111111] p-6 transition-[border-color,box-shadow,transform] duration-150 hover:border-[rgba(124,58,237,0.6)]">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#18181b] text-[#a78bfa] transition-shadow duration-150 group-hover:shadow-[0_0_18px_rgba(124,58,237,0.24)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#a1a1aa]">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-24 border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">Pricing</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">Hosted plans for hvts.app.</h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                The code stays auditable and self-hostable under AGPL v3. The hosted service at hvts.app is the managed path for teams that want the same model without running it themselves.
              </p>
            </div>

            <div className="mt-10 overflow-x-auto pb-2">
              <div className="grid min-w-[1180px] gap-4 lg:grid-cols-5">
                {pricingTiers.map((tier) => (
                  <div
                    key={tier.name}
                    className={`flex min-h-[420px] flex-col rounded-[18px] border p-6 transition-[border-color,box-shadow,transform] duration-150 hover:border-[rgba(124,58,237,0.6)] ${tier.featured ? 'border-[#7c3aed] bg-[#18181b] shadow-[0_0_0_1px_#7c3aed,0_0_24px_rgba(124,58,237,0.15)] hover:scale-[1.02]' : 'border-[#27272a] bg-[#111111]'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">{tier.description}</p>
                      </div>
                      {tier.badge ? (
                        <span className="rounded-full border border-[#7c3aed] bg-[#7c3aed]/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a78bfa]">
                          {tier.badge}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-6 flex items-end gap-1">
                      <span className="text-4xl font-semibold tracking-[-0.04em] text-white">{tier.price}</span>
                      {tier.period ? <span className="pb-1 text-sm text-[#71717a]">{tier.period}</span> : null}
                    </div>
                    <ul className="mt-6 space-y-3 text-sm text-[#d4d4d8]">
                      {tier.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-3">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#a78bfa]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto pt-8">
                      <Link
                        to="/signup"
                        className={`inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-sm font-semibold transition-colors duration-150 ${tier.featured ? 'bg-[#7c3aed] text-white hover:bg-[#6d28d9]' : 'border border-[#27272a] text-[#d4d4d8] hover:border-[rgba(124,58,237,0.6)] hover:text-white'}`}
                      >
                        {tier.cta}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr_0.7fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-[#7c3aed]" />
              <div>
                <div className="text-sm font-semibold tracking-[0.22em] text-[#a78bfa]">HVT</div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#71717a]">hvts.app</div>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#a1a1aa]">
              Open-source auth infrastructure with an explicit org to project to runtime model for teams shipping real products.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Links</div>
              <div className="mt-4 space-y-3">
                <a href={DOCS_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <BookOpen className="h-4 w-4" /> Docs
                </a>
                <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Ops</div>
              <div className="mt-4 space-y-3">
                <a href={CHANGELOG_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <ExternalLink className="h-4 w-4" /> Changelog
                </a>
                <a href={STATUS_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#a1a1aa] transition-colors hover:text-white">
                  <ExternalLink className="h-4 w-4" /> Status
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-start lg:justify-end">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#27272a] bg-[#111111] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[#a1a1aa]">
              <LockKeyhole className="h-3.5 w-3.5 text-[#a78bfa]" /> AGPL v3 Licensed
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
