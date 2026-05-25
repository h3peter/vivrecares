<?php

require_once 'config.php';

if (!function_exists('ensure_staff_invitation_schema')) {
    function ensure_staff_invitation_schema(PDO $conn)
    {
        static $initialized = false;
        if ($initialized) {
            return;
        }

        $conn->exec("
            CREATE TABLE IF NOT EXISTS staff_invitations (
                invitation_id INT AUTO_INCREMENT PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                role ENUM('Admin', 'Doctor') NOT NULL,
                token_hash VARCHAR(64) NOT NULL,
                invited_by INT NOT NULL,
                accepted_user_id INT DEFAULT NULL,
                expires_at DATETIME NOT NULL,
                accepted_at DATETIME DEFAULT NULL,
                revoked_at DATETIME DEFAULT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_staff_invite_email (email),
                INDEX idx_staff_invite_token_hash (token_hash),
                INDEX idx_staff_invite_status (accepted_at, revoked_at, expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $initialized = true;
    }
}

if (!function_exists('create_staff_invitation_token')) {
    function create_staff_invitation_token()
    {
        return bin2hex(random_bytes(32));
    }
}

if (!function_exists('hash_staff_invitation_token')) {
    function hash_staff_invitation_token($token)
    {
        return hash('sha256', (string) $token);
    }
}

if (!function_exists('get_frontend_invitation_url')) {
    function get_frontend_invitation_url($token)
    {
        $baseUrl = trim((string) app_env('FRONTEND_ORIGIN', app_env('APP_BASE_URL', 'http://localhost:5173')));
        $baseUrl = rtrim($baseUrl, '/');

        return $baseUrl . '/staff-invite/' . rawurlencode((string) $token);
    }
}

?>
