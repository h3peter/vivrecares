<?php
require_once 'config.php';
require_once 'auth.php';

send_api_cors_headers();
header('Cache-Control: public, max-age=86400');

$file = isset($_GET['file']) ? basename((string) $_GET['file']) : '';

if ($file === '' || $file === 'default-avatar.png') {
    http_response_code(404);
    exit;
}

$filePath = '/data/uploads/' . $file;

if (!is_file($filePath)) {
    http_response_code(404);
    exit;
}

$resolvedPath = $filePath;

$mimeType = 'application/octet-stream';
if (function_exists('mime_content_type')) {
    $detectedMime = @mime_content_type($resolvedPath);
    if ($detectedMime) {
        $mimeType = $detectedMime;
    }
}

header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($resolvedPath));
header('Content-Disposition: inline; filename="' . basename($resolvedPath) . '"');
readfile($resolvedPath);
exit;
?>
