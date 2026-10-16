/** Temporarily prevent PIN lock when opening camera/gallery pickers or OCR. */
let suppressUntil = 0;
let ocrSessionActive = false;

export function suppressPinLockFor(ms = 15000) {
  suppressUntil = Date.now() + ms;
}

export function setOcrSessionActive(active: boolean) {
  ocrSessionActive = active;
  if (active) suppressPinLockFor(60000);
}

export function isPinLockSuppressed() {
  return ocrSessionActive || Date.now() < suppressUntil;
}
