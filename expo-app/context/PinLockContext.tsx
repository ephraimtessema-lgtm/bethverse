import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { storage } from '@/lib/storage';
import { isPinLockSuppressed } from '@/lib/pinLockGuard';

type PinLockContextValue = {
  pin: string | null;
  isLocked: boolean;
  biometricEnabled: boolean;
  lockOnLaunch: boolean;
  ready: boolean;
  savePin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
  unlock: () => void;
  setBiometric: (v: boolean) => Promise<void>;
  setLockOnLaunch: (v: boolean) => Promise<void>;
};

const PinLockContext = createContext<PinLockContextValue | null>(null);

export function PinLockProvider({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [lockOnLaunch, setLockOnLaunchState] = useState(true);
  const [ready, setReady] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      const storedPin = await storage.getPin();
      const bio = await storage.getBiometric();
      const lockLaunch = await storage.getLockOnLaunch();
      setPin(storedPin);
      setBiometricEnabled(bio);
      setLockOnLaunchState(lockLaunch);
      setIsLocked(!!storedPin && lockLaunch);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!pin) return;

    let lockTimer: ReturnType<typeof setTimeout> | null = null;

    const onChange = (next: AppStateStatus) => {
      const prev = appState.current;
      appState.current = next;

      if (lockTimer) {
        clearTimeout(lockTimer);
        lockTimer = null;
      }

      // Delay lock so camera/gallery pickers can return without flashing PIN screen.
      if (prev === 'active' && next === 'background' && !isPinLockSuppressed()) {
        lockTimer = setTimeout(() => {
          if (AppState.currentState !== 'active' && !isPinLockSuppressed()) {
            setIsLocked(true);
          }
        }, 800);
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => {
      if (lockTimer) clearTimeout(lockTimer);
      sub.remove();
    };
  }, [pin]);

  const savePin = useCallback(async (p: string) => {
    await storage.setPin(p);
    setPin(p);
    setIsLocked(false);
  }, []);

  const removePin = useCallback(async () => {
    await storage.setPin(null);
    await storage.setBiometric(false);
    setPin(null);
    setBiometricEnabled(false);
    setIsLocked(false);
  }, []);

  const unlock = useCallback(() => setIsLocked(false), []);

  const setBiometric = useCallback(async (v: boolean) => {
    await storage.setBiometric(v);
    setBiometricEnabled(v);
  }, []);

  const setLockOnLaunch = useCallback(async (v: boolean) => {
    await storage.setLockOnLaunch(v);
    setLockOnLaunchState(v);
  }, []);

  return (
    <PinLockContext.Provider
      value={{
        pin,
        isLocked,
        biometricEnabled,
        lockOnLaunch,
        ready,
        savePin,
        removePin,
        unlock,
        setBiometric,
        setLockOnLaunch,
      }}
    >
      {children}
    </PinLockContext.Provider>
  );
}

export function usePinLock() {
  const ctx = useContext(PinLockContext);
  if (!ctx) throw new Error('usePinLock outside provider');
  return ctx;
}
