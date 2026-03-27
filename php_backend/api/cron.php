<?php
require_once '../config.php';
require_once 'functions.php';

// Check for secret key to prevent unauthorized access
if (!isset($_GET['key']) || $_GET['key'] !== 'YOUR_CRON_SECRET_KEY') {
    die('Access Denied');
}

echo "Starting Cron Job...\n";

// 1. Process Affiliate Commissions
echo "Processing Affiliate Commissions...\n";

// Get settings
$commissionPercent = getSetting('affiliate_commission_percent', 10);
$smsTemplate = getSetting('affiliate_notification_sms', 'You earned {amount} commission for order #{order_id}.');
$emailSubject = getSetting('affiliate_notification_email_subject', 'New Commission Earned');
$emailBodyTemplate = getSetting('affiliate_notification_email_body', 'Hello {name}, you earned {amount} for order #{order_id}.');

// Find paid orders with affiliate code that haven't been processed
// Assuming 'affiliate_commission_status' column exists in orders table. If not, run setup_auth.php
$stmt = $pdo->prepare("
    SELECT o.*, a.id as affiliate_id, a.name as affiliate_name, a.phone as affiliate_phone, a.email as affiliate_email 
    FROM orders o 
    JOIN affiliates a ON o.affiliate_code = a.code 
    WHERE o.status = 'PAID' 
    AND (o.affiliate_commission_status IS NULL OR o.affiliate_commission_status = 'PENDING')
    AND o.affiliate_code IS NOT NULL
");
$stmt->execute();
$orders = $stmt->fetchAll();

foreach ($orders as $order) {
    echo "Processing Order #{$order['id']} for Affiliate: {$order['affiliate_name']}\n";

    try {
        $pdo->beginTransaction();

        // Calculate Commission
        $commissionAmount = ($order['total_amount'] * $commissionPercent) / 100;

        // Record Earning
        $stmtInsert = $pdo->prepare("INSERT INTO affiliate_earnings (affiliate_id, order_id, amount, status, created_at) VALUES (?, ?, ?, 'PENDING', NOW())");
        $stmtInsert->execute([$order['affiliate_id'], $order['id'], $commissionAmount]);

        // Update Order Status
        $stmtUpdate = $pdo->prepare("UPDATE orders SET affiliate_commission_status = 'PROCESSED' WHERE id = ?");
        $stmtUpdate->execute([$order['id']]);

        $pdo->commit();

        // Send Notifications
        // SMS
        if ($order['affiliate_phone']) {
            $smsMsg = str_replace(
                ['{name}', '{amount}', '{order_id}'],
                [$order['affiliate_name'], $commissionAmount, $order['id']],
                $smsTemplate
            );
            sendSMS($order['affiliate_phone'], $smsMsg);
        }

        // Email
        if ($order['affiliate_email']) {
            $emailBody = str_replace(
                ['{name}', '{amount}', '{order_id}'],
                [$order['affiliate_name'], $commissionAmount, $order['id']],
                $emailBodyTemplate
            );
            sendEmail($order['affiliate_email'], $emailSubject, $emailBody);
        }

        echo "Commission Recorded and Notifications Sent.\n";

    } catch (Exception $e) {
        $pdo->rollBack();
        echo "Error processing order #{$order['id']}: " . $e->getMessage() . "\n";
    }
}

echo "Cron Job Completed.\n";
?>
