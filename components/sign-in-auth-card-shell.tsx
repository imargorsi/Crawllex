import type { ReactNode } from "react";

import { AuthFormBrandMark } from "@/components/auth/auth-form-brand-mark";
import { AuthFormToolbar } from "@/components/auth/auth-form-toolbar";
import { authFormCardSurfaceClass } from "@/lib/frontend/layout/auth-chrome";
import { cn } from "@/lib/utils";

type SignInAuthCardShellProps = {
  ariaLabelledBy: string;
  children: ReactNode;
  /** Defaults to theme + language controls. Pass `null` to hide. */
  topToolbar?: ReactNode | null;
  /** Unified brand mark above the form title. Defaults on. */
  showBrandMark?: boolean;
};

/**
 * Auth form card only — vertical centering lives on the form column in `AuthScreenShell`.
 */
export function SignInAuthCardShell({
  ariaLabelledBy,
  children,
  topToolbar = <AuthFormToolbar />,
  showBrandMark = true,
}: SignInAuthCardShellProps) {
  return (
    <section className="relative w-full min-w-0 max-w-md" aria-labelledby={ariaLabelledBy}>
      <div className={cn(authFormCardSurfaceClass, "relative px-7 py-8 sm:px-8 sm:py-10")}>
        {topToolbar ? (
          <div className="absolute end-5 top-5 z-10 sm:end-6 sm:top-6">{topToolbar}</div>
        ) : null}

        <div className={cn("flex flex-col", topToolbar && "pt-3")}>
          {showBrandMark ? <AuthFormBrandMark className="mb-4" priority /> : null}
          {children}
        </div>
      </div>
    </section>
  );
}
