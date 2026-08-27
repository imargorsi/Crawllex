<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Maps posted form keys onto Crawllex core fields. Leftovers stay as extras.
 * First match wins per core field.
 */
final class Crawllex_Lead_Capture_Field_Map
{
    private const CORE_ALIASES = array(
        'name' => 'firstName',
        'full name' => 'firstName',
        'fullname' => 'firstName',
        'your name' => 'firstName',
        'first name' => 'firstName',
        'firstname' => 'firstName',
        'first-name' => 'firstName',
        'fname' => 'firstName',
        'given name' => 'firstName',
        'your first name' => 'firstName',

        'last name' => 'lastName',
        'lastname' => 'lastName',
        'last-name' => 'lastName',
        'lname' => 'lastName',
        'surname' => 'lastName',
        'family name' => 'lastName',
        'your last name' => 'lastName',

        'email' => 'email',
        'e mail' => 'email',
        'e-mail' => 'email',
        'email address' => 'email',
        'your email' => 'email',
        'customer email' => 'email',
        'client email' => 'email',
        'contact email' => 'email',

        'phone' => 'phone',
        'phone number' => 'phone',
        'your phone' => 'phone',
        'your phone number' => 'phone',
        'your tel' => 'phone',
        'tel' => 'phone',
        'telephone' => 'phone',
        'mobile' => 'phone',
        'mobile number' => 'phone',
        'cell' => 'phone',
        'cell phone' => 'phone',
        'contact number' => 'phone',

        'message' => 'message',
        'your message' => 'message',
        'inquiry' => 'message',
        'enquiry' => 'message',
        'comments' => 'message',
        'comment' => 'message',
        'description' => 'message',
        'note' => 'message',
        'notes' => 'message',
        'details' => 'message',

        'lead message' => 'message',
        'comment or message' => 'message',

        'date' => 'leadDate',
        'lead date' => 'leadDate',
        'created date' => 'leadDate',
        'submission date' => 'leadDate',
        'submitted' => 'leadDate',
        'submitted at' => 'leadDate',
        'submitted on' => 'leadDate',
        'entry date' => 'leadDate',
    );

    private const SKIP_PREFIXES = array('_wpcf7', '_', 'g-recaptcha', 'h-captcha', 'cf-turnstile', 'akismet');

    /**
     * @param array<string, mixed> $posted
     * @return array<string, string>
     */
    public static function from_posted(array $posted): array
    {
        $mapped = array();
        $extras = array();

        foreach ($posted as $key => $raw) {
            if (!is_string($key) || self::should_skip($key)) {
                continue;
            }
            $value = self::stringify($raw);
            if ($value === '') {
                continue;
            }

            $field = self::guess_core_field($key);
            if ($field !== null && !isset($mapped[$field])) {
                $mapped[$field] = $value;
                continue;
            }

            $extras[$key] = $value;
        }

        return array_merge($mapped, $extras);
    }

    public static function guess_core_field(string $key): ?string
    {
        if (isset(self::CORE_ALIASES[$key])) {
            return self::CORE_ALIASES[$key];
        }
        $normalized = strtolower(trim($key));
        $normalized = (string) preg_replace('/[_-]+/', ' ', $normalized);
        $normalized = (string) preg_replace('/\s+/', ' ', $normalized);
        return self::CORE_ALIASES[$normalized] ?? null;
    }

    private static function should_skip(string $key): bool
    {
        $lower = strtolower($key);
        foreach (self::SKIP_PREFIXES as $prefix) {
            if (str_starts_with($lower, $prefix)) {
                return true;
            }
        }
        return false;
    }

    private static function stringify(mixed $raw): string
    {
        if (is_array($raw)) {
            $parts = array();
            foreach ($raw as $item) {
                if (is_scalar($item)) {
                    $part = self::clean_text((string) $item);
                    if ($part !== '') {
                        $parts[] = $part;
                    }
                }
            }
            return implode(', ', $parts);
        }
        if (is_scalar($raw)) {
            return self::clean_text((string) $raw);
        }
        return '';
    }

    private static function clean_text(string $value): string
    {
        $value = str_replace("\0", '', $value);
        return trim($value);
    }
}
