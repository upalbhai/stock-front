"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

function NavigationLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const startProgress = React.useCallback(() => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setLoading(true);
    setProgress(15);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 50) return prev + 15;
        if (prev < 80) return prev + 6;
        if (prev < 95) return prev + 2;
        return prev;
      });
    }, 120);
  }, []);

  const finishProgress = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 250);
  }, []);

  // When pathname or searchParams change, mark transition as finished
  React.useEffect(() => {
    finishProgress();
  }, [pathname, searchParams, finishProgress]);

  // Intercept clicks on local <a> anchor links + programmatic history navigation (router.push/replace)
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignore modified clicks or secondary button clicks
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor || !anchor.href) return;

      // Ignore external tabs, downloads, or external domains
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      try {
        const targetUrl = new URL(anchor.href, window.location.href);
        const currentOrigin = window.location.origin;

        if (targetUrl.origin !== currentOrigin) return;

        // Ignore hash-only jumps on the same page (e.g. #billing)
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return;
        }

        startProgress();
      } catch {
        // Ignore invalid URLs
      }
    };

    // Also intercept programmatic router.push and router.replace
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const url = args[2];
      if (url && typeof url === "string") {
        try {
          const targetUrl = new URL(url, window.location.href);
          if (
            targetUrl.origin === window.location.origin &&
            (targetUrl.pathname !== window.location.pathname ||
              targetUrl.search !== window.location.search)
          ) {
            startProgress();
          }
        } catch {
          // Ignore
        }
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      const url = args[2];
      if (url && typeof url === "string") {
        try {
          const targetUrl = new URL(url, window.location.href);
          if (
            targetUrl.origin === window.location.origin &&
            (targetUrl.pathname !== window.location.pathname ||
              targetUrl.search !== window.location.search)
          ) {
            startProgress();
          }
        } catch {
          // Ignore
        }
      }
      return originalReplaceState.apply(this, args);
    };

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, [startProgress]);

  if (!loading && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-label="Navigation loading"
      className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none h-[2.5px] bg-transparent"
    >
      <div
        className="h-full bg-primary relative transition-all ease-out"
        style={{
          width: `${progress}%`,
          opacity: loading ? 1 : 0,
          transitionDuration: progress === 100 ? "150ms" : "200ms",
        }}
      >
        {/* Glow peg at front edge */}
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-primary shadow-[0_0_12px_var(--primary)] opacity-80" />
      </div>
    </div>
  );
}

export function NavigationLoader() {
  return (
    <React.Suspense fallback={null}>
      <NavigationLoaderInner />
    </React.Suspense>
  );
}
