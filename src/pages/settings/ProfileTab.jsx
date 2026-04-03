import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { updateProfile } from '@/api/auth';
import { profileSchema } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/utils';

export function ProfileTab() {
    const { user, refreshSession } = useAuth();

    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
        },
    });

    const profileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            toast.success('Profile updated successfully');
            refreshSession();
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    const onProfileSubmit = (data) => {
        profileMutation.mutate(data);
    };

    return (
        <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a] mb-6">Profile</p>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div>
                    <Label className="text-[#a1a1aa] mb-2 block">Email</Label>
                    <Input
                        value={user?.email || ''}
                        disabled
                        className="bg-[#111111] border-[#27272a] text-[#71717a] h-10 w-full cursor-not-allowed"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="first_name" className="text-white mb-2 block">First name</Label>
                        <Input
                            id="first_name"
                            {...profileForm.register('first_name')}
                            className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full"
                        />
                        {profileForm.formState.errors.first_name && (
                            <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.first_name.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="last_name" className="text-white mb-2 block">Last name</Label>
                        <Input
                            id="last_name"
                            {...profileForm.register('last_name')}
                            className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full"
                        />
                        {profileForm.formState.errors.last_name && (
                            <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.last_name.message}</p>
                        )}
                    </div>
                </div>

                <Button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 h-10 font-medium"
                >
                    {profileMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
            </form>
        </section>
    );
}