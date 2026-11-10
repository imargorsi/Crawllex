/**
 * Lens issue categories for the dashboard. SEO is the main focus; UI/UX holds viewport checks and accessibility.
 * Grouping is by Lens code, so a new Lens rule lands in a group only when it is listed here; otherwise it goes to "Other".
 */
export type LensCategory = "seo" | "uiux";

export type LensGroupId =
  | "titles"
  | "descriptions"
  | "headings"
  | "urls"
  | "indexing"
  | "robots"
  | "content"
  | "links"
  | "structured_data"
  | "images"
  | "layout"
  | "touch"
  | "text"
  | "accessibility"
  | "other";

const GROUP_BY_CODE: Record<string, LensGroupId> = {
  missing_title: "titles",
  multiple_titles: "titles",
  generic_title: "titles",
  title_length_guideline: "titles",
  metadata_content_mismatch_candidate: "titles",
  missing_meta_description: "descriptions",
  multiple_meta_descriptions: "descriptions",
  description_length_guideline: "descriptions",
  missing_h1: "headings",
  multiple_h1_candidate: "headings",
  heading_hierarchy_candidate: "headings",
  generic_heading_candidate: "headings",
  url_not_readable: "urls",
  conflicting_indexing_directives: "indexing",
  important_page_noindex_candidate: "indexing",
  noindex_conflict: "indexing",
  canonical_conflict: "indexing",
  invalid_canonical: "indexing",
  missing_canonical_candidate: "indexing",
  sitemap_indexability_conflict: "indexing",
  sitemap_error: "robots",
  robots_blocks_site: "robots",
  robots_blocks_sitemap_page: "robots",
  googlebot_robots_restriction: "robots",
  thin_content_candidate: "content",
  empty_content: "content",
  soft_404_candidate: "content",
  broken_internal_link: "links",
  broken_external_link: "links",
  internal_link_redirects: "links",
  external_link_changed: "links",
  missing_image_alt: "images",
  unhelpful_image_alt_candidate: "images",
  large_image_dimensions: "images",
  structured_data_malformed: "structured_data",
  structured_data_property_type: "structured_data",
  structured_data_content_mismatch_candidate: "structured_data",
  local_business_missing_properties: "structured_data",
  product_snippet_missing_properties: "structured_data",
  article_headline_recommended: "structured_data",
  breadcrumb_structure_candidate: "structured_data",
  relevant_structured_data_opportunity: "structured_data",
  ui_horizontal_overflow: "layout",
  ui_text_overflow: "layout",
  ui_small_tap_targets: "touch",
  ui_small_text: "text",
  ui_console_errors: "other",
  ui_failed_resources: "other",
  accessibility_violation: "accessibility",
};

export const GROUP_ORDER: LensGroupId[] = [
  "titles", "descriptions", "headings", "urls", "indexing", "robots", "content", "links",
  "structured_data", "images", "layout", "touch", "text", "accessibility", "other",
];

export function categoryOf(code: string): LensCategory {
  return code.startsWith("ui_") || code.startsWith("accessibility_") ? "uiux" : "seo";
}

export function groupOf(code: string): LensGroupId {
  return GROUP_BY_CODE[code] ?? "other";
}

/** SEO groups only. UI and accessibility checks are not shown in the client dashboard. */
export const SEO_GROUP_ORDER: LensGroupId[] = GROUP_ORDER.filter((id) => !["layout", "touch", "text", "accessibility", "other"].includes(id));

/** Two views for owners: what the page says (on-page) and how search engines reach it (technical). */
export const ONPAGE_GROUPS: LensGroupId[] = ["titles", "descriptions", "headings", "content", "images"];
export const TECHNICAL_GROUPS: LensGroupId[] = ["indexing", "robots", "urls", "links", "structured_data"];

/** One plain sentence per category, shown to the owner. */
export const GROUP_HELP: Partial<Record<LensGroupId, string>> = {
  titles: "The headline people see in search results for each page.",
  descriptions: "The short summary shown under the title in search results.",
  headings: "The main heading and section headings that show what a page is about.",
  content: "How much useful text each page gives visitors and search engines.",
  images: "Descriptions and sizes of pictures, so they help search and load fast.",
  indexing: "Which version of a page search engines should show, and whether they may show it.",
  robots: "The robots file and sitemap, which tell search engines which pages to visit.",
  urls: "How readable the web address of each page is.",
  links: "Links that lead to dead pages, redirects, or changed sites.",
  structured_data: "Hidden labels that tell search engines what a page is (product, article, business).",
};
