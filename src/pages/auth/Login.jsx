import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, Github, Fingerprint, Mail, KeyRound, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';

import { listSocialProviders, loginWithPasskey, requestMagicLink } from '@/api/auth';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { hvt } from '@/lib/hvt';
import { SOCIAL_AUTH_PROVIDERS, startSocialSignIn } from '@/lib/socialAuth';
import {
  buildInvitationAcceptPath,
  consumeInvitationResumeToken,
  markInvitationResumeAfterAuth,
} from '@/lib/invitations';
import { getErrorMessage } from '@/lib/utils';
import { DOCS_URL } from '@/lib/appLinks';

const DOT_GRID_STYLE = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2718%27 height=%2718%27 viewBox=%270 0 18 18%27%3E%3Ccircle cx=%279%27 cy=%279%27 r=%271.5%27 fill=%27%2327272a%27 /%3E%3C/svg%3E")',
  backgroundRepeat: 'repeat',
};

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function AuthBackground() {
  return (
    <>
      <style>{`
        @keyframes authGlowPulse {
          0%, 100% { opacity: 0.18; }
          50% { opacity: 0.34; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top center, rgba(124,58,237,0.15), transparent 56%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          ...DOT_GRID_STYLE,
          WebkitMaskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.88) 68%, transparent 100%)',
          maskImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.88) 68%, transparent 100%)',
        }}
      />
    </>
  );
}

function Wordmark({ centered = false }) {
  return <Logo href="/" align={centered ? 'center' : 'left'} className={centered ? 'mx-auto' : ''} />;
}

export default function Login() {
  const { login, completeMfaLogin, waitForSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'magic_link'
  const [magicLinkSentTo, setMagicLinkSentTo] = useState(null);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [mfaData, setMfaData] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isMfaSubmitting, setIsMfaSubmitting] = useState(false);
  const inviteToken = searchParams.get('invite_token') || '';

  useEffect(() => {
    document.title = 'Sign in | HVT';
  }, []);

  useEffect(() => {
    if (inviteToken) {
      markInvitationResumeAfterAuth(inviteToken);
    }
  }, [inviteToken]);

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    register: registerMagicLink,
    handleSubmit: handleSubmitMagicLink,
    formState: { errors: magicLinkErrors, isSubmitting: isMagicLinkSubmitting },
  } = useForm({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  const { data: socialProviderData } = useQuery({
    queryKey: ['controlPlaneSocialProviders'],
    queryFn: listSocialProviders,
  });

  const controlPlaneProviders = socialProviderData?.providers ?? [];
  const googleAvailable = controlPlaneProviders.some((provider) => provider.provider === 'google');
  const githubAvailable = controlPlaneProviders.some((provider) => provider.provider === 'github');

  const handleSocialLogin = (provider, label) => {
    if (inviteToken) {
      markInvitationResumeAfterAuth(inviteToken);
    }
    const started = startSocialSignIn(provider, controlPlaneProviders);
    if (!started) {
      toast.error(`${label} login is not configured`);
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      const res = await login(values);
      if (res?.mfa_required) {
        setMfaData(res);
        toast.info('Two-factor authentication required. Please enter your code.');
        return;
      }
      const resumeInvitationToken = consumeInvitationResumeToken();
      toast.success('Signed in');
      if (resumeInvitationToken) {
        navigate(buildInvitationAcceptPath(resumeInvitationToken));
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode || mfaCode.length < 6) {
      toast.error('Please enter your 6-digit authenticator code.');
      return;
    }
    setIsMfaSubmitting(true);
    try {
      await completeMfaLogin({ mfa_token: mfaData.mfa_token, code: mfaCode });
      toast.success('Two-factor authentication verified');
      const resumeInvitationToken = consumeInvitationResumeToken();
      if (resumeInvitationToken) {
        navigate(buildInvitationAcceptPath(resumeInvitationToken));
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(getErrorMessage(error) || 'Invalid two-factor code.');
    } finally {
      setIsMfaSubmitting(false);
    }
  };

  const onMagicLinkSubmit = async (values) => {
    try {
      await requestMagicLink({ email: values.email });
      setMagicLinkSentTo(values.email);
      toast.success('Sign-in link sent! Check your inbox.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handlePasskeyLogin = async () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      toast.error('Passkeys are not supported in this browser.');
      return;
    }
    setIsPasskeyLoading(true);
    try {
      const res = await loginWithPasskey();
      if (res?.access) {
        hvt.setAccessToken(res.access);
        localStorage.setItem('hvt_access_token', res.access);
        await waitForSession();
      }
      toast.success('Signed in with Passkey');
      const resumeInvitationToken = consumeInvitationResumeToken();
      if (resumeInvitationToken) {
        navigate(buildInvitationAcceptPath(resumeInvitationToken));
        return;
      }
      navigate('/dashboard');
    } catch (error) {
      const msg = error?.message || '';
      if (error?.name === 'NotAllowedError' || msg.includes('not allowed') || msg.includes('timed out')) {
        toast.error('Passkey authentication was canceled or timed out.');
      } else if (msg.includes('already registered')) {
        toast.info('This passkey is already registered.');
      } else {
        toast.error(getErrorMessage(error) || 'Passkey authentication failed.');
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <Helmet>
        <title>Sign in | HVT - Identity & Access Management</title>
        <meta
          name="description"
          content="Sign in to your HVT control plane. Manage multi-tenant projects, runtime user authentication, API keys, WebAuthn passkeys, and RBAC permissions."
        />
        <meta property="og:title" content="Sign in | HVT Identity Platform" />
        <meta
          property="og:description"
          content="Secure, developer-first authentication with Passkeys, Magic Links, Social OAuth, and TOTP Two-Factor Auth."
        />
      </Helmet>
      <AuthBackground />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[440px] rounded-[20px] border border-[#27272a] bg-[#111111]/92 p-8 shadow-[0_0_0_1px_rgba(124,58,237,0.06)] backdrop-blur-sm transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] sm:p-10">
          <div className="flex justify-center">
            <Wordmark centered />
          </div>

          {mfaData ? (
            /* 2FA TOTP Challenge View */
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-[#a855f7]">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Two-Factor Authentication</h1>
              <p className="mt-2 text-sm text-[#a1a1aa]">
                Enter the 6-digit verification code from your authenticator app (Google Authenticator, Authy, 1Password) to continue.
              </p>

              <form onSubmit={onMfaSubmit} className="mt-6 space-y-4 text-left">
                <div>
                  <label htmlFor="totp-code" className="block text-xs font-semibold uppercase tracking-wider text-[#a1a1aa]">
                    Authentication Code
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    autoFocus
                    placeholder="000 000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="mt-2 w-full rounded-lg border border-[#27272a] bg-[#09090b] px-4 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-white outline-none transition-colors focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isMfaSubmitting || mfaCode.length < 6}
                  className="w-full rounded-lg bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isMfaSubmitting ? 'Verifying code...' : 'Verify and Sign In'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaData(null);
                    setMfaCode('');
                  }}
                  className="w-full text-center text-xs text-[#71717a] transition-colors hover:text-white hover:underline pt-2"
                >
                  Cancel and return to sign in
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="mt-8 text-center">
                <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">Sign in</h1>
                <p className="mt-2 text-sm leading-6 text-[#a1a1aa]">
                  Access your organization control plane and runtime settings.
                </p>
              </div>

              {/* Passkey Fast Sign-in */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isPasskeyLoading}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-4 py-3 text-sm font-semibold text-white transition-all hover:border-[#7c3aed] hover:bg-[#7c3aed]/20 disabled:opacity-50"
                >
                  <Fingerprint className="h-5 w-5 text-[#a855f7]" />
                  {isPasskeyLoading ? 'Waiting for biometric sensor...' : 'Sign in with Passkey'}
                </button>
              </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => handleSocialLogin(SOCIAL_AUTH_PROVIDERS.GOOGLE, 'Google')}
              disabled={!googleAvailable}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-[#27272a] bg-transparent px-4 py-2.5 text-sm font-medium text-[#e4e4e7] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin(SOCIAL_AUTH_PROVIDERS.GITHUB, 'GitHub')}
              disabled={!githubAvailable}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-[#27272a] bg-transparent px-4 py-2.5 text-sm font-medium text-[#e4e4e7] transition-colors duration-150 hover:border-[rgba(124,58,237,0.6)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative my-6">
            <div className="h-px w-full bg-[#27272a]" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#111111] px-3 text-xs uppercase tracking-[0.14em] text-[#71717a]">
              or continue with email
            </span>
          </div>

          {/* Auth Method Tabs */}
          <div className="mb-5 flex rounded-lg border border-[#27272a] bg-[#09090b] p-1">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password');
                setMagicLinkSentTo(null);
              }}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                authMethod === 'password'
                  ? 'bg-[#27272a] text-white shadow-sm'
                  : 'text-[#71717a] hover:text-[#d4d4d8]'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('magic_link')}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${
                authMethod === 'magic_link'
                  ? 'bg-[#27272a] text-white shadow-sm'
                  : 'text-[#71717a] hover:text-[#d4d4d8]'
              }`}
            >
              Magic Link
            </button>
          </div>

          {authMethod === 'password' ? (
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-white">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...registerPassword('email')}
                  className="w-full rounded-md border border-[#27272a] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white outline-none transition-colors duration-150 placeholder:text-[#52525b] focus:border-[#7c3aed]"
                />
                {passwordErrors.email ? <p className="text-xs text-[#f87171]">{passwordErrors.email.message}</p> : null}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    {...registerPassword('password')}
                    className="w-full rounded-md border border-[#27272a] bg-[#0a0a0a] px-4 py-2.5 pr-11 text-sm text-white outline-none transition-colors duration-150 placeholder:text-[#52525b] focus:border-[#7c3aed]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717a] transition-colors hover:text-white"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordErrors.password ? <p className="text-xs text-[#f87171]">{passwordErrors.password.message}</p> : null}
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-[#71717a] transition-colors hover:text-[#a78bfa]">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPasswordSubmitting}
                className="w-full rounded-md bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isPasswordSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          ) : magicLinkSentTo ? (
            <div className="rounded-xl border border-[#27272a] bg-[#09090b] p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#22c55e]" />
              <h3 className="mt-3 text-base font-semibold text-white">Check your email</h3>
              <p className="mt-1 text-xs text-[#a1a1aa]">
                We sent a 1-click magic sign-in link to <span className="font-medium text-white">{magicLinkSentTo}</span>.
              </p>
              <button
                type="button"
                onClick={() => setMagicLinkSentTo(null)}
                className="mt-4 text-xs text-[#a78bfa] hover:underline"
              >
                Send to a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitMagicLink(onMagicLinkSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="magic-email" className="text-sm font-medium text-white">
                  Email
                </label>
                <input
                  id="magic-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  {...registerMagicLink('email')}
                  className="w-full rounded-md border border-[#27272a] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white outline-none transition-colors duration-150 placeholder:text-[#52525b] focus:border-[#7c3aed]"
                />
                {magicLinkErrors.email ? <p className="text-xs text-[#f87171]">{magicLinkErrors.email.message}</p> : null}
              </div>

              <button
                type="submit"
                disabled={isMagicLinkSubmitting}
                className="w-full rounded-md bg-[#7c3aed] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {isMagicLinkSubmitting ? 'Sending link...' : 'Send Magic Link'}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-[#a1a1aa]">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-[#a78bfa] transition-colors hover:text-white">
              Get started free
            </Link>
          </p>

          <p className="mt-2 text-center text-xs text-[#71717a]">
            Need setup help?{' '}
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="text-[#a78bfa] transition-colors hover:text-white">
              Read the docs
            </a>
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
