import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { verifyEmail } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/utils';

export function VerifyEmailPage() {
    const { key } = useParams();
    const [status, setStatus] = useState('loading'); // loading | success | error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!key) {
            setStatus('error');
            setErrorMsg('No verification key found in the URL.');
            return;
        }

        verifyEmail(key)
            .then(() => setStatus('success'))
            .catch((err) => {
                setStatus('error');
                setErrorMsg(getErrorMessage(err));
            });
    }, [key]);

    if (status === 'loading') {
        return (
            <div className="text-center py-8">
                <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-bold text-text-primary">Verifying your email…</h2>
                <p className="text-sm text-text-secondary mt-1">Please wait a moment.</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="text-center py-8">
                <div className="mb-4 inline-flex rounded-full bg-success-muted p-4">
                    <CheckCircle className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-xl font-bold text-text-primary">Email verified!</h2>
                <p className="text-sm text-text-secondary mt-1 mb-6">
                    Your email has been confirmed. You can now sign in.
                </p>
                <Button asChild>
                    <Link to="/login">Sign in</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="text-center py-8">
            <div className="mb-4 inline-flex rounded-full bg-danger-muted p-4">
                <XCircle className="h-10 w-10 text-danger" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">Verification failed</h2>
            <p className="text-sm text-text-secondary mt-1 mb-6">
                {errorMsg || 'This verification link may have expired or already been used.'}
            </p>
            <Button variant="outline" asChild>
                <Link to="/login">Back to sign in</Link>
            </Button>
        </div>
    );
}
