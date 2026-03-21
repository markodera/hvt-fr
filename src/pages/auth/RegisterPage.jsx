import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Github } from 'lucide-react';
import { register as apiRegister } from '@/api/auth';
import { registerSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getErrorMessage } from '@/lib/utils';

export function RegisterPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            first_name: '',
            last_name: '',
            password1: '',
            password2: '',
        },
    });

    const onSubmit = async (data) => {
        try {
            await apiRegister(data);
            navigate('/auth/verify-email-notice', { state: { email: data.email } });
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

    const handleGoogleLogin = () => {
        if (!googleClientId) {
            toast.error('Google login is not configured');
            return;
        }
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
    };

    const handleGithubLogin = () => {
        if (!githubClientId) {
            toast.error('GitHub login is not configured');
            return;
        }
        const redirectUri = `${window.location.origin}/auth/github/callback`;
        window.location.href = `https://github.com/login/oauth/authorize?client_id=${githubClientId}&redirect_uri=${redirectUri}&scope=user:email`;
    };

    return (
        <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-text-primary">Create an account</h2>
                <p className="text-sm text-text-secondary mt-1">Get started with HVT</p>
            </div>

            {/* Social login */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleGoogleLogin}
                    type="button"
                >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                </Button>
                <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleGithubLogin}
                    type="button"
                >
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                </Button>
            </div>

            <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-bg-secondary px-3 text-xs text-text-muted">
                    or continue with email
                </span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">First name</Label>
                        <Input
                            id="first_name"
                            placeholder="John"
                            {...register('first_name')}
                        />
                        {errors.first_name && (
                            <p className="text-xs text-danger">{errors.first_name.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="last_name">Last name</Label>
                        <Input
                            id="last_name"
                            placeholder="Doe"
                            {...register('last_name')}
                        />
                        {errors.last_name && (
                            <p className="text-xs text-danger">{errors.last_name.message}</p>
                        )}
                    </div>
                </div>

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

                <div className="space-y-2">
                    <Label htmlFor="password1">Password</Label>
                    <div className="relative">
                        <Input
                            id="password1"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 8 characters"
                            {...register('password1')}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password1 && (
                        <p className="text-xs text-danger">{errors.password1.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password2">Confirm password</Label>
                    <Input
                        id="password2"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        {...register('password2')}
                    />
                    {errors.password2 && (
                        <p className="text-xs text-danger">{errors.password2.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </Button>
            </form>

            <p className="text-sm text-text-secondary text-center mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
