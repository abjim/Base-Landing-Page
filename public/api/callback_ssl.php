<?php
require_once __DIR__ . '/config.php';

// Inputs
$val_id = isset($_POST['val_id']) ? $_POST['val_id'] : '';
$status = isset($_POST['status']) ? $_POST['status'] : '';
$tran_id = isset($_POST['tran_id']) ? $_POST['tran_id'] : '';
$order_id = isset($_GET['order_id']) ? $_GET['order_id'] : '';

if (!$order_id) {
    die("Invalid Order ID");
}

$isValidated = false;
$transactionId = $tran_id;

// -------------------------------------------------------------------------
// METHOD 1: Standard Validation via val_id
// -------------------------------------------------------------------------
if (($status === 'VALID' || $status === 'VALIDATED') && !empty($val_id)) {
    
    $requested_url = (SSL_IS_SANDBOX) 
        ? "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php" 
        : "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php";

    $handle = curl_init();
    curl_setopt($handle, CURLOPT_URL, $requested_url . "?val_id=" . $val_id . "&store_id=" . SSL_STORE_ID . "&store_passwd=" . SSL_STORE_PASS . "&format=json");
    curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, false);
    
    $result = curl_exec($handle);
    $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
    curl_close($handle);

    if ($code == 200 && $result) {
        $result = json_decode($result, true);
        if ($result['status'] === 'VALID' || $result['status'] === 'VALIDATED') {
            $isValidated = true;
            $transactionId = $result['tran_id']; 
        }
    }
}

// -------------------------------------------------------------------------
// METHOD 2: Fallback - Validate via Transaction ID
// -------------------------------------------------------------------------
if (!$isValidated) {
    if (empty($transactionId)) {
        try {
            $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
            $stmt = $pdo->prepare("SELECT transaction_id FROM orders WHERE id = ?");
            $stmt->execute([$order_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $transactionId = $row['transaction_id'];
            }
        } catch (PDOException $e) {}
    }

    if (!empty($transactionId)) {
        $requested_url = (SSL_IS_SANDBOX) 
            ? "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php" 
            : "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";

        $handle = curl_init();
        curl_setopt($handle, CURLOPT_URL, $requested_url . "?store_id=" . SSL_STORE_ID . "&store_passwd=" . SSL_STORE_PASS . "&tran_id=" . $transactionId . "&format=json");
        curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($handle, CURLOPT_SSL_VERIFYPEER, false);
        
        $result = curl_exec($handle);
        $code = curl_getinfo($handle, CURLINFO_HTTP_CODE);
        curl_close($handle);

        if ($code == 200 && $result) {
            $result = json_decode($result, true);
            if (isset($result['element'][0]['status']) && 
               ($result['element'][0]['status'] === 'VALID' || $result['element'][0]['status'] === 'VALIDATED')) {
                $isValidated = true;
            }
            if (isset($result['status']) && ($result['status'] === 'VALID' || $result['status'] === 'VALIDATED')) {
                 $isValidated = true;
            }
        }
    }
}

// -------------------------------------------------------------------------
// FINAL DECISION
// -------------------------------------------------------------------------

if ($isValidated) {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Update Order Status
        $stmt = $pdo->prepare("UPDATE orders SET status = 'PAID', payment_date = NOW() WHERE id = ? AND status != 'PAID'");
        $stmt->execute([$order_id]);
        $updated = $stmt->rowCount();

        // Fetch Order Details
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$order_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($updated > 0 && $order) {
            // Update Coupon Usage
            if (!empty($order['coupon_code'])) {
                $stmtC = $pdo->prepare("UPDATE coupons SET usage_count = usage_count + 1 WHERE code = ?");
                $stmtC->execute([$order['coupon_code']]);
            }

            include __DIR__ . '/functions.php';
            
            // 1. Send CAPI Event (Server Side Tracking)
            sendFacebookCAPI(
                [
                    'email' => $order['email'],
                    'phone' => $order['phone'],
                    'name'  => $order['name']
                ], 
                $order['amount'], 
                $order['id'] // event_id for Deduplication
            );

            // 2. Send Notifications
            sendProductEmail($order['email'], $order['name'], $order['id']);
            
            // 3. Process Affiliate Commission
            processAffiliateCommission($order['id']);
            
            $smsContent = defined('SUCCESS_SMS_CONTENT') ? SUCCESS_SMS_CONTENT : "Your ebook order is approved! Check email for download link. Help: https://m.me/learningbangladesh71 - Shehzin.com";
            $downloadLink = SITE_URL . "/api/download.php?order_id=" . $order['id'];
            $smsBody = str_replace(
                ['{name}', '{order_id}', '{download_link}', '{site_url}'],
                [$order['name'], $order['id'], $downloadLink, SITE_URL],
                $smsContent
            );
            sendSMS($order['phone'], $smsBody);
        }
        
        if ($order) {
            // Redirect to Frontend Success Page
            header("Location: " . SITE_URL . "/#/success?order_id=" . $order_id);
            exit;
        } else {
            die("Order not found.");
        }

    } catch (PDOException $e) {
        die("Database Error: " . $e->getMessage());
    }
} else {
    // Payment failed or cancelled
    echo '<!DOCTYPE html>
    <html>
    <head>
        <title>Payment Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
        <div class="max-w-md w-full p-8 bg-slate-900 rounded-2xl border border-red-500/30 text-center">
            <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 class="text-2xl font-bold mb-2">Payment Failed</h2>
            <p class="text-slate-400 mb-6">Unfortunately, we could not verify your payment. If money was deducted, it will be refunded automatically or please contact support.</p>
            <div class="space-y-3">
                <a href="' . SITE_URL . '" class="block w-full py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition">Return Home</a>
                <a href="https://m.me/learningbangladesh71" class="block w-full py-3 border border-cyan-500 text-cyan-500 rounded-lg hover:bg-cyan-500/10 transition">Contact Support</a>
            </div>
        </div>
    </body>
    </html>';
}
?>