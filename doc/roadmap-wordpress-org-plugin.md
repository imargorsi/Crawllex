# Upcoming feature: publish the plugin on wordpress.org

**Status:** not started. Planned (2026-11-10). Until Phase 4 is done, distribution stays manual: the zip is downloaded from Crawllex (**Settings → Integrations → Download Plugin**) and uploaded in WordPress, and updates come from the plugin's own updater against Crawllex.

## Goal

List **Crawllex Lead Capture** in the wordpress.org plugin directory, so sites install and update it from inside WordPress.

## Facts

- Cost: $0. No submission, hosting, or yearly fee. The only cost is developer time, roughly one day for Phases 1–2.
- Review is done by volunteers. The queue held 4,232 plugins in February 2026. Expect weeks. The live estimate is shown on https://wordpress.org/plugins/developers/add/.
- The upload is scanned by the official Plugin Check tool first. Any error blocks the upload.
- The slug `crawllex-lead-capture` is permanent after approval.
- A wordpress.org listing is one public build that updates only from wordpress.org. It cannot carry our own updater or the dev URL.

## Audit baseline (2026-11-10)

Plugin 0.4.4, checked with Plugin Check 2.2.0 on WordPress 7.1.4: **4 errors, 7 warnings**.

Already fine: GPL header, unique prefixes, nonce and `manage_options` checks, escaped output, `wp_remote_*` with SSL verify, no PHP syntax errors, slug.

All paths below are under `crawllex-leads-capture/plugin/`.

## Phase 0: now (manual distribution)

No change. Rules stay as they are:

- `main` zip is stamped `https://crawllex.com` (`plugin:pack:prod`), `dev` zip is stamped `https://crawllex-dev.vercel.app` (`plugin:pack`). Never swap.
- Updates are served by `GET /api/v1/leads/plugin/update` through `includes/class-updater.php`.

## Phase 1: clear the Plugin Check errors

Goal: zero errors, zero warnings.

| # | Finding | Fix |
|---|---------|-----|
| 1 | `includes/class-updater.php` is a custom updater (1 error, 2 warnings). Not permitted on wordpress.org. | Leave it out of the wordpress.org build, with the **Latest Version** line in settings and `CRAWLLEX_LC_UPDATE_PATH`. Keep it in the manual build. |
| 2 | No `readme.txt`. The scanner reads `README.md` and reports missing `Tested up to`, missing `License`, invalid `Stable tag` (3 errors). | Add `readme.txt` in WordPress format: `Tested up to`, `Stable tag` equal to the plugin `Version`, `License`, short description of 150 characters or less. |
| 3 | `README.md` title "Crawllex Lead Capture (WordPress)" contains the restricted term "wordpress" and does not match the plugin header name. | Solved by `readme.txt` with the exact name "Crawllex Lead Capture". |
| 4 | `includes/class-settings.php:48` reads `$_POST['crawllex_lc_source_key']` without a sanitize function. | Wrap in `sanitize_text_field()`. |
| 5 | `includes/class-plugin.php:11` calls `load_plugin_textdomain()`. Not needed on wordpress.org. | Remove from the wordpress.org build. |
| 6 | `README.md` says version 0.4.1, plugin is 0.4.4. Main file has no `License URI` header. | Correct both. |

## Phase 2: clear the manual-review risks

The scanner does not catch these. A human reviewer is likely to.

1. **Admin credentials sent off-site without clear consent.** **Test Connection** creates a WordPress application password for the logged-in admin and sends the username and password to Crawllex (`includes/class-settings.php:84`, `includes/class-client.php:25`). The button label does not say so. Make it a separate, clearly labelled opt-in step, and describe it in `readme.txt`.
2. **External service disclosure.** The plugin sends name, email, phone, message, extra fields, and the site URL to Crawllex. `readme.txt` needs an "External services" section that says what is sent, when, and why, with links to the Crawllex Terms and Privacy Policy. Confirm both pages are public on crawllex.com first.
3. **Dashboard URL.** `includes/dashboard-url.php` defaults to `https://crawllex-dev.vercel.app`. The wordpress.org build must be stamped `https://crawllex.com`.
4. **Third-party logos.** `assets/logo-contact-form-7.png`, `logo-elementor.png`, and `logo-wpforms.png` are other companies' trademarks and are probably not GPL-compatible. Replace with plain text names.
5. **Uninstall is incomplete.** `uninstall.php` deletes the option only. It must also revoke the application password and delete the `crawllex_lc_update` and `crawllex_lc_notice` transients.
6. **Dev leftovers.** Remove the localhost and Docker hints in `includes/class-client.php:171` from the wordpress.org build.

Build change for Phases 1–2: add a third target to `scripts/pack-wp-plugin.ts` (for example `plugin:pack:wporg`) that stamps the production URL and leaves out the updater. The two existing targets stay unchanged.

Exit check: run Plugin Check on the wordpress.org zip and get zero errors.

## Phase 3: submit and review

1. Create a wordpress.org account with an `@crawllex.com` email and turn on two-factor authentication (required for plugin authors). Reviewers commonly ask for proof of brand ownership.
2. Upload the wordpress.org zip (under 10 MB) at https://wordpress.org/plugins/developers/add/.
3. Answer the review emails. Upload a corrected zip each round until approved.

## Phase 4: launch on wordpress.org

1. On approval, an SVN repository opens at `https://plugins.svn.wordpress.org/crawllex-lead-capture/`.
2. Commit the code to `trunk` and to `tags/<version>`.
3. Add to the SVN `assets` folder: icon 256x256, banner 772x250 and 1544x500, screenshots.
4. Each later release: raise `Version` and `Stable tag`, then `svn commit`. No new review, but the guidelines keep applying. Keep `Tested up to` current.

## Phase 5: move existing sites and retire manual distribution

Open decisions, to settle before Phase 4 ends:

1. How sites on the manual zip move to the wordpress.org version. Same slug and folder name mean WordPress offers the wordpress.org update once the updater is gone, so the last manual release could simply drop the updater.
2. Whether the dev zip stays as a private, manually installed build for staging. The wordpress.org build cannot point at `crawllex-dev`.
3. When **Download Plugin** in Crawllex changes to a link to the wordpress.org listing, and when `GET /api/v1/leads/plugin/update` is removed.

## References

- Detailed Plugin Guidelines: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
- Plugin Developer FAQ: https://developer.wordpress.org/plugins/wordpress-org/plugin-developer-faq/
- Plugin Check and 2FA requirement: https://make.wordpress.org/plugins/2024/10/01/plugin-check-and-2fa-now-mandatory-for-new-plugin-submissions/
- Review checklist: https://make.wordpress.org/plugins/handbook/performing-reviews/review-checklist/
- Plugin README: `crawllex-leads-capture/plugin/README.md`
