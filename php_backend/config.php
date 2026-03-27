<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'endingsc_organic'); // Replace with actual DB name if different
define('DB_USER', 'endingsc_organic'); // Replace with actual DB user
define('DB_PASS', 'Organic724273269@'); // Replace with actual DB password

// Connect to Database
try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}

// Global Settings
define('SITE_URL', 'https://organic.shehzin.com'); // Replace with actual site URL
define('ADMIN_EMAIL', 'admin@shehzin.com'); // Replace with actual admin email

// SMS Gateway Configuration (Example: GreenWeb, Twilio, etc.)
// You can store these in the database 'settings' table for dynamic configuration
define('SMS_API_KEY', 'your_sms_api_key'); 
define('SMS_SENDER_ID', 'your_sender_id'); 
define('SMS_API_URL', 'http://bulksmsbd.net/api/smsapi'); // Example URL

// Email Configuration (SMTP)
define('SMTP_HOST', 'smtp.your-email-provider.com');
define('SMTP_USER', 'your-email@domain.com');
define('SMTP_PASS', 'your-email-password');
define('SMTP_PORT', 587);
define('SMTP_SECURE', 'tls');

// Timezone
date_default_timezone_set('Asia/Dhaka');
?>
