/** Shared dashboard chrome classes — keep sidebar brand row and top bar aligned. */
export const dashboardHeaderRowClass =
  "flex h-14 shrink-0 items-center border-b border-border";

export const dashboardHeaderTitleClass = "text-sm font-semibold leading-none text-text-primary";

export const dashboardNavIconClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-border)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-card active:scale-[0.98]";

/** Toolbar filters — glass bar with theme tokens (no hardcoded white). */
export const toolbarFilterShellClass =
  "inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-border/50 bg-bg-card/20 p-2 shadow-sm backdrop-blur-md backdrop-saturate-125 dark:border-text-primary/30 dark:bg-text-primary/[0.05]";

/**
 * Frosted panel fill — same glass as filter shells / tables
 * (soft outline, light frost so `--bg-main` stays visible — no milky slabs).
 */
export const glassPanelSurfaceClass =
  "border border-border/50 bg-bg-card/20 text-text-primary shadow-sm backdrop-blur-md backdrop-saturate-125 dark:border-text-primary/30 dark:bg-text-primary/[0.05]";

/**
 * Modal frost (centered dialogs + side sheets only).
 * Greyer wash like chips/actions (`text-primary` tint) — not the purple `bg-card` slab —
 * so modals stay frosted and readable without looking too dark.
 */
export const modalFrostFillClass =
  "bg-bg-card/55 backdrop-blur-xl backdrop-saturate-150 dark:bg-text-primary/10";

export const modalFrostBorderClass =
  "border border-border/55 dark:border-text-primary/40";

/**
 * Side detail sheets — modal frost fill; border is applied on one edge only
 * by the shared `Sheet` (the edge facing page content).
 */
export const sheetSurfaceClass = `border-0 ${modalFrostFillClass} text-text-primary shadow-sm`;

/** Single glassy control (search, sort trigger) — same surface language as filter chip shells. */
export const toolbarFilterControlClass =
  "box-border h-11 rounded-full border border-border/50 bg-bg-card/20 shadow-sm backdrop-blur-md backdrop-saturate-125 transition-[border-color,background-color] duration-200 dark:border-text-primary/30 dark:bg-text-primary/[0.05]";

/** Smaller chips leave a clearer gap inside the outlined shell. */
export const toolbarFilterChipClass =
  "inline-flex h-8 items-center gap-2 rounded-full px-3 type-label leading-none transition-colors";

/** Glassy detail icon wells — filled frost (page panels, matrices). */
export const detailIconWellClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-bg-card/40 text-brand shadow-sm backdrop-blur-md backdrop-saturate-150 dark:border-text-primary/40 dark:bg-text-primary/14 dark:text-text-primary";

/** Modal / sheet icon wells — outline only, no fill (create/edit dialogs + detail sheets). */
export const detailIconWellOutlineClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-transparent text-brand shadow-none dark:border-text-primary/40 dark:bg-transparent dark:text-text-primary";

/** Empty-state icon well — larger glass disc, same surface language as detail wells. */
export const emptyStateIconWellClass =
  "inline-flex size-14 shrink-0 items-center justify-center rounded-full border border-border/60 bg-bg-card/40 text-brand shadow-sm backdrop-blur-md backdrop-saturate-150 dark:border-text-primary/40 dark:bg-text-primary/14 dark:text-text-primary";

/** Metric / summary card icon well — light nested frost (no opaque card fill). */
export const metricIconWellClass =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-text-primary/12 bg-text-primary/[0.04] shadow-none backdrop-blur-md backdrop-saturate-150 dark:border-text-primary/18 dark:bg-text-primary/[0.06]";

/** Empty-state content shell — centered stack; glass lives on the icon well only. */
export const emptyStateShellClass =
  "inline-flex w-full max-w-md flex-col items-center px-6 py-2 text-center sm:px-8";

/** List table — frosted glass over tinted canvas (no solid white fill). */
export const tableShellClass =
  "overflow-hidden rounded-xl border border-border/50 bg-bg-card/20 shadow-sm backdrop-blur-xl backdrop-saturate-125 transition-opacity duration-200 dark:border-text-primary/18 dark:bg-text-primary/[0.03]";

/**
 * Form fields — transparent fill (match canvas/panel) + table-shell outline.
 * Prefer this over milky `--bg-input` slabs inside glass forms.
 */
export const formFieldControlClass =
  "border border-border/50 bg-transparent shadow-none dark:border-text-primary/18";

