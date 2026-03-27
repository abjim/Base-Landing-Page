<?php
require_once 'auth_functions.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Auth
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

if (!$token) {
    send_json_response(['status' => 'error', 'message' => 'Unauthorized'], 401);
}

$decoded = base64_decode($token);
list($user_id, $hash) = explode(':', $decoded);

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || md5($user['email'] . 'NANO_SECRET_SALT') !== $hash) {
        send_json_response(['status' => 'error', 'message' => 'Invalid Token'], 401);
    }

    // Input
    $input = json_decode(file_get_contents('php://input'), true);
    $book_id = $input['book_id'] ?? '';
    $current_page = $input['current_page'] ?? 1;
    $total_pages = $input['total_pages'] ?? 0;

    if (empty($book_id)) {
        send_json_response(['status' => 'error', 'message' => 'Book ID required'], 400);
    }

    // Upsert
    $stmt = $pdo->prepare("INSERT INTO reading_progress (user_id, book_id, current_page, total_pages, last_read_at) VALUES (?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE current_page = ?, total_pages = ?, last_read_at = NOW()");
    $stmt->execute([$user_id, $book_id, $current_page, $total_pages, $current_page, $total_pages]);

    send_json_response(['status' => 'success']);

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
