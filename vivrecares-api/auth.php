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
                $origin = trim($origin);
                if ($origin === '') {
                    continue;
                }

                $origin = rtrim($origin, '/');
                $parsed = parse_url($origin);
                if (!empty($parsed['scheme']) && !empty($parsed['host'])) {
                    $normalizedOrigin = $parsed['scheme'] . '://' . $parsed['host'];
                    if (!empty($parsed['port'])) {
                        $normalizedOrigin .= ':' . $parsed['port'];
                    }

                    $origins[$normalizedOrigin] = true;
                    continue;
                }

                $origins[$origin] = true;
            }
        }

        $localOrigins = [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4173',
            'http://127.0.0.1:4173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];

        foreach ($localOrigins as $origin) {
            $origins[$origin] = true;
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

if (!function_exists('base64url_encode')) {
    function base64url_encode($value)
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}

if (!function_exists('base64url_decode')) {
    function base64url_decode($value)
    {
        $remainder = strlen($value) % 4;
        if ($remainder !== 0) {
            $value .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($value, '-_', '+/'));
    }
}

if (!function_exists('get_jwt_secret')) {
    function get_jwt_secret()
    {
        return (string) app_env('JWT_SECRET', app_env('APP_KEY', 'vivrecares-dev-jwt-secret'));
    }
}

if (!function_exists('get_jwt_ttl_seconds')) {
    function get_jwt_ttl_seconds()
    {
        return (int) app_env('JWT_TTL', 86400 * 7);
    }
}

if (!function_exists('read_bearer_token')) {
    function read_bearer_token()
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['Authorization'] ?? '';
        if ($header === '' && function_exists('getallheaders')) {
            $headers = getallheaders();
            $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (preg_match('/Bearer\s+(.+)/i', (string) $header, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }
}

if (!function_exists('create_auth_token')) {
    function create_auth_token(array $user)
    {
        $now = time();
        $payload = [
            'sub' => (int) ($user['user_id'] ?? 0),
            'role' => (string) ($user['role'] ?? ''),
            'patient_id' => isset($user['patient_id']) ? (int) $user['patient_id'] : null,
            'iat' => $now,
            'exp' => $now + get_jwt_ttl_seconds(),
        ];

        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $headerEncoded = base64url_encode(json_encode($header));
        $payloadEncoded = base64url_encode(json_encode($payload));
        $signature = hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", get_jwt_secret(), true);

        return "{$headerEncoded}.{$payloadEncoded}." . base64url_encode($signature);
    }
}

if (!function_exists('verify_auth_token')) {
    function verify_auth_token($token)
    {
        if (!$token || substr_count($token, '.') !== 2) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = explode('.', $token, 3);
        $expectedSignature = hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", get_jwt_secret(), true);
        $providedSignature = base64url_decode($signatureEncoded);

        if (!$providedSignature || !hash_equals($expectedSignature, $providedSignature)) {
            return null;
        }

        $payload = json_decode((string) base64url_decode($payloadEncoded), true);
        if (!is_array($payload)) {
            return null;
        }

        if (empty($payload['sub']) || empty($payload['role'])) {
            return null;
        }

        if (!empty($payload['exp']) && time() >= (int) $payload['exp']) {
            return null;
        }

        return [
            'user_id' => (int) $payload['sub'],
            'role' => (string) $payload['role'],
            'patient_id' => isset($payload['patient_id']) ? (int) $payload['patient_id'] : null,
        ];
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
        $tokenUser = verify_auth_token(read_bearer_token());
        if ($tokenUser) {
            return $tokenUser;
        }

        return $_SESSION['auth_user'] ?? null;
    }
}

if (!function_exists('clear_authenticated_user')) {
    function clear_authenticated_user()
    {
        unset($_SESSION['auth_user']);
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
