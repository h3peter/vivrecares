<?php
require_once 'auth.php';
require_once 'config.php';
require_once 'admin_security.php';

init_api_auth();

http_response_code(410);
echo json_encode([
    "status" => "error",
    "message" => "Direct staff creation has been disabled. Use staff invitations instead.",
]);
?>
