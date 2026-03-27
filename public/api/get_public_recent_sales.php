<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check if enabled
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_enabled'");
    $enabledRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $enabled = $enabledRow && $enabledRow['setting_value'] === '1';

    if (!$enabled) {
        echo json_encode(['enabled' => false, 'sales' => []]);
        exit;
    }

    // Fetch real sales
    $stmt = $pdo->query("SELECT name, created_at FROM orders WHERE status = 'PAID' ORDER BY created_at DESC LIMIT 20");
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check if dummy enabled
    $stmt = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'social_proof_dummy_enabled'");
    $dummyRow = $stmt->fetch(PDO::FETCH_ASSOC);
    $dummyEnabled = $dummyRow && $dummyRow['setting_value'] === '1';

    if ($dummyEnabled) {
        $dummyNames = ["Rahim", "Karim", "Suma", "Jamal", "Nadia", "Farhan", "Tisha", "Rubel", "Mimi", "Sohag"];
        $dummySales = [];
        foreach ($dummyNames as $name) {
            $minutesToSubtract = rand(0, 1440);
            $date = new DateTime();
            $date->modify("-{$minutesToSubtract} minutes");
            $dummySales[] = [
                'name' => $name,
                'created_at' => $date->format('Y-m-d H:i:s')
            ];
        }
        $sales = array_merge($sales, $dummySales);
        
        // Sort by created_at desc
        usort($sales, function($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });
        
        // Limit to 20
        $sales = array_slice($sales, 0, 20);
    }

    if (empty($sales)) {
        echo json_encode(['enabled' => true, 'sales' => []]);
        exit;
    }

    // Fetch settings
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('social_proof_templates', 'social_proof_delay', 'social_proof_duration')");
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

    $templates = [];
    if (!empty($settings['social_proof_templates'])) {
        $templates = json_decode($settings['social_proof_templates'], true);
    }
    if (empty($templates)) {
        $templates = ['{name} from {location} purchased just now'];
    }

    $delay = !empty($settings['social_proof_delay']) ? (int)$settings['social_proof_delay'] : 5;
    $duration = !empty($settings['social_proof_duration']) ? (int)$settings['social_proof_duration'] : 5;

    echo json_encode([
        'enabled' => true,
        'sales' => $sales,
        'message_templates' => $templates,
        'delay' => $delay,
        'duration' => $duration
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
