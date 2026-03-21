import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Shield } from 'lucide-react';
import { getUser, updateUserRole } from '@/api/users';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { RoleGate } from '@/components/RoleGate';
import { formatDate, getErrorMessage } from '@/lib/utils';
import { ROLE_LABELS, ROLE_OPTIONS } from '@/lib/constants';

export function UserDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    const { data: user, isLoading, isError } = useQuery({
        queryKey: ['user', id],
        queryFn: () => getUser(id),
    });

    const roleMutation = useMutation({
        mutationFn: (role) => updateUserRole(id, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', id] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Role updated');
        },
        onError: (err) => toast.error(getErrorMessage(err)),
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (isError || !user) {
        return (
            <div className="text-center py-20">
                <p className="text-text-secondary">User not found.</p>
                <Button variant="outline" onClick={() => navigate('/dashboard/users')} className="mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to users
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back button */}
            <Button variant="ghost" onClick={() => navigate('/dashboard/users')} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
            </Button>

            {/* User profile card */}
            <div className="bg-bg-secondary border border-border rounded-xl p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center text-xl font-bold text-primary">
                            {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-text-primary">{user.full_name}</h2>
                            <p className="text-sm text-text-secondary">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                                    {ROLE_LABELS[user.role]}
                                </Badge>
                                <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-border">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Member since</p>
                        <p className="text-sm text-text-primary">{formatDate(user.created_at, { hour: undefined, minute: undefined })}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Role</p>
                        <p className="text-sm text-text-primary">{user.role_display || ROLE_LABELS[user.role]}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Status</p>
                        <p className="text-sm text-text-primary">{user.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">Test User</p>
                        <p className="text-sm text-text-primary">{user.is_test ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            </div>

            {/* Role management — owner only */}
            <RoleGate allowedRoles={['owner']}>
                {user.id !== currentUser?.id && (
                    <div className="bg-bg-secondary border border-border rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="h-5 w-5 text-primary" />
                            <h3 className="text-base font-semibold text-text-primary">Manage Role</h3>
                        </div>
                        <div className="flex gap-2">
                            {ROLE_OPTIONS.filter((r) => r.value !== 'owner').map((role) => (
                                <Button
                                    key={role.value}
                                    variant={user.role === role.value ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => roleMutation.mutate(role.value)}
                                    disabled={roleMutation.isPending || user.role === role.value}
                                >
                                    {role.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
            </RoleGate>
        </div>
    );
}
