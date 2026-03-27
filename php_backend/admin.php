<?php
require_once 'db.php';
require_once 'utils.php';

// Handle Admin Requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $_GET['action'] ?? '';

    if ($action === 'update_order_details') {
        $id = $input['id'] ?? '';
        $name = $input['name'] ?? '';
        $email = $input['email'] ?? '';
        $phone = $input['phone'] ?? '';
        $amount = $input['amount'] ?? '';
        $status = $input['status'] ?? '';
        $gateway = $input['gateway'] ?? '';
        $transaction_id = $input['transaction_id'] ?? '';
        $affiliate_code = $input['affiliate_code'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        $currentOrder = $stmt->fetch();

        if (!$currentOrder) {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            exit;
        }

        // Update Order
        $stmt = $pdo->prepare("UPDATE orders SET name = ?, email = ?, phone = ?, amount = ?, status = ?, gateway = ?, transaction_id = ?, affiliate_code = ? WHERE id = ?");
        $stmt->execute([$name, $email, $phone, $amount, $status, $gateway, $transaction_id, $affiliate_code, $id]);

        // Handle Affiliate Commission if status changed to PAID
        if ($status === 'PAID' && $currentOrder['status'] !== 'PAID' && $affiliate_code) {
            process_affiliate_commission($id, $amount, $affiliate_code);
        }

        echo json_encode(['success' => true]);
    } elseif ($action === 'resend_notification') {
        $order_id = $input['order_id'] ?? '';
        $type = $input['type'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$order_id]);
        $order = $stmt->fetch();

        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            exit;
        }

        // Fetch automation settings
        $automationSettings = get_setting('automation_settings');
        $config = json_decode($automationSettings, true) ?? [];

        if ($type === 'sms') {
            $msg = $config['paid_level1']['sms'] ?? "Hi {name}, thanks for your purchase!";
            $msg = str_replace('{name}', $order['name'], $msg);
            $sent = sendSMS($order['phone'], $msg);
            log_automation($order['id'], $order['name'], $order['phone'], 'MANUAL_RESEND_SMS', $msg, $sent ? 'SENT' : 'FAILED');
            echo json_encode(['success' => $sent]);
        } elseif ($type === 'email') {
            $subject = $config['paid_level1']['email_subject'] ?? 'Order Confirmation';
            $body = $config['paid_level1']['email_body'] ?? "Hi {name}, thanks for your purchase!";
            $subject = str_replace('{name}', $order['name'], $subject);
            $body = str_replace('{name}', $order['name'], $body);
            $sent = sendEmail($order['email'], $subject, $body);
            log_automation($order['id'], $order['name'], $order['email'], 'MANUAL_RESEND_EMAIL', "Subject: $subject\n\n$body", $sent ? 'SENT' : 'FAILED');
            echo json_encode(['success' => $sent]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid type']);
        }
    } elseif ($action === 'send_custom_message') {
        $order_id = $input['order_id'] ?? '';
        $message = $input['message'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$order_id]);
        $order = $stmt->fetch();

        if (!$order) {
            echo json_encode(['success' => false, 'message' => 'Order not found']);
            exit;
        }

        $sent = sendSMS($order['phone'], $message);
        log_automation($order['id'], $order['name'], $order['phone'], 'CUSTOM_SMS', $message, $sent ? 'SENT' : 'FAILED');
        echo json_encode(['success' => $sent]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Action not implemented']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
}
?>
