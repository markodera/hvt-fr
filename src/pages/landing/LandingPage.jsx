import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    RefreshCw,
    Users,
    Webhook,
    ScrollText,
    Building2,
    ArrowRight,
    Terminal,
    Code2,
    Check,
    Zap,
    Lock,
    Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Hero ──
function Hero() {
    return (
        <section className="relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(#1E1535_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                    <Zap className="h-3.5 w-3.5" />
                    Open source · Self-hostable · Production-ready
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary max-w-4xl mx-auto leading-[1.1] tracking-tight">
                    Authentication infrastructure{' '}
                    <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                        you own
                    </span>
                </h1>

                <p className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
                    HVT is an open-source Auth0 alternative. JWT rotation, RBAC, webhooks, audit logs, and multi-tenancy               deployed on your infrastructure.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button size="lg" asChild className="text-base px-8">
                        <Link to="/register">
                            Get started free
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="text-base px-8">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                            View on GitHub
                        </a>
                    </Button>
                </div>

                {/* Dashboard preview */}
                <div className="mt-16 max-w-4xl mx-auto relative">
                    {/* Purple glow behind preview */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-primary/10 to-purple-600/20 rounded-3xl blur-2xl" />

                    <div className="relative bg-bg-secondary border border-border rounded-xl overflow-hidden shadow-2xl">
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-bg-tertiary border-b border-border">
                            <div className="w-3 h-3 rounded-full bg-danger/60" />
                            <div className="w-3 h-3 rounded-full bg-warning/60" />
                            <div className="w-3 h-3 rounded-full bg-success/60" />
                            <span className="ml-2 text-xs text-text-muted font-mono">HVT Dashboard</span>
                        </div>

                        <div className="flex">
                            {/* Mini sidebar */}
                            <div className="hidden sm:flex w-48 bg-bg-tertiary/50 border-r border-border flex-col py-4 px-3 gap-1 shrink-0">
                                <div className="flex items-center gap-2 px-3 py-2 mb-4">
                                    <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                                        <span className="text-[10px] text-white font-bold">H</span>
                                    </div>
                                    <span className="text-xs font-bold text-text-primary">HVT.dev</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                    <div className="w-3 h-3 rounded-sm bg-primary/30" />
                                    Dashboard
                                </div>
                                {['Users', 'API Keys', 'Webhooks', 'Audit Logs', 'Settings'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 px-3 py-1.5 text-text-muted text-xs">
                                        <div className="w-3 h-3 rounded-sm bg-border" />
                                        {item}
                                    </div>
                                ))}
                            </div>

                            {/* Main content area */}
                            <div className="flex-1 p-4 sm:p-6 min-h-[280px]">
                                {/* Stat cards */}
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[
                                        { label: 'Total Users', value: '1,284' },
                                        { label: 'API Keys', value: '42' },
                                        { label: 'Events', value: '8,391' },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-bg-tertiary border border-border rounded-lg p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">{stat.label}</p>
                                            <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Activity table */}
                                <div className="bg-bg-tertiary border border-border rounded-lg overflow-hidden">
                                    <div className="px-3 py-2 border-b border-border">
                                        <p className="text-xs font-semibold text-text-primary">Recent Activity</p>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {[
                                            { event: 'user.login', actor: 'mark@hvt.dev', status: true, time: '2m ago' },
                                            { event: 'api_key.created', actor: 'admin@hvt.dev', status: true, time: '5m ago' },
                                            { event: 'webhook.fired', actor: 'system', status: false, time: '12m ago' },
                                            { event: 'user.registered', actor: 'new@example.com', status: true, time: '1h ago' },
                                        ].map((row) => (
                                            <div key={row.event + row.time} className="flex items-center justify-between px-3 py-2 text-xs">
                                                <span className="text-text-primary font-medium">{row.event}</span>
                                                <span className="text-text-muted hidden sm:inline">{row.actor}</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${row.status ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                                    {row.status ? 'OK' : 'FAIL'}
                                                </span>
                                                <span className="text-text-muted">{row.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Features ──
const features = [
    {
        icon: RefreshCw,
        title: 'JWT Rotation',
        description: 'Automatic access and refresh token rotation with httpOnly cookies. Zero XSS exposure.',
    },
    {
        icon: Shield,
        title: 'RBAC',
        description: 'Role-based access control with Owner, Admin, and Member roles out of the box.',
    },
    {
        icon: Webhook,
        title: 'Webhooks',
        description: 'Real-time event notifications with automatic retries and delivery tracking.',
    },
    {
        icon: ScrollText,
        title: 'Audit Logs',
        description: 'Complete audit trail of every authentication event with IP and user-agent tracking.',
    },
    {
        icon: Building2,
        title: 'Multi-tenancy',
        description: 'Built-in organisation support. Each tenant gets isolated users, keys, and settings.',
    },
    {
        icon: Globe,
        title: 'Social OAuth',
        description: 'Google and GitHub login pre-configured. Add any OAuth provider with minimal setup.',
    },
];

function Features() {
    return (
        <section id="features" className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Features</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                        Everything you need to ship auth
                    </h2>
                    <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
                        Stop rebuilding authentication from scratch. HVT gives you production-ready auth infrastructure in minutes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.title}
                            className="group bg-bg-secondary border border-border rounded-xl p-6 hover:border-border-hover hover:bg-bg-tertiary/50 transition-all duration-300"
                        >
                            <div className="mb-4 rounded-xl bg-primary/10 w-12 h-12 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <feature.icon className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── How it Works ──
const steps = [
    {
        step: '01',
        title: 'Install',
        description: 'Clone the repo and run docker-compose up. HVT spins up with a single command.',
        icon: Terminal,
    },
    {
        step: '02',
        title: 'Configure',
        description: 'Set your OAuth providers, email settings, and organisation defaults via environment variables.',
        icon: Code2,
    },
    {
        step: '03',
        title: 'Integrate',
        description: 'Use our REST API or SDK to add login, registration, and user management to your app.',
        icon: Zap,
    },
];

function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-bg-secondary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">How it works</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                        Up and running in three steps
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {steps.map((step, i) => (
                        <div key={step.step} className="relative text-center">
                            {i < steps.length - 1 && (
                                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
                            )}
                            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
                                <step.icon className="h-7 w-7 text-primary" />
                            </div>
                            <div className="text-xs font-bold text-primary mb-2">{step.step}</div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                            <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">{step.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ── Code Tabs ──
function CodeSection() {
    const [tab, setTab] = useState('sdk');

    return (
        <section className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Integration</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                        Integrate in under 10 lines
                    </h2>
                </div>

                <div className="max-w-2xl mx-auto">
                    <div className="flex gap-1 mb-4">
                        <button
                            onClick={() => setTab('sdk')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'sdk'
                                    ? 'bg-primary text-white'
                                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            JavaScript SDK
                        </button>
                        <button
                            onClick={() => setTab('rest')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'rest'
                                    ? 'bg-primary text-white'
                                    : 'bg-bg-tertiary text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            REST API
                        </button>
                    </div>

                    <div className="bg-bg-secondary border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-bg-tertiary border-b border-border">
                            <div className="w-3 h-3 rounded-full bg-danger/60" />
                            <div className="w-3 h-3 rounded-full bg-warning/60" />
                            <div className="w-3 h-3 rounded-full bg-success/60" />
                            <span className="ml-2 text-xs text-text-muted font-mono">
                                {tab === 'sdk' ? 'app.js' : 'terminal'}
                            </span>
                        </div>
                        <pre className="p-6 text-sm font-mono overflow-x-auto">
                            {tab === 'sdk' ? (
                                <code>
                                    <span className="text-primary">import</span>{' '}
                                    <span className="text-text-primary">{'{ HVTClient }'}</span>{' '}
                                    <span className="text-primary">from</span>{' '}
                                    <span className="text-success">'@hvt/sdk'</span>
                                    {'\n\n'}
                                    <span className="text-primary">const</span>{' '}
                                    <span className="text-text-primary">hvt</span>{' = '}
                                    <span className="text-warning">new</span>{' '}
                                    <span className="text-text-primary">HVTClient</span>
                                    {'({\n'}
                                    <span className="text-text-secondary">{'  baseURL'}</span>
                                    {': '}
                                    <span className="text-success">'https://auth.yourapp.com'</span>
                                    {'\n})\n\n'}
                                    <span className="text-text-muted">{'// Login a user'}</span>
                                    {'\n'}
                                    <span className="text-primary">const</span>{' '}
                                    <span className="text-text-primary">session</span>{' = '}
                                    <span className="text-primary">await</span>{' '}
                                    <span className="text-text-primary">hvt.auth.login</span>
                                    {'({\n'}
                                    <span className="text-text-secondary">{'  email'}</span>
                                    {': '}
                                    <span className="text-success">'user@example.com'</span>
                                    {',\n'}
                                    <span className="text-text-secondary">{'  password'}</span>
                                    {': '}
                                    <span className="text-success">'secure-password'</span>
                                    {'\n})'}
                                </code>
                            ) : (
                                <code>
                                    <span className="text-text-muted">$ </span>
                                    <span className="text-text-primary">curl -X POST https://auth.yourapp.com/api/v1/auth/login/ \</span>
                                    {'\n'}
                                    <span className="text-text-primary">{'  -H "Content-Type: application/json" \\'}</span>
                                    {'\n'}
                                    <span className="text-text-primary">{"  -d '{\"email\": \"user@example.com\", \"password\": \"secure\"}}'"}</span>
                                    {'\n\n'}
                                    <span className="text-success">{'{'}</span>
                                    {'\n'}
                                    <span className="text-text-secondary">{'  "user": { "id": "...", "email": "user@example.com" }'}</span>
                                    {'\n'}
                                    <span className="text-success">{'}'}</span>
                                </code>
                            )}
                        </pre>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Pricing ──
function Pricing() {
    return (
        <section id="pricing" className="py-24 bg-bg-secondary">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">Pricing</p>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
                        Simple, transparent pricing
                    </h2>
                    <p className="mt-4 text-lg text-text-secondary">
                        Open source and free forever. Or let us host it for you.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Self-hosted */}
                    <div className="bg-bg-primary border border-border rounded-2xl p-8">
                        <h3 className="text-lg font-bold text-text-primary">Self-hosted</h3>
                        <p className="text-sm text-text-secondary mt-2 mb-6">Deploy on your own infrastructure</p>
                        <div className="mb-8">
                            <span className="text-4xl font-extrabold text-text-primary">$0</span>
                            <span className="text-text-secondary ml-1">/forever</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {[
                                'Unlimited users',
                                'Full source code',
                                'All features included',
                                'Docker & Docker Compose',
                                'Community support',
                                'MIT License',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm text-text-secondary">
                                    <Check className="h-4 w-4 text-success shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Button variant="outline" className="w-full" asChild>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                View on GitHub
                            </a>
                        </Button>
                    </div>

                    {/* Cloud */}
                    <div className="bg-bg-primary border-2 border-primary rounded-2xl p-8 relative">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-white text-xs font-semibold rounded-full">
                            Recommended
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">Cloud</h3>
                        <p className="text-sm text-text-secondary mt-2 mb-6">Fully managed by the HVT team</p>
                        <div className="mb-8">
                            <span className="text-4xl font-extrabold text-text-primary">$29</span>
                            <span className="text-text-secondary ml-1">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {[
                                'Everything in Self-hosted',
                                'Managed infrastructure',
                                'Automatic updates',
                                'Global CDN',
                                'Priority support',
                                '99.9% uptime SLA',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm text-text-secondary">
                                    <Check className="h-4 w-4 text-success shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Button className="w-full" asChild>
                            <Link to="/register">Start free trial</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── CTA Banner ──
function CTABanner() {
    return (
        <section className="py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-br from-primary/20 via-bg-secondary to-bg-secondary border border-primary/20 rounded-2xl p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#7C3AED_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-10" />
                    <div className="relative">
                        <Lock className="h-10 w-10 text-primary mx-auto mb-6" />
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-4">
                            Start building in minutes
                        </h2>
                        <p className="text-lg text-text-secondary max-w-xl mx-auto mb-8">
                            Deploy HVT today and never worry about authentication plumbing again.
                        </p>
                        <Button size="lg" asChild className="text-base px-8">
                            <Link to="/register">
                                Get started free
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ── Landing Page ──
export function LandingPage() {
    return (
        <>
            <Hero />
            <Features />
            <HowItWorks />
            <CodeSection />
            <Pricing />
            <CTABanner />
        </>
    );
}
