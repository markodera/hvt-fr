import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { createOrg } from '@/api/organizations';
import { createOrgSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';

export function CreateOrganizationPage() {
    const navigate = useNavigate();
    const { user, refreshSession } = useAuth();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(createOrgSchema),
        defaultValues: {
            name: '',
            slug: '',
            allow_signup: false,
        },
    });

    const mutation = useMutation({
        mutationFn: createOrg,
        onSuccess: async () => {
            await refreshSession();
            toast.success('Organisation created');
            navigate('/dashboard', { replace: true });
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    if (user?.organization) {
        return <Navigate to="/dashboard" replace />;
    }

    const allowSignup = watch('allow_signup');

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-text-primary">Create Organisation</h2>
            </div>

            <p className="text-sm text-text-secondary mb-6">
                You need an organisation to continue. Create one to access your dashboard.
            </p>

            <form
                onSubmit={handleSubmit((data) => mutation.mutate(data))}
                className="space-y-5"
            >
                <div className="space-y-2">
                    <Label htmlFor="org-name">Organisation name</Label>
                    <Input
                        id="org-name"
                        placeholder="Acme Inc"
                        {...register('name')}
                    />
                    {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="org-slug">Slug</Label>
                    <Input
                        id="org-slug"
                        placeholder="acme"
                        {...register('slug')}
                    />
                    {errors.slug && <p className="text-xs text-danger">{errors.slug.message}</p>}
                </div>

                <div className="flex items-center justify-between py-3 border-t border-border">
                    <div>
                        <p className="text-sm font-medium text-text-primary">Allow public sign-up</p>
                        <p className="text-xs text-text-secondary">
                            Let anyone create an account in this organisation.
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={allowSignup}
                        onClick={() => setValue('allow_signup', !allowSignup, { shouldDirty: true })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            allowSignup ? 'bg-primary' : 'bg-bg-tertiary border border-border'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                                allowSignup ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                    {mutation.isPending ? 'Creating…' : 'Create organisation'}
                </Button>
            </form>
        </div>
    );
}
