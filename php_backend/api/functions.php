<?php
require_once '../config.php';

function getSetting($key, $default = null) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT value FROM settings WHERE setting_key = ?");
    $stmt->execute([$key]);
    $result = $stmt->fetch();
    return $result ? $result['value'] : $default;
}

function updateSetting($key, $value) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?");
    $stmt->execute([$key, $value, $value]);
}

function sendSMS($phone, $message) {
    // Get SMS settings from database or config
    $apiKey = getSetting('sms_api_key', SMS_API_KEY);
    $senderId = getSetting('sms_sender_id', SMS_SENDER_ID);
    $apiUrl = getSetting('sms_api_url', SMS_API_URL);

    if (!$apiKey || !$apiUrl) {
        error_log("SMS Config Missing: API Key or URL not set.");
        return false;
    }

    $url = "$apiUrl?api_key=" . urlencode($apiKey) . "&type=text&contacts=" . urlencode($phone) . "&senderid=" . urlencode($senderId) . "&msg=" . urlencode($message);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    error_log("SMS Sent to $phone: Response: $response");
    return $response;
}

function sendEmail($to, $subject, $body) {
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= 'From: ' . getSetting('site_name', 'eBook Store') . ' <' . getSetting('admin_email', ADMIN_EMAIL) . '>' . "\r\n";

    if(mail($to, $subject, $body, $headers)) {
        error_log("Email Sent to $to: Subject: $subject");
        return true;
    } else {
        error_log("Email Failed to $to: Subject: $subject");
        return false;
    }
}

function logAutomation($orderId, $type, $message, $status, $name, $phone) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO automation_logs (order_id, action_type, message, status, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$orderId, $type, $message, $status]);
}
?>
