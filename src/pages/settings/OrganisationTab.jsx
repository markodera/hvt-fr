import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getCurrentOrg, updateOrg } from '@/api/organizations';
import { orgSettingsSchema } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export function OrganisationTab() {
    const queryClient = useQueryClient();

    const { data: org, isLoading } = useQuery({
        queryKey: ['organization'],
        queryFn: getCurrentOrg,
    });

    const orgForm = useForm({
        resolver: zodResolver(orgSettingsSchema),
        defaultValues: { name: '', slug: '', allow_signup: false },
    });

    useEffect(() => {
        if (org) {
            orgForm.reset({
                name: org.name || '',
                slug: org.slug || '',
                allow_signup: org.allow_signup || false,
            });
        }
    }, [org, orgForm]);

    const orgMutation = useMutation({
        mutationFn: updateOrg,
        onSuccess: () => {
            queryClient.invalidateQueries(['organization']);
            toast.success('Organisation updated successfully');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    const onOrgSubmit = (data) => {
        if (!org) return;
        orgMutation.mutate({ id: org.id, data });
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><LoadingSpinner /></div>;
    }

    return (
        <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a] mb-6">Organisation</p>

            <form onSubmit={orgForm.handleSubmit(onOrgSubmit)} className="space-y-6">
                <div>
                    <Label htmlFor="name" className="text-white mb-2 block">Organisation name</Label>
                    <Input
                        id="name"
                        {...orgForm.register('name')}
                        className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full max-w-[400px]"
                    />
                    {orgForm.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-1">{orgForm.formState.errors.name.message}</p>
                    )}
                </div>

                <div>
                    <Label htmlFor="slug" className="text-[#a1a1aa] mb-2 block">Slug</Label>
                    <Input
                        id="slug"
                        {...orgForm.register('slug')}
                        disabled
                        className="bg-[#111111] border-[#27272a] text-[#71717a] h-10 w-full max-w-[400px] cursor-not-allowed"
                    />
                    <p className="text-xs text-[#71717a] mt-2">Slug cannot be changed after creation</p>
                </div>

                <div className="flex items-center gap-3 mt-6">
                    <Controller
                        name="allow_signup"
                        control={orgForm.control}
                        render={({ field }) => (
                            <button
                                type="button"
                                role="switch"
                                aria-checked={field.value}
                                onClick={() => field.onChange(!field.value)}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c3aed] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${
                                    field.value ? 'bg-[#7c3aed]' : 'bg-[#18181b] border border-[#27272a]'
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                        field.value ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        )}
                    />
                    <div>
                        <Label className="text-white block">Allow public sign-up</Label>
                        <p className="text-sm text-[#71717a]">Anyone can join your organisation automatically.</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-[#27272a]">
                    <Button
                        type="submit"
                        disabled={orgMutation.isPending}
                        className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 h-10 font-medium"
                    >
                        {orgMutation.isPending ? 'Saving...' : 'Save organisation'}
                    </Button>
                </div>
            </form>
        </section>
    );
}