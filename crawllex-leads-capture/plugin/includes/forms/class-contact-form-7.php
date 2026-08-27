<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Contact Form 7 → Crawllex ingest. Does not block the visitor form.
 */
final class Crawllex_Lead_Capture_Contact_Form_7
{
    private const ACCEPT_STATUSES = array('mail_sent', 'mail_failed', 'demo_mode');

    private static bool $handled = false;

    public static function init(): void
    {
        add_action('wpcf7_submit', array(self::class, 'handle'), 10, 2);
    }

    /**
     * @param mixed $form
     * @param mixed $result
     */
    public static function handle($form, $result): void
    {
        if (self::$handled) {
            return;
        }
        if (!is_array($result) || !isset($result['status'])) {
            return;
        }
        if (!in_array((string) $result['status'], self::ACCEPT_STATUSES, true)) {
            return;
        }
        if (!class_exists('WPCF7_Submission')) {
            return;
        }

        $submission = WPCF7_Submission::get_instance();
        if (!$submission) {
            return;
        }

        $posted = $submission->get_posted_data();
        if (!is_array($posted)) {
            return;
        }

        self::$handled = true;

        $form_id = (is_object($form) && method_exists($form, 'id')) ? (int) $form->id() : 0;
        $posted_hash = isset($result['posted_data_hash']) ? (string) $result['posted_data_hash'] : '';
        $fields = Crawllex_Lead_Capture_Field_Map::from_posted($posted);
        Crawllex_Lead_Capture_Submit::send(
            $fields,
            self::idempotency_key($form_id, $posted_hash, $posted),
        );
    }

    /**
     * @param array<string, mixed> $posted
     */
    private static function idempotency_key(int $form_id, string $posted_hash, array $posted): string
    {
        $suffix = $posted_hash;
        if ($suffix === '' || !preg_match('/^[A-Za-z0-9._:-]+$/', $suffix)) {
            $encoded = wp_json_encode($posted);
            $suffix = hash('sha256', $form_id . '|' . (is_string($encoded) ? $encoded : ''));
        }

        return 'cf7-' . $form_id . '-' . substr($suffix, 0, 40);
    }
}
