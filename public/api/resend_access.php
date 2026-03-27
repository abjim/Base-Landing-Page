<?php
// public/api/resend_access.php
header('Content-Type: application/json; charset=utf-8');
require_once 'config.php';
require_once 'functions.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid Request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
$phone = strip_tags(trim($input['phone']));

if (!$email && !$phone) {
    echo json_encode(['status' => 'error', 'message' => 'Email or Phone required']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    
    // Find User
    $sql = "SELECT * FROM orders WHERE status = 'PAID' AND (email = ? OR phone = ?) ORDER BY id DESC LIMIT 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email, $phone]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order) {
        // Send Email
        sendProductEmail($order['email'], $order['name'], $order['id']);
        echo json_encode(['status' => 'success', 'message' => 'Download link sent to ' . $order['email']]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No paid record found with this info.']);
    }

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'System Error']);
}
?>