import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { requestPasswordReset } from '@/api/auth';
import { forgotPasswordSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/utils';

export function ForgotPasswordPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isSubmitSuccessful },
    } = useForm({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (data) => {
        try {
            await requestPasswordReset(data);
            toast.success('Reset link sent! Check your email.');
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    if (isSubmitSuccessful) {
        return (
            <div className="text-center">
                <div className="mb-4 rounded-full bg-success-muted p-4 inline-flex">
                    <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-text-primary mb-2">Check your email</h2>
                <p className="text-sm text-text-secondary mb-6">
                    We've sent a password reset link to your email address.
                </p>
                <Button variant="outline" asChild>
                    <Link to="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to sign in
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-text-primary">Forgot password?</h2>
                <p className="text-sm text-text-secondary mt-1">
                    Enter your email and we'll send you a reset link
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        {...register('email')}
                    />
                    {errors.email && (
                        <p className="text-xs text-danger">{errors.email.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending…' : 'Send reset link'}
                </Button>
            </form>

            <p className="text-sm text-text-secondary text-center mt-6">
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Back to sign in
                </Link>
            </p>
        </div>
    );
}
