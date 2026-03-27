<?php
session_start();
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/functions.php';

header('Content-Type: application/json; charset=utf-8');

$action = isset($_GET['action']) ? $_GET['action'] : '';

// DB Connection
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_STRINGIFY_FETCHES, false);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    $pdo->exec("SET time_zone = '+06:00'");
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB Connection Failed']);
    exit;
}

// ---------------------
// Rate Limiting Helper
// ---------------------
function checkRateLimit($ip, $action_name, $limit = 5, $window = 300) {
    $file = sys_get_temp_dir() . '/rate_limit_' . md5($ip . '_' . $action_name) . '.json';
    $now = time();
    $attempts = [];
    
    if (file_exists($file)) {
        $data = json_decode(file_get_contents($file), true);
        if (is_array($data)) {
            $attempts = array_filter($data, function($timestamp) use ($now, $window) {
                return ($now - $timestamp) < $window;
            });
        }
    }
    
    if (count($attempts) >= $limit) {
        return false; // Rate limit exceeded
    }
    
    $attempts[] = $now;
    file_put_contents($file, json_encode(array_values($attempts)));
    return true;
}

// ---------------------
// AUTH logic... (Kept same)
// ---------------------

if ($action === 'login') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit($ip, 'login', 5, 300)) { // 5 attempts per 5 minutes
        echo json_encode(['success' => false, 'message' => 'Too many login attempts. Please try again in 5 minutes.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $loginId = $input['email']; 
    $password = $input['password'];

    $stmt = $pdo->prepare("SELECT * FROM admins WHERE email = ? OR phone = ?");
    $stmt->execute([$loginId, $loginId]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($admin && password_verify($password, $admin['password_hash'])) {
        if ($admin['status'] !== 'ACTIVE') {
             echo json_encode(['success' => false, 'message' => 'Account is inactive']);
             exit;
        }
        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_role'] = $admin['role'];
        $_SESSION['admin_name'] = $admin['name'];
        $_SESSION['admin_email'] = $admin['email'];
        echo json_encode(['success' => true, 'role' => $admin['role'], 'name' => $admin['name'], 'email' => $admin['email']]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    }
    exit;
}

if ($action === 'forgot_password') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit($ip, 'forgot_password', 3, 300)) { // 3 attempts per 5 minutes
        echo json_encode(['success' => false, 'message' => 'Too many reset requests. Please try again later.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'];
    $stmt = $pdo->prepare("SELECT id, name FROM admins WHERE email = ?");
    $stmt->execute([$email]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($admin) {
        $token = bin2hex(random_bytes(32));
        $update = $pdo->prepare("UPDATE admins SET reset_token = ? WHERE id = ?");
        $update->execute([$token, $admin['id']]);
        $resetLink = SITE_URL . "/#/admin-setup?token=" . $token;
        $subject = "Password Reset Request";
        $msg = "Link: <a href='$resetLink'>$resetLink</a>";
        sendCustomEmail($email, $subject, "<html><body>$msg</body></html>");
        echo json_encode(['success' => true, 'message' => 'Reset link sent']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Email not found']);
    }
    exit;
}

if ($action === 'check_session') {
    if (isset($_SESSION['admin_id'])) {
        echo json_encode([
            'logged_in' => true, 
            'role' => $_SESSION['admin_role'], 
            'name' => $_SESSION['admin_name'],
            'email' => $_SESSION['admin_email'] ?? '',
            'id' => $_SESSION['admin_id']
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
    exit;
}

if ($action === 'logout') {
    session_destroy();
    exit;
}

if ($action === 'setup_password') {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = $input['token'];
    $newPassword = $input['password'];
    $stmt = $pdo->prepare("SELECT * FROM admins WHERE reset_token = ?");
    $stmt->execute([$token]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($admin) {
        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $update = $pdo->prepare("UPDATE admins SET password_hash = ?, reset_token = NULL, status = 'ACTIVE' WHERE id = ?");
        $update->execute([$hash, $admin['id']]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
    }
    exit;
}

// ---------------------
// MIDDLEWARE
// ---------------------
if (!isset($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$currentRole = $_SESSION['admin_role'];

// ---------------------
// SETTINGS & INTEGRATIONS
// ---------------------

// Fetch all integration settings
if ($action === 'get_integration_settings') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    
    // Fetch from DB
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings");
    $dbSettings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // Return with defaults from Config if not in DB
    $response = [
        // bKash
        'bkash_app_key' => $dbSettings['bkash_app_key'] ?? BKASH_APP_KEY,
        'bkash_app_secret' => $dbSettings['bkash_app_secret'] ?? BKASH_APP_SECRET,
        'bkash_username' => $dbSettings['bkash_username'] ?? BKASH_USERNAME,
        'bkash_password' => $dbSettings['bkash_password'] ?? BKASH_PASSWORD,
        'bkash_mode' => $dbSettings['bkash_mode'] ?? 'live',
        
        // SSL
        'ssl_store_id' => $dbSettings['ssl_store_id'] ?? SSL_STORE_ID,
        'ssl_store_pass' => $dbSettings['ssl_store_pass'] ?? SSL_STORE_PASS,
        'ssl_mode' => $dbSettings['ssl_mode'] ?? (SSL_IS_SANDBOX ? 'sandbox' : 'live'),
        
        // SMTP
        'smtp_host' => $dbSettings['smtp_host'] ?? SMTP_HOST,
        'smtp_user' => $dbSettings['smtp_user'] ?? SMTP_USER,
        'smtp_pass' => $dbSettings['smtp_pass'] ?? SMTP_PASS,
        'smtp_port' => $dbSettings['smtp_port'] ?? SMTP_PORT,
        'smtp_from_name' => $dbSettings['smtp_from_name'] ?? SMTP_FROM_NAME,
        
        // SMS
        'sms_api_key' => $dbSettings['sms_api_key'] ?? SMS_API_KEY,
        'sms_sender_id' => $dbSettings['sms_sender_id'] ?? SMS_SENDER_ID,

        // Tracking
        'fb_pixel_id' => $dbSettings['fb_pixel_id'] ?? FB_PIXEL_ID,
        'fb_access_token' => $dbSettings['fb_access_token'] ?? FB_ACCESS_TOKEN,
        'gtm_id' => $dbSettings['gtm_id'] ?? GTM_ID,
        'ga4_id' => $dbSettings['ga4_id'] ?? GA4_ID,

        // Success Messages
        'success_email_subject' => $dbSettings['success_email_subject'] ?? SUCCESS_EMAIL_SUBJECT,
        'success_email_body' => $dbSettings['success_email_body'] ?? SUCCESS_EMAIL_BODY,
        'success_sms_content' => $dbSettings['success_sms_content'] ?? SUCCESS_SMS_CONTENT,

        // OTO Settings
        'oto_enabled' => $dbSettings['oto_enabled'] ?? OTO_ENABLED,
        'oto_image_url' => $dbSettings['oto_image_url'] ?? OTO_IMAGE_URL,
        'oto_copy' => $dbSettings['oto_copy'] ?? OTO_COPY,
        'oto_coupon_code' => $dbSettings['oto_coupon_code'] ?? OTO_COUPON_CODE,
        'oto_link' => $dbSettings['oto_link'] ?? OTO_LINK,

        // Social Proof
        'social_proof_enabled' => $dbSettings['social_proof_enabled'] ?? '0',
        'social_proof_msg' => $dbSettings['social_proof_msg'] ?? '{name} from {location} purchased just now',
        'social_proof_delay' => $dbSettings['social_proof_delay'] ?? '5',
        'social_proof_duration' => $dbSettings['social_proof_duration'] ?? '5',
    ];
    
    echo json_encode($response);
    exit;
}

// Update multiple settings at once
if ($action === 'save_integration_settings') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    
    foreach ($input as $key => $value) {
        // Allowed keys filter for security
        $allowed = [
            'bkash_app_key', 'bkash_app_secret', 'bkash_username', 'bkash_password', 'bkash_mode',
            'ssl_store_id', 'ssl_store_pass', 'ssl_mode',
            'smtp_host', 'smtp_user', 'smtp_pass', 'smtp_port', 'smtp_from_name',
            'sms_api_key', 'sms_sender_id',
            'fb_pixel_id', 'fb_access_token', 'gtm_id', 'ga4_id',
            'success_email_subject', 'success_email_body', 'success_sms_content',
            'oto_enabled', 'oto_image_url', 'oto_copy', 'oto_coupon_code', 'oto_link',
            'social_proof_enabled', 'social_proof_msg', 'social_proof_delay', 'social_proof_duration',
            'favicon_url'
        ];
        
        if (in_array($key, $allowed)) {
            $stmt->execute([$key, $value, $value]);
        }
    }
    
    echo json_encode(['success' => true]);
    exit;
}

    if ($action === 'fix_schema') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    try {
        // 0. Fix Database Character Set
        $pdo->exec("ALTER DATABASE " . DB_NAME . " CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci");

        // 1. Add payment_date column if not exists
        $check = $pdo->query("SHOW COLUMNS FROM orders LIKE 'payment_date'");
        if ($check->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN payment_date DATETIME DEFAULT NULL");
            // Backfill existing PAID orders
            $pdo->exec("UPDATE orders SET payment_date = updated_at WHERE status = 'PAID' AND payment_date IS NULL");
        }

        // 2. Create Coupons Table
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

        // 3. Add coupon columns to orders
        $checkCoupon = $pdo->query("SHOW COLUMNS FROM orders LIKE 'coupon_code'");
        if ($checkCoupon->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50) DEFAULT NULL");
            $pdo->exec("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00");
        }

        // 4. Create Products Table (For eBook & Upsells)
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

        // 4.1 Add regular_price and page_count to products if missing
        $checkRegularPrice = $pdo->query("SHOW COLUMNS FROM products LIKE 'regular_price'");
        if ($checkRegularPrice->rowCount() == 0) {
            $pdo->exec("ALTER TABLE products ADD COLUMN regular_price DECIMAL(10,2) DEFAULT NULL");
        }
        
        $checkPageCount = $pdo->query("SHOW COLUMNS FROM products LIKE 'page_count'");
        if ($checkPageCount->rowCount() == 0) {
            $pdo->exec("ALTER TABLE products ADD COLUMN page_count VARCHAR(50) DEFAULT '১৩৫+'");
        }

        // 5. Add upsell_items to orders
        $checkUpsell = $pdo->query("SHOW COLUMNS FROM orders LIKE 'upsell_items'");
        if ($checkUpsell->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN upsell_items JSON DEFAULT NULL");
        }

        // 5.1 Add last_followup_level to orders
        $checkFollowup = $pdo->query("SHOW COLUMNS FROM orders LIKE 'last_followup_level'");
        if ($checkFollowup->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN last_followup_level INT DEFAULT 0");
        }

        // 5.2 Add last_paid_followup_level to orders
        $checkPaidFollowup = $pdo->query("SHOW COLUMNS FROM orders LIKE 'last_paid_followup_level'");
        if ($checkPaidFollowup->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN last_paid_followup_level INT DEFAULT 0");
        }

        // 5.3 Add affiliate_code and commission_amount to orders
        $checkAffiliate = $pdo->query("SHOW COLUMNS FROM orders LIKE 'affiliate_code'");
        if ($checkAffiliate->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN affiliate_code VARCHAR(255) DEFAULT NULL");
            $pdo->exec("ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0.00");
        }

        // 5.4 Add gateway to orders
        $checkGateway = $pdo->query("SHOW COLUMNS FROM orders LIKE 'gateway'");
        if ($checkGateway->rowCount() == 0) {
            $pdo->exec("ALTER TABLE orders ADD COLUMN gateway VARCHAR(50) DEFAULT NULL");
        }

        // 6. Recalculate Coupon Usage Counts
        $pdo->exec("UPDATE coupons c SET usage_count = (SELECT COUNT(*) FROM orders o WHERE o.coupon_code = c.code AND o.status = 'PAID')");

        // 8. Create Automation Logs Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS automation_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // 7. CONVERT ALL TABLES TO UTF8MB4 (Fix for Bengali Fonts)
        $tables = ['orders', 'products', 'coupons', 'admins', 'settings', 'api_keys'];
        
        // First, ensure the database itself is utf8mb4
        $pdo->exec("ALTER DATABASE " . DB_NAME . " CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci");

        foreach ($tables as $table) {
            try {
                // Convert table default charset
                $pdo->exec("ALTER TABLE $table CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                
                // Explicitly modify text columns to ensure they are utf8mb4
                if ($table === 'products') {
                    $pdo->exec("ALTER TABLE products MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo->exec("ALTER TABLE products MODIFY description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo->exec("ALTER TABLE products MODIFY image_url VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo->exec("ALTER TABLE products MODIFY file_url VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                }
                
                if ($table === 'orders') {
                    $pdo->exec("ALTER TABLE orders MODIFY name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                    $pdo->exec("ALTER TABLE orders MODIFY upsell_items JSON"); // JSON is binary/utf8mb4 by default in newer MySQL, but good to be safe if it was text
                }
                
            } catch (Exception $e) {
                // Ignore if table doesn't exist yet or column doesn't exist
            }
        }

        // 8. Add Indexes for Performance
        try {
            $pdo->exec("CREATE INDEX idx_status_payment_date ON orders(status, payment_date)");
            $pdo->exec("CREATE INDEX idx_status_created_at ON orders(status, created_at)");
        } catch (Exception $e) {
            // Index might already exist
        }

        echo json_encode(['success' => true, 'message' => 'Schema, Charset & Indexes updated successfully.']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ---------------------
// SOCIAL PROOF API
// ---------------------

if ($action === 'get_recent_sales') {
    // Public endpoint (no auth required) or protected? Usually public for landing page.
    // But to be safe, maybe we check if it's enabled in settings first?
    // For now, let's make it public but limit data strictly.
    
    // Check if enabled
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_enabled'");
    $enabled = $stmt->fetchColumn();
    
    if ($enabled !== '1') {
        echo json_encode(['enabled' => false, 'sales' => []]);
        exit;
    }
    
    // Get last 20 PAID orders
    $stmt = $pdo->query("SELECT name, created_at FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 20");
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Privacy: Only First Name? Or full name? User said "Name from order".
    // Let's return as is, frontend can format.
    
    // Also return settings
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('social_proof_msg', 'social_proof_delay', 'social_proof_duration')");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    echo json_encode([
        'enabled' => true,
        'sales' => $sales,
        'message_template' => $settings['social_proof_msg'] ?? '{name} from {location} purchased just now',
        'delay' => (int)($settings['social_proof_delay'] ?? 5),
        'duration' => (int)($settings['social_proof_duration'] ?? 5)
    ]);
    exit;
}

// ---------------------
// PRODUCTS & UPSELLS
// ---------------------

if ($action === 'upload_file') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) { 
        echo json_encode(['success' => false, 'message' => 'No file or upload error']); 
        exit; 
    }
    
    $fileTmpPath = $_FILES['file']['tmp_name'];
    $originalFileName = $_FILES['file']['name'];
    
    // 1. Validate File Extension
    $allowedExtensions = ['pdf', 'zip', 'jpg', 'jpeg', 'png'];
    $fileExtension = strtolower(pathinfo($originalFileName, PATHINFO_EXTENSION));
    if (!in_array($fileExtension, $allowedExtensions)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file extension. Allowed: ' . implode(', ', $allowedExtensions)]);
        exit;
    }
    
    // 2. Validate MIME Type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $fileTmpPath);
    finfo_close($finfo);
    
    $allowedMimeTypes = [
        'application/pdf',
        'application/zip',
        'image/jpeg',
        'image/png'
    ];
    if (!in_array($mimeType, $allowedMimeTypes)) {
        echo json_encode(['success' => false, 'message' => 'Invalid file type (MIME mismatch).']);
        exit;
    }
    
    $targetDir = "../uploads/";
    if (!file_exists($targetDir)) mkdir($targetDir, 0777, true);
    
    // 3. Sanitize File Name
    $safeFileName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($originalFileName, PATHINFO_FILENAME));
    $fileName = time() . '_' . $safeFileName . '.' . $fileExtension;
    $targetFile = $targetDir . $fileName;
    
    if (move_uploaded_file($fileTmpPath, $targetFile)) {
        // Return public URL (assuming /uploads is accessible)
        echo json_encode(['success' => true, 'url' => '/uploads/' . $fileName]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Upload failed']);
    }
    exit;
}

if ($action === 'get_products') {
    $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
    echo json_encode(['products' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($action === 'save_product') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    
    try {
        $price = (isset($input['price']) && $input['price'] !== '') ? (float)$input['price'] : 0.00;
        $regular_price = (isset($input['regular_price']) && $input['regular_price'] !== '') ? (float)$input['regular_price'] : null;
        
        if (isset($input['id']) && $input['id']) {
            // Update
            $sql = "UPDATE products SET type=?, name=?, price=?, regular_price=?, image_url=?, file_url=?, description=?, status=?, page_count=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['type'], 
                $input['name'], 
                $price, 
                $regular_price,
                $input['image_url'] ?? null, 
                $input['file_url'] ?? null, 
                $input['description'] ?? null, 
                $input['status'], 
                $input['page_count'] ?? '১৩৫+',
                $input['id']
            ]);
        } else {
            // Create
            $sql = "INSERT INTO products (type, name, price, regular_price, image_url, file_url, description, status, page_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['type'], 
                $input['name'], 
                $price, 
                $regular_price,
                $input['image_url'] ?? null, 
                $input['file_url'] ?? null, 
                $input['description'] ?? null, 
                $input['status'] ?? 'ACTIVE',
                $input['page_count'] ?? '১৩৫+'
            ]);
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'fix_database') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    
    try {
        // Migration: Add regular_price to products if missing
        try {
            $pdo->query("SELECT regular_price FROM products LIMIT 1");
        } catch (PDOException $e) {
            try { $pdo->exec("ALTER TABLE products ADD COLUMN regular_price DECIMAL(10,2) NULL"); } catch(PDOException $err) {}
        }
        
        // Migration: Add affiliate columns to orders if missing
        try {
            $pdo->query("SELECT affiliate_code FROM orders LIMIT 1");
        } catch (PDOException $e) {
            try { $pdo->exec("ALTER TABLE orders ADD COLUMN affiliate_code VARCHAR(255) NULL"); } catch(PDOException $err) {}
            try { $pdo->exec("ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0"); } catch(PDOException $err) {}
        }

        // Migration: Add gateway to orders if missing
        try {
            $pdo->query("SELECT gateway FROM orders LIMIT 1");
        } catch (PDOException $e) {
            try { $pdo->exec("ALTER TABLE orders ADD COLUMN gateway VARCHAR(50) NULL"); } catch(PDOException $err) {}
        }

        // Migration: Add automation columns
        try {
            $pdo->query("SELECT last_followup_level FROM orders LIMIT 1");
        } catch (PDOException $e) {
            try { $pdo->exec("ALTER TABLE orders ADD COLUMN last_followup_level INT DEFAULT 0"); } catch(PDOException $err) {}
        }
        try {
            $pdo->query("SELECT last_paid_followup_level FROM orders LIMIT 1");
        } catch (PDOException $e) {
            try { $pdo->exec("ALTER TABLE orders ADD COLUMN last_paid_followup_level INT DEFAULT 0"); } catch(PDOException $err) {}
        }

        // Ensure automation_logs table exists
        try {
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
        } catch (PDOException $err) {}

        echo json_encode(['success' => true, 'message' => 'Database schema updated successfully']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete_product') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(['success' => true]);
    exit;
}

// ---------------------
// COUPONS MANAGEMENT
// ---------------------

if ($action === 'get_coupons') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $stmt = $pdo->query("SELECT * FROM coupons ORDER BY created_at DESC");
    echo json_encode(['coupons' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($action === 'save_coupon') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['code']) || empty($input['amount'])) {
        echo json_encode(['success' => false, 'message' => 'Code and Amount required']);
        exit;
    }

    try {
        $usageLimit = (isset($input['usage_limit']) && $input['usage_limit'] !== '') ? (int)$input['usage_limit'] : -1;
        
        if (isset($input['id']) && $input['id']) {
            // Update
            $sql = "UPDATE coupons SET code=?, type=?, amount=?, expiry_date=?, usage_limit=?, status=? WHERE id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                strtoupper(trim($input['code'])), 
                $input['type'], 
                $input['amount'], 
                $input['expiry_date'] ?: null, 
                $usageLimit, 
                $input['status'], 
                $input['id']
            ]);
        } else {
            // Create
            $sql = "INSERT INTO coupons (code, type, amount, expiry_date, usage_limit, status) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                strtoupper(trim($input['code'])), 
                $input['type'], 
                $input['amount'], 
                $input['expiry_date'] ?: null, 
                $usageLimit, 
                $input['status'] ?? 'ACTIVE'
            ]);
        }
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => false, 'message' => 'Coupon code already exists']);
        } else {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    exit;
}

if ($action === 'delete_coupon') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM coupons WHERE id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'toggle_coupon') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("UPDATE coupons SET status = ? WHERE id = ?");
    $stmt->execute([$input['status'], $input['id']]);
    echo json_encode(['success' => true]);
    exit;
}

// ---------------------
// ORDERS (Updated Sorting)
// ---------------------

if ($action === 'get_orders') {
    // Server-side pagination and filtering
    $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 50;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $status = isset($_GET['status']) ? $_GET['status'] : 'ALL';
    $gateway = isset($_GET['gateway']) ? $_GET['gateway'] : 'ALL';
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : '';
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : '';

    $offset = ($page - 1) * $limit;
    
    $whereClause = "1=1";
    $params = [];
    
    if ($status !== 'ALL') {
        $whereClause .= " AND status = :status";
        $params['status'] = $status;
    }
    if ($gateway !== 'ALL') {
        $whereClause .= " AND gateway = :gateway";
        $params['gateway'] = $gateway;
    }
    if ($search !== '') {
        $whereClause .= " AND (name LIKE :search1 OR email LIKE :search2 OR phone LIKE :search3 OR transaction_id LIKE :search4 OR id LIKE :search5)";
        $params['search1'] = "%$search%";
        $params['search2'] = "%$search%";
        $params['search3'] = "%$search%";
        $params['search4'] = "%$search%";
        $params['search5'] = "%$search%";
    }
    if ($startDate !== '') {
        $whereClause .= " AND DATE(COALESCE(payment_date, created_at)) >= :start_date";
        $params['start_date'] = $startDate;
    }
    if ($endDate !== '') {
        $whereClause .= " AND DATE(COALESCE(payment_date, created_at)) <= :end_date";
        $params['end_date'] = $endDate;
    }
    
    // Get total count and stats
    $statsSql = "SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
                    SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as total_revenue
                 FROM orders WHERE $whereClause";
    $statsStmt = $pdo->prepare($statsSql);
    $statsStmt->execute($params);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    $total = $stats['total'];
    
    // Get paginated data
    $sql = "SELECT * FROM orders WHERE $whereClause ORDER BY COALESCE(payment_date, created_at) DESC LIMIT :limit OFFSET :offset";
    $stmt = $pdo->prepare($sql);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue(":$key", $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'orders' => $orders,
        'total' => $total,
        'stats' => [
            'paid' => (int)$stats['paid_count'],
            'pending' => (int)$stats['pending_count'],
            'revenue' => (float)$stats['total_revenue']
        ],
        'page' => $page,
        'totalPages' => ceil($total / $limit)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($action === 'export_orders_csv') {
    if ($currentRole === 'MARKETING') { http_response_code(403); exit; }
    
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $status = isset($_GET['status']) ? $_GET['status'] : 'ALL';
    $gateway = isset($_GET['gateway']) ? $_GET['gateway'] : 'ALL';
    $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : '';
    $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : '';

    $whereClause = "1=1";
    $params = [];
    
    if ($status !== 'ALL') {
        $whereClause .= " AND status = :status";
        $params['status'] = $status;
    }
    if ($gateway !== 'ALL') {
        $whereClause .= " AND gateway = :gateway";
        $params['gateway'] = $gateway;
    }
    if ($search !== '') {
        $whereClause .= " AND (name LIKE :search1 OR email LIKE :search2 OR phone LIKE :search3 OR transaction_id LIKE :search4 OR id LIKE :search5)";
        $params['search1'] = "%$search%";
        $params['search2'] = "%$search%";
        $params['search3'] = "%$search%";
        $params['search4'] = "%$search%";
        $params['search5'] = "%$search%";
    }
    if ($startDate !== '') {
        $whereClause .= " AND DATE(COALESCE(payment_date, created_at)) >= :start_date";
        $params['start_date'] = $startDate;
    }
    if ($endDate !== '') {
        $whereClause .= " AND DATE(COALESCE(payment_date, created_at)) <= :end_date";
        $params['end_date'] = $endDate;
    }
    
    $sql = "SELECT * FROM orders WHERE $whereClause ORDER BY COALESCE(payment_date, created_at) DESC";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=orders_export_' . date('Y-m-d') . '.csv');
    
    $output = fopen('php://output', 'w');
    fputcsv($output, ['Order ID', 'Date', 'Payment Date', 'Name', 'Phone', 'Email', 'Status', 'Gateway', 'Amount', 'Coupon Code', 'Discount Amount']);
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, [
            $row['id'],
            $row['created_at'],
            $row['payment_date'] ?? '',
            $row['name'],
            $row['phone'],
            $row['email'],
            $row['status'],
            $row['gateway'],
            $row['amount'],
            $row['coupon_code'] ?? '',
            $row['discount_amount'] ?? 0
        ]);
    }
    fclose($output);
    exit;
}

if ($action === 'get_account_stats') {
    try {
        $startDate = isset($_GET['start_date']) && $_GET['start_date'] !== '' ? $_GET['start_date'] : date('Y-m-01');
        $endDate = isset($_GET['end_date']) && $_GET['end_date'] !== '' ? $_GET['end_date'] : date('Y-m-d');
        $status = isset($_GET['status']) ? $_GET['status'] : 'ALL';
        
        $dateCol = "CASE WHEN status = 'PAID' THEN COALESCE(payment_date, created_at) ELSE created_at END";
        
        $whereSQL = " WHERE DATE($dateCol) >= :start AND DATE($dateCol) <= :end";
        $params = ['start' => $startDate, 'end' => $endDate];
        
        if ($status !== 'ALL') { 
            $whereSQL .= " AND status = :status"; 
            $params['status'] = $status; 
        }
        
        // 1. Current Period Summary
        $sqlSummary = "SELECT COUNT(*) as total_count, COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_revenue, 
                       SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count 
                       FROM orders $whereSQL";
        $stmtSum = $pdo->prepare($sqlSummary); 
        $stmtSum->execute($params); 
        $summary = $stmtSum->fetch(PDO::FETCH_ASSOC);
        
        $totalRevenue = (float)$summary['total_revenue'];
        $totalCount = (int)$summary['total_count'];
        $paidCount = (int)$summary['paid_count'];
        $aov = $paidCount > 0 ? round($totalRevenue / $paidCount) : 0;
        
        // 2. Previous Period Summary (for growth)
        $startObj = new DateTime($startDate);
        $endObj = new DateTime($endDate);
        $duration = $startObj->diff($endObj)->days + 1;
        
        $prevEndObj = clone $startObj;
        $prevEndObj->modify('-1 day');
        $prevStartObj = clone $prevEndObj;
        $prevStartObj->modify("- " . ($duration - 1) . " days");
        
        $prevStart = $prevStartObj->format('Y-m-d');
        $prevEnd = $prevEndObj->format('Y-m-d');
        
        $whereSQLPrev = " WHERE DATE($dateCol) >= :start AND DATE($dateCol) <= :end";
        $paramsPrev = ['start' => $prevStart, 'end' => $prevEnd];
        if ($status !== 'ALL') { 
            $whereSQLPrev .= " AND status = :status"; 
            $paramsPrev['status'] = $status; 
        }
        
        $sqlPrevSum = "SELECT COUNT(*) as total_count, COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_revenue FROM orders $whereSQLPrev";
        $stmtPrevSum = $pdo->prepare($sqlPrevSum);
        $stmtPrevSum->execute($paramsPrev);
        $prevSummary = $stmtPrevSum->fetch(PDO::FETCH_ASSOC);
        
        $prevRevenue = (float)$prevSummary['total_revenue'];
        $prevCount = (int)$prevSummary['total_count'];
        
        $revenueGrowth = $prevRevenue > 0 ? (($totalRevenue - $prevRevenue) / $prevRevenue) * 100 : ($totalRevenue > 0 ? 100 : 0);
        $countGrowth = $prevCount > 0 ? (($totalCount - $prevCount) / $prevCount) * 100 : ($totalCount > 0 ? 100 : 0);
        
        // 3. Daily Trend
        $sqlDaily = "SELECT DATE($dateCol) as date, COALESCE(SUM(amount), 0) as value FROM orders $whereSQL AND status = 'PAID' GROUP BY DATE($dateCol) ORDER BY date ASC";
        $stmtDaily = $pdo->prepare($sqlDaily); 
        $stmtDaily->execute($params); 
        $dailyData = $stmtDaily->fetchAll(PDO::FETCH_ASSOC);
        
        // 4. Status Dist
        $sqlStatus = "SELECT status as label, COUNT(*) as value FROM orders $whereSQL GROUP BY status";
        $stmtStatus = $pdo->prepare($sqlStatus); 
        $stmtStatus->execute($params); 
        $statusData = $stmtStatus->fetchAll(PDO::FETCH_ASSOC);
        
        // 5. Gateway Dist
        $sqlGateway = "SELECT gateway as label, COUNT(*) as value FROM orders $whereSQL AND status = 'PAID' GROUP BY gateway";
        $stmtGateway = $pdo->prepare($sqlGateway); 
        $stmtGateway->execute($params); 
        $gatewayData = $stmtGateway->fetchAll(PDO::FETCH_ASSOC);
        
        // 6. Recent Transactions
        $sqlRecent = "SELECT id, name, amount, status, gateway, created_at, payment_date, updated_at FROM orders $whereSQL ORDER BY $dateCol DESC LIMIT 20";
        $stmtRecent = $pdo->prepare($sqlRecent);
        $stmtRecent->execute($params);
        $recentTransactions = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);
        
        $response = [
            'summary' => [
                'totalRevenue' => $totalRevenue,
                'totalCount' => $totalCount,
                'aov' => $aov,
                'revenueGrowth' => $revenueGrowth,
                'countGrowth' => $countGrowth
            ],
            'daily' => $dailyData,
            'statuses' => $statusData,
            'gateways' => $gatewayData,
            'recentTransactions' => $recentTransactions
        ];
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
    }
    exit;
}

if ($action === 'get_admins') {
    if ($currentRole !== 'SUPER_ADMIN') { echo json_encode(['admins' => []]); exit; }
    $stmt = $pdo->query("SELECT id, name, email, phone, role, status, created_at FROM admins ORDER BY created_at DESC");
    echo json_encode(['admins' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}

if ($action === 'create_admin') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    $token = bin2hex(random_bytes(32));
    $check = $pdo->prepare("SELECT id FROM admins WHERE email = ?");
    $check->execute([$input['email']]);
    if ($check->rowCount() > 0) { echo json_encode(['success' => false, 'message' => 'Email exists']); exit; }
    $stmt = $pdo->prepare("INSERT INTO admins (name, email, phone, role, status, reset_token) VALUES (?, ?, ?, ?, 'ACTIVE', ?)");
    $res = $stmt->execute([$input['name'], $input['email'], $input['phone'], $input['role'], $token]);
    if ($res) {
        $setupLink = SITE_URL . "/#/admin-setup?token=" . $token;
        $subject = "Admin Access Granted";
        $msg = "Set pass: <a href='$setupLink'>$setupLink</a>";
        sendCustomEmail($input['email'], $subject, "<html><body>$msg</body></html>");
        echo json_encode(['success' => true]);
    } else { echo json_encode(['success' => false]); }
    exit;
}

if ($action === 'delete_admin') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input['id'] == $_SESSION['admin_id']) { echo json_encode(['success' => false]); exit; }
    $stmt = $pdo->prepare("DELETE FROM admins WHERE id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'update_profile') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!empty($input['password'])) {
        $hash = password_hash($input['password'], PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE admins SET password_hash = ? WHERE id = ?");
        $stmt->execute([$hash, $_SESSION['admin_id']]);
        echo json_encode(['success' => true]);
    } else { echo json_encode(['success' => false]); }
    exit;
}



if ($action === 'update_order_details') {
    if ($currentRole === 'ACCOUNTS') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check previous status to trigger automation if changed to PAID
    $stmtCheck = $pdo->prepare("SELECT status, amount, transaction_id FROM orders WHERE id = ?");
    $stmtCheck->execute([$input['id']]);
    $oldOrder = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    
    $sql = "UPDATE orders SET name=?, email=?, phone=?, status=?, gateway=?, profession=?, age=?, location=?, dob=?, reading_status=?, admin_notes=? WHERE id=?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$input['name'], $input['email'], $input['phone'], $input['status'], $input['gateway'], $input['profession'] ?? null, $input['age'] ?: null, $input['location'] ?? null, $input['dob'] ?: null, $input['reading_status'] ?? 'Not Started', $input['admin_notes'] ?? '', $input['id']]);
    
    // Trigger Automation if status changed from PENDING to PAID manually
    if ($oldOrder && $oldOrder['status'] !== 'PAID' && $input['status'] === 'PAID') {
        // Update payment date
        $pdo->prepare("UPDATE orders SET payment_date = NOW() WHERE id = ?")->execute([$input['id']]);
        
        // Send Email & SMS
        sendProductEmail($input['email'], $input['name'], $input['id']);
        
        $smsContent = defined('SUCCESS_SMS_CONTENT') ? SUCCESS_SMS_CONTENT : "Your ebook order is approved! Check email for download link. Help: https://m.me/learningbangladesh71 - Shehzin.com";
        $downloadLink = SITE_URL . "/api/download.php?order_id=" . $input['id'];
        $smsBody = str_replace(
            ['{name}', '{order_id}', '{download_link}', '{site_url}'],
            [$input['name'], $input['id'], $downloadLink, SITE_URL],
            $smsContent
        );
        sendSMS($input['phone'], $smsBody);
        
        // Send CAPI Event
        sendFacebookCAPI(
            [
                'email' => $input['email'],
                'phone' => $input['phone'],
                'name'  => $input['name']
            ], 
            $oldOrder['amount'], 
            $input['id']
        );
    }
    
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'resend_notification') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$input['order_id']]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($order) {
        if ($input['type'] === 'email') sendProductEmail($order['email'], $order['name'], $order['id']);
        elseif ($input['type'] === 'sms') { $link = SITE_URL . "/api/download.php?order_id=" . $order['id']; sendSMS($order['phone'], "Download Link: $link"); }
        echo json_encode(['success' => true]);
    } else echo json_encode(['success' => false]);
    exit;
}

if ($action === 'send_custom_message') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$input['order_id']]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($order) {
        if ($input['type'] === 'email') sendCustomEmail($order['email'], $input['subject'], "<html><body>" . nl2br($input['message']) . "</body></html>");
        elseif ($input['type'] === 'sms') sendSMS($order['phone'], $input['message']);
        echo json_encode(['success' => true]);
    } else echo json_encode(['success' => false]);
    exit;
}

