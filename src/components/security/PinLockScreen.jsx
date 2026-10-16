import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Scan } from 'lucide-react';
import { usePinLock } from '@/lib/PinLockContext';
import { cn } from '@/lib/utils';

const DIGITS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function PinLockScreen() {
  const { pin, unlock, biometricEnabled, biometricSupported } = usePinLock();
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (d) => {
    if (d === '⌫') {
      setEntered(p => p.slice(0, -1));
      return;
    }
    if (!d) return;
    const next = entered + d;
    setEntered(next);
    if (next.length === pin.length) {
      if (next === pin) {
        unlock();
      } else {
        setError(true);
        setTimeout(() => { setEntered(''); setError(false); }, 600);
      }
    }
  };

  const handleBiometric = async () => {
    try {
      // Use WebAuthn for biometric prompt
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        }
      });
      if (credential) unlock();
    } catch {
      // Fallback: try credential API
      try {
        const cred = await navigator.credentials.get({ password: true });
        if (cred) unlock();
      } catch {
        // Biometric not available, user must use PIN
      }
    }
  };

  const dots = Array.from({ length: pin?.length || 4 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-8"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-10 text-center"
      >
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Scan className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground">BethVerse</h1>
        <p className="text-sm text-muted-foreground mt-1">Enter your PIN to continue</p>
      </motion.div>

      {/* Dots */}
      <div className="flex gap-4 mb-10">
        {dots.map((_, i) => (
          <motion.div
            key={i}
            animate={error ? { x: [0, -6, 6, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
            className={cn(
              'w-4 h-4 rounded-full border-2 transition-all duration-150',
              i < entered.length
                ? error ? 'bg-destructive border-destructive' : 'bg-primary border-primary'
                : 'bg-transparent border-muted-foreground/40'
            )}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {DIGITS.map((d, i) => (
          <button
            key={i}
            onClick={() => handleDigit(d)}
            disabled={!d && d !== '0'}
            className={cn(
              'h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95',
              d === '⌫' ? 'bg-muted text-foreground' :
              d ? 'bg-card border border-border/50 shadow-sm text-foreground hover:bg-muted/50' :
              'invisible'
            )}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Biometric */}
      {biometricEnabled && biometricSupported && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={handleBiometric}
          className="mt-8 flex flex-col items-center gap-2 text-primary"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Fingerprint className="w-7 h-7 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">Use Biometrics</span>
        </motion.button>
      )}
    </motion.div>
  );
}