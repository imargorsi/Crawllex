<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Maps form fields onto the Crawllex ingest contract.
 * Known keys become core lead columns; leftover string fields go in extras.
 */
final class Crawllex_Lead_Capture_Normalizer
{
    private const CORE_FIELDS = array(
        'firstName',
        'lastName',
        'email',
        'phone',
        'message',
        'servicesInterestedIn',
        'leadDate',
    );

    private const FIELD_MAX = array(
        'firstName' => CRAWLLEX_LC_NAME_MAX,
        'lastName' => CRAWLLEX_LC_NAME_MAX,
        'email' => CRAWLLEX_LC_EMAIL_MAX,
        'phone' => CRAWLLEX_LC_PHONE_MAX,
        'message' => CRAWLLEX_LC_LEAD_MESSAGE_MAX,
        'servicesInterestedIn' => CRAWLLEX_LC_SERVICES_MAX,
    );

    private const RESERVED_EXTRAS = array(
        'firstName',
        'lastName',
        'email',
        'phone',
        'message',
        'servicesInterestedIn',
        'leadDate',
        'extras',
        'idempotencyKey',
        'pluginVersion',
    );

    /**
     * @param array<string, string> $fields
     * @return array<string, mixed>
     */
    public static function to_ingest_payload(array $fields, string $idempotency_key): array
    {
        $payload = array(
            'idempotencyKey' => self::clip($idempotency_key, 128),
        );
        $extras = array();

        foreach ($fields as $key => $raw) {
            $value = trim((string) $raw);
            if ($value === '') {
                continue;
            }
            if (in_array($key, self::CORE_FIELDS, true)) {
                if ($key === 'leadDate') {
                    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1) {
                        $payload[$key] = $value;
                    }
                    continue;
                }
                $max = self::FIELD_MAX[$key] ?? CRAWLLEX_LC_LEAD_MESSAGE_MAX;
                $payload[$key] = self::clip($value, $max);
                continue;
            }
            if (count($extras) >= CRAWLLEX_LC_EXTRAS_MAX_KEYS) {
                continue;
            }
            $extra_key = self::clip(trim((string) $key), CRAWLLEX_LC_EXTRAS_KEY_MAX);
            if ($extra_key === '' || isset($extras[$extra_key]) || in_array($extra_key, self::RESERVED_EXTRAS, true)) {
                continue;
            }
            $extras[$extra_key] = self::clip($value, CRAWLLEX_LC_EXTRAS_VALUE_MAX);
        }

        if ($extras !== array()) {
            $payload['extras'] = $extras;
        }

        return $payload;
    }

    private static function clip(string $value, int $max): string
    {
        if (function_exists('mb_substr')) {
            return (string) mb_substr($value, 0, $max);
        }
        return substr($value, 0, $max);
    }
}
