<?php
session_start();
require_once '../auth_functions.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$email = $_GET['email'] ?? '';

if (empty($email)) {
    send_json_response(['status' => 'error', 'message' => 'Email is required'], 400);
}

try {
    $pdo = get_db_connection();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get commission rate
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $commission_percent = $row ? floatval($row['setting_value']) : 20;

    if (!$user || !$user['is_affiliate']) {
        send_json_response(['status' => 'error', 'message' => 'Not an affiliate', 'commission_percent' => $commission_percent], 403);
    }

    $affiliate_id = $user['id'];

    // Get clicks
    $stmt = $pdo->prepare("SELECT COUNT(*) as clicks FROM affiliate_clicks WHERE affiliate_id = ?");
    $stmt->execute([$affiliate_id]);
    $clicks = $stmt->fetch(PDO::FETCH_ASSOC)['clicks'];

    // Get sales
    $stmt = $pdo->prepare("SELECT COUNT(*) as sales FROM orders WHERE affiliate_id = ? AND status = 'PAID'");
    $stmt->execute([$affiliate_id]);
    $sales = $stmt->fetch(PDO::FETCH_ASSOC)['sales'];

    // Get transactions
    $stmt = $pdo->prepare("SELECT * FROM affiliate_transactions WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([$affiliate_id]);
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get withdrawals
    $stmt = $pdo->prepare("SELECT * FROM affiliate_withdrawals WHERE affiliate_id = ? ORDER BY created_at DESC LIMIT 10");
    $stmt->execute([$affiliate_id]);
    $withdrawals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get commission rate
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $commission_percent = $row ? floatval($row['setting_value']) : 20;

    send_json_response([
        'status' => 'success',
        'data' => [
            'code' => $user['affiliate_code'],
            'balance' => $user['balance'],
            'total_earnings' => $user['total_earnings'],
            'clicks' => $clicks,
            'sales' => $sales,
            'transactions' => $transactions,
            'withdrawals' => $withdrawals,
            'commission_percent' => $commission_percent
        ]
    ]);

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
