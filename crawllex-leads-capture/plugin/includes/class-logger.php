<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Crawllex_Lead_Capture_Logger
{
    /**
     * Keep the last 20 plugin-local events. Never store the Lead Source Key.
     *
     * @param array<string, mixed> $extra
     */
    public static function record(string $context, string $status, string $message, array $extra = array()): void
    {
        $options = Crawllex_Lead_Capture_Plugin::options();
        $logs = $options['logs'];
        array_unshift($logs, array(
            'at' => gmdate('c'),
            'context' => $context,
            'status' => $status,
            'message' => self::clip($message),
        ));

        $patch = array(
            'logs' => array_slice($logs, 0, CRAWLLEX_LC_LOG_LIMIT),
        );

        if (isset($extra['last_verified_at'])) {
            $patch['last_verified_at'] = (string) $extra['last_verified_at'];
        }
        if (isset($extra['last_status'])) {
            $patch['last_status'] = (string) $extra['last_status'];
        }

        if ($context === 'ingest') {
            if ($status === 'success') {
                if (empty($extra['replayed'])) {
                    $patch['ingest_count'] = $options['ingest_count'] + 1;
                }
            } else {
                $patch['failed_count'] = $options['failed_count'] + 1;
            }
        }

        Crawllex_Lead_Capture_Plugin::update_options($patch);
    }

    private static function clip(string $message): string
    {
        $message = trim($message);
        if (function_exists('mb_substr')) {
            return (string) mb_substr($message, 0, CRAWLLEX_LC_MESSAGE_MAX);
        }
        return substr($message, 0, CRAWLLEX_LC_MESSAGE_MAX);
    }
}
