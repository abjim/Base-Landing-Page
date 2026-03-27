<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['valid' => false, 'message' => 'Invalid Request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$code = isset($input['code']) ? strtoupper(trim($input['code'])) : '';

if (!$code) {
    echo json_encode(['valid' => false, 'message' => 'Code required']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE'");
    $stmt->execute([$code]);
    $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$coupon) {
        echo json_encode(['valid' => false, 'message' => 'Invalid coupon code']);
        exit;
    }

    // Check Expiry
    if ($coupon['expiry_date'] && date('Y-m-d') > $coupon['expiry_date']) {
        echo json_encode(['valid' => false, 'message' => 'Coupon expired']);
        exit;
    }

    // Check Usage Limit
    if ($coupon['usage_limit'] != -1 && $coupon['usage_count'] >= $coupon['usage_limit']) {
        echo json_encode(['valid' => false, 'message' => 'Coupon usage limit reached']);
        exit;
    }

    echo json_encode([
        'valid' => true,
        'type' => $coupon['type'],
        'amount' => (float)$coupon['amount'],
        'code' => $coupon['code']
    ]);

} catch (Exception $e) {
    echo json_encode(['valid' => false, 'message' => 'Server Error']);
}
?>
