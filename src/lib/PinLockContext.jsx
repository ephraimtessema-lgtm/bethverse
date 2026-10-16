import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PinLockContext = createContext(null);

export function PinLockProvider({ children }) {
  const [pin, setPin] = useState(() => localStorage.getItem('bethverse_pin') || null);
  const [isLocked, setIsLocked] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(() => localStorage.getItem('bethverse_biometric') === 'true');

  useEffect(() => {
    // Check if WebAuthn/biometric is supported
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(setBiometricSupported)
        .catch(() => setBiometricSupported(false));
    }
  }, []);

  useEffect(() => {
    if (!pin) return;
    // Lock when page becomes hidden (backgrounded)
    const handleVisibilityChange = () => {
      if (document.hidden) setIsLocked(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pin]);

  const savePin = useCallback((newPin) => {
    localStorage.setItem('bethverse_pin', newPin);
    setPin(newPin);
    setIsLocked(false);
  }, []);

  const removePin = useCallback(() => {
    localStorage.removeItem('bethverse_pin');
    localStorage.removeItem('bethverse_biometric');
    setPin(null);
    setBiometricEnabled(false);
    setIsLocked(false);
  }, []);

  const unlock = useCallback(() => setIsLocked(false), []);

  const toggleBiometric = useCallback((val) => {
    localStorage.setItem('bethverse_biometric', val ? 'true' : 'false');
    setBiometricEnabled(val);
  }, []);

  return (
    <PinLockContext.Provider value={{ pin, isLocked, biometricSupported, biometricEnabled, savePin, removePin, unlock, toggleBiometric }}>
      {children}
    </PinLockContext.Provider>
  );
}

export const usePinLock = () => useContext(PinLockContext);