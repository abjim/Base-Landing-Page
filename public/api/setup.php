<?php
// setup.php - Database Connection Setup Wizard
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/html; charset=utf-8');

$config_file_1 = __DIR__ . '/config.php';
$config_file_2 = __DIR__ . '/../../php_backend/config.php';

$message = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db_host = $_POST['db_host'] ?? 'localhost';
    $db_name = $_POST['db_name'] ?? '';
    $db_user = $_POST['db_user'] ?? '';
    $db_pass = $_POST['db_pass'] ?? '';

    // Test connection - Try without dbname first to verify credentials
    try {
        // We try to connect to the server first. If dbname is provided and exists, it will work.
        // If it doesn't exist, connecting with dbname will fail, so we connect without it first.
        $pdo = new PDO("mysql:host=$db_host;charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        
        // Update public/api/config.php
        $content1 = file_get_contents($config_file_1);
        $content1 = preg_replace("/define\('DB_HOST', getenv\('DB_HOST'\) \?: '.*?'\);/", "define('DB_HOST', getenv('DB_HOST') ?: '$db_host');", $content1);
        $content1 = preg_replace("/define\('DB_NAME', getenv\('DB_NAME'\) \?: '.*?'\);/", "define('DB_NAME', getenv('DB_NAME') ?: '$db_name');", $content1);
        $content1 = preg_replace("/define\('DB_USER', getenv\('DB_USER'\) \?: '.*?'\);/", "define('DB_USER', getenv('DB_USER') ?: '$db_user');", $content1);
        $content1 = preg_replace("/define\('DB_PASS', getenv\('DB_PASS'\) \?: '.*?'\);/", "define('DB_PASS', getenv('DB_PASS') ?: '$db_pass');", $content1);
        file_put_contents($config_file_1, $content1);

        // Update php_backend/config.php
        if (file_exists($config_file_2)) {
            $content2 = file_get_contents($config_file_2);
            $content2 = preg_replace("/define\('DB_HOST', '.*?'\);/", "define('DB_HOST', '$db_host');", $content2);
            $content2 = preg_replace("/define\('DB_NAME', '.*?'\);/", "define('DB_NAME', '$db_name');", $content2);
            $content2 = preg_replace("/define\('DB_USER', '.*?'\);/", "define('DB_USER', '$db_user');", $content2);
            $content2 = preg_replace("/define\('DB_PASS', '.*?'\);/", "define('DB_PASS', '$db_pass');", $content2);
            file_put_contents($config_file_2, $content2);
        }

        // Run install.php to set up tables
        try {
            require_once 'install.php';
            $message = '<div style="color: green; font-weight: bold; margin-bottom: 20px;">Database connected and setup successfully! <a href="/admin">Go to Admin Panel</a></div>';
        } catch (Exception $e) {
            $message = '<div style="color: red; font-weight: bold; margin-bottom: 20px;">Database connected, but setup failed: ' . $e->getMessage() . '</div>';
        }
    } catch (PDOException $e) {
        $message = '<div style="color: red; font-weight: bold; margin-bottom: 20px;">Connection failed: ' . $e->getMessage() . '</div>';
    } catch (Exception $e) {
        $message = '<div style="color: red; font-weight: bold; margin-bottom: 20px;">An error occurred: ' . $e->getMessage() . '</div>';
    }
}

// Current values - Read from file instead of including to avoid constant redefinition issues
$current_host = 'localhost';
$current_name = 'endingsc_organic';
$current_user = 'endingsc_organic';
$current_pass = 'Organic724273269@';

if (file_exists($config_file_1)) {
    $config_content = file_get_contents($config_file_1);
    if (preg_match("/define\('DB_HOST', getenv\('DB_HOST'\) \?: '(.*?)'\);/", $config_content, $m)) $current_host = $m[1];
    if (preg_match("/define\('DB_NAME', getenv\('DB_NAME'\) \?: '(.*?)'\);/", $config_content, $m)) $current_name = $m[1];
    if (preg_match("/define\('DB_USER', getenv\('DB_USER'\) \?: '(.*?)'\);/", $config_content, $m)) $current_user = $m[1];
    if (preg_match("/define\('DB_PASS', getenv\('DB_PASS'\) \?: '(.*?)'\);/", $config_content, $m)) $current_pass = $m[1];
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Organic Panel - Database Setup</title>
    <style>
        body { font-family: sans-serif; background: #0f172a; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { background: #1e293b; padding: 30px; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); width: 100%; max-width: 400px; }
        h2 { margin-top: 0; color: #06b6d4; text-align: center; }
        label { display: block; margin-bottom: 5px; font-size: 12px; color: #94a3b8; }
        input { width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #334155; background: #0f172a; color: #fff; border-radius: 5px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #06b6d4; color: #fff; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: background 0.3s; }
        button:hover { background: #0891b2; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Database Setup Wizard</h2>
        <?php echo $message; ?>
        <form method="POST">
            <label>Database Host</label>
            <input type="text" name="db_host" value="<?php echo htmlspecialchars($current_host); ?>" required>
            
            <label>Database Name</label>
            <input type="text" name="db_name" value="<?php echo htmlspecialchars($current_name); ?>" required>
            
            <label>Database User</label>
            <input type="text" name="db_user" value="<?php echo htmlspecialchars($current_user); ?>" required>
            
            <label>Database Password</label>
            <input type="password" name="db_pass" value="<?php echo htmlspecialchars($current_pass); ?>" required>
            
            <button type="submit">Connect & Setup Database</button>
        </form>
    </div>
</body>
</html>
