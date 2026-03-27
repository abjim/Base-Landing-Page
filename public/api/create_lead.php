<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid Request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Use strip_tags instead of FILTER_SANITIZE_STRING to preserve Unicode characters
$name = strip_tags(trim($input['name']));
$email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
$phone = strip_tags(trim($input['phone'])); 
$gateway = $input['gateway'] ?? null; // Optional at this stage
$couponCode = isset($input['coupon_code']) ? strtoupper(trim($input['coupon_code'])) : null;

if (!$name || !$email || !$phone) {
    echo json_encode(['status' => 'error', 'message' => 'All fields required']);
    exit;
}

try {
    // UTF8MB4 Connection
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // ---------------------------------------------------------
    // COUPON LOGIC
    // ---------------------------------------------------------
    // Base product price (No Upsells yet)
    $baseTotal = PRODUCT_PRICE;
    
    $finalAmount = $baseTotal;
    $discountAmount = 0;
    $validCouponCode = null;

    if ($couponCode) {
        $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE'");
        $stmt->execute([$couponCode]);
        $coupon = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($coupon) {
            // Validate Expiry
            $isExpired = $coupon['expiry_date'] && date('Y-m-d') > $coupon['expiry_date'];
            // Validate Usage Limit
            $isLimitReached = $coupon['usage_limit'] != -1 && $coupon['usage_count'] >= $coupon['usage_limit'];

            if (!$isExpired && !$isLimitReached) {
                $validCouponCode = $coupon['code'];
                if ($coupon['type'] === 'fixed') {
                    $discountAmount = round($coupon['amount']);
                } else {
                    // Percentage applies to the TOTAL amount
                    $discountAmount = round(($baseTotal * $coupon['amount']) / 100);
                }
                $finalAmount = round($baseTotal - $discountAmount);
                if ($finalAmount < 0) $finalAmount = 0;
            }
        }
    }

    // ---------------------------------------------------------
    // AFFILIATE LOGIC
    // ---------------------------------------------------------
    $affiliateCode = isset($input['affiliate_code']) ? trim($input['affiliate_code']) : null;
    $affiliateId = null;

    if ($affiliateCode) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE affiliate_code = ?");
        $stmt->execute([$affiliateCode]);
        $affiliate = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($affiliate) {
            $affiliateId = $affiliate['id'];
        }
    }

    // ---------------------------------------------------------
    // SMART USER CHECK LOGIC
    // ---------------------------------------------------------
    
    // Check if user exists by Email OR Phone
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE email = ? OR phone = ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$email, $phone]);
    $existingOrder = $stmt->fetch(PDO::FETCH_ASSOC);

    $orderId = null;

    if ($existingOrder) {
        // CASE 1: User Already Paid
        if ($existingOrder['status'] === 'PAID') {
            echo json_encode([
                'status' => 'already_purchased', 
                'message' => 'You have already purchased this eBook.',
                'email' => $existingOrder['email']
            ]);
            exit;
        } 
        
        // CASE 2: User has a Pending/Cancelled Order -> Update it
        $sql = "UPDATE orders SET 
                name = ?, 
                email = ?, 
                phone = ?, 
                amount = ?, 
                gateway = ?, 
                status = 'PENDING', 
                updated_at = NOW(),
                coupon_code = ?,
                discount_amount = ?,
                affiliate_id = ?
                WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$name, $email, $phone, $finalAmount, $gateway, $validCouponCode, $discountAmount, $affiliateId, $existingOrder['id']]);
        
        $orderId = $existingOrder['id'];

    } else {
        // CASE 3: New User -> Insert
        $stmt = $pdo->prepare("INSERT INTO orders (name, email, phone, amount, gateway, status, coupon_code, discount_amount, affiliate_id) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)");
        $stmt->execute([$name, $email, $phone, $finalAmount, $gateway, $validCouponCode, $discountAmount, $affiliateId]);
        $orderId = $pdo->lastInsertId();
    }

    echo json_encode(['status' => 'success', 'order_id' => $orderId]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
