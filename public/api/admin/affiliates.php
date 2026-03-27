<?php
session_start();
require_once '../auth_functions.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Security Check: Ensure Admin is Logged In
if (!isset($_SESSION['admin_id'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin login required.']);
    exit;
}

$action = $_GET['action'] ?? '';

try {
    $pdo = get_db_connection();

    // Ensure name column exists in users table to prevent query crashes
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'name'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL AFTER id");
    }

    if ($action === 'stats') {
        // Total Affiliates
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM users WHERE is_affiliate = 1");
        $total_affiliates = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Total Clicks
        $stmt = $pdo->query("SELECT COUNT(*) as total FROM affiliate_clicks");
        $total_clicks = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Total Earnings
        $stmt = $pdo->query("SELECT SUM(total_earnings) as total FROM users WHERE is_affiliate = 1");
        $total_earnings = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // Pending Withdrawals
        $stmt = $pdo->query("SELECT SUM(amount) as total FROM affiliate_withdrawals WHERE status = 'PENDING'");
        $pending_withdrawals = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        send_json_response([
            'total_affiliates' => $total_affiliates,
            'total_clicks' => $total_clicks,
            'total_earnings' => $total_earnings,
            'pending_withdrawals' => $pending_withdrawals
        ]);
    }

    if ($action === 'withdrawals') {
        $stmt = $pdo->query("
            SELECT w.*, u.name as affiliate_name, u.email as affiliate_email 
            FROM affiliate_withdrawals w 
            JOIN users u ON w.affiliate_id = u.id 
            ORDER BY w.created_at DESC
        ");
        $withdrawals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_json_response(['withdrawals' => $withdrawals]);
    }

    if ($action === 'list') {
        $stmt = $pdo->query("
            SELECT u.id, u.name, u.email, u.affiliate_code, u.balance, u.total_earnings, u.created_at,
                   (SELECT COUNT(*) FROM affiliate_clicks c WHERE c.affiliate_id = u.id) as clicks,
                   (SELECT COUNT(*) FROM orders o WHERE o.affiliate_id = u.id AND o.status = 'PAID') as sales_count
            FROM users u 
            WHERE u.is_affiliate = 1 
            ORDER BY u.created_at DESC
        ");
        $affiliates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_json_response(['affiliates' => $affiliates]);
    }

    if ($action === 'update_withdrawal') {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? 0;
        $status = $input['status'] ?? ''; // APPROVED or REJECTED

        if (!$id || !in_array($status, ['APPROVED', 'REJECTED'])) {
            send_json_response(['success' => false, 'message' => 'Invalid input'], 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM affiliate_withdrawals WHERE id = ?");
        $stmt->execute([$id]);
        $withdrawal = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$withdrawal) {
            send_json_response(['success' => false, 'message' => 'Withdrawal not found'], 404);
        }

        if ($withdrawal['status'] !== 'PENDING') {
            send_json_response(['success' => false, 'message' => 'Withdrawal already processed'], 400);
        }

        $pdo->beginTransaction();

        $stmt = $pdo->prepare("UPDATE affiliate_withdrawals SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        if ($status === 'REJECTED') {
            // Refund balance
            $stmt = $pdo->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
            $stmt->execute([$withdrawal['amount'], $withdrawal['affiliate_id']]);

            // Update transaction status
            $stmt = $pdo->prepare("UPDATE affiliate_transactions SET status = 'REJECTED' WHERE type = 'WITHDRAWAL' AND order_id = ?");
            $stmt->execute([$id]);
        } else {
            // Update transaction status
            $stmt = $pdo->prepare("UPDATE affiliate_transactions SET status = 'COMPLETED' WHERE type = 'WITHDRAWAL' AND order_id = ?");
            $stmt->execute([$id]);
        }

        $pdo->commit();

        send_json_response(['success' => true]);
    }

    if ($action === 'get_settings') {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('affiliate_commission_percent', 'affiliate_notification_sms', 'affiliate_notification_email_subject', 'affiliate_notification_email_body')");
        $settings = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }
        
        send_json_response([
            'commission_percent' => floatval($settings['affiliate_commission_percent'] ?? 20),
            'notification_sms' => $settings['affiliate_notification_sms'] ?? 'Congrats! You earned ৳{commission} commission for order #{order_id}.',
            'notification_email_subject' => $settings['affiliate_notification_email_subject'] ?? 'New Commission Earned!',
            'notification_email_body' => $settings['affiliate_notification_email_body'] ?? '<p>Hi {name},</p><p>You have earned ৳{commission} commission for order #{order_id}.</p>'
        ]);
    }

    if ($action === 'update_settings') {
        $input = json_decode(file_get_contents('php://input'), true);
        $commission_percent = floatval($input['commission_percent'] ?? 20);
        $notification_sms = $input['notification_sms'] ?? '';
        $notification_email_subject = $input['notification_email_subject'] ?? '';
        $notification_email_body = $input['notification_email_body'] ?? '';

        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
        $stmt->execute(['affiliate_commission_percent', $commission_percent, $commission_percent]);
        $stmt->execute(['affiliate_notification_sms', $notification_sms, $notification_sms]);
        $stmt->execute(['affiliate_notification_email_subject', $notification_email_subject, $notification_email_subject]);
        $stmt->execute(['affiliate_notification_email_body', $notification_email_body, $notification_email_body]);

        send_json_response(['success' => true]);
    }

    send_json_response(['status' => 'error', 'message' => 'Invalid action'], 400);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
