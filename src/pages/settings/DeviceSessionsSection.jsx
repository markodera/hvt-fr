// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Laptop, Smartphone, Globe, Shield, Trash2, LogOut, Check } from 'lucide-react';
import { toast } from 'sonner';

import { listSessions, revokeSession, revokeAllOtherSessions } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

function getDeviceIcon(name = '', userAgent = '') {
    const text = (name + ' ' + userAgent).toLowerCase();
    if (text.includes('iphone') || text.includes('android') || text.includes('mobile')) {
        return <Smartphone className="h-4 w-4 text-zinc-400" />;
    }
    if (text.includes('mac') || text.includes('windows') || text.includes('linux')) {
        return <Laptop className="h-4 w-4 text-zinc-400" />;
    }
    return <Globe className="h-4 w-4 text-zinc-400" />;
}

export function DeviceSessionsSection() {
    const queryClient = useQueryClient();
    const { user, logout } = useAuth();
    const [revokingId, setRevokingId] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { data: sessions = [], isLoading } = useQuery({
        queryKey: ['active-sessions'],
        queryFn: listSessions,
        refetchInterval: 30000,
    });

    const revokeMutation = useMutation({
        mutationFn: (sessionId) => revokeSession(sessionId),
        onMutate: (sessionId) => setRevokingId(sessionId),
        onSuccess: () => {
            queryClient.invalidateQueries(['active-sessions']);
            toast.success('Session revoked successfully');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err) || 'Failed to revoke session');
        },
        onSettled: () => setRevokingId(null),
    });

    const revokeAllMutation = useMutation({
        mutationFn: revokeAllOtherSessions,
        onSuccess: (res) => {
            queryClient.invalidateQueries(['active-sessions']);
            toast.success(res?.detail || 'All other sessions revoked successfully.');
        },
        onError: (err) => {
            toast.error(getErrorMessage(err) || 'Failed to revoke other sessions');
        },
    });

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logout();
            window.location.href = '/login';
        } catch (err) {
            toast.error(getErrorMessage(err) || 'Failed to log out');
            setIsLoggingOut(false);
        }
    };

    const sessionList = Array.isArray(sessions) ? sessions : sessions?.results || [];
    const otherSessionsCount = sessionList.filter((s) => !s.is_current).length;

    return (
        <div className="space-y-4">
            {/* Header Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272a]">
                <div>
                    <h3 className="text-sm font-semibold text-white">Active Devices & Sessions</h3>
                    <p className="mt-0.5 text-xs text-[#a1a1aa]">
                        Devices currently signed in to your HVT control-plane account.
                    </p>
                </div>

                {otherSessionsCount > 0 && (
                    <Button
                        type="button"
                        onClick={() => revokeAllMutation.mutate()}
                        disabled={revokeAllMutation.isPending}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:text-white"
                    >
                        <span>{revokeAllMutation.isPending ? 'Revoking...' : `Sign out other devices (${otherSessionsCount})`}</span>
                    </Button>
                )}
            </div>

            {/* Session List */}
            {isLoading ? (
                <div className="p-8 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : sessionList.length === 0 ? (
                /* Fallback for when backend session table has current browser context only */
                <div className="rounded-xl border border-[#27272a] bg-[#111111] p-4 text-xs text-zinc-400">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Laptop className="h-4 w-4 text-zinc-300" />
                            <div>
                                <p className="font-semibold text-white">Current Browser Session</p>
                                <p className="text-[11px] text-[#71717a]">{user?.email}</p>
                            </div>
                        </div>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            Current Device
                        </span>
                    </div>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {sessionList.map((s) => (
                        <div
                            key={s.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#27272a] bg-[#111111] p-4 transition-colors hover:border-[#3f3f46]"
                        >
                            <div className="flex items-start sm:items-center gap-3 min-w-0">
                                <div className="rounded-lg border border-[#27272a] bg-[#18181b] p-2 mt-0.5 sm:mt-0 shrink-0">
                                    {getDeviceIcon(s.device_name, s.user_agent)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate text-xs font-semibold text-white">
                                            {s.device_name || 'Browser Session'}
                                        </p>
                                        {s.is_current && (
                                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 shrink-0">
                                                This Device
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-[#71717a] font-mono">
                                        <span>IP: {s.ip_address || '127.0.0.1'}</span>
                                        <span>•</span>
                                        <span>
                                            Last active:{' '}
                                            {s.last_active_at
                                                ? new Date(s.last_active_at).toLocaleDateString(undefined, {
                                                      month: 'short',
                                                      day: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                  })
                                                : 'Just now'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                {s.is_current ? (
                                    <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                        <span>Active now</span>
                                    </span>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={() => revokeMutation.mutate(s.id)}
                                        disabled={revokingId === s.id}
                                        className="h-8 border border-[#27272a] bg-[#18181b] px-3 text-xs text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                                        <span>{revokingId === s.id ? 'Revoking...' : 'Revoke'}</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Logout on Current Device */}
            <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold text-white">Sign Out</p>
                    <p className="text-[11px] text-[#71717a]">End your active session on this device.</p>
                </div>

                <Button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="h-9 border border-rose-500/40 bg-rose-500/10 px-4 text-xs font-semibold text-rose-300 hover:bg-rose-600 hover:text-white"
                >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    <span>{isLoggingOut ? 'Signing out...' : 'Sign out of HVT'}</span>
                </Button>
            </div>
        </div>
    );
}
