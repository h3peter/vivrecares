<?php
// upload_profile_photo.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once 'config.php'; // matches the rest of the project

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user_id.']);
    exit;
}

if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'No file uploaded or upload error.']);
    exit;
}

$file     = $_FILES['photo'];
$tmpPath  = $file['tmp_name'];
$origName = $file['name'];
$fileSize = $file['size'];

// ── Validation ──
$allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$detectedMime = finfo_file($finfo, $tmpPath);
finfo_close($finfo);

if (!in_array($detectedMime, $allowedMimes)) {
    echo json_encode(['status' => 'error', 'message' => 'Only JPG, PNG, and WebP files are allowed.']);
    exit;
}

if ($fileSize > 3 * 1024 * 1024) { // 3 MB max
    echo json_encode(['status' => 'error', 'message' => 'File too large. Max 3MB allowed.']);
    exit;
}

// ── Save File ──
// Put uploads one level above the API folder, inside /assets/uploads/
$uploadDir = __DIR__ . '/../assets/uploads/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generate a unique filename so we never collide
$ext      = pathinfo($origName, PATHINFO_EXTENSION);
$filename = 'user_' . $user_id . '_' . time() . '.' . strtolower($ext);
$destPath = $uploadDir . $filename;

if (!move_uploaded_file($tmpPath, $destPath)) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save file.']);
    exit;
}

// ── Delete old photo if it's not the default ──
$stmt = $conn->prepare("SELECT profile_photo FROM users WHERE user_id = ?");
$stmt->execute([$user_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if ($row && $row['profile_photo'] && $row['profile_photo'] !== 'default-avatar.png') {
    $oldPath = $uploadDir . $row['profile_photo'];
    if (file_exists($oldPath)) {
        @unlink($oldPath);
    }
}

// ── Update DB ──
$stmt = $conn->prepare("UPDATE users SET profile_photo = ? WHERE user_id = ?");

if ($stmt->execute([$filename, $user_id])) {
    echo json_encode([
        'status'   => 'success',
        'message'  => 'Profile photo updated.',
        'filename' => $filename
    ]);
} else {
    @unlink($destPath);
    echo json_encode(['status' => 'error', 'message' => 'Database update failed.']);
}
?>