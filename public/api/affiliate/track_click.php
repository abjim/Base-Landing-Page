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
$code = $input['code'] ?? '';

if (empty($code)) {
    send_json_response(['status' => 'error', 'message' => 'Code is required'], 400);
}

$ip_address = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

try {
    $pdo = get_db_connection();
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE affiliate_code = ?");
    $stmt->execute([$code]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        send_json_response(['status' => 'error', 'message' => 'Invalid affiliate code'], 404);
    }

    $affiliate_id = $user['id'];

    // Check if click from this IP already exists today
    $stmt = $pdo->prepare("SELECT id FROM affiliate_clicks WHERE affiliate_id = ? AND ip_address = ? AND DATE(created_at) = CURDATE()");
    $stmt->execute([$affiliate_id, $ip_address]);
    
    if (!$stmt->fetch()) {
        $stmt = $pdo->prepare("INSERT INTO affiliate_clicks (affiliate_id, ip_address) VALUES (?, ?)");
        $stmt->execute([$affiliate_id, $ip_address]);
    }

    send_json_response(['status' => 'success']);

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
