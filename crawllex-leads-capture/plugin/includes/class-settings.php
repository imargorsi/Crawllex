<?php

if (!defined('ABSPATH')) {
    exit;
}

final class Crawllex_Lead_Capture_Settings
{
    public static function init(): void
    {
        add_action('admin_menu', array(self::class, 'register_page'));
        add_action('admin_enqueue_scripts', array('Crawllex_Lead_Capture_Supported_Forms', 'enqueue'));
        add_action('admin_init', array(self::class, 'handle_post'));
        add_action('admin_notices', array(self::class, 'notices'));
    }

    public static function register_page(): void
    {
        add_options_page(
            __('Crawllex Lead Capture', 'crawllex-lead-capture'),
            __('Crawllex Lead Capture', 'crawllex-lead-capture'),
            'manage_options',
            'crawllex-lead-capture',
            array(self::class, 'render_page')
        );
    }

    public static function handle_post(): void
    {
        if (!is_admin() || !current_user_can('manage_options')) {
            return;
        }
        $page = isset($_REQUEST['page']) ? sanitize_key((string) wp_unslash($_REQUEST['page'])) : '';
        if ($page !== 'crawllex-lead-capture') {
            return;
        }
        if (!isset($_POST['crawllex_lc_action'])) {
            return;
        }
        check_admin_referer('crawllex_lc_settings');

        $action = sanitize_key((string) wp_unslash($_POST['crawllex_lc_action']));
        if ($action !== 'save' && $action !== 'verify') {
            self::set_notice('error', __('Invalid request.', 'crawllex-lead-capture'));
            self::redirect();
        }

        $posted_key = trim((string) wp_unslash($_POST['crawllex_lc_source_key'] ?? ''));
        $existing = Crawllex_Lead_Capture_Plugin::options();
        $source_key = $existing['source_key'];

        if ($posted_key !== '') {
            $source_key = self::sanitize_source_key($posted_key);
            if ($source_key === '') {
                self::set_notice('error', __('Enter a valid lead source key.', 'crawllex-lead-capture'));
                self::redirect();
            }
        }

        Crawllex_Lead_Capture_Plugin::update_options(array(
            'source_key' => $source_key,
        ));

        if ($action === 'save') {
            self::set_notice('success', __('Settings saved.', 'crawllex-lead-capture'));
            self::redirect();
        }

        $dashboard_url = Crawllex_Lead_Capture_Plugin::dashboard_url();
        if ($dashboard_url === '' || $source_key === '') {
            self::set_notice('error', __('Enter the lead source key first.', 'crawllex-lead-capture'));
            self::redirect();
        }

        $client = new Crawllex_Lead_Capture_Client($dashboard_url, $source_key);
        $result = $client->verify();

        if ($result['ok']) {
            Crawllex_Lead_Capture_Updater::clear_cache();
            Crawllex_Lead_Capture_Logger::record('verify', 'success', $result['message'], array(
                'last_verified_at' => gmdate('c'),
                'last_status' => 'connected',
            ));
            self::set_notice('success', $result['message']);
            self::redirect();
        }

        Crawllex_Lead_Capture_Logger::record('verify', 'failed', $result['message'], array(
            'last_status' => 'error',
        ));
        self::set_notice('error', $result['message']);
        self::redirect();
    }

