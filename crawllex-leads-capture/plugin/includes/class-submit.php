<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Crawllex_Lead_Capture_Submit
{
    /**
     * @param array<string, string> $fields
     */
    public static function send(array $fields, string $idempotency_key): void
    {
        $options = Crawllex_Lead_Capture_Plugin::options();
        $dashboard_url = Crawllex_Lead_Capture_Plugin::dashboard_url();
        if ($dashboard_url === '' || $options['source_key'] === '') {
            Crawllex_Lead_Capture_Logger::record(
                'ingest',
                'failed',
                'Lead source key is not set.',
            );
            return;
        }

        $fields = Crawllex_Lead_Capture_Fill::prepare($fields);

        if (!isset($fields['email']) || !is_email(trim($fields['email']))) {
            Crawllex_Lead_Capture_Logger::record(
                'ingest',
                'failed',
                'Email is required. Add an email field or a field that contains an email address.',
            );
            return;
        }

        if (isset($fields['phone']) && trim($fields['phone']) !== '') {
            $digits = preg_replace('/\D+/', '', $fields['phone']);
            if (!is_string($digits) || strlen($digits) < 7) {
                unset($fields['phone']);
            }
        }

        $payload = Crawllex_Lead_Capture_Normalizer::to_ingest_payload($fields, $idempotency_key);
        $client = new Crawllex_Lead_Capture_Client($dashboard_url, $options['source_key']);
        $result = $client->ingest($payload);
        Crawllex_Lead_Capture_Logger::record(
            'ingest',
            $result['ok'] ? 'success' : 'failed',
            $result['message'],
            array(
                'replayed' => $result['ok'] && $result['status'] === 200,
            ),
        );
    }
}
