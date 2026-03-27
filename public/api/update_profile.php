<?php
require_once 'auth_functions.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get Token
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? '';
$token = str_replace('Bearer ', '', $authHeader);

if (!$token) {
    send_json_response(['status' => 'error', 'message' => 'Unauthorized'], 401);
}

// Validate Token
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

    $data = json_decode(file_get_contents('php://input'), true);
    
    $updates = [];
    $params = [];

    // Update Email
    if (!empty($data['email']) && $data['email'] !== $user['email']) {
        // Check if email exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$data['email'], $user_id]);
        if ($stmt->fetch()) {
            send_json_response(['status' => 'error', 'message' => 'Email already in use'], 400);
        }
        $updates[] = "email = ?";
        $params[] = $data['email'];
    }

    // Update Phone
    if (!empty($data['phone']) && $data['phone'] !== $user['phone']) {
        $updates[] = "phone = ?";
        $params[] = $data['phone'];
    }

    // Update Password
    if (!empty($data['password'])) {
        if (strlen($data['password']) < 6) {
            send_json_response(['status' => 'error', 'message' => 'Password must be at least 6 characters'], 400);
        }
        $updates[] = "password = ?";
        $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    if (empty($updates)) {
        send_json_response(['status' => 'success', 'message' => 'No changes made']);
    }

    $params[] = $user_id;
    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    // If email changed, we need to issue a new token
    $newToken = null;
    if (!empty($data['email']) && $data['email'] !== $user['email']) {
        $newHash = md5($data['email'] . 'NANO_SECRET_SALT');
        $newToken = base64_encode($user_id . ':' . $newHash);
    }

    send_json_response([
        'status' => 'success', 
        'message' => 'Profile updated successfully',
        'new_token' => $newToken
    ]);

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
