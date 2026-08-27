# Crawllex Lead Capture — distribution

Private WordPress plugin source and the files packed for public download.

```text
crawllex-leads-capture/
  plugin/                      # WordPress plugin source
  crawllex-lead-capture.zip    # copy written by plugin:pack
  crawllex_sample_sheet.csv    # sample CSV (source)
  README.md                    # this file

public/resources/
  crawllex-lead-capture.zip    # public plugin download
  crawllex_sample_sheet.csv    # public sample CSV
```

Shareable URLs (same host as the dashboard):

- Plugin zip: `/resources/crawllex-lead-capture.zip`
- Sample CSV: `/resources/crawllex_sample_sheet.csv`

WordPress installs the zip as `wp-content/plugins/crawllex-lead-capture/`.

## Release

1. Edit files under `plugin/`. Keep `Version:` in `crawllex-lead-capture.php` in sync with `CRAWLLEX_LC_VERSION`.
2. Run `npm run plugin:pack` (local `APP_URL`) or `npm run plugin:pack:prod` (production `APP_URL`). That writes the zip and copies the sample CSV into `public/resources/`.
3. Deploy. Anyone with the link can download either file.

## How operators get it

- **Link:** `/resources/crawllex-lead-capture.zip`
- **Dashboard:** Settings → Integrations → WordPress → **Download Plugin**
- **WordPress updates:** `GET /api/v1/leads/plugin/update` (Lead Source Key) returns that public zip URL
- **Sample CSV:** Leads → Import → **Download Sample CSV**

Operator guide: [`plugin/README.md`](./plugin/README.md).
