<?php
require_once 'auth_functions.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');
$code = trim($input['code'] ?? '');
$new_password = trim($input['new_password'] ?? '');

if (!$email || !$code || !$new_password) {
    send_json_response(['status' => 'error', 'message' => 'All fields are required'], 400);
}

try {
    $pdo = get_db_connection();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_expiry > NOW()");
    $stmt->execute([$email, $code]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $hash = password_hash($new_password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE users SET password_hash = ?, reset_token = NULL, reset_expiry = NULL WHERE id = ?");
        $stmt->execute([$hash, $user['id']]);

        send_json_response(['status' => 'success', 'message' => 'Password updated successfully']);
    } else {
        send_json_response(['status' => 'error', 'message' => 'Invalid or expired code'], 400);
    }

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