export const tableHeaderRowClass =
  "border-border/55 bg-transparent hover:bg-transparent dark:border-text-primary/12";

export const tableHeaderCellClass =
  "h-12 px-3 type-label tracking-wide text-text-secondary sm:px-4";

/** Continuous glass body rows — hairline dividers, no pill cards. */
export const tableBodyRowClass =
  "border-border/55 bg-transparent transition-colors hover:bg-bg-hover/40 dark:border-text-primary/12";

export const tableBodyCellClass = "px-3 py-3 type-body text-text-primary sm:px-4";

export const tablePaginationBarClass =
  "flex flex-col gap-2 border-t border-border/50 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4 dark:border-text-primary/12";

/** Row action icon buttons — compact glass pills. */
export const tableRowIconActionClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-bg-card/50 text-text-primary shadow-sm backdrop-blur-md transition-[border-color,background-color,color,box-shadow] duration-200 hover:border-accent-border hover:bg-bg-hover hover:text-text-primary hover:shadow-md dark:border-text-primary/35 dark:bg-text-primary/12 dark:hover:border-text-primary/50 dark:hover:bg-text-primary/18";

/** Inline outlined chip for table cell counts / labels — no fill (readable on glass rows). */
export const tableGlassChipClass =
  "inline-flex items-center rounded-full border border-border bg-transparent px-2.5 py-1 type-caption tabular-nums text-text-primary shadow-none dark:border-text-primary/45";

/** Pagination controls — compact outline chips. */
export const tablePaginationIconActionClass =
  "size-7 min-w-7 rounded-full border border-border/60 bg-transparent p-0 type-caption text-text-secondary shadow-none transition-[border-color,background-color,color] duration-200 hover:border-accent-border hover:bg-bg-hover/50 hover:text-text-primary disabled:opacity-40 dark:border-text-primary/25 dark:hover:border-text-primary/40 dark:hover:bg-text-primary/10";

/**
 * Dashboard panel / card surface — same transparent chrome as filters + tables
 * (`glassPanelSurfaceClass`) with a light hover outline. Prefer this for create,
 * settings, analytics, and project panels so outlines stay visible.
 */
export const elevatedCardSurfaceClass = `${glassPanelSurfaceClass} transition-[border-color,box-shadow] duration-200 hover:border-accent-border/50`;

/**
 * Menus / floating overlays — opaque `--popover` (not translucent `--bg-card`).
 * Use theme shadow tokens only (no hardcoded rgba in components).
 * Glass Aurora dark `--bg-card` includes alpha; popovers must stay opaque.
 */
export const popoverSurfaceClass =
  "border border-border bg-popover text-popover-foreground shadow-(--shadow) dark:border-text-primary/40";

/**
 * Centered modals / alert dialogs — denser modal frost (readable text + chrome effect).
 * Do not use for cards, chips, or list chrome — those stay on light `glassPanelSurfaceClass`.
 */
export const dialogSurfaceClass = `${modalFrostBorderClass} ${modalFrostFillClass} text-text-primary shadow-(--shadow-elevated)`;

/**
 * Standard centered-modal header/footer rule — 90% width, centered (not full-bleed edge borders).
 * Use via `DialogSectionDivider` after headers and before footers.
 * Slightly stronger than bare `--border` so the rule stays visible on frosted modal fills.
 */
export const dialogSectionDividerClass =
  "mx-auto h-px w-[90%] shrink-0 bg-border dark:bg-text-primary/22";

/**
 * Settings inset rules — 99% width, centered (category rail + theme section splits).
 * Softer than modal dividers so they sit cleanly on glass panels.
 */
export const settingsInsetDividerClass =
  "mx-auto h-px w-[99%] shrink-0 bg-border/55 dark:bg-text-primary/18";

/** Analytics module panels — shared radius + breathing room. */
export const analyticsPanelClass = "rounded-3xl p-5 sm:p-6";

/**
 * Standard content rhythm (md) — heading ↔ description / title ↔ supporting line.
 * Prefer `type-stack-md` in CSS; this alias is for chrome imports.
 */
export const typeStackMdClass = "type-stack-md";

/** Identity hero: name/title then email·phone / slug meta (same gap as type-stack-md). */
export const typeStackIdentityClass = "type-stack-identity";

/** Inline icon + text pair (email, phone, links). */
export const typeIconTextClass = "inline-flex min-w-0 max-w-full items-center gap-2";

/** Horizontal meta row (email | phone). */
export const typeMetaRowClass = "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2";

