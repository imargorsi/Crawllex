import Image from "next/image";

import { cn } from "@/lib/utils";

type AppLogoProps = {
  alt?: string;
  className?: string;
  height?: number;
  priority?: boolean;
  /** `full` = wordmark; `mark` = brand icon only (favicon). */
  variant?: "full" | "mark";
  /**
   * `auto` — follow light/dark class.
   * `onDark` — always light wordmark (video / dark photography).
   * `onLight` — always dark wordmark.
   */
  surface?: "auto" | "onDark" | "onLight";
  width?: number;
};

/** Wordmark PNG canvas: `public/crawllex-{light,dark}.png`. Mark: `public/favicon.png`. */
const WORDMARK_INTRINSIC_WIDTH = 2172;
const WORDMARK_INTRINSIC_HEIGHT = 724;
const WORDMARK_ASPECT = `${WORDMARK_INTRINSIC_WIDTH} / ${WORDMARK_INTRINSIC_HEIGHT}`;
/** Default display width — matches expanded sidebar content (`md:w-60` minus `px-3`). */
const FULL_LOGO_WIDTH = 216;
const MARK_SIZE = 32;

function wordmarkHeightForWidth(width: number): number {
  return Math.round((width * WORDMARK_INTRINSIC_HEIGHT) / WORDMARK_INTRINSIC_WIDTH);
}

export function AppLogo({
  alt = "",
  className,
  height,
  priority = false,
  variant = "full",
  surface = "auto",
  width,
}: AppLogoProps) {
  if (variant === "mark") {
    const markWidth = width ?? MARK_SIZE;
    const markHeight = height ?? MARK_SIZE;
    return (
      <Image
        src="/favicon.png"
        alt={alt}
        width={markWidth}
        height={markHeight}
        priority={priority}
        className={cn("block", className)}
        aria-hidden={alt ? undefined : true}
      />
    );
  }

  const fullWidth = width ?? FULL_LOGO_WIDTH;
  const fullHeight = height ?? wordmarkHeightForWidth(fullWidth);

  if (surface === "onDark") {
    return (
      <Image
        src="/crawllex-light.png"
        alt={alt}
        width={fullWidth}
        height={fullHeight}
        priority={priority}
        className={cn("block h-auto max-h-full w-auto max-w-full", className)}
        aria-hidden={alt ? undefined : true}
      />
    );
  }

  if (surface === "onLight") {
    return (
      <Image
        src="/crawllex-dark.png"
        alt={alt}
        width={fullWidth}
        height={fullHeight}
        priority={priority}
        className={cn("block h-auto max-h-full w-auto max-w-full", className)}
        aria-hidden={alt ? undefined : true}
      />
    );
  }

  return (
    <span
      className={cn("relative inline-block h-auto w-54 shrink-0", className)}
      style={{ aspectRatio: WORDMARK_ASPECT }}
    >
      {/* Dark wordmark — light surfaces */}
      <Image
        src="/crawllex-dark.png"
        alt={alt}
        width={fullWidth}
        height={fullHeight}
        priority={priority}
        className="absolute inset-0 block h-full w-full object-contain dark:hidden"
        aria-hidden={alt ? undefined : true}
      />
      {/* Light wordmark — dark surfaces */}
      <Image
        src="/crawllex-light.png"
        alt={alt}
        width={fullWidth}
        height={fullHeight}
        priority={priority}
        className="absolute inset-0 hidden h-full w-full object-contain dark:block"
        aria-hidden={alt ? undefined : true}
      />
    </span>
  );
}
