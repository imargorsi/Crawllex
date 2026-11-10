import type { TAppIconComponent } from "@/components/ui/app-icon";
import { cn } from "@/lib/utils";

/** Label with a leading icon, used by the report form fields so every field reads the same. */
export function ReportFieldLabel({
  htmlFor,
  label,
  icon: Icon,
  required,
}: {
  htmlFor: string;
  label: string;
  icon?: TAppIconComponent;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? <Icon className="size-4 shrink-0 text-text-muted" aria-hidden /> : null}
      <label
        htmlFor={htmlFor}
        className={cn("text-base font-medium text-text-primary", required ? 'after:ms-0.5 after:text-destructive after:content-["*"]' : "")}
      >
        {label}
      </label>
    </div>
  );
}
