<?php
session_start();
require_once 'auth_functions.php';

// Allow CORS
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

$response = [
    'status' => 'success',
    'messages' => [],
    'migrated_count' => 0
];

try {
    $pdo = get_db_connection();
    
    // 1. Ensure Users Table Exists & Has Phone Column
    ensure_users_table_exists($pdo);
    
    // Check if phone column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'phone'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER email");
        $response['messages'][] = "Added phone column to users table.";
    }
    
    // Check if name column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'name'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN name VARCHAR(255) AFTER id");
        $response['messages'][] = "Added name column to users table.";
    }
    
    // Check if affiliate columns exist in users table
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'is_affiliate'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE users 
            ADD COLUMN is_affiliate TINYINT(1) DEFAULT 0,
            ADD COLUMN affiliate_code VARCHAR(50) UNIQUE NULL,
            ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00,
            ADD COLUMN total_earnings DECIMAL(10,2) DEFAULT 0.00");
        $response['messages'][] = "Added affiliate columns to users table.";
    }
    $response['messages'][] = "Users table checked/updated.";

    // 1.5 Ensure Affiliate Tables Exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS affiliate_clicks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        affiliate_id INT NOT NULL,
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS affiliate_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        affiliate_id INT NOT NULL,
        type ENUM('COMMISSION', 'WITHDRAWAL') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        order_id INT NULL,
        status VARCHAR(20) DEFAULT 'COMPLETED',
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        affiliate_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        details TEXT NOT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    // Add affiliate_id to orders table if it doesn't exist
    $stmt = $pdo->query("SHOW COLUMNS FROM orders LIKE 'affiliate_id'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE orders ADD COLUMN affiliate_id INT NULL, ADD FOREIGN KEY (affiliate_id) REFERENCES users(id) ON DELETE SET NULL");
        $response['messages'][] = "Added affiliate_id to orders table.";
    }
    $response['messages'][] = "Affiliate tables checked/created.";

    // 2. Ensure Reading Progress Table Exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS reading_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        book_id VARCHAR(255) NOT NULL,
        current_page INT DEFAULT 1,
        total_pages INT DEFAULT 0,
        last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_progress (user_id, book_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $response['messages'][] = "Reading progress table checked/created.";

    // 3. Ensure Product Metadata Table Exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS product_metadata (
        product_key VARCHAR(255) PRIMARY KEY,
        cover_url VARCHAR(512),
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    $response['messages'][] = "Product metadata table checked/created.";

    // 4. Insert Default Metadata if needed
    $stmt = $pdo->prepare("SELECT * FROM product_metadata WHERE product_key = 'main'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $stmt = $pdo->prepare("INSERT INTO product_metadata (product_key, cover_url, description) VALUES (?, ?, ?)");
        $stmt->execute(['main', 'https://organic.shehzin.com/uploads/1.jpg', 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট']);
        $response['messages'][] = "Inserted default metadata for main product.";
    }

    // 5. Find all PAID orders that are NOT in users table
    // We select distinct emails from paid orders
    $stmt = $pdo->query("SELECT * FROM orders WHERE status = 'PAID' GROUP BY email");
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $migrated_count = 0;
    $skipped_count = 0;
    $errors = [];

    foreach ($orders as $order) {
        $email = trim($order['email']);
        if (empty($email)) continue;

        // Check if exists in users
        $check = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $check->execute([$email]);
        if ($check->fetch()) {
            $skipped_count++;
            continue;
        }

        // Migrate
        $migrated = migrate_user_from_order($pdo, $order);
        if ($migrated) {
            $migrated_count++;
        } else {
            $errors[] = "Failed to migrate: $email";
        }
    }

    $response['messages'][] = "Migration complete. Migrated: $migrated_count, Skipped (Already Exists): $skipped_count";
    $response['migrated_count'] = $migrated_count;
    if (!empty($errors)) {
        $response['errors'] = $errors;
    }

} catch (Exception $e) {
    $response['status'] = 'error';
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
?>
