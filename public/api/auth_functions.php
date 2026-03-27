<?php
require_once __DIR__ . '/config.php';

function get_db_connection() {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    return $pdo;
}

function normalize_phone($phone) {
    // Remove all non-digit characters
    $digits = preg_replace('/[^0-9]/', '', $phone);
    // If it starts with 880, remove 88
    if (substr($digits, 0, 3) === '880') {
        $digits = substr($digits, 2);
    }
    // If it starts with 0, keep it. 
    // Basically we want the local format: 017XXXXXXXX
    return $digits;
}

function ensure_users_table_exists($pdo) {
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        password_hash VARCHAR(255) NOT NULL,
        reset_token VARCHAR(255) NULL,
        reset_expiry DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email)
    )";
    $pdo->exec($sql);
}

function find_user_by_identifier($pdo, $identifier) {
    $clean_identifier = trim($identifier);
    
    // 1. Try to find in USERS table
    // Check as Email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$clean_identifier]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) return $user;

    // Check as Phone (Normalize input and DB column?)
    // For simplicity, let's just check direct match first
    $stmt = $pdo->prepare("SELECT * FROM users WHERE phone = ? LIMIT 1");
    $stmt->execute([$clean_identifier]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) return $user;

    // 2. If not found, check ORDERS table (Auto-Migration)
    // We check for PAID orders
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PAID' ORDER BY id DESC LIMIT 1");
    $stmt->execute([$clean_identifier, $clean_identifier]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order) {
        return migrate_user_from_order($pdo, $order);
    }
    
    return null;
}

function migrate_user_from_order($pdo, $order) {
    $email = trim($order['email']);
    $phone = trim($order['phone']);
    $name = trim($order['name'] ?? '');
    
    // Default password hash for '12345678'
    $default_pass_hash = password_hash('12345678', PASSWORD_DEFAULT);
    
    try {
        // Check if email already exists in users (maybe from another order)
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            return $existing;
        }

        $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $email, $phone, $default_pass_hash]);
        
        // Return the newly created user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Handle race condition or duplicate entry
        return null;
    }
}

function get_auth_token() {
    $headers = null;
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }
    
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return str_replace('Bearer ', '', $authHeader);
}

function send_json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
?>
