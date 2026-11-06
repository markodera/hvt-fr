import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldAlert, KeyRound, CheckCircle2, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getMfaStatus, setupMfa, verifyMfa, disableMfa } from '@/api/auth';

export function MFASettingsSection() {
    const queryClient = useQueryClient();
    const [isSetupOpen, setIsSetupOpen] = useState(false);
    const [isDisableOpen, setIsDisableOpen] = useState(false);
    const [setupData, setSetupData] = useState(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');

    const { data: mfaStatus, isLoading } = useQuery({
        queryKey: ['mfa-status'],
        queryFn: () => getMfaStatus(),
    });

    const setupMutation = useMutation({
        mutationFn: () => setupMfa(),
        onSuccess: (data) => {
            setSetupData(data);
            setIsSetupOpen(true);
            setVerifyCode('');
        },
        onError: (err) => {
            toast.error(err?.message || err?.response?.data?.error || 'Failed to initiate MFA setup.');
        },
    });

    const verifyMutation = useMutation({
        mutationFn: (code) => verifyMfa({ code }),
        onSuccess: (data) => {
            toast.success(data?.detail || 'Two-factor authentication enabled successfully!');
            queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
            setIsSetupOpen(false);
            setSetupData(null);
        },
        onError: (err) => {
            toast.error(err?.message || err?.response?.data?.error || 'Invalid verification code.');
        },
    });

    const disableMutation = useMutation({
        mutationFn: (password) => disableMfa({ password }),
        onSuccess: (data) => {
            toast.success(data?.detail || 'Two-factor authentication disabled.');
            queryClient.invalidateQueries({ queryKey: ['mfa-status'] });
            setIsDisableOpen(false);
            setDisablePassword('');
        },
        onError: (err) => {
            toast.error(err?.message || err?.response?.data?.error || 'Failed to disable MFA. Check password.');
        },
    });

    const isEnabled = Boolean(mfaStatus?.is_mfa_enabled);

    return (
        <section className="rounded-2xl border border-[#27272a] bg-[#18181b] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71717a]">Security</p>
            <div className="mt-3 flex items-start justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Two-Factor Authentication (2FA)</h2>
                    <p className="mt-1 text-sm text-[#a1a1aa]">
                        Protect your control plane account with Time-Based One-Time Passwords (TOTP) from Google Authenticator, 1Password, or Authy.
                    </p>
                </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[#27272a] bg-[#111111] p-4">
                <div className="flex items-center gap-3">
                    {isEnabled ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white">
                                {isEnabled ? 'Two-Factor Authentication is active' : 'Two-Factor Authentication is off'}
                            </p>
                            {isEnabled && (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                                    Protected
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#71717a]">
                            {isEnabled
                                ? 'Authenticator app verification is required when signing in.'
                                : 'Add an extra layer of security to prevent unauthorized access.'}
                        </p>
                    </div>
                </div>

                {isEnabled ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDisableOpen(true)}
                        className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    >
                        Disable 2FA
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={() => setupMutation.mutate()}
                        disabled={setupMutation.isPending || isLoading}
                        className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                    >
                        {setupMutation.isPending ? 'Setting up...' : 'Enable 2FA'}
                    </Button>
                )}
            </div>

            {/* Setup Dialog */}
            <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
                <DialogContent className="border-[#27272a] bg-[#111111] text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-white">
                            <QrCode className="h-5 w-5 text-[#a78bfa]" /> Set up Authenticator App
                        </DialogTitle>
                        <DialogDescription className="text-[#a1a1aa]">
                            Scan the QR code with your authenticator app (Google Authenticator, 1Password, Apple Keychain) or enter the setup key manually.
                        </DialogDescription>
                    </DialogHeader>

                    {setupData && (
                        <div className="space-y-4 py-2">
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#27272a] bg-[#18181b] p-5 text-center">
                                <div className="rounded-xl bg-white p-3 shadow-md">
                                    <QRCodeSVG
                                        value={setupData.otpauth_url || `otpauth://totp/HVT?secret=${setupData.secret}`}
                                        size={180}
                                        level="M"
                                    />
                                </div>
                                <p className="mt-3 text-xs text-[#a1a1aa]">
                                    Point your phone camera or authenticator app scanner at this QR code.
                                </p>
                            </div>

                            <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-4 text-center">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                    Manual Setup Key (Base32)
                                </Label>
                                <p className="mt-2 font-mono text-sm font-bold tracking-widest text-[#a78bfa] select-all">
                                    {setupData.secret}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                                    Enter 6-digit Authenticator Code
                                </Label>
                                <Input
                                    type="text"
                                    maxLength={6}
                                    placeholder="123456"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                                    className="h-11 text-center font-mono text-lg tracking-widest border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed]"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsSetupOpen(false)}
                            className="border-[#27272a] bg-transparent text-white hover:bg-[#18181b]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => verifyMutation.mutate(verifyCode)}
                            disabled={verifyCode.length < 6 || verifyMutation.isPending}
                            className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                        >
                            {verifyMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Disable Dialog */}
            <Dialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
                <DialogContent className="border-[#27272a] bg-[#111111] text-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-white">Disable Two-Factor Authentication</DialogTitle>
                        <DialogDescription className="text-[#a1a1aa]">
                            Enter your current account password to confirm disabling 2FA.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#71717a]">
                            Account Password
                        </Label>
                        <Input
                            type="password"
                            placeholder="Current password"
                            value={disablePassword}
                            onChange={(e) => setDisablePassword(e.target.value)}
                            className="h-10 border-[#27272a] bg-[#18181b] text-white focus:border-[#7c3aed]"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDisableOpen(false)}
                            className="border-[#27272a] bg-transparent text-white hover:bg-[#18181b]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => disableMutation.mutate(disablePassword)}
                            disabled={!disablePassword || disableMutation.isPending}
                            className="border border-rose-500/30 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                        >
                            {disableMutation.isPending ? 'Disabling...' : 'Confirm Disable'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
