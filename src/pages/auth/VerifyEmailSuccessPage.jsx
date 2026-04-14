import { AuthLayout } from '@/layouts/AuthLayout';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

import { AuthCard, AUTH_PRIMARY_BUTTON_CLASS } from '@/components/auth/AuthShell';
import { Logo } from '@/components/Logo';
import { isRuntimeAuthSearch } from '@/lib/runtimeAuth';

export function VerifyEmailSuccessPage() {
    const [searchParams] = useSearchParams();
    const runtimeMode = isRuntimeAuthSearch(searchParams);
    const destination = runtimeMode ? '/runtime-playground' : '/dashboard';

    return (
        <AuthLayout>
            <AuthCard>
                <div className="space-y-6 text-center">
                    <Logo align="center" className="mx-auto" />
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#14532d] bg-[#052e16] text-[#4ade80]">
                        <CheckCircle2 className="h-7 w-7" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-[-0.03em] text-white">Email verified</h1>
                        <p className="text-sm leading-6 text-[#a1a1aa]">
                            {runtimeMode
                                ? 'Your app account is active. You can return to sign-in.'
                                : 'Your account is active. You&apos;re ready to go.'}
                        </p>
                    </div>
                    <Link to={destination} className={AUTH_PRIMARY_BUTTON_CLASS}>
                        {runtimeMode ? 'Open runtime playground' : 'Go to dashboard'}
                    </Link>
                </div>
            </AuthCard>
        </AuthLayout>
    );
}
