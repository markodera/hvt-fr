import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

import { changePassword } from '@/api/auth';
import { changePasswordSchema } from '@/lib/schemas';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

export function SecurityTab() {
    const passwordForm = useForm({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            old_password: '',
            new_password: '',
            confirm_new_password: '',
        },
    });

    const [showPassword, setShowPassword] = useState({
        old: false,
        new: false,
        confirm: false,
    });

    const togglePassword = (field) => {
        setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const passwordMutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            toast.success('Password updated successfully');
            passwordForm.reset();
        },
        onError: (err) => {
            toast.error(getErrorMessage(err));
        },
    });

    const onPasswordSubmit = (data) => {
        passwordMutation.mutate(data);
    };

    const newPasswordWatcher = useWatch({
        control: passwordForm.control,
        name: 'new_password',
    });

    const calculateStrength = (pwd) => {
        if (!pwd) return 0;
        let score = 0;
        if (pwd.length >= 8) score += 1;
        if (/[A-Z]/.test(pwd)) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
        return score;
    };

    const strength = calculateStrength(newPasswordWatcher);

    return (
        <section>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a] mb-6">Password</p>

            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                <div>
                    <Label htmlFor="old_password" className="text-white mb-2 block">Current password</Label>
                    <div className="relative">
                        <Input
                            id="old_password"
                            type={showPassword.old ? 'text' : 'password'}
                            {...passwordForm.register('old_password')}
                            className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => togglePassword('old')}
                            className="absolute right-3 top-2.5 text-[#71717a] hover:text-[#a1a1aa]"
                        >
                            {showPassword.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {passwordForm.formState.errors.old_password && (
                        <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.old_password.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="new_password" className="text-white mb-2 block">New password</Label>
                        <div className="relative">
                            <Input
                                id="new_password"
                                type={showPassword.new ? 'text' : 'password'}
                                {...passwordForm.register('new_password')}
                                className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => togglePassword('new')}
                                className="absolute right-3 top-2.5 text-[#71717a] hover:text-[#a1a1aa]"
                            >
                                {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordForm.formState.errors.new_password && (
                            <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.new_password.message}</p>
                        )}
                        <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={`h-1 flex-1 rounded-full transition-colors ${
                                        i <= strength
                                            ? strength <= 1
                                                ? 'bg-red-500'
                                                : strength === 2
                                                ? 'bg-amber-500'
                                                : 'bg-green-500'
                                            : 'bg-[#27272a]'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="confirm_new_password" className="text-white mb-2 block">Confirm password</Label>
                        <div className="relative">
                            <Input
                                id="confirm_new_password"
                                type={showPassword.confirm ? 'text' : 'password'}
                                {...passwordForm.register('confirm_new_password')}
                                className="bg-[#18181b] border-[#27272a] text-white focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] h-10 w-full pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => togglePassword('confirm')}
                                className="absolute right-3 top-2.5 text-[#71717a] hover:text-[#a1a1aa]"
                            >
                                {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {passwordForm.formState.errors.confirm_new_password && (
                            <p className="text-sm text-red-500 mt-1">{passwordForm.formState.errors.confirm_new_password.message}</p>
                        )}
                    </div>
                </div>

                <div>
                    <Button
                        type="submit"
                        disabled={passwordMutation.isPending}
                        className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 h-10 font-medium"
                    >
                        {passwordMutation.isPending ? 'Updating...' : 'Change password'}
                    </Button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-[#27272a]">
                    <Link to="/forgot-password" target="_blank" className="text-sm text-[#7c3aed] hover:text-[#a78bfa] transition-colors">
                        Forgot your password?
                    </Link>
                </div>
            </form>
        </section>
    );
}