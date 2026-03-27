<?php
require_once '../config.php';

header('Content-Type: application/json');

try {
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 1. Ensure 'affiliates' table exists
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

    // 2. Ensure 'affiliate_earnings' table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS affiliate_earnings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        affiliate_id INT,
        order_id INT,
        amount DECIMAL(10,2),
        status ENUM('PENDING', 'PAID', 'CANCELLED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
    )");

    // 3. Add 'affiliate_code' to 'orders' table if not exists
    $stmt = $pdo->query("SHOW COLUMNS FROM orders LIKE 'affiliate_code'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN affiliate_code VARCHAR(50) NULL AFTER status");
    }

    // 4. Add 'affiliate_commission_status' to 'orders' table if not exists
    $stmt = $pdo->query("SHOW COLUMNS FROM orders LIKE 'affiliate_commission_status'");
    if ($stmt->rowCount() == 0) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN affiliate_commission_status ENUM('PENDING', 'PROCESSED', 'CANCELLED') DEFAULT 'PENDING' AFTER affiliate_code");
    }

    // 5. Ensure 'settings' table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 6. Ensure 'automation_logs' table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        action_type VARCHAR(50),
        message TEXT,
        status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    echo json_encode(['status' => 'success', 'messages' => ['Database schema updated successfully.']]);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database update failed: ' . $e->getMessage()]);
}
?>
