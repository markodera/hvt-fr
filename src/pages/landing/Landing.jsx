import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Building2,
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

import { HvtLogoMark, Logo } from '@/components/Logo';

const SITE_URL = 'https://hvts.app';
const API_URL = 'https://api.hvts.app';
const GITHUB_URL = 'https://github.com/markodera/hvt';
const DOCS_URL = import.meta.env.VITE_PUBLIC_DOCS_URL?.trim() || 'https://docs.hvts.app';
const CHANGELOG_URL = 'https://github.com/markodera/hvt/commits/main';
const STATUS_URL = import.meta.env.VITE_PUBLIC_STATUS_URL?.trim() || `${API_URL}/healthz/`;

const DOT_GRID_STYLE = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2718%27 height=%2718%27 viewBox=%270 0 18 18%27%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%2327272a%27 /%3E%3C/svg%3E")',
  backgroundRepeat: 'repeat',
};

const featureStripItems = [
  'User signup and login',
  'Password reset',
  'Google and GitHub login',
  'Team invites',
  'Audit history',
  'Webhooks',
];

const chainNodes = ['Set up', 'Invite team', 'Connect app', 'Users sign in', 'Track activity'];

const controlPlaneNodes = [
  {
    title: 'Workspace',
    description: 'Create one home for your company or team.',
  },
  {
    title: 'Apps and environments',
    description: 'Give each app or environment its own settings and signup rules.',
  },
  {
    title: 'API keys',
    description: 'Connect your backend securely without reusing one shared key everywhere.',
  },
  {
    title: 'Team invites',
    description: 'Invite owners, admins, and members with the right level of access.',
  },
  {
    title: 'Login options',
    description: 'Turn Google or GitHub sign-in on only where you need it.',
  },
];

const runtimeNodes = [
  {
    title: 'Create accounts',
    description: 'Let people sign up with email and password.',
  },
  {
    title: 'Sign in',
    description: 'Let returning users log in to the right app safely.',
  },
  {
    title: 'Reset access',
    description: 'Handle forgot-password and email verification flows without extra tools.',
  },
  {
    title: 'Social login',
    description: 'Offer Google or GitHub sign-in when it is enabled for that app.',
  },
  {
    title: 'Activity updates',
    description: 'Send important account events to your other tools with webhooks.',
  },
  {
    title: 'History',
    description: 'See who signed in and what changed from one clear activity trail.',
  },
];

const features = [
  {
    icon: ShieldCheck,
    title: 'User signup and login',
    description:
      'Let customers create accounts, sign in, verify email addresses, and reset passwords from one system.',
  },
  {
    icon: KeyRound,
    title: 'API keys for your backend',
    description:
      'Connect your server to HVT with app-specific keys instead of sharing one credential across everything.',
  },
  {
    icon: GitBranchPlus,
    title: 'Google and GitHub sign-in',
    description:
      'Offer social login where you want it, and keep each app or environment separated.',
  },
  {
    icon: Users,
    title: 'Team roles and invites',
    description:
      'Invite teammates, choose what they can access, and avoid mixing staff access with customer access.',
  },
  {
    icon: Webhook,
    title: 'Webhooks and alerts',
    description:
      'Send account and security events to Slack, internal tools, or any system that needs updates.',
  },
  {
    icon: ScrollText,
    title: 'Audit history',
    description:
      'See who signed in, who was invited, what changed, and when it happened.',
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
    label: 'For your users',
    caption:
      'The customer-facing experience stays simple from the first screen.',
    code: (
      <>
        <CodeLine>1. A visitor opens your app.</CodeLine>
        <CodeLine>2. They create an account or sign in.</CodeLine>
        <CodeLine>3. HVT checks the right app and access rules.</CodeLine>
        <CodeLine>4. HVT signs them in securely.</CodeLine>
        <CodeLine>5. If needed, they can verify email or reset a password.</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>Common user flows</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>- Sign up</CodeLine>
        <CodeLine>- Sign in</CodeLine>
        <CodeLine>- Email verification</CodeLine>
        <CodeLine>- Password reset</CodeLine>
        <CodeLine>- Google and GitHub login</CodeLine>
      </>
    ),
  },
  key: {
    label: 'For your team',
    caption:
      'Your staff can set up access without stitching together multiple products.',
    code: (
      <>
        <CodeLine>1. Create a workspace for your company.</CodeLine>
        <CodeLine>2. Add an app or environment.</CodeLine>
        <CodeLine>3. Invite teammates with the right role.</CodeLine>
        <CodeLine>4. Choose email login, Google, or GitHub.</CodeLine>
        <CodeLine>5. Connect your backend with an API key.</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>What your team manages</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>- Apps and environments</CodeLine>
        <CodeLine>- Staff access</CodeLine>
        <CodeLine>- API keys</CodeLine>
        <CodeLine>- Social login settings</CodeLine>
        <CodeLine>- Signup rules</CodeLine>
      </>
    ),
  },
  webhook: {
    label: 'For your operations',
    caption:
      'HVT keeps the rest of your tools informed when something important happens.',
    code: (
      <>
        <CodeLine>When something changes, HVT can tell your other tools.</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>Examples</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>- New user created</CodeLine>
        <CodeLine>- Password changed</CodeLine>
        <CodeLine>- API key issued or revoked</CodeLine>
        <CodeLine>- Teammate invited</CodeLine>
        <CodeLine>- Login activity recorded</CodeLine>
        <CodeLine></CodeLine>
        <CodeLine>You also get a built-in activity history for your team.</CodeLine>
      </>
    ),
  },
};

