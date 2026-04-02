<?php

require_once __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$GLOBALS['vivre_last_mail_error'] = null;

if (!function_exists('is_mail_enabled')) {
    function is_mail_enabled()
    {
        return filter_var(app_env('MAIL_ENABLED', 'false'), FILTER_VALIDATE_BOOLEAN);
    }
}

if (!function_exists('build_mail_html')) {
    function build_mail_html($title, $message, $actionUrl = null, $actionLabel = 'Open Dashboard')
    {
        $logoCid = 'vivre_logo';
        $safeTitle = htmlspecialchars((string) $title, ENT_QUOTES, 'UTF-8');
        $safeMessage = nl2br(htmlspecialchars((string) $message, ENT_QUOTES, 'UTF-8'));
        $safeActionLabel = htmlspecialchars((string) $actionLabel, ENT_QUOTES, 'UTF-8');
        $safeActionUrl = $actionUrl ? htmlspecialchars((string) $actionUrl, ENT_QUOTES, 'UTF-8') : null;

        $button = '';
        if ($safeActionUrl) {
            $button = '<p style="margin:24px 0 0;">
                <a href="' . $safeActionUrl . '" style="display:inline-block;padding:10px 18px;background:#2f2f2f;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">' . $safeActionLabel . '</a>
            </p>';
        }

        return '<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#f7f7f7;font-family:Arial,sans-serif;color:#1f2937;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
        <tr>
            <td style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
                <img src="cid:' . $logoCid . '" alt="Vivre Medical Group" style="height:44px;width:auto;">
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

if (!function_exists('send_vivre_email')) {
    function send_vivre_email($toEmail, $toName, $subject, $title, $message, $actionUrl = null, $actionLabel = 'Open Dashboard')
    {
        $GLOBALS['vivre_last_mail_error'] = null;

        if (!is_mail_enabled()) {
            $GLOBALS['vivre_last_mail_error'] = 'Mail sending is disabled.';
            return false;
        }

        $resendApiKey = app_env('RESEND_API_KEY', '');
        $smtpHost = app_env('MAIL_HOST', $resendApiKey ? 'smtp.resend.com' : 'smtp.gmail.com');
        $smtpUser = app_env('MAIL_USERNAME', $resendApiKey ? 'resend' : '');
        $smtpPass = app_env('MAIL_PASSWORD', $resendApiKey);
        $smtpPort = (int) app_env('MAIL_PORT', '587');
        $smtpEncryption = strtolower((string) app_env('MAIL_ENCRYPTION', 'tls'));
        $smtpTimeout = max(3, (int) app_env('MAIL_TIMEOUT', '15'));
        $smtpDebugEnabled = filter_var(app_env('MAIL_DEBUG', 'false'), FILTER_VALIDATE_BOOLEAN);
        $fromEmail = app_env('MAIL_FROM_ADDRESS', app_env('RESEND_FROM_ADDRESS', $smtpUser));
        $fromName = app_env('MAIL_FROM_NAME', 'Vivre Medical Group');

        if (!$toEmail || !$smtpUser || !$smtpPass || !$fromEmail) {
            $GLOBALS['vivre_last_mail_error'] = 'Mail configuration is incomplete.';
            return false;
        }

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = $smtpHost;
            $mail->SMTPAuth = true;
            $mail->Username = $smtpUser;
            $mail->Password = $smtpPass;
            if ($smtpEncryption === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            } elseif ($smtpEncryption === 'none' || $smtpEncryption === '') {
                $mail->SMTPSecure = false;
            } else {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            }
            $mail->Port = $smtpPort;
            $mail->Timeout = $smtpTimeout;
            $mail->SMTPKeepAlive = false;
            $mail->CharSet = 'UTF-8';

            if ($smtpDebugEnabled) {
                $mail->SMTPDebug = SMTP::DEBUG_SERVER;
                $mail->Debugoutput = static function ($debugMessage, $level) {
                    error_log('Mailer debug [' . $level . ']: ' . $debugMessage);
                };
            }

            $mail->setFrom($fromEmail, $fromName);
            $mail->addAddress($toEmail, $toName ?: '');

            $logoPath = __DIR__ . '/vivre-black.png';
            if (is_file($logoPath)) {
                $mail->addEmbeddedImage($logoPath, 'vivre_logo');
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = build_mail_html($title, $message, $actionUrl, $actionLabel);
            $mail->AltBody = trim($title . "\n\n" . preg_replace('/\s+/', ' ', strip_tags((string) $message)));

            $mail->send();
            return true;
        } catch (Exception $e) {
            $errorMessage = trim((string) $e->getMessage());
            if ($errorMessage === '') {
                $errorMessage = 'Unknown mail transport error.';
            }

            $GLOBALS['vivre_last_mail_error'] = $errorMessage;
            error_log('Mailer error: ' . $errorMessage);
            return false;
        }
    }
}

if (!function_exists('get_last_mail_error')) {
    function get_last_mail_error()
    {
        return $GLOBALS['vivre_last_mail_error'] ?? null;
    }
}

?>
