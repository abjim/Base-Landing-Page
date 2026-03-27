<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');

$order_id = $_GET['order_id'];

if(!$order_id) {
    echo json_encode(['status' => 'error']);
    exit;
}

$pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
$stmt = $pdo->prepare("SELECT status, amount FROM orders WHERE id = ?");
$stmt->execute([$order_id]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);

if ($order && $order['status'] === 'PAID') {
    echo json_encode([
        'status' => 'PAID',
        'amount' => $order['amount'],
        'download_link' => SITE_URL . '/api/download.php?order_id=' . $order_id
    ]);
} else {
    echo json_encode(['status' => $order['status']]);
}
?>