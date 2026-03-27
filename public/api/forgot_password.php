<?php
require_once 'auth_functions.php';
require_once 'functions.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
$email = trim($input['email'] ?? '');

if (!$email) {
    send_json_response(['status' => 'error', 'message' => 'Email is required'], 400);
}

try {
    $pdo = get_db_connection();
    ensure_users_table_exists($pdo);

    // Check if user exists (in users or orders)
    // We use find_user_by_identifier to ensure they are migrated to users table if they exist in orders
    $user = find_user_by_identifier($pdo, $email);

    if ($user) {
        // Generate Reset Token (6 digit code)
        $token = rand(100000, 999999);
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expiry = ? WHERE id = ?");
        $stmt->execute([$token, $expiry, $user['id']]);

        // Send Email using shared function
        $subject = 'Password Reset Code - অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট';
        $body = "Your password reset code is: <b>$token</b><br>This code expires in 1 hour.";
        
        sendCustomEmail($user['email'], $subject, $body);
    }

    // Always return success to prevent email enumeration
    send_json_response(['status' => 'success', 'message' => 'If an account exists, a reset code has been sent.']);

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
