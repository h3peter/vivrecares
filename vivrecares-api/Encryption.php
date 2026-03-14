<?php
// Encryption.php

class Encryption {
    // In a real production environment, you should store this key in an environment variable (.env)
    // For your local development and defense, this static key is perfectly fine.
    private static $secret_key = 'VivreCares_Secure_Key_2026!';
    private static $encrypt_method = 'AES-256-CBC';

    public static function encrypt($data) {
        $key = hash('sha256', self::$secret_key);
        // Generate a random initialization vector (IV) for extra security
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length(self::$encrypt_method));
        
        $encrypted = openssl_encrypt($data, self::$encrypt_method, $key, 0, $iv);
        
        // We combine the IV and the encrypted data so we can decrypt it later
        return base64_encode($encrypted . '::' . $iv);
    }

    public static function decrypt($data) {
        $key = hash('sha256', self::$secret_key);
        
        // Split the encrypted data and the IV back apart
        list($encrypted_data, $iv) = explode('::', base64_decode($data), 2);
        
        return openssl_decrypt($encrypted_data, self::$encrypt_method, $key, 0, $iv);
    }
}
?>