import * as React from "react";

import { Icons } from "@/lib/frontend/icons/app-icons";
import { cn } from "@/lib/utils";
import { breadcrumbChromeMutedClass } from "@/lib/frontend/theme/chrome-tones";

export const breadcrumbLinkClassName = cn(
  "rounded-md px-2 py-0.5 text-[13px] font-medium text-text-secondary underline-offset-4 transition-[color,background-color] duration-200",
  "hover:bg-accent-bg hover:text-text-primary hover:underline",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-border focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated",
);

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("relative z-[1] min-w-0 flex-1", className)}
      {...props}
    />
  );
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "relative z-[1] flex flex-wrap items-center gap-x-1 gap-y-1 break-words text-[13px] text-text-primary sm:gap-x-1.5",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

function BreadcrumbLink({ className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      data-slot="breadcrumb-link"
      className={cn(breadcrumbLinkClassName, className)}
      {...props}
    />
  );
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      aria-current="page"
      className={cn(
        "inline-flex max-w-[min(100%,18rem)] items-center truncate text-[13px] font-semibold leading-none text-text-primary sm:max-w-md",
        className
      )}
      {...props}
    />
  );
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "inline-flex select-none text-text-muted [&>svg]:size-3.5 [&>svg]:shrink-0 [&>svg]:text-(--text-chrome-muted)",
        breadcrumbChromeMutedClass,
        className
      )}
      {...props}
    >
      {children ?? <Icons.arrowRight className="rtl:rotate-180" aria-hidden />}
    </li>
  );
}

function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-8 items-center justify-center text-(--text-chrome-muted)",
        className
      )}
      {...props}
    >
      <Icons.moreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
