<?php
// install.php - Database Installation & Migration Script
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Prevent direct access if needed, but here we want it to be accessible via setup.php or directly
// For security, you might want to add a check here later.

// We use a separate connection logic here because config.php might fail if DB doesn't exist
if (!defined('DB_HOST')) {
    require_once 'config.php';
}

try {
    // 1. Connect to MySQL without selecting a database first
    $pdo = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 2. Create Database with utf8mb4 support
    try {
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    } catch (Exception $e) {
        // If we can't create the database, it might already exist but we don't have CREATE permission.
        // We'll proceed to USE it and see if it works.
    }
    $pdo->exec("USE `" . DB_NAME . "`");

    // 3. Create Tables
    // 3.1 ORDERS TABLE
    $sql = "CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('PENDING', 'PAID', 'REFUNDED', 'CANCELLED') DEFAULT 'PENDING',
        gateway VARCHAR(50) NOT NULL,
        transaction_id VARCHAR(100) DEFAULT NULL,
        payment_url TEXT DEFAULT NULL,
        download_count INT DEFAULT 0,
        profession VARCHAR(100) DEFAULT NULL,
        age INT DEFAULT NULL,
        location VARCHAR(255) DEFAULT NULL,
        dob DATE DEFAULT NULL,
        reading_status VARCHAR(50) DEFAULT 'Not Started',
        feedback TEXT DEFAULT NULL,
        rating INT DEFAULT NULL,
        admin_notes TEXT DEFAULT NULL,
        last_followup_level INT DEFAULT 0,
        coupon_code VARCHAR(50) DEFAULT NULL,
        discount_amount DECIMAL(10,2) DEFAULT 0.00,
        upsell_items JSON DEFAULT NULL,
        payment_date DATETIME DEFAULT NULL,
        affiliate_code VARCHAR(255) DEFAULT NULL,
        commission_amount DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    $pdo->exec($sql);

    // Migration for orders table
    $colsToAdd = [
        "profession VARCHAR(100) DEFAULT NULL",
        "age INT DEFAULT NULL",
        "location VARCHAR(255) DEFAULT NULL",
        "dob DATE DEFAULT NULL",
        "reading_status VARCHAR(50) DEFAULT 'Not Started'",
        "feedback TEXT DEFAULT NULL",
        "rating INT DEFAULT NULL",
        "admin_notes TEXT DEFAULT NULL",
        "last_followup_level INT DEFAULT 0",
        "coupon_code VARCHAR(50) DEFAULT NULL",
        "discount_amount DECIMAL(10,2) DEFAULT 0.00",
        "upsell_items JSON DEFAULT NULL",
        "payment_date DATETIME DEFAULT NULL",
        "affiliate_code VARCHAR(255) DEFAULT NULL",
        "commission_amount DECIMAL(10,2) DEFAULT 0.00"
    ];

    foreach ($colsToAdd as $colDef) {
        $colName = explode(' ', $colDef)[0];
        $check = $pdo->query("SHOW COLUMNS FROM orders LIKE '$colName'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN $colDef");
        }
    }

    // 3.2 SETTINGS TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(50) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 3.3 COUPONS TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type ENUM('fixed', 'percent') NOT NULL DEFAULT 'fixed',
        amount DECIMAL(10,2) NOT NULL,
        expiry_date DATE DEFAULT NULL,
        usage_limit INT DEFAULT -1,
        usage_count INT DEFAULT 0,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // 3.4 PRODUCTS TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('main', 'upsell') NOT NULL DEFAULT 'upsell',
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) DEFAULT 0.00,
        regular_price DECIMAL(10,2) DEFAULT NULL,
        image_url VARCHAR(255) DEFAULT NULL,
        file_url VARCHAR(255) DEFAULT NULL,
        description TEXT DEFAULT NULL,
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // Migration for products table
    $productColsToAdd = [
        "regular_price DECIMAL(10,2) DEFAULT NULL"
    ];
    foreach ($productColsToAdd as $colDef) {
        $colName = explode(' ', $colDef)[0];
        $check = $pdo->query("SHOW COLUMNS FROM products LIKE '$colName'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE products ADD COLUMN $colDef");
        }
    }

    // 3.5 AUTOMATION LOGS TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS automation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        name VARCHAR(255),
        phone VARCHAR(50),
        action_type VARCHAR(50),
        message TEXT,
        status VARCHAR(50) DEFAULT 'SENT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // 3.6 API KEYS TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS api_keys (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_name VARCHAR(100) NOT NULL,
        api_key VARCHAR(64) NOT NULL UNIQUE,
        status ENUM('ACTIVE', 'REVOKED') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 3.7 ADMINS TABLE
    $pdo->exec("CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20) DEFAULT NULL,
        password_hash VARCHAR(255) DEFAULT NULL,
        role ENUM('SUPER_ADMIN', 'ACCOUNTS', 'SALES') DEFAULT 'SALES',
        status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
        reset_token VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // 4. Seed Initial Data
    // Default Admin
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM admins");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $passHash = password_hash(ADMIN_PASS, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, 'SUPER_ADMIN')");
        $stmt->execute(['Super Admin', ADMIN_EMAIL, $passHash]);
    }

    // Default Automation Settings
    $default_automation = json_encode([
        'day1' => [
            'sms' => 'প্রিয় {name}, অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট ইবুকটি কার্টে অ্যাড করেছিলেন কিন্তু অর্ডার কমপ্লিট করেননি। স্টক শেষ হওয়ার আগেই সংগ্রহ করুন: https://organic.shehzin.com',
            'email_subject' => 'অসম্পূর্ণ অর্ডার: অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট',
            'email_body' => 'প্রিয় {name},<br><br>আপনি আমাদের \'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট\' ইবুকটি কেনার চেষ্টা করেছিলেন, কিন্তু কোনো কারণে অর্ডারটি সম্পন্ন হয়নি।<br><br>এখনই অর্ডার সম্পন্ন করুন: <a href="https://organic.shehzin.com">https://organic.shehzin.com</a>'
        ],
        'day3' => [
            'sms' => 'প্রিয় {name}, হাজারো মানুষ অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট পড়ে নিজেদের জীবন বদলে ফেলছে। আপনি কেন পিছিয়ে থাকবেন? আজই শুরু করুন: https://organic.shehzin.com',
            'email_subject' => 'সাফল্যের গল্প: অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট',
            'email_body' => 'প্রিয় {name},<br><br>আমাদের কমিউনিটিতে প্রতিদিন নতুন নতুন মানুষ তাদের জার্নি শেয়ার করছে। আপনিও নিজের জীবন বদলাতে পারেন।'
        ]
    ], JSON_UNESCAPED_UNICODE);

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM settings WHERE setting_key = 'automation_config'");
    $stmt->execute();
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('automation_config', ?)");
        $stmt->execute([$default_automation]);
    }

    if (basename($_SERVER['PHP_SELF']) == 'install.php') {
        echo "Database structure updated/verified successfully. Existing data preserved.";
    }

} catch (Exception $e) {
    if (basename($_SERVER['PHP_SELF']) == 'install.php') {
        die("Installation Error: " . $e->getMessage());
    } else {
        // Re-throw for setup.php to catch
        throw $e;
    }
}
