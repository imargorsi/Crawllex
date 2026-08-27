"use client";

import Image from "next/image";

import { WORDPRESS_INTEGRATION_LOGO_SRC } from "@/lib/integrations/wordpress-integration-logo";
import { cn } from "@/lib/utils";

type TWordpressIntegrationLogoProps = {
  /** Pixel size for both width and height. */
  size?: number;
  className?: string;
  alt?: string;
};

/** Official WordPress product mark (full color SVG). */
export function WordpressIntegrationLogo({
  size = 20,
  className,
  alt = "",
}: TWordpressIntegrationLogoProps) {
  return (
    <Image
      src={WORDPRESS_INTEGRATION_LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      className={cn("object-contain", className)}
      unoptimized
    />
  );
}
