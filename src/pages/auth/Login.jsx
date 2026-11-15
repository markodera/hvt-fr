// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, Github, Fingerprint, Mail, KeyRound, ShieldCheck } from 'lucide-react';
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

export default function Login() {
  const { login, completeMfaLogin, waitForSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'magic_link'
  const [magicLinkSentTo, setMagicLinkSentTo] = useState(null);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  // 2FA TOTP state
  const [mfaData, setMfaData] = useState(null); // { mfa_required: true, mfa_token: '...' }
  const [mfaCode, setMfaCode] = useState('');
  const [isMfaSubmitting, setIsMfaSubmitting] = useState(false);

  const inviteToken = searchParams.get('invite_token') || '';

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    register: magicLinkRegister,
    handleSubmit: handleMagicLinkSubmit,
    formState: { errors: magicLinkErrors, isSubmitting: isMagicLinkSubmitting },
  } = useForm({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    document.title = 'Sign in | HVT';
    if (inviteToken) {
      markInvitationResumeAfterAuth(inviteToken);
    }
  }, [inviteToken]);

  const socialProvidersQuery = useQuery({
    queryKey: ['control-plane-social-providers'],
    queryFn: listSocialProviders,
    retry: 1,
  });

  const providers = useMemo(() => socialProvidersQuery.data?.providers || [], [socialProvidersQuery.data]);

  const handleSocialLogin = (provider, providerName) => {
    if (inviteToken) {
      markInvitationResumeAfterAuth(inviteToken);
    }
    const started = startSocialSignIn(provider, providers);
    if (!started) {
      toast.error(`${providerName} sign-in is not available yet.`);
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      const res = await login({ email: values.email, password: values.password });
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
        toast.error('Passkey authentication was canceled.');
      } else {
        toast.error(getErrorMessage(error) || 'Passkey authentication failed.');
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center px-4 py-12 sm:px-6">
      <Helmet>
        <title>Sign in | HVT - Identity & Access Management</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo href="/" />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[420px]">
        <div className="rounded-2xl border border-[#27272a] bg-[#121215] p-6 sm:p-8 shadow-xl">
          {mfaData ? (
            /* ── Two-Factor Authentication Challenge ── */
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#27272a] bg-[#18181b] text-zinc-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="mt-4 text-xl font-bold tracking-tight text-white">Two-Factor Authentication</h1>
              <p className="mt-1.5 text-xs text-zinc-400">
                Enter the 6-digit code from your authenticator app or an 8-character recovery backup code.
              </p>

              <form onSubmit={onMfaSubmit} className="mt-6 space-y-4 text-left">
                <div>
                  <label htmlFor="totp-code" className="block text-xs font-semibold text-zinc-400">
                    Verification Code
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={9}
                    autoFocus
                    placeholder="000 000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.toUpperCase())}
                    className="mt-1.5 w-full rounded-lg border border-[#27272a] bg-[#0c0c0e] px-4 py-2.5 text-center font-mono text-xl font-bold tracking-widest text-white outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isMfaSubmitting || mfaCode.length < 6}
                  className="w-full h-10 rounded-lg bg-[#7c3aed] px-4 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMfaSubmitting ? 'Verifying...' : 'Verify and continue'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMfaData(null);
                    setMfaCode('');
                  }}
                  className="w-full text-center text-xs text-zinc-500 transition hover:text-white pt-1"
                >
                  Cancel and return to login
                </button>
              </form>
            </div>
          ) : (
            /* ── Standard Login ── */
            <div>
              <div className="text-center pb-5 border-b border-[#27272a]">
                <h1 className="text-xl font-bold tracking-tight text-white">Sign in to HVT</h1>
                <p className="mt-1 text-xs text-zinc-400">
                  Access your projects, API keys, and identity console.
                </p>
              </div>

              {/* Social Login Buttons - Always Available */}
              <div className="mt-5 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialLogin(SOCIAL_AUTH_PROVIDERS.GOOGLE, 'Google')}
                  disabled={socialProvidersQuery.isLoading}
                  className="flex w-full h-10 items-center justify-center gap-2.5 rounded-lg border border-[#27272a] bg-[#18181b] px-4 text-xs font-medium text-zinc-200 transition hover:bg-[#202025] hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
                >
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin(SOCIAL_AUTH_PROVIDERS.GITHUB, 'GitHub')}
                  disabled={socialProvidersQuery.isLoading}
                  className="flex w-full h-10 items-center justify-center gap-2.5 rounded-lg border border-[#27272a] bg-[#18181b] px-4 text-xs font-medium text-zinc-200 transition hover:bg-[#202025] hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
                >
                  <Github className="h-4 w-4" />
                  <span>Continue with GitHub</span>
                </button>
              </div>

              {/* Passkey Button - Matching exact width */}
              <div className="mt-2.5">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isPasskeyLoading}
                  className="flex w-full h-10 items-center justify-center gap-2.5 rounded-lg border border-[#27272a] bg-[#18181b] px-4 text-xs font-semibold text-zinc-200 transition hover:bg-[#202025] hover:border-[#3f3f46] hover:text-white disabled:opacity-50"
                >
                  <Fingerprint className="h-4 w-4 text-zinc-400" />
                  <span>{isPasskeyLoading ? 'Waiting for biometric sensor...' : 'Sign in with Passkey'}</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="h-px w-full bg-[#27272a]" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#121215] px-2 text-[11px] text-zinc-500">
                  or with email
                </span>
              </div>

              {/* Method Switcher */}
              <div className="mb-4 flex rounded-lg border border-[#27272a] bg-[#0c0c0e] p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('password');
                    setMagicLinkSentTo(null);
                  }}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                    authMethod === 'password'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('magic_link')}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
                    authMethod === 'magic_link'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Magic Link
                </button>
              </div>

              {/* Method 1: Password Form */}
              {authMethod === 'password' && (
                <form onSubmit={handleLoginSubmit(onPasswordSubmit)} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400">Email address</label>
                    <input
                      type="email"
                      {...loginRegister('email')}
                      autoComplete="email"
                      placeholder="name@company.com"
                      className="mt-1.5 h-10 w-full rounded-lg border border-[#27272a] bg-[#0c0c0e] px-3 text-xs text-white outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    />
                    {loginErrors.email && (
                      <p className="mt-1 text-xs text-rose-400">{loginErrors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-zinc-400">Password</label>
                      <Link to="/forgot-password" className="text-xs text-zinc-400 hover:text-white">
                        Forgot?
                      </Link>
                    </div>
                    <div className="relative mt-1.5">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        {...loginRegister('password')}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="h-10 w-full rounded-lg border border-[#27272a] bg-[#0c0c0e] px-3 pr-10 text-xs text-white outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="mt-1 text-xs text-rose-400">{loginErrors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoginSubmitting}
                    className="w-full h-10 mt-2 rounded-lg bg-[#7c3aed] px-4 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9] disabled:opacity-50"
                  >
                    {isLoginSubmitting ? 'Signing in...' : 'Sign in with password'}
                  </button>
                </form>
              )}

              {/* Method 2: Magic Link Form */}
              {authMethod === 'magic_link' && (
                <div>
                  {magicLinkSentTo ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
                      <Mail className="mx-auto h-6 w-6 text-emerald-400" />
                      <p className="mt-2 text-xs font-semibold text-white">Check your email</p>
                      <p className="mt-1 text-xs text-emerald-300">
                        We sent a sign-in link to <strong className="text-white">{magicLinkSentTo}</strong>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMagicLinkSentTo(null)}
                        className="mt-3 text-xs text-zinc-400 underline hover:text-white"
                      >
                        Use a different email
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleMagicLinkSubmit(onMagicLinkSubmit)} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400">Email address</label>
                        <input
                          type="email"
                          {...magicLinkRegister('email')}
                          placeholder="name@company.com"
                          className="mt-1.5 h-10 w-full rounded-lg border border-[#27272a] bg-[#0c0c0e] px-3 text-xs text-white outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                        />
                        {magicLinkErrors.email && (
                          <p className="mt-1 text-xs text-rose-400">{magicLinkErrors.email.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isMagicLinkSubmitting}
                        className="w-full h-10 mt-2 rounded-lg bg-[#7c3aed] px-4 text-xs font-semibold text-white shadow-sm shadow-[#7c3aed]/25 transition hover:bg-[#6d28d9] disabled:opacity-50"
                      >
                        {isMagicLinkSubmitting ? 'Sending link...' : 'Send magic link'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Footer link to sign up */}
              <div className="mt-6 text-center text-xs text-zinc-400 pt-4 border-t border-[#27272a]">
                Don’t have an account?{' '}
                <Link to="/signup" className="font-semibold text-white hover:underline">
                  Create an account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
