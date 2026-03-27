<?php
require_once 'auth_functions.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get Token
$token = get_auth_token();

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

    // Fetch Library (PAID Orders)
    // We search by email OR phone associated with this user
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE (email = ? OR phone = ?) AND status = 'PAID' ORDER BY id DESC");
    $stmt->execute([$user['email'], $user['phone']]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch Metadata
    $stmt = $pdo->prepare("SELECT * FROM product_metadata");
    $stmt->execute();
    $metadata = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $metaMap = [];
    foreach ($metadata as $m) {
        $metaMap[$m['product_key']] = $m;
    }

    $library = [];
    $processed_products = [];

    // Fetch main product name from products table
    $stmt = $pdo->prepare("SELECT name FROM products WHERE type = 'main' LIMIT 1");
    $stmt->execute();
    $mainProduct = $stmt->fetch(PDO::FETCH_ASSOC);
    $mainProductName = $mainProduct ? $mainProduct['name'] : 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট eBook';

    // Main Product
    foreach ($orders as $order) {
        // Add Main Product (once)
        if (!in_array('main', $processed_products)) {
            $meta = $metaMap['main'] ?? [];
            $library[] = [
                'id' => 'main',
                'name' => $mainProductName,
                'type' => 'ebook',
                'download_url' => SITE_URL . '/api/download.php?order_id=' . $order['id'] . '&file_key=main',
                'order_date' => $order['created_at'],
                'cover_image' => $meta['cover_url'] ?? null,
                'description' => $meta['description'] ?? null
            ];
            $processed_products[] = 'main';
        }

        // Add Upsells
        $upsells = !empty($order['upsell_items']) ? json_decode($order['upsell_items'], true) : [];
        foreach ($upsells as $item) {
            if (!in_array($item['id'], $processed_products)) {
                $meta = $metaMap[$item['id']] ?? [];
                $library[] = [
                    'id' => $item['id'],
                    'name' => $item['name'],
                    'type' => 'bonus',
                    'download_url' => SITE_URL . '/api/download.php?order_id=' . $order['id'] . '&file_key=' . $item['id'],
                    'order_date' => $order['created_at'],
                    'cover_image' => $meta['cover_url'] ?? null,
                    'description' => $meta['description'] ?? null
                ];
                $processed_products[] = $item['id'];
            }
        }
    }

    send_json_response(['status' => 'success', 'library' => $library]);

} catch (Exception $e) {
    send_json_response(['status' => 'error', 'message' => $e->getMessage()], 500);
}
?>
