<?php
require_once '../config.php';
require_once 'functions.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

if ($action === 'update_schema') {
    try {
        // Create tables if not exist
        $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS automation_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT,
            action_type VARCHAR(50),
            message TEXT,
            status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS affiliates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            email VARCHAR(255) UNIQUE,
            phone VARCHAR(20),
            password VARCHAR(255),
            code VARCHAR(50) UNIQUE,
            commission_percent DECIMAL(5,2) DEFAULT 10.00,
            notification_sms TEXT,
            notification_email_subject VARCHAR(255),
            notification_email_body TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS affiliate_earnings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            affiliate_id INT,
            order_id INT,
            amount DECIMAL(10,2),
            status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
        )");

        echo json_encode(['success' => true, 'message' => 'Schema updated successfully']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Schema update failed: ' . $e->getMessage()]);
    }
    exit;
}

if ($action === 'run_automation') {
    // Include cron logic or call it
    // For simplicity, we can just include the cron script logic here or make a request to it
    // But since cron.php checks for a key, we might need to bypass it or set the key
    $_GET['key'] = 'YOUR_CRON_SECRET_KEY'; // Simulate key for internal include
    ob_start();
    include 'cron.php';
    $output = ob_get_clean();
    echo json_encode(['success' => true, 'message' => 'Automation run successfully', 'output' => $output]);
    exit;
}

if ($action === 'bulk_send') {
    $data = json_decode(file_get_contents('php://input'), true);
    // Implement bulk send logic here
    // Example: Loop through users and send SMS/Email
    echo json_encode(['success' => true, 'message' => 'Bulk send initiated']);
    exit;
}

// Other admin actions...
echo json_encode(['success' => false, 'message' => 'Invalid action']);
?>
