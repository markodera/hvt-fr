import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, KeyRound, Plus, Trash2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { listPasskeys, registerPasskey, deletePasskey } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export function PasskeySettingsSection() {
  const queryClient = useQueryClient();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['user-passkeys'],
    queryFn: listPasskeys,
  });

  const passkeys = data?.passkeys || [];

  const registerMutation = useMutation({
    mutationFn: (name) => registerPasskey({ name: name || 'Passkey' }),
    onSuccess: (res) => {
      toast.success(res?.detail || 'Passkey registered successfully.');
      queryClient.invalidateQueries({ queryKey: ['user-passkeys'] });
      setIsRegisterOpen(false);
      setPasskeyName('');
    },
    onError: (err) => {
      const msg = err?.message || '';
      if (err?.name === 'InvalidStateError' || msg.includes('already registered')) {
        toast.info('This device or security key is already registered to your account.');
        queryClient.invalidateQueries({ queryKey: ['user-passkeys'] });
        setIsRegisterOpen(false);
        setPasskeyName('');
      } else if (err?.name === 'NotAllowedError' || msg.includes('not allowed') || msg.includes('timed out')) {
        toast.error('Passkey registration was canceled or timed out.');
      } else {
        toast.error(err?.message || 'Failed to register passkey.');
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deletePasskey(id),
    onSuccess: () => {
      toast.success('Passkey removed.');
      queryClient.invalidateQueries({ queryKey: ['user-passkeys'] });
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to delete passkey.');
    },
  });

  const handleStartRegister = () => {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      toast.error('WebAuthn Passkeys are not supported in this browser.');
      return;
    }
    setPasskeyName('');
    setIsRegisterOpen(true);
  };

  const handleConfirmRegister = (e) => {
    e.preventDefault();
    registerMutation.mutate(passkeyName.trim());
  };

  return (
    <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-[#a855f7]" />
            <h3 className="text-base font-semibold text-white">Passkeys (WebAuthn / Biometrics)</h3>
          </div>
          <p className="mt-1 text-sm text-[#a1a1aa]">
            Sign in securely using Touch ID, Face ID, Windows Hello, or hardware security keys without typing passwords.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleStartRegister}
          className="bg-[#7c3aed] text-white hover:bg-[#6d28d9] flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Passkey
        </Button>
      </div>

      <div className="mt-6 border-t border-[#27272a] pt-4">
        {isLoading ? (
          <div className="py-4 text-sm text-[#71717a]">Loading registered passkeys...</div>
        ) : passkeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#27272a]/60 text-[#71717a]">
              <KeyRound className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-[#d4d4d8]">No passkeys registered</p>
            <p className="mt-1 text-xs text-[#71717a]">
              Add a biometric device or security key for fast, phishing-resistant logins.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#27272a]">
            {passkeys.map((cred) => (
              <div key={cred.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#27272a] text-[#a855f7]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{cred.name || 'Passkey'}</p>
                    <p className="text-xs text-[#71717a]">
                      Added {new Date(cred.created_at).toLocaleDateString()}
                      {cred.last_used_at ? ` • Last used ${new Date(cred.last_used_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingId(cred.id)}
                  className="text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#f87171]"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Passkey Modal */}
      <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
        <DialogContent className="border-[#27272a] bg-[#18181b] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Passkey</DialogTitle>
            <DialogDescription className="text-[#a1a1aa]">
              Give your passkey a recognizable name, then follow your browser's prompt to verify your biometric sensor or security key.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passkey-name" className="text-sm text-[#d4d4d8]">
                Passkey Label
              </Label>
              <Input
                id="passkey-name"
                placeholder="e.g. MacBook Touch ID, iPhone, YubiKey"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                className="border-[#27272a] bg-[#09090b] text-white placeholder:text-[#52525b]"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsRegisterOpen(false)}
                className="border-[#27272a] bg-transparent text-[#a1a1aa] hover:bg-[#27272a]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={registerMutation.isPending}
                className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              >
                {registerMutation.isPending ? 'Verifying with Sensor...' : 'Continue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Remove Passkey"
        description="Are you sure you want to remove this passkey? You will no longer be able to sign in using this device credential."
        confirmText="Remove Passkey"
        variant="destructive"
        onConfirm={() => deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
