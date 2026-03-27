<?php
require_once 'db.php';
require_once 'utils.php';

// Cron Job for Automation (Runs every hour)
// Fetch automation settings
$automationSettings = get_setting('automation_settings');
$config = json_decode($automationSettings, true) ?? [];

function processAutomation($step, $status, $delayHours, $smsTemplate, $emailSubject, $emailBody) {
    global $pdo;

    // Calculate target time
    $targetTime = date('Y-m-d H:i:s', strtotime("-$delayHours hours"));

    // Find orders matching criteria
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE status = ? AND created_at <= ?");
    $stmt->execute([$status, $targetTime]);
    $orders = $stmt->fetchAll();

    foreach ($orders as $order) {
        // Check if already processed for this step
        $stmt = $pdo->prepare("SELECT id FROM automation_logs WHERE order_id = ? AND action_type LIKE ?");
        $stmt->execute([$order['id'], "AUTOMATION_{$step}_%"]);
        if ($stmt->fetch()) continue;

        $sent = false;

        if ($smsTemplate) {
            $msg = str_replace('{name}', $order['name'], $smsTemplate);
            $smsSent = sendSMS($order['phone'], $msg);
            log_automation($order['id'], $order['name'], $order['phone'], "AUTOMATION_{$step}_SMS", $msg, $smsSent ? 'SENT' : 'FAILED');
            $sent = true;
        }

        if ($emailSubject && $emailBody) {
            $subject = str_replace('{name}', $order['name'], $emailSubject);
            $body = str_replace('{name}', $order['name'], $emailBody);
            $emailSent = sendEmail($order['email'], $subject, $body);
            log_automation($order['id'], $order['name'], $order['email'], "AUTOMATION_{$step}_EMAIL", "Subject: $subject\n\n$body", $emailSent ? 'SENT' : 'FAILED');
            $sent = true;
        }

        if ($sent) {
            echo "Processed $step for Order #{$order['id']}\n";
        }
    }
}

// Pending Orders
processAutomation('day1', 'PENDING', (int)($config['day1']['delay'] ?? 0), $config['day1']['sms'] ?? '', $config['day1']['email_subject'] ?? '', $config['day1']['email_body'] ?? '');
processAutomation('day3', 'PENDING', (int)($config['day3']['delay'] ?? 0), $config['day3']['sms'] ?? '', $config['day3']['email_subject'] ?? '', $config['day3']['email_body'] ?? '');
processAutomation('day5', 'PENDING', (int)($config['day5']['delay'] ?? 0), $config['day5']['sms'] ?? '', $config['day5']['email_subject'] ?? '', $config['day5']['email_body'] ?? '');

// Paid Orders
processAutomation('paid_level1', 'PAID', (int)($config['paid_level1']['delay'] ?? 0), $config['paid_level1']['sms'] ?? '', $config['paid_level1']['email_subject'] ?? '', $config['paid_level1']['email_body'] ?? '');
processAutomation('paid_level2', 'PAID', (int)($config['paid_level2']['delay'] ?? 0), $config['paid_level2']['sms'] ?? '', $config['paid_level2']['email_subject'] ?? '', $config['paid_level2']['email_body'] ?? '');
processAutomation('paid_level3', 'PAID', (int)($config['paid_level3']['delay'] ?? 0), $config['paid_level3']['sms'] ?? '', $config['paid_level3']['email_subject'] ?? '', $config['paid_level3']['email_body'] ?? '');

?>
