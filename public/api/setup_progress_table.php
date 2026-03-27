<?php
session_start();
require_once 'auth_functions.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Security Check: Ensure Admin is Logged In
if (!isset($_SESSION['admin_id'])) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized. Admin login required.']);
    exit;
}

$pdo = get_db_connection();

try {
    // Create reading_progress table
    $sql = "CREATE TABLE IF NOT EXISTS reading_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        book_id VARCHAR(255) NOT NULL,
        current_page INT DEFAULT 1,
        total_pages INT DEFAULT 0,
        last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_progress (user_id, book_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    
    $pdo->exec($sql);
    
    echo json_encode(['status' => 'success', 'message' => 'Reading progress table created successfully.']);

} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
