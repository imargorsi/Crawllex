<?php

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Settings page: supported form logos and install state.
 */
final class Crawllex_Lead_Capture_Supported_Forms
{
    public static function enqueue(string $hook): void
    {
        if ($hook !== 'settings_page_crawllex-lead-capture') {
            return;
        }

        wp_enqueue_style(
            'crawllex-lead-capture-admin',
            plugins_url('assets/admin.css', CRAWLLEX_LC_FILE),
            array(),
            CRAWLLEX_LC_VERSION
        );
    }

    public static function render(): void
    {
        ?>
        <div class="crawllex-lc-forms">
            <h2 class="crawllex-lc-forms-title"><?php echo esc_html__('Supported Forms', 'crawllex-lead-capture'); ?></h2>
            <p class="crawllex-lc-forms-help">
                <?php echo esc_html__('Submissions from these forms are sent to Crawllex after a successful submit. Email is required. If name, phone, or message is missing, Crawllex fills what it can and keeps other answers as extra fields.', 'crawllex-lead-capture'); ?>
            </p>
            <div class="crawllex-lc-forms-grid">
                <?php foreach (self::partners() as $partner) : ?>
                    <?php self::render_card($partner); ?>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
    }

    /**
     * @return list<array{id: string, name: string, file: string, well: string, state: string, state_class: string}>
     */
    private static function partners(): array
    {
        $elementor = self::elementor_state();
        $cf7_active = defined('WPCF7_VERSION');
        $wpforms_active = function_exists('wpforms');

        return array(
            array(
                'id' => 'contact-form-7',
                'name' => __('Contact Form 7', 'crawllex-lead-capture'),
                'file' => 'logo-contact-form-7.png',
                'well' => '',
                'state' => self::installed_state($cf7_active),
                'state_class' => $cf7_active ? 'is-active' : '',
            ),
            array(
                'id' => 'elementor',
                'name' => __('Elementor Forms', 'crawllex-lead-capture'),
                'file' => 'logo-elementor.png',
                'well' => 'is-dark',
                'state' => $elementor['label'],
                'state_class' => $elementor['class'],
            ),
            array(
                'id' => 'wpforms',
                'name' => __('WPForms', 'crawllex-lead-capture'),
                'file' => 'logo-wpforms.png',
                'well' => 'is-dark is-wide',
                'state' => self::installed_state($wpforms_active),
                'state_class' => $wpforms_active ? 'is-active' : '',
            ),
        );
    }

    /**
     * @return array{label: string, class: string}
     */
    private static function elementor_state(): array
    {
        if (defined('ELEMENTOR_PRO_VERSION')) {
            return array(
                'label' => __('Active', 'crawllex-lead-capture'),
                'class' => 'is-active',
            );
        }
        if (defined('ELEMENTOR_VERSION')) {
            return array(
                'label' => __('Needs Elementor Pro', 'crawllex-lead-capture'),
                'class' => 'is-warn',
            );
        }
        return array(
            'label' => __('Not Installed', 'crawllex-lead-capture'),
            'class' => '',
        );
    }

    private static function installed_state(bool $is_active): string
    {
        return $is_active
            ? __('Active', 'crawllex-lead-capture')
            : __('Not Installed', 'crawllex-lead-capture');
    }

    /**
     * @param array{id: string, name: string, file: string, well: string, state: string, state_class: string} $partner
     */
    private static function render_card(array $partner): void
    {
        $src = plugins_url('assets/' . $partner['file'], CRAWLLEX_LC_FILE);
        $logo_class = 'crawllex-lc-form-logo';
        if ($partner['well'] !== '') {
            $logo_class .= ' ' . $partner['well'];
        }
        $state_class = 'crawllex-lc-form-state';
        if ($partner['state_class'] !== '') {
            $state_class .= ' ' . $partner['state_class'];
        }
        ?>
        <div class="crawllex-lc-form-card">
            <span class="<?php echo esc_attr($logo_class); ?>">
                <img src="<?php echo esc_url($src); ?>" alt="" width="112" height="40" />
            </span>
            <span class="crawllex-lc-form-meta">
                <span class="crawllex-lc-form-name"><?php echo esc_html($partner['name']); ?></span>
                <span class="<?php echo esc_attr($state_class); ?>"><?php echo esc_html($partner['state']); ?></span>
            </span>
        </div>
        <?php
    }
}
