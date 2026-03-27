<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/config.php';

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
$gateway = $input['gateway']; // 'bkash' or 'ssl'
$couponCode = isset($input['coupon_code']) ? strtoupper(trim($input['coupon_code'])) : null;

if (!$name || !$email || !$phone) {
    echo json_encode(['status' => 'error', 'message' => 'All fields required']);
    exit;
}

try {
    // UTF8MB4 Connection
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '+06:00'");
    
    // ---------------------------------------------------------
    // UPSELL LOGIC
    // ---------------------------------------------------------
    $upsellAmount = 0;
    $selectedUpsells = [];
    
    if (isset($input['upsell_ids']) && is_array($input['upsell_ids']) && count($input['upsell_ids']) > 0) {
        $placeholders = implode(',', array_fill(0, count($input['upsell_ids']), '?'));
        $stmt = $pdo->prepare("SELECT * FROM products WHERE id IN ($placeholders) AND status = 'ACTIVE' AND type = 'upsell'");
        $stmt->execute($input['upsell_ids']);
        $upsellProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($upsellProducts as $prod) {
            $upsellAmount += $prod['price'];
            $selectedUpsells[] = [
                'id' => $prod['id'],
                'name' => $prod['name'],
                'price' => $prod['price'],
                'file_url' => $prod['file_url']
            ];
        }
    }

    // ---------------------------------------------------------
    // COUPON LOGIC (WITH PESSIMISTIC LOCKING)
    // ---------------------------------------------------------
    // Base product price + Upsells
    $baseTotal = PRODUCT_PRICE + $upsellAmount;
    
    $finalAmount = $baseTotal;
    $discountAmount = 0;
    $validCouponCode = null;

    if ($couponCode) {
        // Use FOR UPDATE to lock the coupon row during this transaction
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT * FROM coupons WHERE code = ? AND status = 'ACTIVE' FOR UPDATE");
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
                    // Percentage applies to the TOTAL amount (Main + Upsells)
                    $discountAmount = round(($baseTotal * $coupon['amount']) / 100);
                }
                $finalAmount = round($baseTotal - $discountAmount);
                if ($finalAmount < 0) $finalAmount = 0;
            }
        }
        $pdo->commit();
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
    $upsellJson = !empty($selectedUpsells) ? json_encode($selectedUpsells) : null;

    if ($existingOrder) {
        // CASE 1: User Already Paid (Flexible Logic)
        if ($existingOrder['status'] === 'PAID') {
            // Check if they are trying to buy the exact same thing (no new upsells)
            $existingUpsells = !empty($existingOrder['upsell_items']) ? json_decode($existingOrder['upsell_items'], true) : [];
            $existingUpsellIds = array_map(function($u) { return $u['id']; }, $existingUpsells);
            $newUpsellIds = array_map(function($u) { return $u['id']; }, $selectedUpsells);
            
            // If they are buying the exact same items, block them. Otherwise, allow a new order.
            sort($existingUpsellIds);
            sort($newUpsellIds);
            
            if ($existingUpsellIds === $newUpsellIds) {
                echo json_encode([
                    'status' => 'already_purchased', 
                    'message' => 'You have already purchased this exact package. Please check your email for the download link.',
                    'email' => $existingOrder['email']
                ]);
                exit;
            } else {
                // They are buying something different (e.g., missed an upsell before). Create a NEW order.
                $stmt = $pdo->prepare("INSERT INTO orders (name, email, phone, amount, gateway, status, coupon_code, discount_amount, upsell_items, affiliate_id) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)");
                $stmt->execute([$name, $email, $phone, $finalAmount, $gateway, $validCouponCode, $discountAmount, $upsellJson, $affiliateId]);
                $orderId = $pdo->lastInsertId();
            }
        } else {
            // CASE 2: User has a Pending/Cancelled Order -> Update it (Avoid Duplicates)
            // We act on the latest order found.
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
                    upsell_items = ?,
                    affiliate_id = ?
                    WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$name, $email, $phone, $finalAmount, $gateway, $validCouponCode, $discountAmount, $upsellJson, $affiliateId, $existingOrder['id']]);
            
            $orderId = $existingOrder['id'];
        }

    } else {
        // CASE 3: New User -> Insert
        $stmt = $pdo->prepare("INSERT INTO orders (name, email, phone, amount, gateway, status, coupon_code, discount_amount, upsell_items, affiliate_id) VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?)");
        $stmt->execute([$name, $email, $phone, $finalAmount, $gateway, $validCouponCode, $discountAmount, $upsellJson, $affiliateId]);
        $orderId = $pdo->lastInsertId();
    }

    // ---------------------------------------------------------
    // FREE ORDER LOGIC (100% Discount)
    // ---------------------------------------------------------
    if ($finalAmount <= 0) {
        $stmt = $pdo->prepare("UPDATE orders SET status = 'PAID', payment_date = NOW(), transaction_id = 'FREE_ORDER' WHERE id = ?");
        $stmt->execute([$orderId]);

        // Update Coupon Usage
        if ($validCouponCode) {
            $stmtC = $pdo->prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?");
            $stmtC->execute([$validCouponCode]);
        }

        include_once __DIR__ . '/functions.php';
        
        // Send CAPI Event
        sendFacebookCAPI(
            [
                'email' => $email,
                'phone' => $phone,
                'name'  => $name
            ], 
            $finalAmount, 
            $orderId
        );

        // Send Notifications
        sendProductEmail($email, $name, $orderId);
        
        // Send SMS
        $smsContent = defined('SUCCESS_SMS_CONTENT') ? SUCCESS_SMS_CONTENT : "Your ebook order is approved! Check email for download link. Help: https://m.me/learningbangladesh71 - Shehzin.com";
        $downloadLink = SITE_URL . "/api/download.php?order_id=" . $orderId;
        $smsBody = str_replace(
            ['{name}', '{order_id}', '{download_link}', '{site_url}'],
            [$name, $orderId, $downloadLink, SITE_URL],
            $smsContent
        );
        sendSMS($phone, $smsBody);
        
        // Process Affiliate Commission
        processAffiliateCommission($orderId);

        echo json_encode(['status' => 'success', 'redirect_url' => SITE_URL . "/#/success?order_id=" . $orderId]);
        exit;
    }

    // ---------------------------------------------------------
    // GATEWAY LOGIC (Existing)
    // ---------------------------------------------------------

    if ($gateway === 'bkash') {
        // bKash Grant Token
        $post_token = [
            'app_key' => BKASH_APP_KEY,
            'app_secret' => BKASH_APP_SECRET
        ];
        
        $url = curl_init(BKASH_BASE_URL . '/tokenized/checkout/token/grant');
        $header = [
            'Content-Type:application/json',
            'username:'.BKASH_USERNAME,
            'password:'.BKASH_PASSWORD
        ];
        curl_setopt($url, CURLOPT_HTTPHEADER, $header);
        curl_setopt($url, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($url, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($url, CURLOPT_POSTFIELDS, json_encode($post_token));
        
        $resultdata = curl_exec($url);
        curl_close($url);
        $response = json_decode($resultdata, true);
        
        if (isset($response['id_token'])) {
            $id_token = $response['id_token'];
            
            // Create Payment
            $createpaybody = [
                'mode' => '0011',
                'payerReference' => $phone,
                'callbackURL' => SITE_URL . '/api/callback_bkash.php',
                'amount' => $finalAmount,
                'currency' => 'BDT',
                'intent' => 'sale',
                'merchantInvoiceNumber' => 'INV' . $orderId
            ];
            
            $url = curl_init(BKASH_BASE_URL . '/tokenized/checkout/create');
            $header = [
                'Content-Type:application/json',
                'Authorization:'.$id_token,
                'X-APP-Key:'.BKASH_APP_KEY
            ];
            curl_setopt($url, CURLOPT_HTTPHEADER, $header);
            curl_setopt($url, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($url, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($url, CURLOPT_POSTFIELDS, json_encode($createpaybody));
            
            $resultdata = curl_exec($url);
            curl_close($url);
            $response = json_decode($resultdata, true);

            if (isset($response['bkashURL'])) {
                // Save payment ID
                $stmt = $pdo->prepare("UPDATE orders SET transaction_id = ? WHERE id = ?");
                $stmt->execute([$response['paymentID'], $orderId]);

                echo json_encode(['status' => 'success', 'redirect_url' => $response['bkashURL']]);
            } else {
                 echo json_encode(['status' => 'error', 'message' => 'bKash Create Failed', 'debug' => $response]);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'bKash Token Failed', 'debug' => $response]);
        }

    } elseif ($gateway === 'ssl') {
        
        // Generate Transaction ID (CV Prefix)
        $tran_id = "ZERO_" . $orderId . "_" . uniqid();
        
        // Update Order with Transaction ID BEFORE redirecting
        $stmt = $pdo->prepare("UPDATE orders SET transaction_id = ? WHERE id = ?");
        $stmt->execute([$tran_id, $orderId]);

        $post_data = array();
        $post_data['store_id'] = SSL_STORE_ID;
        $post_data['store_passwd'] = SSL_STORE_PASS;
        $post_data['total_amount'] = $finalAmount;
        $post_data['currency'] = "BDT";
        $post_data['tran_id'] = $tran_id;
        
        // URLs
        $post_data['success_url'] = SITE_URL . "/api/callback_ssl.php?order_id=" . $orderId;
        $post_data['fail_url'] = SITE_URL . "/api/callback_ssl.php?status=fail&order_id=" . $orderId;
        $post_data['cancel_url'] = SITE_URL . "/api/callback_ssl.php?status=cancel&order_id=" . $orderId;
        
        // Customer Info
        $post_data['cus_name'] = $name;
        $post_data['cus_email'] = $email;
        $post_data['cus_phone'] = $phone;
        $post_data['cus_add1'] = "Dhaka";
        $post_data['cus_city'] = "Dhaka";
        $post_data['cus_country'] = "Bangladesh";
        $post_data['shipping_method'] = "NO";
        $post_data['product_name'] = "Ebook";
        $post_data['product_category'] = "Digital";
        $post_data['product_profile'] = "general";

        $direct_api_url = SSL_IS_SANDBOX ? "https://sandbox.sslcommerz.com/gwprocess/v4/api.php" : "https://securepay.sslcommerz.com/gwprocess/v4/api.php";

        $handle = curl_init();
        curl_setopt($handle, CURLOPT_URL, $direct_api_url);
        curl_setopt($handle, CURLOPT_TIMEOUT, 30);
        curl_setopt($handle, CURLOPT_CONNECTTIMEOUT, 30);
        curl_setopt($handle, CURLOPT_POST, 1);
        curl_setopt($handle, CURLOPT_POSTFIELDS, $post_data);
        curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, false); 

        $content = curl_exec($handle);
        $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);

        if ($code == 200 && !(curl_errno($handle))) {
            curl_close($handle);
            $sslcommerzResponse = json_decode($content, true);

            if (isset($sslcommerzResponse['GatewayPageURL'])) {
                echo json_encode(['status' => 'success', 'redirect_url' => $sslcommerzResponse['GatewayPageURL']]);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'SSL Init Failed']);
            }
        } else {
            curl_close($handle);
            echo json_encode(['status' => 'error', 'message' => 'FAILED TO CONNECT WITH SSLCOMMERZ API']);
        }
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>