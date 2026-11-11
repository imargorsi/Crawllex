/** Brand gradient wash behind a whole page. Boxes on the page stay transparent so it shows through (same as Reports). */
export function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(70%_55%_at_50%_0%,color-mix(in_srgb,var(--brand)_22%,transparent),transparent_70%),linear-gradient(180deg,color-mix(in_srgb,var(--brand)_8%,transparent),transparent_60%)]"
    />
  );
}
