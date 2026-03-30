<?php

if (!function_exists('get_allowed_api_origins')) {
    function get_allowed_api_origins()
    {
        $origins = [];
        $rawValues = [
            app_env('FRONTEND_ORIGIN', ''),
            app_env('APP_BASE_URL', ''),
        ];

        foreach ($rawValues as $rawValue) {
            foreach (explode(',', (string) $rawValue) as $origin) {
                $origin = rtrim(trim($origin), '/');
                if ($origin !== '') {
                    $origins[$origin] = true;
                }
            }
        }

        if (empty($origins)) {
            $origins['http://localhost:5173'] = true;
            $origins['http://127.0.0.1:5173'] = true;
        }

        return array_keys($origins);
    }
}

if (!function_exists('send_api_cors_headers')) {
    function send_api_cors_headers()
    {
        $requestOrigin = rtrim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''), '/');
        $allowedOrigins = get_allowed_api_origins();

        if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$requestOrigin}");
            header('Access-Control-Allow-Credentials: true');
        }

        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
        header('Access-Control-Max-Age: 86400');
    }
}

if (!function_exists('start_api_session')) {
    function start_api_session()
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $requestOrigin = rtrim((string) ($_SERVER['HTTP_ORIGIN'] ?? ''), '/');
        $allowedOrigins = get_allowed_api_origins();
        $isCrossSiteRequest = $requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true);
        $forwardedProto = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
        $secure = (
            (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
            $forwardedProto === 'https' ||
            ($requestOrigin !== '' && stripos($requestOrigin, 'https://') === 0)
        );

        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => $isCrossSiteRequest ? 'None' : 'Lax',
            'secure' => $secure,
        ]);

        session_start();
    }
}

if (!function_exists('init_api_auth')) {
    function init_api_auth()
    {
        send_api_cors_headers();

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        start_api_session();
    }
}

if (!function_exists('set_authenticated_user')) {
    function set_authenticated_user(array $user)
    {
        $_SESSION['auth_user'] = [
            'user_id' => (int) ($user['user_id'] ?? 0),
            'role' => (string) ($user['role'] ?? ''),
            'patient_id' => isset($user['patient_id']) ? (int) $user['patient_id'] : null,
        ];
    }
}

if (!function_exists('get_authenticated_user')) {
    function get_authenticated_user()
    {
        return $_SESSION['auth_user'] ?? null;
    }
}

if (!function_exists('clear_authenticated_user')) {
    function clear_authenticated_user()
    {
        unset($_SESSION['auth_user']);
    }
}

if (!function_exists('require_auth')) {
    function require_auth()
    {
        $authUser = get_authenticated_user();
        if (!$authUser || empty($authUser['user_id'])) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Authentication required."]);
            exit;
        }

        return $authUser;
    }
}

if (!function_exists('require_roles')) {
    function require_roles(array $roles)
    {
        $authUser = require_auth();
        if (!in_array($authUser['role'] ?? '', $roles, true)) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "You are not allowed to perform this action."]);
            exit;
        }

        return $authUser;
    }
}

if (!function_exists('require_same_user_or_roles')) {
    function require_same_user_or_roles($targetUserId, array $roles = [])
    {
        $authUser = require_auth();
        $authUserId = (int) ($authUser['user_id'] ?? 0);
        $targetUserId = (int) $targetUserId;

        if ($authUserId === $targetUserId) {
            return $authUser;
        }

        if (!empty($roles) && in_array($authUser['role'] ?? '', $roles, true)) {
            return $authUser;
        }

        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "You are not allowed to access this resource."]);
        exit;
    }
}
