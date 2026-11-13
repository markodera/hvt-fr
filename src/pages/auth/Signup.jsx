// SPDX-License-Identifier: Apache-2.0
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Github, Check } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

import { listSocialProviders, register as apiRegister } from '@/api/auth';
import {
    AuthCard,
    AuthDivider,
    AuthFieldError,
    AUTH_GHOST_BUTTON_CLASS,
    AUTH_INPUT_CLASS,
    AUTH_PRIMARY_BUTTON_CLASS,
    ButtonSpinner,
} from '@/components/auth/AuthShell';
import { Logo } from '@/components/Logo';
import { setPendingVerificationEmail } from '@/lib/emailVerification';
import { markInvitationResumeAfterAuth } from '@/lib/invitations';
import { getErrorMessage } from '@/lib/utils';
import { SOCIAL_AUTH_PROVIDERS, startSocialSignIn } from '@/lib/socialAuth';
import { DOCS_URL } from '@/lib/appLinks';

const signupSchema = z
    .object({
        first_name: z.string().min(1, 'Enter your first name'),
        last_name: z.string().min(1, 'Enter your last name'),
        email: z.string().email('Enter a valid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirm_password: z.string().min(1, 'Confirm your password'),
    })
    .refine((data) => data.password === data.confirm_password, {
        message: 'Passwords do not match',
        path: ['confirm_password'],
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

export default function Signup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const inviteToken = searchParams.get('invite_token') || '';

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            email: '',
            password: '',
            confirm_password: '',
        },
    });

    useEffect(() => {
        document.title = 'Sign up | HVT';
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

    const handleSocialSignIn = (provider) => {
        const started = startSocialSignIn(provider, providers);
        if (!started) {
            toast.error(`${provider === SOCIAL_AUTH_PROVIDERS.GOOGLE ? 'Google' : 'GitHub'} sign-in is not available yet.`);
        }
    };

    const onSubmit = async (values) => {
        try {
            await apiRegister({
                email: values.email,
                password1: values.password,
                password2: values.confirm_password,
                first_name: values.first_name.trim(),
                last_name: values.last_name.trim(),
            });
            setPendingVerificationEmail(values.email);
            toast.success('Verification email sent.');
            navigate('/verify-email', {
                replace: true,
                state: {
                    email: values.email,
                    inviteToken,
                },
            });
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center px-4 py-12 sm:px-6">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <Logo href="/" />
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[460px]">
                <AuthCard className="p-6 sm:p-8">
                    <div className="text-center pb-5 border-b border-[#27272a]">
                        <h1 className="text-xl font-bold tracking-tight text-white">Create your HVT account</h1>
                        <p className="mt-1 text-xs text-zinc-400">
                          Set up your account to start managing multi-tenant projects.
                        </p>
                    </div>

                    {/* Social Buttons */}
                    <div className="mt-5 space-y-2.5">
                        <button
                            type="button"
                            onClick={() => handleSocialSignIn(SOCIAL_AUTH_PROVIDERS.GOOGLE)}
                            disabled={socialProvidersQuery.isLoading}
                            className={AUTH_GHOST_BUTTON_CLASS}
                        >
                            <GoogleIcon />
                            <span>Continue with Google</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSocialSignIn(SOCIAL_AUTH_PROVIDERS.GITHUB)}
                            disabled={socialProvidersQuery.isLoading}
                            className={AUTH_GHOST_BUTTON_CLASS}
                        >
                            <Github className="h-4 w-4" />
                            <span>Continue with GitHub</span>
                        </button>
                    </div>

                    <div className="my-5">
                        <AuthDivider label="or continue with email" />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label htmlFor="signup-first-name" className="block text-xs font-semibold text-zinc-400">
                                    First name
                                </label>
                                <input
                                    id="signup-first-name"
                                    type="text"
                                    autoComplete="given-name"
                                    className={`${AUTH_INPUT_CLASS} mt-1`}
                                    placeholder="Jane"
                                    {...register('first_name')}
                                />
                                <AuthFieldError>{errors.first_name?.message}</AuthFieldError>
                            </div>

                            <div>
                                <label htmlFor="signup-last-name" className="block text-xs font-semibold text-zinc-400">
                                    Last name
                                </label>
                                <input
                                    id="signup-last-name"
                                    type="text"
                                    autoComplete="family-name"
                                    className={`${AUTH_INPUT_CLASS} mt-1`}
                                    placeholder="Builder"
                                    {...register('last_name')}
                                />
                                <AuthFieldError>{errors.last_name?.message}</AuthFieldError>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="signup-email" className="block text-xs font-semibold text-zinc-400">
                                Email address
                            </label>
                            <input
                                id="signup-email"
                                type="email"
                                autoComplete="email"
                                className={`${AUTH_INPUT_CLASS} mt-1`}
                                placeholder="you@company.com"
                                {...register('email')}
                            />
                            <AuthFieldError>{errors.email?.message}</AuthFieldError>
                        </div>

                        <div>
                            <label htmlFor="signup-password" className="block text-xs font-semibold text-zinc-400">
                                Password
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    className={`${AUTH_INPUT_CLASS} pr-10`}
                                    placeholder="At least 8 characters"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-300"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <AuthFieldError>{errors.password?.message}</AuthFieldError>
                        </div>

                        <div>
                            <label htmlFor="signup-password-confirm" className="block text-xs font-semibold text-zinc-400">
                                Confirm password
                            </label>
                            <input
                                id="signup-password-confirm"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                className={`${AUTH_INPUT_CLASS} mt-1`}
                                placeholder="Repeat your password"
                                {...register('confirm_password')}
                            />
                            <AuthFieldError>{errors.confirm_password?.message}</AuthFieldError>
                        </div>

                        <button type="submit" disabled={isSubmitting} className={`${AUTH_PRIMARY_BUTTON_CLASS} mt-2`}>
                            {isSubmitting ? (
                                <>
                                    <ButtonSpinner />
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <span>Create account</span>
                            )}
                        </button>
                    </form>

                    <p className="mt-4 text-center text-[11px] leading-5 text-zinc-500">
                        By continuing you agree to the{' '}
                        <Link to="/terms-of-service" className="text-zinc-400 hover:text-white underline">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy-policy" className="text-zinc-400 hover:text-white underline">
                            Privacy Policy
                        </Link>
                        .
                    </p>

                    <p className="mt-4 text-center text-xs text-zinc-400 pt-4 border-t border-[#27272a]">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-white hover:underline">
                            Sign in
                        </Link>
                    </p>
                </AuthCard>
            </div>
        </div>
    );
}
