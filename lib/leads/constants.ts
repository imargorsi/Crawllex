export const LEAD_ORIGINS = ["csv_import", "manual", "wordpress"] as const;

/** WordPress (and later providers) live on `LeadSource`, not `ProjectIntegration`. */
export const LEAD_SOURCE_PROVIDERS = ["wordpress"] as const;

export const LEAD_SOURCE_PROVIDER = "wordpress" as const;

/**
 * `error` is reserved. Ingest failures stay `connected` and use `lastError` /
 * `failedCount`. Flipping status to `error` would 401 the plugin because
 * `findLeadSourceByPlainKey` only matches `connected`.
 */
export const LEAD_SOURCE_STATUSES = ["connected", "error"] as const;

/** Human-readable default name on Settings → Integrations. */
export const LEAD_SOURCE_DEFAULT_NAME = "WordPress";

/** Plaintext keys start with this prefix so operators can recognize them. */
export const LEAD_SOURCE_KEY_PREFIX = "clx_ls_";

/** Random bytes used after the prefix (hex-encoded). */
export const LEAD_SOURCE_KEY_BYTES = 32;

/** Max length for the WordPress site URL stored on a lead source. */
export const LEAD_SOURCE_SITE_URL_MAX_LENGTH = 500;

export const LEAD_SOURCE_KEY_UNAVAILABLE_MESSAGE =
  "This lead source key cannot be displayed. Disconnect and connect again.";

/** MVP: one WordPress source per project in API/UI. Drop the unique `{ projectId, provider }` index when 1:N ships. */
export const LEAD_SOURCE_MVP_MAX_PER_PROJECT = 1;

export const LEAD_DEFAULT_PER_PAGE = 10;

export const LEAD_MAX_PER_PAGE = 100;

export const LEAD_IMPORT_MAX_FILE_BYTES = 2 * 1024 * 1024;

/**
 * Public downloads for the plugin zip and sample CSV (`public/resources/`).
 * Do not put these under `/leads` (App Router page).
 */
export const PUBLIC_RESOURCES_DIR = "resources";

export const LEAD_IMPORT_SAMPLE_CSV_FILENAME = "crawllex_sample_sheet.csv";

export const LEAD_IMPORT_SAMPLE_CSV_HREF = `/${PUBLIC_RESOURCES_DIR}/${LEAD_IMPORT_SAMPLE_CSV_FILENAME}`;

export const LEAD_IMPORT_MAX_ROWS = 2_000;

/** Max length for each of firstName / lastName. */
export const LEAD_NAME_MAX_LENGTH = 80;

export const LEAD_EMAIL_MAX_LENGTH = 255;

export const LEAD_PHONE_MAX_LENGTH = 40;

export const LEAD_SERVICES_MAX_LENGTH = 500;

export const LEAD_MESSAGE_MAX_LENGTH = 5_000;

/** Unmapped CSV columns kept on the lead as string extras. */
export const LEAD_EXTRAS_MAX_KEYS = 40;

export const LEAD_EXTRAS_KEY_MAX_LENGTH = 80;

export const LEAD_EXTRAS_VALUE_MAX_LENGTH = 2_000;

/** Required mapped CSV / form fields. */
export const LEAD_REQUIRED_FIELDS = ["firstName", "email", "phone", "message"] as const;

/** Optional mapped fields (lastName / services may be empty; date may default to today). */
export const LEAD_OPTIONAL_FIELDS = ["lastName", "servicesInterestedIn", "leadDate"] as const;

export const LEAD_FIELDS = [...LEAD_REQUIRED_FIELDS, ...LEAD_OPTIONAL_FIELDS] as const;

/** Sentinel in import mapping UI / API: do not map a CSV column; use today's date. */
export const LEAD_DATE_USE_TODAY = "__today__";

/** Sentinel in import mapping UI: skip optional column. */
export const LEAD_FIELD_SKIP = "__ignore__";

/** Sentinel in import extras UI: keep unmapped CSV column on the lead. */
export const LEAD_EXTRAS_KEEP = "__keep__";

export const LEAD_DUPLICATE_MESSAGE = "A lead with this email and phone already exists.";

/** Plugin / ingest auth. Prefer this header; `Authorization: Bearer <key>` also works. */
export const LEAD_INGEST_KEY_HEADER = "x-lead-source-key";

export const LEAD_INGEST_PLUGIN_VERSION_MAX_LENGTH = 40;

export const LEAD_INGEST_IDEMPOTENCY_KEY_MIN_LENGTH = 8;

export const LEAD_INGEST_IDEMPOTENCY_KEY_MAX_LENGTH = 128;

export const LEAD_SOURCE_LAST_ERROR_MAX_LENGTH = 200;

export const LEAD_INGEST_VERIFY_RATE_MAX = 20;

export const LEAD_INGEST_RATE_MAX = 60;

/** WordPress plugin slug (folder + bootstrap basename inside the zip). */
export const WP_PLUGIN_SLUG = "crawllex-lead-capture";

export const WP_PLUGIN_BOOTSTRAP_FILE = "crawllex-lead-capture.php";

export const WP_PLUGIN_BASENAME = `${WP_PLUGIN_SLUG}/${WP_PLUGIN_BOOTSTRAP_FILE}`;

export const WP_PLUGIN_NAME = "Crawllex Lead Capture";

export const WP_PLUGIN_HOMEPAGE = "https://crawllex.com";

export const WP_PLUGIN_REQUIRES_WP = "6.2";

export const WP_PLUGIN_REQUIRES_PHP = "8.1";

export const WP_PLUGIN_TESTED_WP = "6.8";

/** Repo folder that holds plugin source + the single latest zip. */
export const WP_PLUGIN_DIST_DIR = "crawllex-leads-capture";

export const WP_PLUGIN_SOURCE_SUBDIR = "plugin";

/** Stable zip name — replace this file on each release; do not keep versioned copies. */
export const WP_PLUGIN_ZIP_FILENAME = "crawllex-lead-capture.zip";

/** Public static zip (`public/resources/…`), next to the sample CSV. */
export const WP_PLUGIN_ZIP_HREF = `/${PUBLIC_RESOURCES_DIR}/${WP_PLUGIN_ZIP_FILENAME}`;

export const WP_PLUGIN_UPDATE_PATH = "/api/v1/leads/plugin/update";

export const LEAD_PLUGIN_UPDATE_RATE_MAX = 20;

/** Public ingest JSON cap (core fields + extras). */
export const LEAD_INGEST_MAX_BODY_BYTES = 128 * 1024;

export const LEAD_INGEST_INACTIVE_MESSAGE = "Project must be active to ingest leads.";
