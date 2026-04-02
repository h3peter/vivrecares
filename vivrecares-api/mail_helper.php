<?php

require_once __DIR__ . '/vendor/autoload.php';

$GLOBALS['vivre_last_mail_error'] = null;

if (!function_exists('is_mail_enabled')) {
    function is_mail_enabled()
    {
        return filter_var(app_env('MAIL_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
    }
}

if (!function_exists('build_mail_html')) {
    function build_mail_html($title, $message, $actionUrl = null, $actionLabel = 'Open Dashboard', $logoSrc = null)
    {
        $safeTitle = htmlspecialchars((string) $title, ENT_QUOTES, 'UTF-8');
        $safeMessage = nl2br(htmlspecialchars((string) $message, ENT_QUOTES, 'UTF-8'));
        $safeActionLabel = htmlspecialchars((string) $actionLabel, ENT_QUOTES, 'UTF-8');
        $safeActionUrl = $actionUrl ? htmlspecialchars((string) $actionUrl, ENT_QUOTES, 'UTF-8') : null;
        $safeLogoSrc = $logoSrc ? htmlspecialchars((string) $logoSrc, ENT_QUOTES, 'UTF-8') : null;

        $button = '';
        if ($safeActionUrl) {
            $button = '<p style="margin:24px 0 0;">
                <a href="' . $safeActionUrl . '" style="display:inline-block;padding:10px 18px;background:#2f2f2f;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">' . $safeActionLabel . '</a>
            </p>';
        }

        $logoHtml = '';
        if ($safeLogoSrc) {
            $logoHtml = '<img src="' . $safeLogoSrc . '" alt="Vivre Medical Group" style="height:44px;width:auto;">';
        }

        return '<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f7f7f7;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                ' . $logoHtml . '
            </td>
        </tr>
        <tr>
            <td style="padding:24px;">
                <h2 style="margin:0 0 12px;font-size:22px;color:#111827;">' . $safeTitle . '</h2>
                <div style="font-size:15px;line-height:1.6;color:#374151;">' . $safeMessage . '</div>
                ' . $button . '
            </td>
        </tr>
        <tr>
            <td style="padding:14px 24px;background:#fafafa;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                This is an automated update from Vivre Medical Group.
            </td>
        </tr>
    </table>
</body>
</html>';
    }
}

if (!function_exists('get_mail_logo_url')) {
    function get_mail_logo_url()
    {
        $configured = trim((string) app_env('MAIL_LOGO_URL', ''));
        if ($configured !== '') {
            return $configured;
        }

        $appBaseUrl = rtrim((string) app_env('APP_BASE_URL', ''), '/');
        if ($appBaseUrl === '') {
            return null;
        }

        return $appBaseUrl . '/vivrecares-api/vivre-black.png';
    }
}

if (!function_exists('send_via_resend_api')) {
    function send_via_resend_api($toEmail, $toName, $subject, $title, $message, $actionUrl = null, $actionLabel = 'Open Dashboard')
    {
        $apiKey = trim((string) app_env('RESEND_API_KEY', ''));
        $fromEmail = trim((string) app_env('MAIL_FROM_ADDRESS', app_env('RESEND_FROM_ADDRESS', '')));
        $fromName = trim((string) app_env('MAIL_FROM_NAME', 'Vivre Medical Group'));
        $timeout = max(3, (int) app_env('MAIL_TIMEOUT', '15'));

        if ($apiKey === '') {
            $GLOBALS['vivre_last_mail_error'] = 'RESEND_API_KEY is not configured.';
            return false;
        }

        if ($fromEmail === '') {
            $GLOBALS['vivre_last_mail_error'] = 'MAIL_FROM_ADDRESS or RESEND_FROM_ADDRESS is not configured.';
            return false;
        }

        if (!$toEmail) {
            $GLOBALS['vivre_last_mail_error'] = 'Recipient email is required.';
            return false;
        }

        $recipient = trim((string) $toEmail);
        if ($toName) {
            $recipient = trim((string) $toName) . ' <' . $recipient . '>';
        }

        $html = build_mail_html($title, $message, $actionUrl, $actionLabel, get_mail_logo_url());
        $text = trim((string) $title . "\n\n" . preg_replace('/\s+/', ' ', strip_tags((string) $message)));

        $payload = [
            'from' => $fromName !== '' ? ($fromName . ' <' . $fromEmail . '>') : $fromEmail,
            'to' => [$recipient],
            'subject' => (string) $subject,
            'html' => $html,
            'text' => $text,
        ];

        $ch = curl_init('https://api.resend.com/emails');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => $timeout,
        ]);

        $responseBody = curl_exec($ch);
        $curlError = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($responseBody === false) {
            $GLOBALS['vivre_last_mail_error'] = $curlError !== '' ? $curlError : 'Failed to call Resend API.';
            error_log('Resend API error: ' . $GLOBALS['vivre_last_mail_error']);
            return false;
        }

        $decoded = json_decode($responseBody, true);
        if ($httpCode < 200 || $httpCode >= 300) {
            $apiMessage = '';
            if (is_array($decoded)) {
                $apiMessage = trim((string) ($decoded['message'] ?? $decoded['error'] ?? ''));
            }

            $GLOBALS['vivre_last_mail_error'] = $apiMessage !== ''
                ? $apiMessage
                : ('Resend API request failed with HTTP ' . $httpCode . '.');
            error_log('Resend API error: ' . $GLOBALS['vivre_last_mail_error'] . ' Response: ' . $responseBody);
            return false;
        }

        return true;
    }
}

if (!function_exists('send_vivre_email')) {
    function send_vivre_email($toEmail, $toName, $subject, $title, $message, $actionUrl = null, $actionLabel = 'Open Dashboard')
    {
        $GLOBALS['vivre_last_mail_error'] = null;

        if (!is_mail_enabled()) {
            $GLOBALS['vivre_last_mail_error'] = 'Mail sending is disabled.';
            return false;
        }

        return send_via_resend_api($toEmail, $toName, $subject, $title, $message, $actionUrl, $actionLabel);
    }
}

if (!function_exists('get_last_mail_error')) {
    function get_last_mail_error()
    {
        return $GLOBALS['vivre_last_mail_error'] ?? null;
    }
}

?>
