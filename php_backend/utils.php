<?php
require_once 'db.php';

// Send SMS using BulkSMSBD
function sendSMS($to, $message) {
    if (empty($to) || $to === 'N/A' || strlen($to) < 10) return false;

    $apiKey = get_setting('sms_api_key');
    $senderId = get_setting('sms_sender_id');

    if (!$apiKey || !$senderId) {
        error_log("SMS not configured. SMS skipped: " . $to);
        return false;
    }

    $url = "http://bulksmsbd.net/api/smsapi?api_key=" . urlencode($apiKey) . "&type=text&number=" . urlencode($to) . "&senderid=" . urlencode($senderId) . "&message=" . urlencode($message);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $data = json_decode($response, true);

    if ($httpCode == 200 && (isset($data['response_code']) && $data['response_code'] == 202 || isset($data['success']) && $data['success'] === true)) {
        return true;
    } else {
        error_log("Error sending SMS: " . $response);
        return false;
    }
}

// Send Email using PHP mail() or SMTP (basic implementation)
function sendEmail($to, $subject, $body) {
    $smtpHost = get_setting('smtp_host');
    $smtpUser = get_setting('smtp_user');
    $smtpPass = get_setting('smtp_pass');
    $senderEmail = get_setting('sender_email', 'noreply@example.com');
    $senderName = get_setting('sender_name', 'My Store');

    // Basic PHP mail() fallback if SMTP not configured (or use PHPMailer if available)
    // For simplicity, using mail() here but ideally use PHPMailer
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: $senderName <$senderEmail>" . "\r\n";

    if (mail($to, $subject, $body, $headers)) {
        return true;
    } else {
        error_log("Error sending email to: " . $to);
        return false;
    }
}

// Log Automation Action
function log_automation($order_id, $name, $phone, $action_type, $message, $status) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$order_id, $name, $phone, $action_type, $message, $status]);
}

// Process Affiliate Commission
function process_affiliate_commission($order_id, $amount, $affiliate_code) {
    global $pdo;

    // Check if commission already processed
    $stmt = $pdo->prepare("SELECT id FROM affiliate_transactions WHERE source_order_id = ? AND type = 'COMMISSION'");
    $stmt->execute([$order_id]);
    if ($stmt->fetch()) return; // Already processed

    // Get Affiliate
    $stmt = $pdo->prepare("SELECT * FROM affiliates WHERE code = ?");
    $stmt->execute([$affiliate_code]);
    $affiliate = $stmt->fetch();

    if (!$affiliate) return;

    // Calculate Commission
    $percent = (float)get_setting('affiliate_commission_percent', '20');
    $commission = round(($amount * $percent) / 100);

    if ($commission > 0) {
        // Update Balance
        $stmt = $pdo->prepare("UPDATE affiliates SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?");
        $stmt->execute([$commission, $commission, $affiliate['id']]);

        // Record Transaction
        $stmt = $pdo->prepare("INSERT INTO affiliate_transactions (affiliate_id, amount, type, source_order_id, created_at) VALUES (?, ?, 'COMMISSION', ?, NOW())");
        $stmt->execute([$affiliate['id'], $commission, $order_id]);

        // Update Order Commission Amount
        $stmt = $pdo->prepare("UPDATE orders SET commission_amount = ? WHERE id = ?");
        $stmt->execute([$commission, $order_id]);

        // Send Notifications
        send_affiliate_notifications($affiliate, $commission, $amount, $order_id);
    }
}

// Send Affiliate Notifications
function send_affiliate_notifications($affiliate, $commission, $order_amount, $order_id) {
    global $pdo;

    // Get Affiliate User Info (Name/Phone from orders table using email)
    $stmt = $pdo->prepare("SELECT name, phone FROM orders WHERE email = ? LIMIT 1");
    $stmt->execute([$affiliate['email']]);
    $user = $stmt->fetch();

    $affiliateName = $user ? $user['name'] : 'Partner';
    $affiliatePhone = $user ? $user['phone'] : 'N/A';
    
    // Re-fetch updated affiliate for accurate totals
    $stmt = $pdo->prepare("SELECT total_earnings FROM affiliates WHERE id = ?");
    $stmt->execute([$affiliate['id']]);
    $updatedAffiliate = $stmt->fetch();
    $totalEarnings = $updatedAffiliate['total_earnings'];

    // Templates
    $smsTemplate = get_setting('affiliate_notification_sms');
    $emailSubjectTemplate = get_setting('affiliate_notification_email_subject');
    $emailBodyTemplate = get_setting('affiliate_notification_email_body');

    // Replace Tags
    $replaceTags = function($text) use ($affiliateName, $commission, $totalEarnings, $order_amount, $affiliate) {
        return str_replace(
            ['{name}', '{commission}', '{total_earnings}', '{order_amount}', '{code}'],
            [$affiliateName, $commission, $totalEarnings, $order_amount, $affiliate['code']],
            $text
        );
    };

    // Send SMS
    if ($smsTemplate && $affiliatePhone !== 'N/A') {
        $msg = $replaceTags($smsTemplate);
        $sent = sendSMS($affiliatePhone, $msg);
        log_automation($order_id, $affiliateName, $affiliatePhone, 'AFFILIATE_SMS', $msg, $sent ? 'SENT' : 'FAILED');
    }

    // Send Email
    if ($emailBodyTemplate) {
        $subject = $replaceTags($emailSubjectTemplate ?: 'New Commission');
        $body = $replaceTags($emailBodyTemplate);
        $sent = sendEmail($affiliate['email'], $subject, $body);
        log_automation($order_id, $affiliateName, $affiliate['email'], 'AFFILIATE_EMAIL', "Subject: $subject\n\n$body", $sent ? 'SENT' : 'FAILED');
    }
}
?>
