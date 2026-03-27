<?php
require_once 'db.php';
require_once 'utils.php';

// Handle Checkout Request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $gateway = $input['gateway'] ?? '';
    $coupon_code = $input['coupon_code'] ?? '';
    $upsell_ids = $input['upsell_ids'] ?? [];
    $affiliate_code = $input['affiliate_code'] ?? '';

    // Check if already purchased
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PAID'");
    $stmt->execute([$email, $phone]);
    if ($stmt->fetch()) {
        echo json_encode(['status' => 'already_purchased', 'message' => 'You have already purchased this product.']);
        exit;
    }

    // Calculate Amount
    $amount = 199;
    $stmt = $pdo->prepare("SELECT price FROM products WHERE type = 'main' AND status = 'ACTIVE' LIMIT 1");
    $stmt->execute();
    $mainProduct = $stmt->fetch();
    if ($mainProduct && isset($mainProduct['price'])) {
        $amount = (float)$mainProduct['price'];
    }

    if (!empty($upsell_ids)) {
        $placeholders = implode(',', array_fill(0, count($upsell_ids), '?'));
        $stmt = $pdo->prepare("SELECT price FROM products WHERE id IN ($placeholders)");
        $stmt->execute($upsell_ids);
        $upsells = $stmt->fetchAll();
        foreach ($upsells as $u) {
            $amount += $u['price'];
        }
    }

    // Apply Coupon
    if ($coupon_code) {
        $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE'");
        $stmt->execute([$coupon_code]);
        $coupon = $stmt->fetch();
        if ($coupon) {
            if ($coupon['type'] === 'fixed') {
                $amount -= $coupon['amount'];
            } else {
                $amount -= ($amount * $coupon['amount'] / 100);
            }
            // Increment usage count
            $stmt = $pdo->prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?");
            $stmt->execute([$coupon['id']]);
        }
    }

    $amount = max(0, round($amount));

    // Create or Update Order
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PENDING'");
    $stmt->execute([$email, $phone]);
    $pending = $stmt->fetch();

    $order_id = 0;
    if ($pending) {
        $stmt = $pdo->prepare("UPDATE orders SET status = 'PAID', payment_date = NOW(), amount = ?, gateway = ?, affiliate_code = ? WHERE id = ?");
        $stmt->execute([$amount, $gateway, $affiliate_code, $pending['id']]);
        $order_id = $pending['id'];
    } else {
        $stmt = $pdo->prepare("INSERT INTO orders (name, email, phone, amount, status, gateway, payment_date, affiliate_code, created_at) VALUES (?, ?, ?, ?, 'PAID', ?, NOW(), ?, NOW())");
        $stmt->execute([$name, $email, $phone, $amount, $gateway, $affiliate_code]);
        $order_id = $pdo->lastInsertId();
    }

    // Process Affiliate Commission
    if ($affiliate_code) {
        process_affiliate_commission($order_id, $amount, $affiliate_code);
    }

    echo json_encode(['status' => 'success', 'redirect_url' => '/#/success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
}
?>
