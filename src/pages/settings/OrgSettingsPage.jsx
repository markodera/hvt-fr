import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';
import { getCurrentOrg, updateOrg } from '@/api/organizations';
import { orgSettingsSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getErrorMessage } from '@/lib/utils';

export function OrgSettingsPage() {
    const queryClient = useQueryClient();

    const { data: org, isLoading } = useQuery({
        queryKey: ['organization'],
        queryFn: getCurrentOrg,
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isSubmitting, isDirty },
    } = useForm({
        resolver: zodResolver(orgSettingsSchema),
        values: org ? { name: org.name, slug: org.slug, allow_signup: org.allow_signup } : undefined,
    });

    const mutation = useMutation({
        mutationFn: (data) => updateOrg(org.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organization'] });
            toast.success('Settings updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    if (isLoading) {
        return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
    }

    const allowSignup = watch('allow_signup');

    return (
        <div className="max-w-2xl space-y-6">
            <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-bold text-text-primary">Organisation Settings</h2>
                </div>

                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="org-name">Organisation name</Label>
                        <Input id="org-name" {...register('name')} />
                        {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="org-slug">Slug</Label>
                        <Input id="org-slug" {...register('slug')} />
                        {errors.slug && <p className="text-xs text-danger">{errors.slug.message}</p>}
                        <p className="text-xs text-text-muted">Used in URLs. Lowercase letters, numbers, and hyphens only.</p>
                    </div>

                    <div className="flex items-center justify-between py-3 border-t border-border">
                        <div>
                            <p className="text-sm font-medium text-text-primary">Allow public sign-up</p>
                            <p className="text-xs text-text-secondary">Let anyone create an account in this organisation.</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={allowSignup}
                            onClick={() => setValue('allow_signup', !allowSignup, { shouldDirty: true })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowSignup ? 'bg-primary' : 'bg-bg-tertiary border border-border'
                                }`}
                        >
                            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${allowSignup ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                        </button>
                    </div>

                    <Button type="submit" disabled={!isDirty || mutation.isPending}>
                        {mutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