/** Detail sheet section: heading block + fields (Lead Details spacing). */
export const detailSectionClass = "space-y-3";

/** Detail sheet scroll body. */
export const detailBodyClass =
  "themed-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5";

/** Hero row: avatar/icon well + identity text. */
export const detailHeroRowClass = "flex items-center gap-4";

/** Page/section title + description — keep hierarchy readable (flex gap, not tight leading collapse). */
export const analyticsHeadingStackClass = typeStackMdClass;

export const elevatedCardTitleClass = "text-(--text-on-elevated)";

export const elevatedCardBodyClass = "text-(--text-on-elevated-secondary)";

export const elevatedCardMutedClass = "text-(--text-on-elevated-muted)";

/** Sidebar shell — wider than content chrome, distinct surface from main modules. */
export const sidebarShellClass =
  "flex h-full max-h-svh w-full shrink-0 flex-col border-b border-border bg-bg-sidebar transition-[width] duration-200 ease-out md:border-b-0 md:border-e";

export const sidebarShellExpandedClass = "md:w-60";

export const sidebarShellCollapsedClass = "md:w-[4.5rem]";

/** Crawllex wordmark in the sidebar header — same horizontal inset as project selector. */
export const sidebarBrandRowClass =
  "relative flex min-h-[4.75rem] shrink-0 items-center justify-center px-3 py-2";

export const sidebarBrandRowCollapsedClass = "md:px-2";

/** Desktop collapse/expand control. */
export const sidebarCollapseToggleClass =
  "group hidden w-full items-center gap-3 rounded-xl px-2.5 py-2 type-label text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent-border) focus-visible:ring-offset-2 focus-visible:ring-offset-bg-sidebar md:inline-flex";

export const sidebarCollapseToggleCollapsedClass = "md:justify-center md:px-0";

/**
 * Sidebar nav icons — bare glyphs (no circular wells).
 * Circular frames at ~26px add stroke noise and soften complex Hugeicons.
 */
export const sidebarNavIconClass =
  "inline-flex size-5 shrink-0 items-center justify-center transition-colors duration-200";

export const sidebarNavIconActiveClass = "text-text-on-brand";

export const sidebarNavIconInactiveClass =
  "text-text-muted group-hover:text-text-primary";

/** Nav link: soft rounded row; active uses solid brand pill. */
export const sidebarNavLinkClass =
  "group relative flex items-center gap-3 rounded-xl px-2.5 py-2 type-label transition-[border-color,background-color,background-image,color] duration-200";

export const sidebarNavLinkCollapsedClass = "md:justify-center md:gap-0 md:px-0";

/** Keep gradient as background-image only — avoid border/bg-color utilities that punch holes in it. */
export const sidebarNavLinkActiveClass =
  "border-0 bg-brand text-text-on-brand shadow-sm hover:bg-brand/90";

export const sidebarNavLinkInactiveClass =
  "border border-transparent bg-transparent text-text-secondary hover:border-border/60 hover:bg-bg-hover/55 hover:text-text-primary";

/** Project selector — one shell that expands over sidebar content. */
export const sidebarProjectSelectorShellClass =
  "flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-bg-card/20 shadow-sm backdrop-blur-md backdrop-saturate-125 transition-[border-color,background-color,box-shadow,max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-text-primary/42 dark:bg-text-primary/[0.05]";

export const sidebarProjectSelectorShellOpenClass =
  "border-border/80 bg-bg-card-elevated shadow-(--shadow-elevated) dark:border-text-primary/55 dark:bg-bg-card-elevated";

export const sidebarProjectSelectorTriggerClass =
  "flex w-full shrink-0 items-center gap-3 px-3 py-2.5 type-label text-text-primary transition-colors duration-200 hover:bg-bg-hover/40";

export const sidebarProjectSelectorExpandClass =
  "grid min-h-0 transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]";

export const sidebarProjectSelectorOptionClass =
  "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start transition-colors duration-200 ease-out";

export const sidebarProjectSelectorListClass =
  "themed-scrollbar flex max-h-[min(40rem,calc(100svh-11rem))] flex-col gap-2 overflow-y-auto px-2 pb-2.5 pe-1 pt-1";

export const sidebarNavGroupLabelClass =
  "px-2.5 pb-2 type-overline tracking-wide text-text-muted";

export const sidebarNavGroupClass =
  "flex flex-col gap-1.5 border-t border-border/55 pb-4 pt-7 first:border-t-0 first:pt-0 last:pb-0 dark:border-text-primary/20";