if ($action === 'bulk_send') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = json_decode(file_get_contents('php://input'), true);
    $sql = "SELECT * FROM orders WHERE 1=1";
    $params = [];
    if ($input['target_status'] !== 'ALL') {
        $sql .= " AND status = :status";
        $params['status'] = $input['target_status'];
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $count = 0;
    foreach ($orders as $order) {
        if ($input['type'] === 'email') sendCustomEmail($order['email'], $input['subject'], "<html><body>" . nl2br($input['message']) . "</body></html>");
        elseif ($input['type'] === 'sms') sendSMS($order['phone'], $input['message']);
        $count++;
    }
    echo json_encode(['success' => true, 'count' => $count]);
    exit;
}

if ($action === 'get_settings') {
    $stmt = $pdo->query("SELECT * FROM settings");
    $settings = [];
    while($row = $stmt->fetch(PDO::FETCH_ASSOC)) $settings[$row['setting_key']] = $row['setting_value'];
    echo json_encode(['settings' => $settings]);
    exit;
}

if ($action === 'get_api_keys') {
    $stmt = $pdo->query("SELECT * FROM api_keys ORDER BY created_at DESC");
    echo json_encode(['keys' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}
if ($action === 'create_api_key') {
    $input = json_decode(file_get_contents('php://input'), true);
    $key = bin2hex(random_bytes(16));
    $stmt = $pdo->prepare("INSERT INTO api_keys (client_name, api_key, status) VALUES (?, ?, 'ACTIVE')");
    $stmt->execute([$input['client_name'], $key]);
    echo json_encode(['success' => true]);
    exit;
}
if ($action === 'revoke_api_key') {
    $input = json_decode(file_get_contents('php://input'), true);
    $stmt = $pdo->prepare("DELETE FROM api_keys WHERE id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(['success' => true]);
    exit;
}

if ($action === 'get_automation_settings') {
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'automation_config'");
    echo $stmt->fetchColumn() ?: json_encode([]);
    exit;
}

if ($action === 'get_automation_logs') {
    // Join with orders to get customer details
    $stmt = $pdo->query("SELECT l.*, o.name, o.email, o.phone FROM automation_logs l LEFT JOIN orders o ON l.order_id = o.id ORDER BY l.created_at DESC LIMIT 100");
    echo json_encode(['logs' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    exit;
}
if ($action === 'save_automation_settings') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    $input = file_get_contents('php://input');
    $stmt = $pdo->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('automation_config', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->execute([$input, $input]);
    echo json_encode(['success' => true]);
    exit;
}
if ($action === 'run_automation') {
    if ($currentRole !== 'SUPER_ADMIN') { http_response_code(403); exit; }
    
    // Call cron.php via HTTP to ensure it runs in its own isolated context
    // This prevents any function redeclaration issues and ensures self-healing runs
    $cronUrl = SITE_URL . '/api/cron.php';
    
    // Use cURL for better reliability
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $cronUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode == 200 && $response) {
        echo $response;
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to execute cron.php', 'http_code' => $httpCode]);
    }
    exit;
}
?>