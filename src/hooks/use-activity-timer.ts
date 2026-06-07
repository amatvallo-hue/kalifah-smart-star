import { useRef, useCallback } from "react";

/** Rekod masa pelajar habiskan dalam satu aktiviti. Pulangkan masa berlalu dalam saat. */
export function useActivityTimer() {
  const startRef = useRef<number>(Date.now());

  const elapsed = useCallback(() => {
    return Math.max(0, Math.round((Date.now() - startRef.current) / 1000));
  }, []);

  const reset = useCallback(() => {
    startRef.current = Date.now();
  }, []);

  return { elapsed, reset };
}