function Wordmark() {
  return (
    <Link to="/" className="inline-flex items-center gap-3">
      <HvtLogoMark className="h-9 w-9 shrink-0" />
      <div className="leading-none">
        <div className="font-mono text-[1.08rem] font-bold tracking-[-0.03em] text-white">HVT</div>
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
      className={`rounded-[18px] border border-[#27272a] bg-[#111111]/88 ${compact ? 'p-4' : 'p-5'} transition-[border-color,transform,box-shadow] duration-200 hover:border-[rgba(124,58,237,0.6)]`}
      style={{
        animation: compact ? undefined : 'heroFloat 7.5s ease-in-out infinite',
        boxShadow: compact ? undefined : '0 18px 48px rgba(0,0,0,0.28)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {chainNodes.map((node, index) => (
          <div key={node} className="contents">
            <div
              className={`rounded-full border border-[#3f3f46] bg-[#18181b] px-4 py-2 ${compact ? 'text-xs' : 'text-sm'} font-medium text-[#e4e4e7]`}
              style={{
                animation: compact ? undefined : `heroFadeUp 0.7s ease-out ${0.18 + index * 0.08}s both`,
              }}
            >
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
    document.title = 'HVT | Sign-in, team access, and account security in one place';

    upsertMeta('meta[name="description"]', () => {
      const meta = document.createElement('meta');
      meta.name = 'description';
      return meta;
    }, (meta) => {
      meta.content = 'HVT helps teams handle user signup, login, team access, social sign-in, API keys, and activity history from one product.';
    });

    upsertMeta('meta[property="og:title"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:title');
      return meta;
    }, (meta) => {
      meta.setAttribute('content', 'HVT | Sign-in, team access, and account security in one place');
    });

    upsertMeta('meta[property="og:description"]', () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', 'og:description');
      return meta;
    }, (meta) => {
      meta.setAttribute('content', 'Handle customer login, team invites, social sign-in, API keys, audit history, and webhooks from one place.');
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
        @keyframes heroFadeUp {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        @keyframes heroGlowPulse {
          0%, 100% { opacity: 0.72; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.04); }
        }

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
        className={`sticky top-0 z-50 border-b transition-all ${
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
              className="rounded-full border border-[#3f3f46] bg-[#18181b] px-4 py-2 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_24px_rgba(0,0,0,0.26)] transition-[border-color,background-color] duration-150 hover:border-[rgba(124,58,237,0.45)] hover:bg-[#1d1d22]"
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
        <section className="relative overflow-hidden border-b border-[#27272a]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at top center, rgba(124,58,237,0.15), transparent 58%)',
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

          <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8 lg:py-32">
            <div className="max-w-5xl">
              <div
                className="inline-flex items-center rounded-full border border-[#27272a] bg-[#111111]/88 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-[#a78bfa]"
                style={{ animation: 'heroFadeUp 0.6s ease-out 0.05s both' }}
              >
                Sign-in, team access, and account security in one place
              </div>
              <h1
                className="mt-8 max-w-5xl text-4xl font-extrabold leading-tight tracking-[-0.05em] text-white sm:text-5xl lg:text-7xl"
                style={{ animation: 'heroFadeUp 0.7s ease-out 0.12s both' }}
              >
                HVT helps you manage customer accounts and team access without stitching five tools together.
              </h1>
              <p
                className="mt-6 max-w-3xl text-base leading-8 text-[#a1a1aa] sm:text-lg"
                style={{ animation: 'heroFadeUp 0.7s ease-out 0.2s both' }}
              >
                Use one product to let customers sign up, let teammates log in, offer Google or GitHub sign-in,
                issue API keys, reset passwords, and keep a clear record of what changed. Start hosted now and
                self-host later if you want full control.
              </p>

              <div className="mt-8 max-w-3xl" style={{ animation: 'heroFadeUp 0.8s ease-out 0.28s both' }}>
                <ChainDiagram />
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row" style={{ animation: 'heroFadeUp 0.8s ease-out 0.36s both' }}>
                <Link to="/signup" className="inline-flex items-center justify-center rounded-md bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9]">
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

        <section className="border-b border-[#27272a]">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="text-sm font-medium text-[#a78bfa]">At a glance</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">What HVT helps you do, in plain language.</h2>
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
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">One side for your team. One side for your users.</h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                Your team sets up apps, teammate access, and login options. Your users sign up, sign in, reset
                passwords, and use social login. HVT keeps both sides connected and easy to manage.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="rounded-[18px] border border-[#27272a] bg-[#111111] p-6 transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)]">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[#a78bfa]" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">For your team</div>
                    <div className="mt-1 text-lg font-semibold text-white">Set up apps, teammates, and login options</div>
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
                  Shared access rules
                </div>
              </div>

              <div className="rounded-[18px] border border-[#3f3f46] bg-[#18181b] p-6 transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)]">
                <div className="flex items-center gap-3">
                  <Boxes className="h-5 w-5 text-[#a78bfa]" />
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">For your users</div>
                    <div className="mt-1 text-lg font-semibold text-white">Sign up, sign in, reset passwords, and stay secure</div>
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
              <div className="text-sm font-medium text-[#a78bfa]">Why teams choose HVT</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">Everything you need to run access in one place.</h2>
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
              <div className="text-sm font-medium text-[#a78bfa]">Start here</div>
              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">Start free today, choose how to run it later.</h2>
              <p className="mt-4 text-base leading-8 text-[#a1a1aa]">
                Use the hosted version now or self-host when you are ready. Either way, HVT stays focused on user
                accounts, team access, and clear security controls.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="flex flex-col rounded-[18px] border border-[#27272a] bg-[#111111] p-6 transition-[border-color,box-shadow] duration-150 hover:border-[rgba(124,58,237,0.6)]">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#71717a]">Self-hosted</div>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-[#d4d4d8]">
                    <p>
                      HVT is open-source, so your team can run it on your own infrastructure when you want full control.
                    </p>
                    <p>
                      That is a good fit if you want to own the stack, review the code, or keep deployment inside your
                      own environment.
                    </p>
                  </div>
                </div>
                <div className="mt-auto pt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9]"
                  >
                    Get started free
                  </Link>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-[#27272a] px-4 py-3 text-sm font-semibold text-[#d4d4d8] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] hover:text-white"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>

              <div className="relative flex flex-col overflow-hidden rounded-[18px] border border-[rgba(124,58,237,0.4)] bg-[#18181b] p-6 shadow-[0_0_30px_rgba(124,58,237,0.15)] transition-[border-color,box-shadow] duration-150 hover:border-[rgba(124,58,237,0.8)] hover:shadow-[0_0_40px_rgba(124,58,237,0.25)]">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7c3aed] opacity-20 blur-[80px]"></div>
                <div className="relative z-10 flex h-full flex-col">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-[#a78bfa] font-semibold">Hosted by HVT</div>
                    <h3 className="mt-4 bg-gradient-to-r from-white to-[#a78bfa] bg-clip-text text-xl font-bold text-transparent">Free to try today</h3>
                    <p className="mt-3 text-sm leading-7 text-[#a1a1aa]">
                      You can create an account, test login flows, invite teammates, and explore the product without
                      setting up servers first.
                    </p>
                    <div className="mt-6 rounded-2xl border border-[rgba(124,58,237,0.2)] bg-[#111111] px-4 py-4 text-sm text-[#d4d4d8]">
                      Hosted pricing will be shared later. Right now, <strong className="text-[#a78bfa]">you can sign up and use HVT for free while you evaluate it.</strong>
                    </div>
                  </div>
                  <div className="mt-auto pt-6">
                    <Link
                      to="/signup"
                      className="inline-flex w-full items-center justify-center rounded-md bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9]"
                    >
                      Create free account
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0a0a0a]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 xl:grid-cols-[1.1fr_1fr_0.7fr] lg:px-8">
          <div>
            <Logo href="/" />
            <p className="mt-4 max-w-sm text-sm leading-7 text-[#a1a1aa]">
              HVT helps you handle customer login, teammate access, social sign-in, API keys, and activity history
              from one product.
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
              <LockKeyhole className="h-3.5 w-3.5 text-[#a78bfa]" /> AGPL v3 Licensed
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
