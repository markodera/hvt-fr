import { Link, useLocation } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VerifyEmailNoticePage() {
    const location = useLocation();
    const email = location.state?.email || 'your email';

    return (
        <div className="text-center py-6">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-8 w-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-extrabold text-text-primary mb-3">
                Check your inbox
            </h2>
            
            <p className="text-text-secondary mb-8 leading-relaxed px-4">
                We've sent a verification link to <span className="font-semibold text-text-primary">{email}</span>. 
                Please click the link to verify your account and complete registration.
            </p>

            <div className="space-y-4">
                <Button className="w-full font-semibold group" asChild>
                    <Link to="/login">
                        Go to login <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
                
                <p className="text-xs text-text-muted mt-6">
                    Didn't receive the email? Check your spam folder or contact support.
                </p>
            </div>
        </div>
    );
}
