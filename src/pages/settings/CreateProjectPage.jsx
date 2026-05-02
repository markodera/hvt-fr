import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Boxes } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { createProject } from '@/api/organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePageTitle } from '@/hooks/usePageTitle';
import { createProjectSchema } from '@/lib/schemas';
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

export function CreateProjectPage() {
    usePageTitle('Create Project');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            slug: '',
            allow_signup: true,
            frontend_url: '',
            allowed_origins_text: '',
        },
    });

    const mutation = useMutation({
        mutationFn: createProject,
        onSuccess: (project) => {
            queryClient.setQueryData(
                ['projects', { page_size: 1, source: 'dashboard-layout' }],
                {
                    count: 1,
                    next: null,
                    previous: null,
                    results: [project],
                },
            );
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['apiKeys'] });
            toast.success('Project created');
            navigate(`/dashboard/api-keys?project=${project.id}&create=1`, {
                replace: true,
            });
        },
        onError: (error) => {
            toast.error(getErrorMessage(error));
        },
    });

    const allowSignup = watch('allow_signup');

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <section className="rounded-3xl border border-[#27272a] bg-[#18181b] p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#7c3aed]/25 bg-[#7c3aed]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#c4b5fd]">
                            <Boxes className="h-3.5 w-3.5" />
                            Next step
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-bold tracking-[-0.04em] text-white">Create your first project</h2>
                            <p className="max-w-xl text-sm leading-7 text-[#a1a1aa]">
                                Projects are the app boundary in HVT. Your first project is where runtime sign-up,
                                runtime login, social providers, and API keys will live.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#27272a] bg-[#111111] px-4 py-4 text-sm text-[#a1a1aa] lg:w-[280px]">
                        <p className="font-semibold text-white">What happens next</p>
                        <ol className="mt-3 space-y-2 leading-6">
                            <li>1. This becomes your primary project.</li>
                            <li>2. You issue the first API key for it.</li>
                            <li>3. You can add providers, roles, and app URLs later in Settings.</li>
                        </ol>
                    </div>
                </div>
            </section>

            <section className="rounded-3xl border border-[#27272a] bg-[#18181b] p-6 md:p-8">
                <form
                    onSubmit={handleSubmit((values) =>
                        mutation.mutate({
                            name: values.name,
                            slug: values.slug,
                            allow_signup: values.allow_signup,
                        })
                    )}
                    className="space-y-6"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label
                                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]"
                                htmlFor="project-name"
                            >
                                Project name
                            </Label>
                            <Input
                                id="project-name"
                                placeholder="Storefront"
                                {...register('name')}
                                className="h-11 border-[#27272a] bg-[#111111] text-white"
                            />
                            {errors.name ? <p className="text-xs text-rose-300">{errors.name.message}</p> : null}
                        </div>

                        <div className="space-y-2">
                            <Label
                                className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]"
                                htmlFor="project-slug"
                            >
                                Slug
                            </Label>
                            <Input
                                id="project-slug"
                                placeholder="storefront"
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
                                Leave this on if app users should be able to register immediately through this project.
                            </p>
                        </div>
                        <Toggle
                            checked={allowSignup}
                            onChange={() =>
                                setValue('allow_signup', !allowSignup, { shouldDirty: true })
                            }
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="h-11 min-w-[190px] bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                        >
                            {mutation.isPending ? 'Creating project...' : 'Create project'}
                            {!mutation.isPending ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
