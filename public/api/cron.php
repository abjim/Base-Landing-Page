<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json; charset=utf-8');

// DB Connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("SET time_zone = '+06:00'");
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB Connection Failed: ' . $e->getMessage()]);
    exit;
}

// --- SELF-HEALING: Ensure Columns & Tables Exist ---
try {
    // 1. Ensure automation_logs table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        name VARCHAR(255),
        phone VARCHAR(50),
        action_type VARCHAR(50), -- 'SMS', 'EMAIL'
        message TEXT,
        status VARCHAR(50) DEFAULT 'SENT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // 2. Ensure orders table has tracking columns
    $columns = $pdo->query("SHOW COLUMNS FROM orders")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('last_followup_level', $columns)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN last_followup_level INT DEFAULT 0");
    }
    if (!in_array('last_paid_followup_level', $columns)) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN last_paid_followup_level INT DEFAULT 0");
    }

} catch (Exception $e) {
    // Log error but continue if possible
    error_log("Schema Check Failed: " . $e->getMessage());
}

// --- FETCH CONFIG ---
$stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'automation_config'");
$configStr = $stmt->fetchColumn();
$config = $configStr ? json_decode($configStr, true) : [];

if (!$config) { 
    echo json_encode(['success' => false, 'message' => 'No automation config found']); 
    exit; 
}

$processed = 0;
$logs = [];

// --- PENDING ORDER AUTOMATION (Recovery) ---
// Delays: Step 1 (1h), Step 2 (24h), Step 3 (48h)
$stmt = $pdo->query("SELECT *, TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_diff FROM orders WHERE status = 'PENDING' AND last_followup_level < 3 LIMIT 50");
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($orders as $order) {
    $hours = $order['hours_diff'];
    $lastLevel = $order['last_followup_level'];
    $nextLevel = 0;
    $actions = null;
    
    // Logic based on User Configured Delays
    $delay1 = intval($config['day1']['delay'] ?? 1);
    $delay2 = intval($config['day3']['delay'] ?? 24);
    $delay3 = intval($config['day5']['delay'] ?? 48);

    // Step 1
    if ($hours >= $delay1 && $lastLevel < 1) { 
        $nextLevel = 1; 
        $actions = $config['day1'] ?? null; 
    } 
    // Step 2
    elseif ($hours >= $delay2 && $lastLevel < 2) { 
        $nextLevel = 2; 
        $actions = $config['day3'] ?? null; 
    } 
    // Step 3
    elseif ($hours >= $delay3 && $lastLevel < 3) { 
        $nextLevel = 3; 
        $actions = $config['day5'] ?? null; 
    }
    
    if ($actions && $nextLevel > 0) {
        processAutomation($pdo, $order, $actions, 'PENDING', $nextLevel);
        $processed++;
        $logs[] = "Pending Order #{$order['id']} -> Level $nextLevel";
    }
}

// --- PAID ORDER AUTOMATION (Upsell/Engagement) ---
// Delays: Level 1 (6h), Level 2 (36h), Level 3 (72h)
$stmt = $pdo->query("SELECT *, TIMESTAMPDIFF(HOUR, created_at, NOW()) as hours_diff FROM orders WHERE status = 'PAID' AND last_paid_followup_level < 3 LIMIT 50");
$paidOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($paidOrders as $order) {
    $hours = $order['hours_diff'];
    $lastLevel = $order['last_paid_followup_level'] ?? 0;
    $nextLevel = 0;
    $actions = null;

    // Logic based on User Configured Delays
    $delay1 = intval($config['paid_level1']['delay'] ?? 6);
    $delay2 = intval($config['paid_level2']['delay'] ?? 36);
    $delay3 = intval($config['paid_level3']['delay'] ?? 72);

    // Level 1
    if ($hours >= $delay1 && $lastLevel < 1) { 
        $nextLevel = 1; 
        $actions = $config['paid_level1'] ?? null; 
    }
    // Level 2
    elseif ($hours >= $delay2 && $lastLevel < 2) { 
        $nextLevel = 2; 
        $actions = $config['paid_level2'] ?? null; 
    }
    // Level 3
    elseif ($hours >= $delay3 && $lastLevel < 3) { 
        $nextLevel = 3; 
        $actions = $config['paid_level3'] ?? null; 
    }

    if ($actions && $nextLevel > 0) {
        processAutomation($pdo, $order, $actions, 'PAID', $nextLevel);
        $processed++;
        $logs[] = "Paid Order #{$order['id']} -> Level $nextLevel";
    }
}

// --- HELPER FUNCTION ---
function processAutomation($pdo, $order, $actions, $type, $level) {
    $downloadLink = SITE_URL . "/api/download.php?order_id=" . $order['id'];
    $replacements = [
        '{name}' => $order['name'],
        '{order_id}' => $order['id'],
        '{download_link}' => $downloadLink,
        '{site_url}' => SITE_URL,
        '<br>' => "\n" // For SMS
    ];

    // Send SMS
    if (!empty($actions['sms'])) {
        $smsContent = str_replace(array_keys($replacements), array_values($replacements), $actions['sms']);
        // Remove HTML tags for SMS
        $smsContent = strip_tags($smsContent);
        
        $res = sendSMS($order['phone'], $smsContent);
        
        $pdo->prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, 'SMS', ?, ?)")
            ->execute([$order['id'], $order['name'], $order['phone'], $smsContent, 'SENT']);
    }
    
    // Send Email
    if (!empty($actions['email_body'])) {
        // Reset <br> for Email
        $replacements['<br>'] = '<br>';
        
        $body = str_replace(array_keys($replacements), array_values($replacements), $actions['email_body']);
        $subject = $actions['email_subject'] ?? ($type === 'PENDING' ? 'Complete your order' : 'Update from Shehzin');
        $subject = str_replace(array_keys($replacements), array_values($replacements), $subject);
        
        // Ensure HTML
        if (strpos($body, '<html') === false) {
            $body = "<html><body>" . nl2br($body) . "</body></html>";
        }

        $sent = sendCustomEmail($order['email'], $subject, $body);
        
        $pdo->prepare("INSERT INTO automation_logs (order_id, name, phone, action_type, message, status) VALUES (?, ?, ?, 'EMAIL', ?, ?)")
            ->execute([$order['id'], $order['name'], $order['phone'], "Subject: $subject", $sent ? 'SENT' : 'FAILED']);
    }
    
    // Update Level
    $col = $type === 'PENDING' ? 'last_followup_level' : 'last_paid_followup_level';
    $pdo->prepare("UPDATE orders SET $col = ? WHERE id = ?")->execute([$level, $order['id']]);
}

echo json_encode([
    'success' => true, 
    'processed_count' => $processed,
    'logs' => $logs
]);
?>
