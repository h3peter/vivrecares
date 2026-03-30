<?php
require_once 'auth.php';

header('Cache-Control: public, max-age=86400');

$file = isset($_GET['file']) ? basename((string) $_GET['file']) : '';

if ($file === '' || $file === 'default-avatar.png') {
    http_response_code(404);
    exit;
}

$candidatePaths = [
    __DIR__ . '/../assets/uploads/' . $file,
    __DIR__ . '/assets/uploads/' . $file,
];

$resolvedPath = null;

foreach ($candidatePaths as $path) {
    if (is_file($path)) {
        $resolvedPath = $path;
        break;
    }
}

if ($resolvedPath === null) {
    http_response_code(404);
    exit;
}

$mimeType = mime_content_type($resolvedPath) ?: 'application/octet-stream';
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($resolvedPath));
readfile($resolvedPath);
exit;
?>
