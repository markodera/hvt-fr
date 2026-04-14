import { AuthLayout } from '@/layouts/AuthLayout';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { verifyEmail, verifyRuntimeScopedEmail } from '@/api/auth';
import { AuthCard } from '@/components/auth/AuthShell';
import { Logo } from '@/components/Logo';
import {
    clearPendingVerificationEmail,
    getPendingVerificationEmail,
} from '@/lib/emailVerification';
import { buildRuntimeAuthPath, isRuntimeAuthSearch } from '@/lib/runtimeAuth';
import { getErrorMessage } from '@/lib/utils';

const verificationRequests = new Map();

function verifyEmailOnce(cacheKey, requestFactory) {
    if (!verificationRequests.has(cacheKey)) {
        const request = requestFactory()
            .then(() => ({ ok: true }))
            .catch((error) => ({ ok: false, error }));
        verificationRequests.set(cacheKey, request);
    }

    return verificationRequests.get(cacheKey);
}

export function VerifyEmailPage() {
    const navigate = useNavigate();
    const { key } = useParams();
    const [searchParams] = useSearchParams();
    const runtimeMode = isRuntimeAuthSearch(searchParams);
    const expiredPath = buildRuntimeAuthPath('/verify-email/expired', searchParams);
    const successPath = buildRuntimeAuthPath('/verify-email/success', searchParams);

    useEffect(() => {
        document.title = runtimeMode ? 'Verifying runtime email | HVT' : 'Verifying email | HVT';
    }, [runtimeMode]);

    useEffect(() => {
        let cancelled = false;

        async function finishVerification() {
            if (!key) {
                navigate(expiredPath, {
                    replace: true,
                    state: {
                        email: getPendingVerificationEmail(),
                        message: 'No verification key was provided.',
                    },
                });
                return;
            }

            const result = await verifyEmailOnce(`${runtimeMode ? 'runtime' : 'control'}:${key}`, () =>
                runtimeMode ? verifyRuntimeScopedEmail(key) : verifyEmail(key),
            );
            if (cancelled) {
                return;
            }

            if (result.ok) {
                clearPendingVerificationEmail();
                navigate(successPath, { replace: true });
                return;
            }

            navigate(expiredPath, {
                replace: true,
                state: {
                    email: getPendingVerificationEmail(),
                    message: getErrorMessage(result.error),
                },
            });
        }

        finishVerification();

        return () => {
            cancelled = true;
        };
    }, [expiredPath, key, navigate, runtimeMode, successPath]);

    return (
        <AuthLayout>
            <AuthCard>
                <div className="space-y-6 text-center">
                    <Logo align="center" className="mx-auto" />
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#27272a] bg-[#18181b] text-[#a78bfa]">
                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#7c3aed]" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">Verifying your email</h1>
                        <p className="text-sm leading-6 text-[#a1a1aa]">
                            We&apos;re validating your verification link now.
                        </p>
                    </div>
                </div>
            </AuthCard>
        </AuthLayout>
    );
}
