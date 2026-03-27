<?php
// public/api/v1.php - Secured External API Endpoint
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: X-API-KEY, Content-Type");

// 1. Get API Key (Robust Method for LiteSpeed/Apache/Nginx)
$apiKey = null;

// Method A: Check $_SERVER (Best for LiteSpeed with .htaccess rewrite)
if (isset($_SERVER['HTTP_X_API_KEY'])) {
    $apiKey = trim($_SERVER['HTTP_X_API_KEY']);
} 
// Method B: Check getallheaders() if available
elseif (function_exists('getallheaders')) {
    $requestHeaders = getallheaders();
    // Normalize headers to upper case to avoid case sensitivity issues
    $requestHeaders = array_change_key_case($requestHeaders, CASE_UPPER);
    if (isset($requestHeaders['X-API-KEY'])) {
        $apiKey = trim($requestHeaders['X-API-KEY']);
    }
}

if (!$apiKey) {
    http_response_code(401);
    echo json_encode(['error' => 'API Key Missing', 'debug' => 'Ensure X-API-KEY header is sent']);
    exit;
}

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 2. Validate API Key
    $stmt = $pdo->prepare("SELECT * FROM api_keys WHERE api_key = ? AND status = 'ACTIVE'");
    $stmt->execute([$apiKey]);
    $client = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$client) {
        http_response_code(403);
        echo json_encode(['error' => 'Invalid or Revoked API Key']);
        exit;
    }

    // 3. Handle Endpoints
    $endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

    switch ($endpoint) {
        case 'orders':
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            $offset = ($page - 1) * $limit;
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            
            // Added 'product_name' as a static column
            $sql = "SELECT *, 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট' as product_name FROM orders WHERE 1=1";
            
            // Filter by status ONLY if provided and NOT 'ALL'
            if ($status && strtoupper($status) !== 'ALL') {
                $sql .= " AND status = " . $pdo->quote($status);
            }
            
            $sql .= " ORDER BY id DESC LIMIT $limit OFFSET $offset";
            
            $stmt = $pdo->query($sql);
            $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get total count for pagination metadata
            $countSql = "SELECT COUNT(*) FROM orders WHERE 1=1";
            if ($status && strtoupper($status) !== 'ALL') {
                $countSql .= " AND status = " . $pdo->quote($status);
            }
            $total = $pdo->query($countSql)->fetchColumn();
            
            echo json_encode([
                'data' => $orders, 
                'meta' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total_items' => $total,
                    'total_pages' => ceil($total / $limit)
                ]
            ]);
            break;

        case 'sales_report':
            $startDate = isset($_GET['start_date']) ? $_GET['start_date'] : date('Y-m-01');
            $endDate = isset($_GET['end_date']) ? $_GET['end_date'] : date('Y-m-d');
            
            $sql = "SELECT 
                        DATE(created_at) as date, 
                        COUNT(*) as count, 
                        SUM(amount) as revenue 
                    FROM orders 
                    WHERE status = 'PAID' 
                    AND created_at >= ? 
                    AND created_at <= ? 
                    GROUP BY DATE(created_at) 
                    ORDER BY date ASC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
            echo json_encode(['data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found. Available: orders, sales_report']);
            break;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database Error']);
}
?>