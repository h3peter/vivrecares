<?php
require_once 'auth.php';
require_once 'config.php';

init_api_auth();
require_roles(['Admin']);

$data = json_decode(file_get_contents("php://input"), true);

$firstName = trim($data['first_name'] ?? '');
$lastName = trim($data['last_name'] ?? '');
$email = trim($data['email'] ?? '');
$password = (string) ($data['password'] ?? '');
$role = trim($data['role'] ?? '');

if ($firstName === '' || $lastName === '' || $email === '' || $password === '' || !in_array($role, ['Admin', 'Doctor'], true)) {
    echo json_encode(["status" => "error", "message" => "First name, last name, role, email, and password are required."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Please provide a valid email address."]);
    exit;
}

if (strlen($password) < 8) {
    echo json_encode(["status" => "error", "message" => "Password must be at least 8 characters."]);
    exit;
}

try {
    $checkStmt = $conn->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
    $checkStmt->execute([$email]);
    if ($checkStmt->fetchColumn()) {
        echo json_encode(["status" => "error", "message" => "Email is already registered."]);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $insertStmt = $conn->prepare("INSERT INTO users (first_name, last_name, email, password, role)
                                  VALUES (?, ?, ?, ?, ?)");
    $insertStmt->execute([$firstName, $lastName, $email, $passwordHash, $role]);

    echo json_encode([
        "status" => "success",
        "message" => $role . " account created successfully.",
        "user_id" => (int) $conn->lastInsertId()
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
