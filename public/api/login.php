<?php
require_once 'auth_functions.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_response(['status' => 'error', 'message' => 'Invalid Request'], 405);
}

$input = json_decode(file_get_contents('php://input'), true);
$identifier = trim($input['identifier'] ?? '');
$password = trim($input['password'] ?? '');

if (!$identifier || !$password) {
    send_json_response(['status' => 'error', 'message' => 'Email/Phone and Password are required'], 400);
}

try {
    $pdo = get_db_connection();
    ensure_users_table_exists($pdo);

    $user = find_user_by_identifier($pdo, $identifier);

    if ($user) {
        if (password_verify($password, $user['password_hash'])) {
            // Login Success
            // Generate a simple token: base64(user_id:hash)
            // Hash includes a secret salt to prevent tampering
            $token_payload = $user['id'] . ':' . md5($user['email'] . 'NANO_SECRET_SALT');
            $token = base64_encode($token_payload);
            
            send_json_response([
                'status' => 'success',
                'token' => $token,
                'user' => [
                    'name' => $user['email'], 
                    'email' => $user['email'],
                    'phone' => $user['phone']
                ]
            ]);
        } else {
            send_json_response(['status' => 'error', 'message' => 'Incorrect password.'], 401);
        }
    } else {
        send_json_response(['status' => 'error', 'message' => 'No account found with this Email or Phone. Please check your spelling or ensure you have a Paid order.'], 404);
    }

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => 'System Error: ' . $e->getMessage()], 500);
}
?>
