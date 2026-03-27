<?php
session_start();
require_once '../auth_functions.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = $input['email'] ?? '';

if (empty($email)) {
    send_json_response(['status' => 'error', 'message' => 'Email is required'], 400);
}

try {
    $pdo = get_db_connection();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        send_json_response(['status' => 'error', 'message' => 'User not found'], 404);
    }

    if ($user['is_affiliate']) {
        send_json_response(['status' => 'success', 'code' => $user['affiliate_code']]);
    }

    // Generate unique affiliate code
    $code = strtoupper(substr(md5(uniqid(rand(), true)), 0, 8));
    
    $stmt = $pdo->prepare("UPDATE users SET is_affiliate = 1, affiliate_code = ? WHERE id = ?");
    $stmt->execute([$code, $user['id']]);

    send_json_response(['status' => 'success', 'code' => $code]);

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
