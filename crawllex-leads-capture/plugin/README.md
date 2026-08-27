# Crawllex Lead Capture (WordPress)

WordPress plugin that pushes form submissions into Crawllex. Lives in this repo at `crawllex-leads-capture/plugin/`.

**Requirements:** WordPress 6.2+ · PHP 8.1+ · Contact Form 7, Elementor Pro Forms, and/or WPForms for capture (settings work without them)  
**Version:** 0.4.1

Download the zip from `/resources/crawllex-lead-capture.zip` (or Crawllex **Settings → Integrations → WordPress → Download Plugin**), then upload it in WordPress (Plugins → Add Plugin → Upload). Or copy this folder into `wp-content/plugins/crawllex-lead-capture/` (the folder name on the WordPress site should be the plugin slug).

## Current slice

- Settings → Crawllex Lead Capture (supported form logos + **Current Version** / **Latest Version** from Crawllex)
- Updates via Crawllex (`GET /api/v1/leads/plugin/update` points at the public zip)
- **Dashboard Base URL** is fixed in the plugin package (`APP_URL` at pack time) — not editable in WordPress
- **Lead Source Key** (paste from Crawllex **View Key**)
- **Test Connection** → `POST /api/v1/leads/ingest/verify` (sends this site’s `home_url()`)
- Plugin-local status, ingest/failed counts, last 20 events
- **Contact Form 7** → `POST /api/v1/leads/ingest` after `mail_sent`, `mail_failed`, or `demo_mode`
- **Elementor Pro Forms** → `POST /api/v1/leads/ingest` on `elementor_pro/forms/new_record`
- **WPForms** → `POST /api/v1/leads/ingest` on `wpforms_process_complete`
- Gravity Forms and Fluent Forms are not wired yet

## Setup

1. In Crawllex: project **Active** → Settings → Integrations → **Download Plugin** → Connect WordPress → copy the key (**View Key** can show it again).
2. In WordPress: upload the zip (or copy this folder), then paste the `clx_ls_…` key. The dashboard URL is already set.
3. Click **Test Connection**. Crawllex then shows this website URL on the WordPress card.
4. Use a Contact Form 7, Elementor, or WPForms form with first name, email, phone, and message. Submit it and confirm the lead in Crawllex `/leads`. Plugin logs show success or the API message.

Pack local vs production zips with the matching `APP_URL` (`.env.local` or `.env.production.local`). Do not use a dashboard user password or access token. Auth is the Lead Source Key only (`X-Lead-Source-Key`).

## Contact Form 7

Spam and validation failures are skipped. Mail failures and CF7 demo/skip-mail still ingest.

Default CF7 tags map automatically (`your-name`, `your-email`, `your-message`). Add a phone field — Crawllex requires it.

```
[text* your-name]
[email* your-email]
[tel* your-phone]
[textarea* your-message]
```

Optional: `[text your-last-name]`. Service / project-type tags stay in `extras`. File uploads are not sent.

If the form omits a mapped name, phone, or message, the plugin still sends the lead when it can find an **email** (mapped or inside extras). Missing name becomes `Website Visitor`. Missing message becomes the extra fields joined together, or `Submitted from the website form.` Missing phone is stored empty. A submit with no email is logged and not sent.

Ingest runs in the same PHP request as the CF7 submit (up to 10 seconds). A Crawllex error does **not** change the visitor-facing CF7 result, but the thank-you waits on that HTTP call. There is no automatic retry; fix the form or connection and submit again.

Idempotency uses `cf7-{formId}-{postedHash}` so a double submit does not create a second row. Replays log as success and do not increment the plugin **Ingested** count.

## Elementor Forms

Requires **Elementor Pro** (the Form widget is a Pro feature). Free Elementor does not include this widget.

The visitor-facing form is not failed if Crawllex ingest errors. Recaptcha, honeypot, and file-upload fields are skipped.

Default Elementor field IDs and labels map automatically (`name`, `email`, `message`, plus Tel field type → phone). Add a **Tel** field — Crawllex requires phone.

| Elementor field | Crawllex |
|-----------------|----------|
| Name (`name` / Full Name) | firstName |
| Email (type `email`) | email |
| Tel (type `tel`) | phone |
| Message (textarea) | message |
| Last Name, Services, other labels | lastName / extras |

If name, phone, or message is missing, the plugin recovers them from extra answers or uses fallbacks. Email is still required.

Ingest runs in the same request (up to 10 seconds). Idempotency uses `el-{formId}-{hash}`.

## WPForms

Works with **WPForms Lite** and Pro. The visitor-facing form is not failed if Crawllex ingest errors. File uploads, captcha, honeypot, HTML, page breaks, and payment-card fields are skipped.

Default labels and field types map automatically (`Name`, `Email`, `Phone`, `Comment or Message`). A Name field with first/last subfields maps to firstName / lastName.

| WPForms field | Crawllex |
|---------------|----------|
| Name (simple or first/last) | firstName / lastName |
| Email (type `email`) | email |
| Phone (type `phone`) | phone |
| Comment or Message / textarea | message |
| Other labels | extras |

If name, phone, or message is missing, the plugin recovers them from extra answers or uses fallbacks. Email is still required.

Ingest runs in the same request (up to 10 seconds). Idempotency uses `wp-{formId}-{hash}`.

## Limits (same as Crawllex ingest)

| Field | Cap |
|-------|-----|
| First / last name | 80 |
| Email | 255 |
| Phone | 40 (at least 7 digits) |
| Message | 5000 |
| Services | 500 |
| Extras | 40 keys · key 80 · value 2000 |
| `leadDate` | `YYYY-MM-DD` or omitted (today) |

## Security

- Capability `manage_options` for settings. CSRF nonce on save / verify.
- Lead Source Key is stored in `wp_options` (`crawllex_lead_capture`, not autoloaded). It is not echoed back in the form. Uninstall deletes the option.
- Outbound HTTP: no redirects, SSL verify on, 64KB response cap. `localhost` is rewritten to `127.0.0.1` for IPv4.
- Plugin logs store only status messages — not the key and not field values.

Plugin **Ingested** / **Failed** counts are local. Dashboard Settings → Integrations shows the Lead Source `ingestCount` / `failedCount` from Crawllex.

## Layout

| File | Role |
|------|------|
| `includes/dashboard-url.php` | Crawllex origin (`CRAWLLEX_LC_DASHBOARD_URL`) stamped at pack time |
| `includes/class-settings.php` | Admin UI, save, Test Connection, version line |
| `includes/class-supported-forms.php` | Settings **Supported Forms** logos + install state |
| `assets/admin.css` | Settings form-logo cards |
| `assets/logo-contact-form-7.png` · `logo-elementor.png` · `logo-wpforms.png` | Official form marks |
| `includes/class-updater.php` | Private update check + zip download against Crawllex |
| `includes/class-client.php` | `verify` / `ingest` / `update` via `wp_remote_*` |
| `includes/class-field-map.php` | Form keys → core fields / extras |
| `includes/class-fill.php` | Recover missing core fields from extras / fallbacks |
| `includes/class-normalizer.php` | Ingest JSON contract + length caps |
| `includes/class-submit.php` | Required-field checks + send + log |
| `includes/forms/class-contact-form-7.php` | `wpcf7_submit` adapter |
| `includes/forms/class-elementor.php` | `elementor_pro/forms/new_record` adapter |
| `includes/forms/class-wpforms.php` | `wpforms_process_complete` adapter |
