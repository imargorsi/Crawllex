<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Crawllex_Lead_Capture_Updater
{
    private const TRANSIENT = 'crawllex_lc_update';
    private const TTL = 43200;

    public static function init(): void
    {
        add_filter('pre_set_site_transient_update_plugins', array(self::class, 'inject_update'));
        add_filter('plugins_api', array(self::class, 'plugin_information'), 10, 3);
    }

    public static function clear_cache(): void
    {
        delete_site_transient(self::TRANSIENT);
        delete_transient(self::TRANSIENT);
    }

    public static function latest_version(): string
    {
        $remote = self::remote();
        if ($remote !== null && $remote['version'] !== '') {
            return $remote['version'];
        }
        return CRAWLLEX_LC_VERSION;
    }

    /**
     * @param mixed $transient
     * @return mixed
     */
    public static function inject_update($transient)
    {
        if (!is_object($transient)) {
            return $transient;
        }

        $remote = self::remote();
        if ($remote === null) {
            return $transient;
        }

        $plugin_file = plugin_basename(CRAWLLEX_LC_FILE);
        $item = (object) array(
            'slug' => $remote['slug'],
            'plugin' => $plugin_file,
            'new_version' => $remote['version'],
            'url' => $remote['homepage'],
            'package' => $remote['download_url'],
            'requires' => $remote['requires'],
            'requires_php' => $remote['requires_php'],
            'tested' => $remote['tested'],
        );

        if (version_compare(CRAWLLEX_LC_VERSION, $remote['version'], '<')) {
            if (!isset($transient->response) || !is_array($transient->response)) {
                $transient->response = array();
            }
            $transient->response[$plugin_file] = $item;
            if (isset($transient->no_update) && is_array($transient->no_update)) {
                unset($transient->no_update[$plugin_file]);
            }
        } else {
            if (!isset($transient->no_update) || !is_array($transient->no_update)) {
                $transient->no_update = array();
            }
            $transient->no_update[$plugin_file] = $item;
            if (isset($transient->response) && is_array($transient->response)) {
                unset($transient->response[$plugin_file]);
            }
        }

        return $transient;
    }

    /**
     * @param mixed $result
     * @param mixed $action
     * @param mixed $args
     * @return mixed
     */
    public static function plugin_information($result, $action, $args)
    {
        if ($action !== 'plugin_information' || !is_object($args) || empty($args->slug)) {
            return $result;
        }
        if ((string) $args->slug !== 'crawllex-lead-capture') {
            return $result;
        }

        $remote = self::remote(true);
        if ($remote === null) {
            return $result;
        }

        return (object) array(
            'name' => $remote['name'],
            'slug' => $remote['slug'],
            'version' => $remote['version'],
            'author' => '<a href="https://crawllex.com">Crawllex</a>',
            'homepage' => $remote['homepage'],
            'requires' => $remote['requires'],
            'tested' => $remote['tested'],
            'requires_php' => $remote['requires_php'],
            'download_link' => $remote['download_url'],
            'sections' => array(
                'description' => 'Send Contact Form 7, Elementor, and WPForms submissions to Crawllex with a Lead Source Key.',
            ),
        );
    }

    /**
     * @return array{slug: string, plugin: string, name: string, version: string, requires: string, requires_php: string, tested: string, homepage: string, download_url: string}|null
     */
    private static function remote(bool $force = false): ?array
    {
        if (!$force) {
            $cached = get_site_transient(self::TRANSIENT);
            if (is_array($cached) && isset($cached['version'])) {
                return self::sanitize_remote($cached);
            }
        }

        $options = Crawllex_Lead_Capture_Plugin::options();
        $dashboard_url = Crawllex_Lead_Capture_Plugin::dashboard_url();
        if ($dashboard_url === '' || $options['source_key'] === '') {
            return null;
        }

        $client = new Crawllex_Lead_Capture_Client($dashboard_url, $options['source_key']);
        $result = $client->update_check();
        if (!$result['ok'] || !is_array($result['data'])) {
            return null;
        }

        $remote = self::sanitize_remote($result['data']);
        if ($remote === null) {
            return null;
        }

        set_site_transient(self::TRANSIENT, $remote, self::TTL);
        return $remote;
    }

    /**
     * @param mixed $raw
     * @return array{slug: string, plugin: string, name: string, version: string, requires: string, requires_php: string, tested: string, homepage: string, download_url: string}|null
     */
    private static function sanitize_remote($raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }

        $version = isset($raw['version']) ? sanitize_text_field((string) $raw['version']) : '';
        $download = isset($raw['downloadUrl'])
            ? esc_url_raw((string) $raw['downloadUrl'])
            : (isset($raw['download_url']) ? esc_url_raw((string) $raw['download_url']) : '');
        if ($version === '' || $download === '') {
            return null;
        }

        return array(
            'slug' => isset($raw['slug']) ? sanitize_key((string) $raw['slug']) : 'crawllex-lead-capture',
            'plugin' => isset($raw['plugin']) ? sanitize_text_field((string) $raw['plugin']) : 'crawllex-lead-capture/crawllex-lead-capture.php',
            'name' => isset($raw['name']) ? sanitize_text_field((string) $raw['name']) : 'Crawllex Lead Capture',
            'version' => $version,
            'requires' => isset($raw['requires']) ? sanitize_text_field((string) $raw['requires']) : '6.2',
            'requires_php' => isset($raw['requiresPhp'])
                ? sanitize_text_field((string) $raw['requiresPhp'])
                : (isset($raw['requires_php']) ? sanitize_text_field((string) $raw['requires_php']) : '8.1'),
            'tested' => isset($raw['tested']) ? sanitize_text_field((string) $raw['tested']) : '',
            'homepage' => isset($raw['homepage']) ? esc_url_raw((string) $raw['homepage']) : 'https://crawllex.com',
            'download_url' => $download,
        );
    }
}
