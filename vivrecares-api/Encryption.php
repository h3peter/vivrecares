<?php
// Encryption.php

class Encryption {
    private static $secret_key = 'VivreCares_Secure_Key_2026!';
    private static $encrypt_method = 'AES-256-CBC';

    public static function encrypt($data) {
        if ($data === null || $data === '') {
            return '';
        }

        $key = hash('sha256', self::$secret_key, true);
        $ivLength = openssl_cipher_iv_length(self::$encrypt_method);
        $iv = openssl_random_pseudo_bytes($ivLength);

        $encrypted = openssl_encrypt($data, self::$encrypt_method, $key, OPENSSL_RAW_DATA, $iv);
        if ($encrypted === false) {
            return $data;
        }

        return base64_encode($iv . $encrypted);
    }

    public static function decrypt($data) {
        if ($data === null || $data === '') {
            return '';
        }

        $decoded = base64_decode($data, true);
        if ($decoded === false) {
            return $data;
        }

        $key = hash('sha256', self::$secret_key, true);
        $ivLength = openssl_cipher_iv_length(self::$encrypt_method);

        // Backward compatibility for older values stored as base64("ciphertext::iv")
        if (strpos($decoded, '::') !== false) {
            [$legacyCipher, $legacyIv] = explode('::', $decoded, 2);
            $legacyDecrypted = openssl_decrypt($legacyCipher, self::$encrypt_method, bin2hex($key), 0, $legacyIv);
            return $legacyDecrypted !== false ? $legacyDecrypted : $data;
        }

        if (strlen($decoded) <= $ivLength) {
            return $data;
        }

        $iv = substr($decoded, 0, $ivLength);
        $ciphertext = substr($decoded, $ivLength);
        $decrypted = openssl_decrypt($ciphertext, self::$encrypt_method, $key, OPENSSL_RAW_DATA, $iv);

        return $decrypted !== false ? $decrypted : $data;
    }
}
?>
