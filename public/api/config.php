<?php
// config.php - Main Configuration File

// 0. Timezone Configuration
date_default_timezone_set('Asia/Dhaka');

// 1. Database Configuration
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'endingsc_organic');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: 'Organic724273269@');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'endingsc_organic');

// 2. Admin Hardcoded Fallback
if (!defined('ADMIN_EMAIL')) define('ADMIN_EMAIL', getenv('ADMIN_EMAIL') ?: 'admin@shehzin.com');
if (!defined('ADMIN_PASS')) define('ADMIN_PASS', getenv('ADMIN_PASS') ?: '72427'); 
if (!defined('SITE_URL')) define('SITE_URL', getenv('SITE_URL') ?: 'https://organic.shehzin.com');

// --- DYNAMIC SETTINGS LOADER ---
$settings = [];

try {
    $pdo_config = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    // Set MySQL timezone to match PHP timezone
    $pdo_config->exec("SET time_zone = '+06:00'");
    
    // Check if settings table exists before querying
    $tableCheck = $pdo_config->query("SHOW TABLES LIKE 'settings'");
    if ($tableCheck && $tableCheck->rowCount() > 0) {
        // Fetch all settings
        $stmt = $pdo_config->query("SELECT setting_key, setting_value FROM settings");
        if ($stmt) {
            $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        }
    }
} catch (Exception $e) {
    // Fallback - Database might not exist yet during installation
}

// Helper function
function get_conf($key, $default, $settings_array) {
    return isset($settings_array[$key]) && $settings_array[$key] !== '' ? $settings_array[$key] : $default;
}

// 3. Product Info & Dynamic Price Logic
define('PRODUCT_NAME', 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট');

// Fetch main product price from products table
$main_product_price = 199;
try {
    if (isset($pdo_config)) {
        // Check if products table exists
        $tableCheck = $pdo_config->query("SHOW TABLES LIKE 'products'");
        if ($tableCheck && $tableCheck->rowCount() > 0) {
            $stmt = $pdo_config->query("SELECT price FROM products WHERE type = 'main' AND status = 'ACTIVE' LIMIT 1");
            $price_row = $stmt->fetch();
            if ($price_row && isset($price_row['price'])) {
                $main_product_price = (int)$price_row['price'];
            }
        }
    }
} catch (Exception $e) {
    // Fallback
}
if (!defined('PRODUCT_PRICE')) define('PRODUCT_PRICE', $main_product_price);

// 4. bKash Configuration
define('BKASH_APP_KEY',    get_conf('bkash_app_key', '1HQbZuXiIHOPhQCiQRswqykStc', $settings));
define('BKASH_APP_SECRET', get_conf('bkash_app_secret', 'KSyjSoa6uqOXgAEJvBiLQsquZtmNnhB9Au7EkSKAWTYgrEcaBFVt', $settings));
define('BKASH_USERNAME',   get_conf('bkash_username', '01723227699', $settings));
define('BKASH_PASSWORD',   get_conf('bkash_password', '?b4}.Q!o>WF', $settings));
$bkash_mode = get_conf('bkash_mode', 'live', $settings);
define('BKASH_BASE_URL',   $bkash_mode === 'sandbox' ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta' : 'https://tokenized.pay.bka.sh/v1.2.0-beta');

// 5. SSLCommerz Configuration
define('SSL_STORE_ID',     get_conf('ssl_store_id', 'learningbangladeshlive', $settings));
define('SSL_STORE_PASS',   get_conf('ssl_store_pass', '5DB6C13522D2715381', $settings));
define('SSL_IS_SANDBOX',   get_conf('ssl_mode', 'live', $settings) === 'sandbox'); 
// 6. SMTP Configuration
define('SMTP_HOST',        get_conf('smtp_host', 'mail.shehzin.com', $settings));
define('SMTP_USER',        get_conf('smtp_user', 'ebook@shehzin.com', $settings));
define('SMTP_PASS',        get_conf('smtp_pass', 'eBook73269@', $settings));
define('SMTP_PORT',        (int)get_conf('smtp_port', '465', $settings));
define('SMTP_FROM_NAME',   get_conf('smtp_from_name', 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট', $settings));

// 7. SMS API
define('SMS_API_KEY',      get_conf('sms_api_key', 'btrTLu2rfvU9M6drqJ5h', $settings)); 
define('SMS_SENDER_ID',    get_conf('sms_sender_id', '8809617611016', $settings));

// 8. Analytics & Tracking (Dynamic)
define('FB_PIXEL_ID',      get_conf('fb_pixel_id', '640217658466268', $settings));
define('FB_ACCESS_TOKEN',  get_conf('fb_access_token', 'EAAHrn7sZCwIEBQ9K5GgX7Rdi0g5TCqpNPoy3mxjz7gySu2qyXWjFUfON2U215veuVDP4Wv57nNatB7fEvkwMz6P4fGqB6amWBJCLS9ZCsN01Y67JFX1Udg8a5y6joRJ0Q08hjXrZBqBuLsVa9rMWRq3QZC69LGsEB132XcCUQ1GxZBTq46HWC06ZAIvXVHIwZDZD', $settings));
define('GTM_ID',           get_conf('gtm_id', 'GTM-PBDLCHBC', $settings));
define('GA4_ID',           get_conf('ga4_id', 'G-HFFZX86YRW', $settings));

// 9. Success Messages (Dynamic)
define('SUCCESS_EMAIL_SUBJECT', get_conf('success_email_subject', 'Download Your অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট eBook', $settings));
define('SUCCESS_EMAIL_BODY',    get_conf('success_email_body', '', $settings)); // Empty defaults to hardcoded in functions.php if not set
define('SUCCESS_SMS_CONTENT',   get_conf('success_sms_content', 'Your ebook order is approved! Check email for download link. Help: https://m.me/learningbangladesh71 - Shehzin.com', $settings));

// 10. OTO (One Time Offer) Settings
define('OTO_ENABLED',     get_conf('oto_enabled', '0', $settings));
define('OTO_IMAGE_URL',   get_conf('oto_image_url', '', $settings));
define('OTO_COPY',        get_conf('oto_copy', '', $settings));
define('OTO_COUPON_CODE', get_conf('oto_coupon_code', '', $settings));
define('OTO_LINK',        get_conf('oto_link', '', $settings));
define('FAVICON_URL',     get_conf('favicon_url', '', $settings));

// Error Reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);