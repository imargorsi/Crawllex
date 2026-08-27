<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Crawllex_Lead_Capture_Plugin
{
    public static function init(): void
    {
        load_plugin_textdomain(
            'crawllex-lead-capture',
            false,
            dirname(plugin_basename(CRAWLLEX_LC_FILE)) . '/languages'
        );

        Crawllex_Lead_Capture_Updater::init();
        if (is_admin()) {
            Crawllex_Lead_Capture_Settings::init();
        }
        Crawllex_Lead_Capture_Forms::init();
    }

    public static function dashboard_url(): string
    {
        if (!defined('CRAWLLEX_LC_DASHBOARD_URL')) {
            return '';
        }
        return untrailingslashit((string) CRAWLLEX_LC_DASHBOARD_URL);
    }

    /**
     * @return array{base_url: string, source_key: string, last_verified_at: string, last_status: string, ingest_count: int, failed_count: int, logs: array<int, array<string, string>>}
     */
    public static function options(): array
    {
        $stored = get_option(CRAWLLEX_LC_OPTION, array());
        if (!is_array($stored)) {
            $stored = array();
        }

        return array(
            'base_url' => isset($stored['base_url']) ? (string) $stored['base_url'] : '',
            'source_key' => isset($stored['source_key']) ? (string) $stored['source_key'] : '',
            'last_verified_at' => isset($stored['last_verified_at']) ? (string) $stored['last_verified_at'] : '',
            'last_status' => isset($stored['last_status']) ? (string) $stored['last_status'] : '',
            'ingest_count' => isset($stored['ingest_count']) ? (int) $stored['ingest_count'] : 0,
            'failed_count' => isset($stored['failed_count']) ? (int) $stored['failed_count'] : 0,
            'logs' => self::sanitize_logs($stored['logs'] ?? array()),
        );
    }

    /**
     * @param array<string, mixed> $patch
     */
    public static function update_options(array $patch): void
    {
        $current = self::options();
        $allowed = array(
            'base_url',
            'source_key',
            'last_verified_at',
            'last_status',
            'ingest_count',
            'failed_count',
            'logs',
        );
        $clean = array();
        foreach ($allowed as $key) {
            if (array_key_exists($key, $patch)) {
                $clean[$key] = $patch[$key];
            }
        }
        update_option(CRAWLLEX_LC_OPTION, array_merge($current, $clean), false);
    }

    /**
     * @param mixed $raw
     * @return array<int, array<string, string>>
     */
    private static function sanitize_logs($raw): array
    {
        if (!is_array($raw)) {
            return array();
        }
        $logs = array();
        foreach ($raw as $row) {
            if (!is_array($row)) {
                continue;
            }
            $logs[] = array(
                'at' => isset($row['at']) ? (string) $row['at'] : '',
                'context' => isset($row['context']) ? (string) $row['context'] : '',
                'status' => isset($row['status']) ? (string) $row['status'] : '',
                'message' => isset($row['message']) ? (string) $row['message'] : '',
            );
        }
        return $logs;
    }
}
