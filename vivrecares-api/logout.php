<?php
require_once 'auth.php';
require_once 'config.php';

init_api_auth();

clear_authenticated_user();

if (session_status() === PHP_SESSION_ACTIVE) {
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'] ?? '/', $params['domain'] ?? '', !empty($params['secure']), !empty($params['httponly']));
    }

    session_destroy();
}

echo json_encode([
    "status" => "success",
    "message" => "Logged out successfully."
]);
?>
