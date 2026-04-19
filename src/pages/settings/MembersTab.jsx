import { useQuery } from '@tanstack/react-query';
import { listUsers } from '@/api/users';
import { OrganizationInvitationsSection } from '@/pages/users/OrganizationInvitationsSection';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { User, MoreHorizontal, Shield, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getUserDisplayName, getUserInitials } from '@/lib/userIdentity';

export function MembersTab() {
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: listUsers,
    });

    const users = usersData?.results ?? usersData ?? [];

    return (
        <div className="space-y-8">
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">Team Members</h3>
                    <Button className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
                        <Mail className="w-4 h-4 mr-2" />
                        Invite Member
                    </Button>
                </div>
                
                <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
                    {usersLoading ? (
                        <div className="p-8 flex justify-center"><LoadingSpinner /></div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-[#a1a1aa] text-sm">No members found.</div>
                    ) : (
                        <div className="divide-y divide-[#27272a]">
                            {users.map((user) => (
                                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-[#27272a]/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center text-white font-medium">
                                            {getUserInitials(user, '') || <User className="w-5 h-5 text-[#a1a1aa]" />}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-white flex items-center gap-2">
                                                {getUserDisplayName(user)}
                                                {user.role === 'owner' && (
                                                    <Badge variant="outline" className="bg-[#7c3aed]/10 text-[#7c3aed] border-[#7c3aed]/20 text-xs">
                                                        <Shield className="w-3 h-3 mr-1" />
                                                        Owner
                                                    </Badge>
                                                )}
                                                {user.role === 'admin' && (
                                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs">
                                                        Admin
                                                    </Badge>
                                                )}
                                                {user.role === 'member' && (
                                                    <Badge variant="outline" className="bg-[#27272a] text-[#a1a1aa] border-transparent text-xs">
                                                        Member
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-xs text-[#a1a1aa] mt-0.5">{user.email}</div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-[#a1a1aa] hover:text-white hover:bg-[#27272a]">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section>
                <div className="bg-[#111111] rounded-xl border border-[#27272a] overflow-hidden">
                    <OrganizationInvitationsSection />
                </div>
            </section>
        </div>
    );
}
