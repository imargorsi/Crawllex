"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { AUTH_REVEAL_TOTAL_MS } from "@/lib/frontend/auth/auth-reveal-timing";
import { AuthVideoBackground } from "@/components/auth/auth-video-background";
import { authFormCardSurfaceClass, authFormPanelClass } from "@/lib/frontend/layout/auth-chrome";
import { SignInHeroSection } from "@/sections/sign-in-hero-section";
import { cn } from "@/lib/utils";

type AuthRevealContextValue = {
  isRevealing: boolean;
  armAuthReveal: () => void;
  disarmAuthReveal: () => void;
  beginAuthReveal: (path: string) => void;
};

const AuthRevealContext = createContext<AuthRevealContextValue | null>(null);

/** Blocks GuestOnly redirect while login is in-flight or the reveal overlay is active. */
const AuthRevealActiveContext = createContext(false);

function useCanUseDomPortal() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function AuthRevealFormPanel() {
  return (
    <section className={cn(authFormPanelClass, "relative z-10 justify-center px-6 py-10 sm:px-10 lg:px-8 lg:py-12 xl:px-10")}>
      <div className="mx-auto w-full max-w-[26rem]">
        <div className={cn(authFormCardSurfaceClass, "p-7 sm:p-8")}>
          <div className="h-8 w-32 rounded-md bg-border/60" aria-hidden />
          <div className="mt-2 h-4 w-56 max-w-full rounded-md bg-border/40" aria-hidden />
          <div className="mt-8 space-y-5">
            <div className="h-10 rounded-md border border-border bg-bg-main" aria-hidden />
            <div className="h-10 rounded-md border border-border bg-bg-main" aria-hidden />
            <div className="h-10 rounded-md bg-brand/90" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthRevealOverlay() {
  return (
    <div className="auth-reveal-overlay" aria-hidden>
      <div className="auth-reveal-panel auth-reveal-panel--hero">
        <AuthVideoBackground variant="viewport" anchor="start" />
        <SignInHeroSection overlay />
      </div>
      <div className="auth-reveal-panel auth-reveal-panel--form">
        <AuthVideoBackground variant="viewport" anchor="end" />
        <AuthRevealFormPanel />
      </div>
    </div>
  );
}

export function AuthRevealProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const canPortal = useCanUseDomPortal();
  const [isRevealing, setIsRevealing] = useState(false);
  const [isRevealArmed, setIsRevealArmed] = useState(false);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
    };
  }, []);

  const armAuthReveal = useCallback(() => {
    setIsRevealArmed(true);
  }, []);

  const disarmAuthReveal = useCallback(() => {
    setIsRevealArmed(false);
  }, []);

  const beginAuthReveal = useCallback(
    (path: string) => {
      if (!path) return;

      if (endTimerRef.current) clearTimeout(endTimerRef.current);

      setIsRevealArmed(false);

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        router.push(path);
        return;
      }

      flushSync(() => {
        setIsRevealing(true);
      });

      router.push(path);

      endTimerRef.current = setTimeout(() => {
        setIsRevealing(false);
        endTimerRef.current = null;
      }, AUTH_REVEAL_TOTAL_MS);
    },
    [router]
  );

  useEffect(() => {
    if (!isRevealing) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isRevealing]);

  const isRevealActive = isRevealing || isRevealArmed;

  const value = useMemo<AuthRevealContextValue>(
    () => ({
      isRevealing,
      armAuthReveal,
      disarmAuthReveal,
      beginAuthReveal,
    }),
    [armAuthReveal, beginAuthReveal, disarmAuthReveal, isRevealing]
  );

  return (
    <AuthRevealContext.Provider value={value}>
      <AuthRevealActiveContext.Provider value={isRevealActive}>
        {children}
        {canPortal && isRevealing ? createPortal(<AuthRevealOverlay />, document.body) : null}
      </AuthRevealActiveContext.Provider>
    </AuthRevealContext.Provider>
  );
}

export function useAuthReveal() {
  const ctx = useContext(AuthRevealContext);
  if (!ctx) {
    throw new Error("useAuthReveal must be used within AuthRevealProvider");
  }
  return ctx;
}

export function useIsAuthRevealing(): boolean {
  return useContext(AuthRevealContext)?.isRevealing ?? false;
}

/** True while login is in-flight or the post-login reveal animation is running. */
export function useIsAuthRevealActive(): boolean {
  return useContext(AuthRevealActiveContext);
}
