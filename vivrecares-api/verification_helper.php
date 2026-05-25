<?php

require_once 'config.php';

if (!function_exists('ensure_email_verification_schema')) {
    function ensure_email_verification_schema(PDO $conn)
    {
        static $initialized = false;
        if ($initialized) {
            return;
        }

        $conn->exec("
            CREATE TABLE IF NOT EXISTS email_verifications (
                verification_id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                purpose VARCHAR(100) NOT NULL,
                code_hash VARCHAR(255) NOT NULL,
                code_expires_at DATETIME NOT NULL,
                verified_token_hash VARCHAR(255) DEFAULT NULL,
                verified_at DATETIME DEFAULT NULL,
                token_expires_at DATETIME DEFAULT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_email_purpose (email, purpose)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $columnStmt = $conn->query("SHOW COLUMNS FROM users LIKE 'email_verified_at'");
        if (!$columnStmt->fetch(PDO::FETCH_ASSOC)) {
            $conn->exec("ALTER TABLE users ADD COLUMN email_verified_at DATETIME NULL AFTER email");
        }

        $initialized = true;
    }
}

if (!function_exists('verification_purpose_patient_registration')) {
    function verification_purpose_patient_registration()
    {
        return 'patient_registration';
    }
}

if (!function_exists('verification_purpose_profile_email_change')) {
    function verification_purpose_profile_email_change()
    {
        return 'profile_email_change';
    }
}

if (!function_exists('create_email_verification_code')) {
    function create_email_verification_code(PDO $conn, $email, $purpose)
    {
        ensure_email_verification_schema($conn);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $codeHash = password_hash($code, PASSWORD_DEFAULT);
        $codeExpiresAt = (new DateTimeImmutable('+10 minutes'))->format('Y-m-d H:i:s');

        $stmt = $conn->prepare("
            INSERT INTO email_verifications (email, purpose, code_hash, code_expires_at, verified_token_hash, verified_at, token_expires_at)
            VALUES (?, ?, ?, ?, NULL, NULL, NULL)
            ON DUPLICATE KEY UPDATE
                code_hash = VALUES(code_hash),
                code_expires_at = VALUES(code_expires_at),
                verified_token_hash = NULL,
                verified_at = NULL,
                token_expires_at = NULL
        ");
        $stmt->execute([$email, $purpose, $codeHash, $codeExpiresAt]);

        return $code;
    }
}

if (!function_exists('verify_email_code_and_issue_token')) {
    function verify_email_code_and_issue_token(PDO $conn, $email, $purpose, $code)
    {
        ensure_email_verification_schema($conn);

        $stmt = $conn->prepare("SELECT * FROM email_verifications WHERE email = ? AND purpose = ? LIMIT 1");
        $stmt->execute([$email, $purpose]);
        $verification = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$verification) {
            throw new Exception('No verification request found for this email.');
        }

        if (strtotime((string) $verification['code_expires_at']) < time()) {
            throw new Exception('The verification code has expired. Please request a new one.');
        }

        if (!password_verify((string) $code, (string) $verification['code_hash'])) {
            throw new Exception('Invalid verification code.');
        }

        $token = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $token);
        $tokenExpiresAt = (new DateTimeImmutable('+30 minutes'))->format('Y-m-d H:i:s');
        $verifiedAt = (new DateTimeImmutable())->format('Y-m-d H:i:s');

        $updateStmt = $conn->prepare("
            UPDATE email_verifications
            SET verified_token_hash = ?, verified_at = ?, token_expires_at = ?
            WHERE verification_id = ?
        ");
        $updateStmt->execute([$tokenHash, $verifiedAt, $tokenExpiresAt, $verification['verification_id']]);

        return $token;
    }
}

if (!function_exists('consume_verified_email_token')) {
    function consume_verified_email_token(PDO $conn, $email, $purpose, $token)
    {
        ensure_email_verification_schema($conn);

        $stmt = $conn->prepare("SELECT * FROM email_verifications WHERE email = ? AND purpose = ? LIMIT 1");
        $stmt->execute([$email, $purpose]);
        $verification = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$verification || empty($verification['verified_token_hash'])) {
            throw new Exception('Email verification is required before registration.');
        }

        if (strtotime((string) $verification['token_expires_at']) < time()) {
            throw new Exception('Your verified session has expired. Please verify your email again.');
        }

        if (!hash_equals((string) $verification['verified_token_hash'], hash('sha256', (string) $token))) {
            throw new Exception('Invalid verified token.');
        }

        $deleteStmt = $conn->prepare("DELETE FROM email_verifications WHERE verification_id = ?");
        $deleteStmt->execute([$verification['verification_id']]);
    }
}

if (!function_exists('mark_user_email_verified')) {
    function mark_user_email_verified(PDO $conn, $userId)
    {
        ensure_email_verification_schema($conn);
        $stmt = $conn->prepare("UPDATE users SET email_verified_at = NOW() WHERE user_id = ?");
        $stmt->execute([$userId]);
    }
}

?>
