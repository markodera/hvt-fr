import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

import { verifyMagicLink } from '@/api/auth';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { hvt } from '@/lib/hvt';
import {
  consumeInvitationResumeToken,
  buildInvitationAcceptPath,
} from '@/lib/invitations';

export default function MagicLinkVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { waitForSession } = useAuth();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    if (!token) {
      setStatus('error');
      setErrorMessage('Missing magic link token in URL.');
      return;
    }

    async function handleVerify() {
      try {
        const res = await verifyMagicLink({ token });
        if (res?.access) {
          hvt.setAccessToken(res.access);
          localStorage.setItem('hvt_access_token', res.access);
          await waitForSession();
        }
        setStatus('success');
        toast.success('Successfully authenticated!');

        const resumeInvitationToken = consumeInvitationResumeToken();
        setTimeout(() => {
          if (resumeInvitationToken) {
            navigate(buildInvitationAcceptPath(resumeInvitationToken));
          } else {
            navigate('/dashboard');
          }
        }, 1000);
      } catch (err) {
        setStatus('error');
        setErrorMessage(err?.message || 'Magic link is invalid or has expired.');
      }
    }

    handleVerify();
  }, [token, navigate, waitForSession]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 text-white">
      <Helmet>
        <title>Verifying Magic Link | HVT</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="w-full max-w-md rounded-2xl border border-[#27272a] bg-[#111111]/90 p-8 text-center shadow-xl backdrop-blur-md">
        <div className="flex justify-center mb-6">
          <Logo href="/" align="center" />
        </div>

        {status === 'verifying' && (
          <div className="py-8">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#7c3aed]" />
            <h2 className="mt-4 text-xl font-bold text-white">Verifying Magic Link...</h2>
            <p className="mt-2 text-sm text-[#a1a1aa]">Authenticating your session securely.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#22c55e]" />
            <h2 className="mt-4 text-xl font-bold text-white">Authenticated!</h2>
            <p className="mt-2 text-sm text-[#a1a1aa]">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <AlertCircle className="mx-auto h-10 w-10 text-[#ef4444]" />
            <h2 className="mt-4 text-xl font-bold text-white">Authentication Failed</h2>
            <p className="mt-2 text-sm text-[#f87171]">{errorMessage}</p>
            <div className="mt-6">
              <Link to="/login">
                <Button className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
