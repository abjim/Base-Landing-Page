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
$amount = floatval($input['amount'] ?? 0);
$method = $input['method'] ?? '';
$details = $input['details'] ?? '';

if (empty($email) || $amount < 500 || empty($method) || empty($details)) {
    send_json_response(['status' => 'error', 'message' => 'Invalid input data. Minimum withdrawal is 500 BDT.'], 400);
}

try {
    $pdo = get_db_connection();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !$user['is_affiliate']) {
        send_json_response(['status' => 'error', 'message' => 'Not an affiliate'], 403);
    }

    if ($user['balance'] < $amount) {
        send_json_response(['status' => 'error', 'message' => 'Insufficient balance'], 400);
    }

    $pdo->beginTransaction();

    // Deduct balance
    $stmt = $pdo->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
    $stmt->execute([$amount, $user['id']]);

    // Record withdrawal request
    $stmt = $pdo->prepare("INSERT INTO affiliate_withdrawals (affiliate_id, amount, method, details, status) VALUES (?, ?, ?, ?, 'PENDING')");
    $stmt->execute([$user['id'], $amount, $method, $details]);
    $withdrawal_id = $pdo->lastInsertId();

    // Record transaction
    $stmt = $pdo->prepare("INSERT INTO affiliate_transactions (affiliate_id, type, amount, status, details, order_id) VALUES (?, 'WITHDRAWAL', ?, 'PENDING', ?, ?)");
    $stmt->execute([$user['id'], -$amount, "Withdrawal request via $method", $withdrawal_id]);

    $pdo->commit();

    send_json_response(['status' => 'success', 'message' => 'Withdrawal request submitted successfully']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
