<?php

if (!function_exists('send_api_cors_headers')) {
    function send_api_cors_headers()
    {
        $allowedOrigin = app_env('FRONTEND_ORIGIN', 'http://localhost:5173');
        $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if ($requestOrigin !== '' && $requestOrigin === $allowedOrigin) {
            header("Access-Control-Allow-Origin: {$allowedOrigin}");
            header('Access-Control-Allow-Credentials: true');
        } else {
            header("Access-Control-Allow-Origin: {$allowedOrigin}");
            header('Access-Control-Allow-Credentials: true');
        }

        header('Vary: Origin');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    }
}

if (!function_exists('start_api_session')) {
    function start_api_session()
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
            'secure' => $secure,
        ]);

        session_start();
    }
}

if (!function_exists('init_api_auth')) {
    function init_api_auth()
    {
        send_api_cors_headers();
        start_api_session();

        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(200);
            exit;
        }
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