    public static function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }

        $options = Crawllex_Lead_Capture_Plugin::options();
        $latest = Crawllex_Lead_Capture_Updater::latest_version();
        ?>
        <div class="wrap">
            <h1>
                <img
                    src="<?php echo esc_url(plugins_url('assets/favicon.png', CRAWLLEX_LC_FILE)); ?>"
                    alt=""
                    width="32"
                    height="32"
                    style="display:inline-block;vertical-align:middle;margin-right:8px;"
                />
                <?php echo esc_html__('Crawllex Lead Capture', 'crawllex-lead-capture'); ?>
            </h1>
            <p><?php echo esc_html__('Paste the lead source key from Crawllex Settings → Integrations.', 'crawllex-lead-capture'); ?></p>
            <?php Crawllex_Lead_Capture_Supported_Forms::render(); ?>
            <p>
                <strong><?php echo esc_html__('Current Version', 'crawllex-lead-capture'); ?>:</strong>
                <?php echo esc_html(CRAWLLEX_LC_VERSION); ?>
                ·
                <strong><?php echo esc_html__('Latest Version', 'crawllex-lead-capture'); ?>:</strong>
                <?php echo esc_html($latest); ?>
            </p>

            <form method="post" action="<?php echo esc_url(admin_url('options-general.php?page=crawllex-lead-capture')); ?>" autocomplete="off">
                <?php wp_nonce_field('crawllex_lc_settings'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row"><?php echo esc_html__('Dashboard Base URL', 'crawllex-lead-capture'); ?></th>
                        <td>
                            <code><?php echo esc_html(Crawllex_Lead_Capture_Plugin::dashboard_url()); ?></code>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <label for="crawllex_lc_source_key"><?php echo esc_html__('Lead Source Key', 'crawllex-lead-capture'); ?></label>
                        </th>
                        <td>
                            <input
                                type="password"
                                class="regular-text"
                                id="crawllex_lc_source_key"
                                name="crawllex_lc_source_key"
                                value=""
                                autocomplete="new-password"
                                placeholder="<?php echo $options['source_key'] !== ''
                                    ? esc_attr__('Leave blank to keep the stored key.', 'crawllex-lead-capture')
                                    : ''; ?>"
                            />
                            <?php if ($options['source_key'] !== '') : ?>
                                <p class="description">
                                    <?php echo esc_html(sprintf(
                                        /* translators: %s: last four characters of the stored key */
                                        __('Key ending in %s.', 'crawllex-lead-capture'),
                                        self::key_suffix($options['source_key'])
                                    )); ?>
                                </p>
                            <?php endif; ?>
                        </td>
                    </tr>
                </table>

                <?php if ($options['last_status'] !== '') : ?>
                    <p>
                        <strong><?php echo esc_html__('Status', 'crawllex-lead-capture'); ?>:</strong>
                        <?php echo esc_html(ucfirst($options['last_status'])); ?>
                        <?php if ($options['last_verified_at'] !== '') : ?>
                            · <?php echo esc_html(sprintf(
                                /* translators: %s: timestamp */
                                __('Last Verified %s', 'crawllex-lead-capture'),
                                $options['last_verified_at']
                            )); ?>
                        <?php endif; ?>
                    </p>
                <?php endif; ?>

                <p>
                    <strong><?php echo esc_html__('Ingested', 'crawllex-lead-capture'); ?>:</strong>
                    <?php echo esc_html((string) $options['ingest_count']); ?>
                    ·
                    <strong><?php echo esc_html__('Failed', 'crawllex-lead-capture'); ?>:</strong>
                    <?php echo esc_html((string) $options['failed_count']); ?>
                </p>

                <p class="submit">
                    <button type="submit" class="button button-primary" name="crawllex_lc_action" value="save">
                        <?php echo esc_html__('Save Settings', 'crawllex-lead-capture'); ?>
                    </button>
                    <button type="submit" class="button" name="crawllex_lc_action" value="verify">
                        <?php echo esc_html__('Test Connection', 'crawllex-lead-capture'); ?>
                    </button>
                </p>
            </form>

            <h2><?php echo esc_html__('Recent Events', 'crawllex-lead-capture'); ?></h2>
            <?php if ($options['logs'] === array()) : ?>
                <p><?php echo esc_html__('No plugin events yet. Test the connection to confirm the key works.', 'crawllex-lead-capture'); ?></p>
            <?php else : ?>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th><?php echo esc_html__('Time', 'crawllex-lead-capture'); ?></th>
                            <th><?php echo esc_html__('Context', 'crawllex-lead-capture'); ?></th>
                            <th><?php echo esc_html__('Status', 'crawllex-lead-capture'); ?></th>
                            <th><?php echo esc_html__('Message', 'crawllex-lead-capture'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($options['logs'] as $row) : ?>
                            <tr>
                                <td><?php echo esc_html((string) ($row['at'] ?? '')); ?></td>
                                <td><?php echo esc_html((string) ($row['context'] ?? '')); ?></td>
                                <td><?php echo esc_html((string) ($row['status'] ?? '')); ?></td>
                                <td><?php echo esc_html((string) ($row['message'] ?? '')); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    public static function notices(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'settings_page_crawllex-lead-capture') {
            return;
        }

        $notice = get_transient('crawllex_lc_notice');
        if (!is_array($notice) || empty($notice['message'])) {
            return;
        }
        delete_transient('crawllex_lc_notice');
        $class = ($notice['type'] ?? '') === 'error' ? 'notice-error' : 'notice-success';
        printf(
            '<div class="notice %1$s is-dismissible"><p>%2$s</p></div>',
            esc_attr($class),
            esc_html((string) $notice['message'])
        );
    }

    private static function sanitize_source_key(string $value): string
    {
        $value = trim($value);
        $pattern = '/^' . preg_quote(CRAWLLEX_LC_KEY_PREFIX, '/') . '[a-fA-F0-9]{' . CRAWLLEX_LC_KEY_HEX_LENGTH . '}$/';
        if (preg_match($pattern, $value) !== 1) {
            return '';
        }
        return CRAWLLEX_LC_KEY_PREFIX . strtolower(substr($value, strlen(CRAWLLEX_LC_KEY_PREFIX)));
    }

    private static function key_suffix(string $value): string
    {
        $secret = str_starts_with($value, CRAWLLEX_LC_KEY_PREFIX)
            ? substr($value, strlen(CRAWLLEX_LC_KEY_PREFIX))
            : $value;
        return substr($secret, -4);
    }

    private static function set_notice(string $type, string $message): void
    {
        set_transient('crawllex_lc_notice', array(
            'type' => $type,
            'message' => $message,
        ), 30);
    }

    private static function redirect(): void
    {
        wp_safe_redirect(admin_url('options-general.php?page=crawllex-lead-capture'));
        exit;
    }
}
