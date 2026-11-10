/**
 * Plain-language explanation of each SEO issue, for clients. Written for someone who is not an SEO expert.
 * Every Lens SEO code should be here; unknown codes fall back to a generic line (see explainIssue).
 * Guidelines (lengths) are shown as guidelines: search engines do not publish hard limits.
 */

export type SeoExplanation = {
  title: string;
  why: string;
  fix: string;
};

export const SEO_EXPLANATIONS: Record<string, SeoExplanation> = {
  missing_title: {
    title: "Page has no title",
    why: "The title is the headline people see in search results. Without one, search engines write their own.",
    fix: "Add a short, clear title that describes what this page is about.",
  },
  multiple_titles: {
    title: "Page has more than one title",
    why: "Two titles send mixed signals about what the page is about.",
    fix: "Keep one title in the page head.",
  },
  generic_title: {
    title: "Title is too generic",
    why: "Words like \"Home\" or \"Welcome\" do not say what the page offers.",
    fix: "Name the service, product or topic in the title.",
  },
  title_length_guideline: {
    title: "Title length",
    why: "Very short or very long titles are often cut off or unclear in search results. This is a guideline, not a rule.",
    fix: "Aim for about 30 to 60 characters that describe the page.",
  },
  metadata_content_mismatch_candidate: {
    title: "Title and page content do not match",
    why: "When the title promises something the page does not show, visitors leave quickly.",
    fix: "Check that the title and the main heading describe the same page.",
  },
  missing_meta_description: {
    title: "Page has no meta description",
    why: "The meta description is the short summary under the title in search results.",
    fix: "Write one or two sentences that describe the page for a visitor.",
  },
  multiple_meta_descriptions: {
    title: "Page has more than one meta description",
    why: "Only one summary is used, and the choice may not be the one you want.",
    fix: "Keep a single meta description.",
  },
  description_length_guideline: {
    title: "Meta description length",
    why: "Very short or very long summaries are often cut off in search results. This is a guideline, not a rule.",
    fix: "Aim for about 70 to 160 characters.",
  },
  missing_h1: {
    title: "Page has no main heading",
    why: "The main heading (H1) tells search engines and visitors the page topic.",
    fix: "Add one clear main heading that names the page topic.",
  },
  multiple_h1_candidate: {
    title: "More than one main heading",
    why: "Several H1 headings can make the main topic less clear.",
    fix: "Check whether one heading should be the main one and make the others smaller headings.",
  },
  heading_hierarchy_candidate: {
    title: "Heading levels skip",
    why: "Headings should go in order (H1, then H2, then H3). Skipped levels make the page structure hard to read.",
    fix: "Use the next level down without skipping (for example H2 then H3).",
  },
  generic_heading_candidate: {
    title: "Heading is too generic",
    why: "A heading like \"Welcome\" does not tell visitors or search engines what the page is.",
    fix: "Use a heading that names the page purpose.",
  },
  url_not_readable: {
    title: "Web address is hard to read",
    why: "Clear addresses are easier to share and understand. Capital letters, underscores and tracking codes make them harder.",
    fix: "Use lowercase words with hyphens, and avoid tracking codes in the address.",
  },
  conflicting_indexing_directives: {
    title: "Conflicting instructions for search engines",
    why: "The page says both \"show it\" and \"hide it\" in search. Search engines follow the stricter one.",
    fix: "Keep one clear instruction.",
  },
  important_page_noindex_candidate: {
    title: "Important page is hidden from search",
    why: "This page looks important but asks search engines not to show it.",
    fix: "If the page should appear in search, remove the \"noindex\" instruction.",
  },
  canonical_conflict: {
    title: "Page points to more than one preferred address",
    why: "A canonical tag tells search engines the main version of a page. Two different ones confuse them.",
    fix: "Keep one canonical address per page.",
  },
  invalid_canonical: {
    title: "Preferred address is not valid",
    why: "The preferred address cannot be used by search engines.",
    fix: "Use a full web address starting with https://.",
  },
  missing_canonical_candidate: {
    title: "No preferred address set",
    why: "Without one, copies of a page (for example with tracking codes) can compete with each other.",
    fix: "Add a canonical tag that points to the main address of the page.",
  },
  sitemap_indexability_conflict: {
    title: "Sitemap lists a page that is hidden from search",
    why: "The sitemap invites search engines to a page, but the page asks them not to show it.",
    fix: "Remove the page from the sitemap, or allow it in search.",
  },
  sitemap_error: {
    title: "Sitemap problem",
    why: "Search engines use the sitemap to find pages. A broken sitemap means some pages may be missed.",
    fix: "Repair the sitemap, or remove the reference to it.",
  },
  robots_blocks_site: {
    title: "Whole site is blocked for search engines",
    why: "The robots file tells all search engines to skip the whole site. Nothing can appear in search.",
    fix: "Remove the rule that blocks the whole site, unless it must stay private.",
  },
  robots_blocks_sitemap_page: {
    title: "Pages listed in the sitemap are blocked",
    why: "You asked search engines to visit these pages, but the robots file blocks them.",
    fix: "Allow these pages in the robots file, or remove them from the sitemap.",
  },
  googlebot_robots_restriction: {
    title: "Google is blocked from part of the site",
    why: "The robots file has a rule that only affects Google.",
    fix: "Check that the Google-specific rule is intended.",
  },
  thin_content_candidate: {
    title: "Page has little text",
    why: "Pages with very little text give search engines little to understand. This is a candidate: some short pages are intentional.",
    fix: "Check whether the page should say more about its topic.",
  },
  empty_content: {
    title: "Page content is empty",
    why: "Search engines and visitors see almost nothing on this page.",
    fix: "Check that the page loads its content, and add the text it should show.",
  },
  soft_404_candidate: {
    title: "Missing page looks like a normal page",
    why: "A page that says \"not found\" but returns success confuses search engines.",
    fix: "Return a proper not-found response, or redirect to the right page.",
  },
  broken_internal_link: {
    title: "Broken link to another page on your site",
    why: "Visitors and search engines hit a dead end.",
    fix: "Fix the link, or point it to the right page.",
  },
  broken_external_link: {
    title: "Broken link to another website",
    why: "Visitors who click it reach an error page.",
    fix: "Replace the link with a working address.",
  },
  internal_link_redirects: {
    title: "Link goes through a redirect",
    why: "Each redirect slows the visit and wastes some value of the link.",
    fix: "Link straight to the final address.",
  },
  external_link_changed: {
    title: "Link to another website has changed",
    why: "The other site now points somewhere else, so the link may no longer match your intent.",
    fix: "Check the link and update it if needed.",
  },
  missing_image_alt: {
    title: "Image has no description",
    why: "Descriptions help search engines understand images and help people using screen readers.",
    fix: "Add a short description of what the image shows.",
  },
  unhelpful_image_alt_candidate: {
    title: "Image description is not useful",
    why: "A description like \"image1\" tells nobody anything.",
    fix: "Describe what the image shows in a few words.",
  },
  large_image_dimensions: {
    title: "Image is very large",
    why: "Large images slow the page down, and visitors wait longer.",
    fix: "Resize the image to the size it is shown at.",
  },
  structured_data_malformed: {
    title: "Structured data is broken",
    why: "Structured data helps search engines understand the page. Broken data is ignored.",
    fix: "Fix the markup so it validates.",
  },
  structured_data_property_type: {
    title: "Structured data has a wrong value type",
    why: "A value in the markup has the wrong type and may be ignored.",
    fix: "Correct the value type in the markup.",
  },
  structured_data_content_mismatch_candidate: {
    title: "Structured data does not match the page",
    why: "The markup describes something the page does not show.",
    fix: "Make the markup match what visitors see.",
  },
  local_business_missing_properties: {
    title: "Business details are incomplete",
    why: "Local business details help people find you in search.",
    fix: "Add the missing business details such as address and phone.",
  },
  product_snippet_missing_properties: {
    title: "Product details are incomplete",
    why: "Complete product details can appear in search results.",
    fix: "Add the missing product details such as price and availability.",
  },
  article_headline_recommended: {
    title: "Article is missing a headline in its markup",
    why: "The headline helps search engines show the article correctly.",
    fix: "Add the headline to the article markup.",
  },
  breadcrumb_structure_candidate: {
    title: "Breadcrumb trail could be clearer",
    why: "Breadcrumbs show visitors and search engines where a page sits on the site.",
    fix: "Check that the breadcrumb markup matches the page path.",
  },
  relevant_structured_data_opportunity: {
    title: "Extra structured data could help",
    why: "This kind of page can show richer results when it has the right markup.",
    fix: "Consider adding the suggested markup.",
  },
};

export function explainIssue(code: string): SeoExplanation {
  return SEO_EXPLANATIONS[code] ?? {
    title: code.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    why: "Lens found something on this page that is worth checking.",
    fix: "Review the page and decide whether a change is needed.",
  };
}
