import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { createOrg } from '@/api/organizations';
import { createOrgSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/lib/utils';

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? 'bg-[#7c3aed]' : 'border border-[#27272a] bg-[#111111]'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    checked ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
        </button>
    );
}

export function CreateOrganizationPage() {
    const navigate = useNavigate();
    const { user, waitForSession } = useAuth();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
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
            await waitForSession({ attempts: 5, delayMs: 400 });
            toast.success('Organization created');
            navigate('/dashboard', { replace: true });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    if (user?.organization) {
        return <Navigate to="/dashboard" replace />;
    }

    const allowSignup = watch('allow_signup');

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <section className="rounded-3xl border border-[#27272a] bg-[#18181b] p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/25 bg-[#7c3aed]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">
                            <Building2 className="h-3.5 w-3.5" />
                            First-time setup
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-[-0.04em] text-white">Create your organization</h2>
                            <p className="max-w-xl text-sm leading-7 text-[#a1a1aa]">
                                Your HVT account is ready. The next step is creating the organization that will own your
                                projects, API keys, invitations, and dashboard settings.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#27272a] bg-[#111111] px-4 py-4 text-sm text-[#a1a1aa] lg:w-[280px]">
                        <p className="font-semibold text-white">What happens next</p>
                        <ol className="mt-3 space-y-2 leading-6">
                            <li>1. You become the organization owner.</li>
                            <li>2. HVT creates your default project automatically.</li>
                            <li>3. You can issue keys and configure runtime auth.</li>
                        </ol>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-[#27272a] bg-[#18181b] p-6 md:p-8">
                <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]" htmlFor="org-name">
                                Organization name
                            </Label>
                            <Input
                                id="org-name"
                                placeholder="Acme Inc"
                                {...register('name')}
                                className="h-11 border-[#27272a] bg-[#111111] text-white"
                            />
                            {errors.name ? <p className="text-xs text-rose-300">{errors.name.message}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]" htmlFor="org-slug">
                                Slug
                            </Label>
                            <Input
                                id="org-slug"
                                placeholder="acme"
                                {...register('slug')}
                                className="h-11 border-[#27272a] bg-[#111111] text-white"
                            />
                            {errors.slug ? <p className="text-xs text-rose-300">{errors.slug.message}</p> : null}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-[#27272a] bg-[#111111] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-white">Allow public sign-up</p>
                            <p className="text-xs leading-6 text-[#71717a]">
                                Turn this on if you want the default project to accept runtime registrations immediately.
                            </p>
                        </div>
                        <Toggle
                            checked={allowSignup}
                            onChange={() => setValue('allow_signup', !allowSignup, { shouldDirty: true })}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="h-11 min-w-[190px] bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                        >
                            {mutation.isPending ? 'Creating organization...' : 'Create organization'}
                            {!mutation.isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
