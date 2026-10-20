<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Creates and removes the WordPress application password Crawllex uses to push drafts.
 * WordPress shows the plaintext only once, so it is handed to Crawllex at creation time and never stored here.
 */
final class Crawllex_Lead_Capture_App_Password
{
    public const APP_NAME = 'Crawllex Lead Capture';

    public static function available(): bool
    {
        return class_exists('WP_Application_Passwords')
            && function_exists('wp_is_application_passwords_available')
            && wp_is_application_passwords_available();
    }

    /**
     * @return array{user_id: int, username: string, password: string, uuid: string}|WP_Error
     */
    public static function create(int $user_id)
    {
        if (!self::available()) {
            return new WP_Error(
                'app_passwords_unavailable',
                __('WordPress application passwords are not available on this site. They need HTTPS and must not be disabled by a plugin or filter.', 'crawllex-lead-capture')
            );
        }

        $user = get_userdata($user_id);
        if (!$user) {
            return new WP_Error('user_missing', __('Could not find the WordPress user for this connection.', 'crawllex-lead-capture'));
        }

        $created = WP_Application_Passwords::create_new_application_password($user_id, array(
            'name' => self::APP_NAME,
        ));
        if (is_wp_error($created)) {
            return $created;
        }

        list($password, $item) = $created;
        return array(
            'user_id' => $user_id,
            'username' => (string) $user->user_login,
            'password' => (string) $password,
            'uuid' => (string) $item['uuid'],
        );
    }

    public static function delete(int $user_id, string $uuid): void
    {
        if ($uuid === '' || !class_exists('WP_Application_Passwords')) {
            return;
        }
        WP_Application_Passwords::delete_application_password($user_id, $uuid);
    }
}
