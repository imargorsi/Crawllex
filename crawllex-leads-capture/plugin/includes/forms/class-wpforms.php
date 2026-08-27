<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * WPForms → Crawllex ingest. Does not block the visitor form.
 */
final class Crawllex_Lead_Capture_Wpforms
{
    private const SKIP_TYPES = array(
        'file-upload',
        'upload',
        'html',
        'pagebreak',
        'divider',
        'password',
        'signature',
        'captcha',
        'recaptcha',
        'credit-card',
        'stripe-credit-card',
        'content',
        'entry-preview',
        'entry_preview',
        'internal-information',
        'layout',
    );

    private static bool $handled = false;

    public static function init(): void
    {
        add_action('wpforms_process_complete', array(self::class, 'handle'), 10, 4);
    }

    /**
     * @param mixed $fields
     * @param mixed $entry
     * @param mixed $form_data
     * @param mixed $entry_id
     */
    public static function handle($fields, $entry, $form_data, $entry_id): void
    {
        if (self::$handled) {
            return;
        }
        if (!is_array($fields) || $fields === array()) {
            return;
        }

        $posted = self::posted_from_fields($fields);
        if ($posted === array()) {
            return;
        }

        self::$handled = true;

        $mapped = Crawllex_Lead_Capture_Field_Map::from_posted($posted);
        Crawllex_Lead_Capture_Submit::send(
            $mapped,
            self::idempotency_key(self::form_id($form_data), $posted),
        );
    }

    /**
     * @param array<string|int, mixed> $fields
     * @return array<string, mixed>
     */
    private static function posted_from_fields(array $fields): array
    {
        $posted = array();
        $email_from_type = '';
        $phone_from_type = '';
        $message_from_type = '';

        foreach ($fields as $id => $field) {
            if (!is_array($field)) {
                continue;
            }

            $type = isset($field['type']) ? strtolower((string) $field['type']) : '';
            if (in_array($type, self::SKIP_TYPES, true)) {
                continue;
            }

            if ($type === 'name') {
                self::merge_name_field($posted, $field);
                continue;
            }

            $value = $field['value'] ?? '';
            if ($value === '' || $value === null) {
                continue;
            }

            $title = isset($field['name']) ? trim((string) $field['name']) : '';
            $id_key = isset($field['id']) ? (string) $field['id'] : (string) $id;
            $key = self::posted_key($title, $id_key, $type, $posted, $value);
            if ($key !== null) {
                $posted[$key] = $value;
            }

            if ($type === 'email' && $email_from_type === '' && is_scalar($value)) {
                $email_from_type = (string) $value;
            }
            if (($type === 'phone' || $type === 'tel') && $phone_from_type === '' && is_scalar($value)) {
                $phone_from_type = (string) $value;
            }
            if ($type === 'textarea' && $message_from_type === '' && is_scalar($value)) {
                $message_from_type = (string) $value;
            }
        }

        if ($email_from_type !== '' && !isset($posted['email'])) {
            $posted['email'] = $email_from_type;
        }
        if ($phone_from_type !== '' && !isset($posted['phone'])) {
            $posted['phone'] = $phone_from_type;
        }
        if ($message_from_type !== '' && !isset($posted['message'])) {
            $posted['message'] = $message_from_type;
        }

        return $posted;
    }

    /**
     * Prefer first/last subfields when WPForms splits the Name field.
     *
     * @param array<string, mixed> $posted
     * @param array<string, mixed> $field
     */
    private static function merge_name_field(array &$posted, array $field): void
    {
        $first = isset($field['first']) ? trim((string) $field['first']) : '';
        $last = isset($field['last']) ? trim((string) $field['last']) : '';
        $middle = isset($field['middle']) ? trim((string) $field['middle']) : '';

        if ($first !== '') {
            $posted['first name'] = $first;
        }
        if ($last !== '') {
            $posted['last name'] = $last;
        }
        if ($middle !== '') {
            $posted['middle name'] = $middle;
        }
        if ($first !== '' || $last !== '') {
            return;
        }

        $value = $field['value'] ?? '';
        if ($value === '' || $value === null) {
            return;
        }

        $title = isset($field['name']) ? trim((string) $field['name']) : '';
        $id_key = isset($field['id']) ? (string) $field['id'] : '';
        $key = self::posted_key($title, $id_key, 'name', $posted, $value);
        if ($key !== null) {
            $posted[$key] = $value;
        }
    }

    /**
     * Prefer the visible label. Untitled typed fields map to core names.
     * Duplicate labels keep both values instead of overwriting.
     *
     * @param array<string, mixed> $posted
     */
    private static function posted_key(
        string $title,
        string $id_key,
        string $type,
        array $posted,
        mixed $value,
    ): ?string {
        $key = $title;
        if ($key === '') {
            if ($type === 'email') {
                $key = 'email';
            } elseif ($type === 'phone' || $type === 'tel') {
                $key = 'phone';
            } elseif ($type === 'textarea') {
                $key = 'message';
            } elseif ($type === 'name') {
                $key = 'name';
            } else {
                $key = $id_key;
            }
        }
        if ($key === '') {
            return null;
        }
        if (!isset($posted[$key])) {
            return $key;
        }
        if ((string) $posted[$key] === (string) $value) {
            return null;
        }
        $suffix = $id_key !== '' && strcasecmp($id_key, $key) !== 0 ? $id_key : '2';
        $disambiguated = $key . ' (' . $suffix . ')';
        if (!isset($posted[$disambiguated])) {
            return $disambiguated;
        }
        return $key . ' (' . $suffix . '-2)';
    }

    /**
     * @param mixed $form_data
     */
    private static function form_id($form_data): string
    {
        if (!is_array($form_data) || !isset($form_data['id'])) {
            return '0';
        }
        $value = (string) $form_data['id'];
        $safe = preg_replace('/[^A-Za-z0-9._:-]/', '', $value);
        if (is_string($safe) && $safe !== '') {
            return substr($safe, 0, 40);
        }
        return '0';
    }

    /**
     * @param array<string, mixed> $posted
     */
    private static function idempotency_key(string $form_id, array $posted): string
    {
        $encoded = wp_json_encode($posted);
        $suffix = hash('sha256', $form_id . '|' . (is_string($encoded) ? $encoded : ''));
        return 'wp-' . $form_id . '-' . substr($suffix, 0, 40);
    }
}
