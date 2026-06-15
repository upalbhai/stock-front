"use client";

import { useEffect, useRef } from "react";

/**
 * A hook to listen for physical barcode scanner input globally.
 * Physical scanners act as keyboards that type very quickly and press Enter.
 */
export function useGlobalBarcodeScanner(onScan: (barcode: string) => void, enabled: boolean = true) {
  const buffer = useRef("");
  const lastKeyTime = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is using modifiers (like Ctrl+C, etc)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime.current;

      // Reset buffer if time between keystrokes is too long (> 50ms)
      // Hardware scanners typically type at 10-30ms per character.
      if (timeDiff > 50) {
        buffer.current = "";
      }

      if (e.key === "Enter") {
        if (buffer.current.length >= 4) {
          // It's a scanned barcode!
          e.preventDefault();
          e.stopPropagation();
          const scannedCode = buffer.current;
          buffer.current = "";
          
          // Small delay to let any active React states settle before triggering scan
          setTimeout(() => onScan(scannedCode), 0);
        } else {
          buffer.current = "";
        }
      } else if (e.key.length === 1) {
        buffer.current += e.key;
        lastKeyTime.current = currentTime;

        // If we are actively receiving a fast stream of characters, 
        // prevent them from being typed into random active inputs (like quantity fields)
        if (buffer.current.length > 1 && timeDiff <= 50) {
          // We only prevent default for the subsequent characters. The 1st character might sneak in,
          // but preventing subsequent ones stops the active input from being fully mangled.
          if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    // Use capture phase so we intercept the scanner before other elements process the keys
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onScan, enabled]);
}
