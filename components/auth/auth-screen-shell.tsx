import type { ReactNode } from "react";

import { AuthVideoBackground } from "@/components/auth/auth-video-background";
import { SignInHeroSection } from "@/sections/sign-in-hero-section";

type AuthScreenShellProps = {
  children: ReactNode;
};

/**
 * Auth split layout — hero left, form right from `lg`.
 * On smaller screens the hero stays visible (tighter type) above the form.
 * Trust chips wait until `xl`.
 *
 * Form centering uses the min-h-full + items-center scroll pattern so the card
 * stays vertically centered when it fits, and scrolls from a sensible start when
 * it does not (plain items-center + overflow on the same node sticks to the top).
 */
export function AuthScreenShell({ children }: AuthScreenShellProps) {
  return (
    <main className="relative grid min-h-svh grid-cols-1 overflow-x-hidden lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
      <AuthVideoBackground />
      <SignInHeroSection />
      <div className="relative z-10 min-w-0 w-full overflow-y-auto overflow-x-hidden lg:h-full lg:min-h-0">
        <div className="flex w-full min-w-0 items-center justify-center px-5 py-8 sm:px-10 lg:min-h-full lg:px-8 lg:py-12 xl:px-10">
          {children}
        </div>
      </div>
    </main>
  );
}
