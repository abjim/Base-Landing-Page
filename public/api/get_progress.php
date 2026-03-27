<?php
require_once 'auth_functions.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Auth
$token = get_auth_token();

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

    $book_id = $_GET['book_id'] ?? null;

    if ($book_id) {
        $stmt = $pdo->prepare("SELECT * FROM reading_progress WHERE user_id = ? AND book_id = ?");
        $stmt->execute([$user_id, $book_id]);
        $progress = $stmt->fetch(PDO::FETCH_ASSOC);
        send_json_response(['status' => 'success', 'progress' => $progress]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM reading_progress WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $progress = $stmt->fetchAll(PDO::FETCH_ASSOC);
        send_json_response(['status' => 'success', 'progress' => $progress]);
    }

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
