<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "Testing PDO MySQL...<br>";
if (extension_loaded('pdo_mysql')) {
    echo "pdo_mysql is loaded.<br>";
} else {
    echo "pdo_mysql is NOT loaded.<br>";
}

try {
    $pdo = new PDO("mysql:host=localhost", "root", "");
    echo "Connected to MySQL successfully (as root/empty).<br>";
} catch (Exception $e) {
    echo "Connection failed (expected if root/empty is wrong): " . $e->getMessage() . "<br>";
}
