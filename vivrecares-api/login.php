<?php
require 'cors.php'; 
require 'config.php';

header('Content-Type: application/json');

$json = file_get_contents("php://input");
$data = json_decode($json);

// 1. Validate the incoming request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit();
}

if (empty($data->email) || empty($data->password)) {
    echo json_encode(["status" => "error", "message" => "Please provide both email and password."]);
    exit();
}

// 2. Authenticate the user
try {
    // Search for the user using their email
    $stmt = $conn->prepare("SELECT user_id, password, role FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$data->email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Verify the user exists and the typed password matches the Bcrypt hash
    if ($user && password_verify($data->password, $user['password'])) {
        
        // Return a success status along with the user's role and ID
        // The role is crucial so React knows if it should load the Patient Portal or Admin Dashboard
        echo json_encode([
            "status" => "success",
            "message" => "Login authorized.",
            "user" => [
                "id" => $user['user_id'],
                "role" => $user['role']
            ]
        ]);
    } else {
        // We use a generic error message for both wrong email and wrong password for security
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
    }

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "System error: " . $e->getMessage()]);
}
?>