import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { socialAuthGoogle } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getErrorMessage } from '@/lib/utils';

export function GoogleCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            toast.error('No authorization code received');
            navigate('/login');
            return;
        }

        socialAuthGoogle({ code })
            .then(() => {
                toast.success('Signed in with Google!');
                navigate('/dashboard');
            })
            .catch((err) => {
                toast.error(getErrorMessage(err));
                navigate('/login');
            });
    }, [searchParams, navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-text-secondary">Completing Google sign-in…</p>
        </div>
    );
}
