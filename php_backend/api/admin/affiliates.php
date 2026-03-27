<?php
require_once '../../config.php';
require_once '../functions.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'update_settings') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['commission_percent'])) {
        updateSetting('affiliate_commission_percent', $data['commission_percent']);
    }
    if (isset($data['notification_sms'])) {
        updateSetting('affiliate_notification_sms', $data['notification_sms']);
    }
    if (isset($data['notification_email_subject'])) {
        updateSetting('affiliate_notification_email_subject', $data['notification_email_subject']);
    }
    if (isset($data['notification_email_body'])) {
        updateSetting('affiliate_notification_email_body', $data['notification_email_body']);
    }
    
    echo json_encode(['success' => true, 'message' => 'Affiliate settings updated successfully']);
    exit;
}

if ($action === 'get_settings') {
    $settings = [
        'commission_percent' => getSetting('affiliate_commission_percent', 10.00),
        'notification_sms' => getSetting('affiliate_notification_sms', 'Congratulations! You earned {amount} commission for order #{order_id}.'),
        'notification_email_subject' => getSetting('affiliate_notification_email_subject', 'New Commission Earned!'),
        'notification_email_body' => getSetting('affiliate_notification_email_body', '<p>Hello {name},</p><p>You have earned {amount} commission for order #{order_id}.</p>')
    ];
    echo json_encode($settings);
    exit;
}

// Other affiliate actions (list, stats, withdrawals)...
echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
