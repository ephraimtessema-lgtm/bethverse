import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePinLock } from '@/lib/PinLockContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function SetPinModal({ open, onClose, mode = 'set' }) {
  const { savePin, removePin, pin: existingPin, unlock } = usePinLock();
  const [step, setStep] = useState(mode === 'remove' ? 'confirm_old' : (existingPin ? 'confirm_old' : 'new'));
  const [entered, setEntered] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');

  const handleKey = (k) => {
    if (k === '⌫') { setEntered(p => p.slice(0, -1)); setError(''); return; }
    if (k === '' || entered.length >= 6) return;
    const next = entered + k;
    setEntered(next);
    if (next.length >= 4) setTimeout(() => handleSubmit(next), 80);
  };

  const handleSubmit = (pin) => {
    if (step === 'confirm_old') {
      if (unlock(pin)) {
        setEntered('');
        setError('');
        if (mode === 'remove') { removePin(); toast.success('PIN removed'); onClose(); }
        else setStep('new');
      } else {
        setEntered(''); setError('Incorrect PIN');
      }
    } else if (step === 'new') {
      if (pin.length < 4) return;
      setFirstPin(pin); setEntered(''); setStep('confirm');
    } else if (step === 'confirm') {
      if (pin === firstPin) {
        savePin(pin); toast.success('PIN saved'); onClose();
      } else {
        setEntered(''); setError('PINs don\'t match. Try again.'); setStep('new'); setFirstPin('');
      }
    }
  };

  const titles = {
    confirm_old: 'Enter current PIN',
    new: 'Set new PIN',
    confirm: 'Confirm PIN',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs mx-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-center font-heading">{titles[step]}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center gap-4 my-4">
          {[0,1,2,3].map(i => (
            <div key={i} className={cn(
              'w-4 h-4 rounded-full border-2 transition-all',
              i < entered.length ? 'bg-primary border-primary' : 'border-muted-foreground/40'
            )} />
          ))}
        </div>

        {error && <p className="text-xs text-destructive text-center -mt-2 mb-1">{error}</p>}

        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k, i) => (
            <button key={i} onClick={() => handleKey(k)} disabled={k === ''}
              className={cn('h-14 rounded-xl text-lg font-semibold transition-all active:scale-95',
                k === '' ? 'invisible' : 'bg-muted hover:bg-muted/80 text-foreground')}>
              {k}
            </button>
          ))}
        </div>

        <Button variant="ghost" className="w-full mt-2 text-sm text-muted-foreground" onClick={onClose}>Cancel</Button>
      </DialogContent>
    </Dialog>
  );
}