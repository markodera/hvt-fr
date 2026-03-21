import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { confirmPasswordReset } from '@/api/auth';
import { resetPasswordSchema } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getErrorMessage } from '@/lib/utils';

export function ResetPasswordPage() {
    const { key } = useParams();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { new_password1: '', new_password2: '' },
    });

    const onSubmit = async (data) => {
        try {
            // Need to pass the combined headless key rather than split tokens
            await confirmPasswordReset(key, data);
            toast.success('Password reset! You can now sign in.');
            navigate('/login');
        } catch (err) {
            toast.error(getErrorMessage(err));
        }
    };

    return (
        <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-text-primary">Reset password</h2>
                <p className="text-sm text-text-secondary mt-1">Enter your new password</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="new_password1">New password</Label>
                    <Input
                        id="new_password1"
                        type="password"
                        placeholder="Min. 8 characters"
                        {...register('new_password1')}
                    />
                    {errors.new_password1 && (
                        <p className="text-xs text-danger">{errors.new_password1.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="new_password2">Confirm new password</Label>
                    <Input
                        id="new_password2"
                        type="password"
                        placeholder="Repeat password"
                        {...register('new_password2')}
                    />
                    {errors.new_password2 && (
                        <p className="text-xs text-danger">{errors.new_password2.message}</p>
                    )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Resetting…' : 'Reset password'}
                </Button>
            </form>
        </div>
    );
}
