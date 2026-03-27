<?php
require_once __DIR__ . '/config.php';

// bKash redirects here with paymentID and status
$paymentID = $_GET['paymentID'];
$status = $_GET['status'];

if (isset($paymentID) && $status === 'success') {
    
    // 1. Get Token again to Execute Payment
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
    $id_token = $response['id_token'];

    // 2. Execute Payment
    $executebody = ['paymentID' => $paymentID];
    
    $url = curl_init(BKASH_BASE_URL . '/tokenized/checkout/execute');
    $header = [
        'Content-Type:application/json',
        'Authorization:'.$id_token,
        'X-APP-Key:'.BKASH_APP_KEY
    ];
    curl_setopt($url, CURLOPT_HTTPHEADER, $header);
    curl_setopt($url, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($url, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($url, CURLOPT_POSTFIELDS, json_encode($executebody));
    
    $resultdata = curl_exec($url);
    curl_close($url);
    $response = json_decode($resultdata, true);

    if (isset($response['trxID'])) {
        // SUCCESS!
        // UTF8MB4 Connection
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        
        // Find order by Payment ID and Update
        $stmt = $pdo->prepare("UPDATE orders SET status = 'PAID', transaction_id = ?, payment_date = NOW() WHERE transaction_id = ? AND status != 'PAID'");
        $stmt->execute([$response['trxID'], $paymentID]);
        $updated = $stmt->rowCount();
        
        // Get Order Details
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE transaction_id = ? OR transaction_id = ?");
        $stmt->execute([$response['trxID'], $paymentID]);
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
            // Redirect to Success Page
            header("Location: " . SITE_URL . "/#/success?order_id=" . $order['id']);
            exit;
        } else {
            die("Order not found.");
        }
    } else {
        // Execution API Failed (Technical Error or Insufficient Balance during execute)
        echo '<!DOCTYPE html>
        <html>
        <head>
            <title>Payment Execution Failed</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-950 text-white flex items-center justify-center min-h-screen">
            <div class="max-w-md w-full p-8 bg-slate-900 rounded-2xl border border-red-500/30 text-center">
                <div class="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-red-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
                <h2 class="text-2xl font-bold mb-2">bKash Error</h2>
                <p class="text-slate-400 mb-6">Payment execution failed. ' . ($response['statusMessage'] ?? 'Unknown Error') . '</p>
                <div class="space-y-3">
                    <a href="' . SITE_URL . '" class="block w-full py-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition">Return Home</a>
                    <a href="https://m.me/learningbangladesh71" class="block w-full py-3 border border-cyan-500 text-cyan-500 rounded-lg hover:bg-cyan-500/10 transition">Contact Support</a>
                </div>
            </div>
        </body>
        </html>';
    }

} else {
    // Payment Cancelled or Failed by User
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