import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePinLock } from '@/lib/PinLockContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

function PinInput({ value, onChange, label, length = 4 }) {
  const handleDigit = (d) => {
    if (d === '⌫') { onChange(value.slice(0, -1)); return; }
    if (!d || value.length >= length) return;
    onChange(value + d);
  };
  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div key={i} className={cn(
            'w-4 h-4 rounded-full border-2 transition-all',
            i < value.length ? 'bg-primary border-primary' : 'border-muted-foreground/40'
          )} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
        {DIGITS.map((d, i) => (
          <button key={i} onClick={() => handleDigit(d)} disabled={!d && d !== '0'}
            className={cn(
              'h-13 py-3 rounded-xl text-lg font-semibold transition-all active:scale-95',
              d === '⌫' ? 'bg-muted text-foreground' :
              d ? 'bg-card border border-border/50 text-foreground hover:bg-muted/50' : 'invisible'
            )}
          >{d}</button>
        ))}
      </div>
    </div>
  );
}

export default function SetPinDialog({ open, onClose, mode = 'set' }) {
  const { savePin, removePin, pin } = usePinLock();
  const [step, setStep] = useState(1); // 1=enter new, 2=confirm, 3=verify old
  const [newPin, setNewPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [oldPin, setOldPin] = useState('');
  const PIN_LENGTH = 4;

  const handleSave = () => {
    if (mode === 'change' && oldPin !== pin) { toast.error('Current PIN is incorrect'); setOldPin(''); return; }
    if (newPin !== confirm) { toast.error('PINs do not match'); setConfirm(''); setStep(1); return; }
    savePin(newPin);
    toast.success(mode === 'set' ? 'PIN set successfully' : 'PIN changed successfully');
    reset(); onClose();
  };

  const reset = () => { setStep(1); setNewPin(''); setConfirm(''); setOldPin(''); };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {mode === 'set' ? 'Set PIN Lock' : mode === 'change' ? 'Change PIN' : 'Disable PIN'}
          </DialogTitle>
        </DialogHeader>

        {mode === 'disable' ? (
          <div className="flex flex-col items-center gap-5 py-4">
            <PinInput value={oldPin} onChange={setOldPin} label="Enter current PIN to disable" length={PIN_LENGTH} />
            <Button onClick={() => { if (oldPin === pin) { removePin(); toast.success('PIN removed'); handleClose(); } else { toast.error('Incorrect PIN'); setOldPin(''); } }}
              disabled={oldPin.length < PIN_LENGTH} className="w-full rounded-full">
              Disable PIN
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {mode === 'change' && step === 1 && (
              <>
                <PinInput value={oldPin} onChange={setOldPin} label="Enter current PIN" length={PIN_LENGTH} />
                <Button onClick={() => { if (oldPin === pin) setStep(2); else { toast.error('Incorrect PIN'); setOldPin(''); }}}
                  disabled={oldPin.length < PIN_LENGTH} className="w-full rounded-full">Next</Button>
              </>
            )}
            {(mode === 'set' || (mode === 'change' && step === 2)) && step !== 3 && (
              <>
                <PinInput value={newPin} onChange={setNewPin} label="Enter new PIN" length={PIN_LENGTH} />
                <Button onClick={() => setStep(step + 1)} disabled={newPin.length < PIN_LENGTH} className="w-full rounded-full">Next</Button>
              </>
            )}
            {((mode === 'set' && step === 2) || (mode === 'change' && step === 3)) && (
              <>
                <PinInput value={confirm} onChange={setConfirm} label="Confirm new PIN" length={PIN_LENGTH} />
                <Button onClick={handleSave} disabled={confirm.length < PIN_LENGTH} className="w-full rounded-full">Save PIN</Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}