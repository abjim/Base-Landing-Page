<?php
require_once 'config.php';
session_start();

$order_id = isset($_GET['order_id']) ? $_GET['order_id'] : null;
$file_key = isset($_GET['file_key']) ? $_GET['file_key'] : null;
$isAdmin = isset($_GET['admin_preview']) && isset($_SESSION['admin_id']);

if (!$order_id) die("Invalid Link");

try {
    // UTF8MB4 Connection
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Fetch Order & Upsells
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) die("Order not found.");

    // Verify Payment (unless admin)
    if (!$isAdmin && $order['status'] !== 'PAID') {
        die("Access Denied. Order status is " . $order['status']);
    }

    $upsell_items = !empty($order['upsell_items']) ? json_decode($order['upsell_items'], true) : [];

    // ---------------------------------------------------------
    // HANDLE FILE DOWNLOAD
    // ---------------------------------------------------------
    if ($file_key) {
        $filePath = null;
        $fileName = "download.pdf";

        if ($file_key === 'main') {
            $stmt = $pdo->prepare("SELECT * FROM products WHERE type = 'main' LIMIT 1");
            $stmt->execute();
            $mainProduct = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($mainProduct && !empty($mainProduct['file_url'])) {
                $safeFileName = basename($mainProduct['file_url']);
                $filePath = '../uploads/' . $safeFileName;
                $fileName = $safeFileName;
            } else {
                $filePath = '../protected/ebook.pdf';
                $fileName = "eBook.pdf";
            }
        } else {
            // Check if file_key matches an upsell ID
            foreach ($upsell_items as $item) {
                if ((string)$item['id'] === (string)$file_key) {
                    // Prevent path traversal by extracting only the basename
                    $safeFileName = basename($item['file_url']);
                    $filePath = '../uploads/' . $safeFileName;
                    $fileName = $safeFileName;
                    break;
                }
            }
        }

        // Secure realpath check to prevent directory traversal
        $realBaseDir = realpath(__DIR__ . '/../');
        $realFilePath = $filePath ? realpath($filePath) : false;

        if ($realFilePath && strpos($realFilePath, $realBaseDir) === 0 && file_exists($realFilePath)) {
            // Increment Download Counter only for main file or generally? 
            // Let's increment for any download to show activity
            $update = $pdo->prepare("UPDATE orders SET download_count = download_count + 1 WHERE id = ?");
            $update->execute([$order_id]);

            // Detect MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $realFilePath);
            finfo_close($finfo);

            header('Content-Description: File Transfer');
            header('Content-Type: ' . $mimeType);
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
            header('Content-Length: ' . filesize($realFilePath));
            readfile($realFilePath);
            exit;
        } else {
            die("File not found. Please contact support.");
        }
    }

    // ---------------------------------------------------------
    // RENDER DOWNLOAD DASHBOARD
    // ---------------------------------------------------------
    
    // Fetch main product name
    $stmt = $pdo->prepare("SELECT name FROM products WHERE type = 'main' LIMIT 1");
    $stmt->execute();
    $mainProduct = $stmt->fetch(PDO::FETCH_ASSOC);
    $mainProductName = $mainProduct ? htmlspecialchars($mainProduct['name']) : 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট';
    ?>
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Download Your Files | Shehzin Publications</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Hind Siliguri', sans-serif; }
        </style>
        <script>
            function copyCoupon(code) {
                navigator.clipboard.writeText(code);
                const btn = document.getElementById('copy-btn');
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<span class="text-green-400 text-xs font-bold flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Copied!</span>';
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                }, 2000);
            }
        </script>
    </head>
    <body class="bg-slate-950 text-slate-200 min-h-screen flex flex-col items-center justify-center p-4 py-12">
        <div class="max-w-2xl w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden mb-8">
            
            <!-- Header -->
            <div class="bg-slate-950 p-8 text-center border-b border-slate-800">
                <div class="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h1 class="text-2xl font-bold text-white mb-2">Order Confirmed!</h1>
                <p class="text-slate-400">Order #<?php echo $order_id; ?> • <?php echo htmlspecialchars($order['name']); ?></p>
            </div>

            <!-- Downloads List -->
            <div class="p-8 space-y-4">
                <h2 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Your Downloads</h2>

                <!-- Main Product -->
                <div class="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between border border-slate-700 hover:border-cyan-500/50 transition-colors group">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="font-bold text-white group-hover:text-cyan-400 transition-colors"><?php echo $mainProductName; ?></h3>
                            <p class="text-xs text-slate-500">Main Product</p>
                        </div>
                    </div>
                    <a href="?order_id=<?php echo $order_id; ?>&file_key=main" class="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                        <span>Download</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </a>
                </div>

                <!-- Upsell Items -->
                <?php if (!empty($upsell_items)): ?>
                    <?php foreach ($upsell_items as $item): ?>
                        <div class="bg-slate-800/50 rounded-xl p-4 flex items-center justify-between border border-slate-700 hover:border-purple-500/50 transition-colors group">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="font-bold text-white group-hover:text-purple-400 transition-colors"><?php echo htmlspecialchars($item['name']); ?></h3>
                                    <p class="text-xs text-slate-500">Bonus Material</p>
                                </div>
                            </div>
                            <?php if (!empty($item['file_url'])): ?>
                                <a href="?order_id=<?php echo $order_id; ?>&file_key=<?php echo $item['id']; ?>" class="bg-slate-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                    <span>Download</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </a>
                            <?php else: ?>
                                <span class="text-xs text-slate-500 italic">No file attached</span>
                            <?php endif; ?>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>

            </div>

            <!-- Login Info Section -->
            <div class="bg-indigo-900/20 rounded-xl p-6 border border-indigo-500/30 mt-8 mb-4">
                <h3 class="text-lg font-bold text-indigo-300 mb-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                    </svg>
                    Access Your Library Anytime
                </h3>
                <p class="text-slate-300 text-sm mb-4">
                    You can also access your purchased content by logging into your account.
                </p>
                <div class="bg-slate-950/50 rounded-lg p-4 text-sm font-mono text-slate-400 mb-4 border border-slate-800">
                    <p class="mb-1">Login URL: <a href="https://organic.shehzin.com/#/login" class="text-cyan-400 hover:underline">organic.shehzin.com/#/login</a></p>
                    <p class="mb-1">Username: Your Email or Phone</p>
                    <p>Default Password: <span class="text-white font-bold">12345678</span></p>
                </div>
                <a href="https://organic.shehzin.com/#/login" target="_blank" class="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                    Login to Dashboard
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </a>
            </div>

            <!-- Footer -->
            <div class="bg-slate-950 p-6 text-center border-t border-slate-800">
                <p class="text-xs text-slate-500">Need help? Reply to the confirmation email.</p>
                <a href="/" class="text-xs text-cyan-400 hover:underline mt-2 inline-block">Back to Website</a>
            </div>
        </div>

        <!-- OTO Section -->
        <?php if (defined('OTO_ENABLED') && OTO_ENABLED === '1'): ?>
        <div class="max-w-2xl w-full bg-gradient-to-b from-indigo-900/40 to-slate-900 rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden relative">
            <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <div class="p-8 text-center">
                <div class="inline-block bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-indigo-500/20">
                    Special One-Time Offer
                </div>
                
                <?php if (defined('OTO_IMAGE_URL') && OTO_IMAGE_URL !== ''): ?>
                <img 
                    src="<?php echo htmlspecialchars(OTO_IMAGE_URL); ?>" 
                    alt="Special Offer" 
                    class="w-full h-auto rounded-xl mb-6 border border-slate-700 shadow-lg"
                />
                <?php endif; ?>
                
                <?php if (defined('OTO_COPY') && OTO_COPY !== ''): ?>
                <div class="text-slate-300 mb-6 text-sm leading-relaxed">
                    <?php echo OTO_COPY; ?>
                </div>
                <?php endif; ?>

                <?php if (defined('OTO_COUPON_CODE') && OTO_COUPON_CODE !== ''): ?>
                <div class="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-6">
                    <p class="text-xs text-slate-500 mb-2 uppercase tracking-wider">Use this coupon code</p>
                    <div 
                        onclick="copyCoupon('<?php echo htmlspecialchars(OTO_COUPON_CODE); ?>')"
                        class="flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 py-3 px-4 rounded-lg cursor-pointer transition-colors border border-slate-700 hover:border-indigo-500/50 group"
                    >
                        <span class="font-mono text-xl font-bold text-indigo-400 tracking-widest">
                            <?php echo htmlspecialchars(OTO_COUPON_CODE); ?>
                        </span>
                        <div id="copy-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 group-hover:text-indigo-400 transition-colors"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </div>
                    </div>
                </div>
                <?php endif; ?>

                <?php if (defined('OTO_LINK') && OTO_LINK !== ''): ?>
                <a 
                    href="<?php echo htmlspecialchars(OTO_LINK); ?>"
                    target="_blank"
                    rel="noreferrer"
                    class="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105"
                >
                    Grab This Offer Now 
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
    </body>
    </html>
    <?php
} catch (PDOException $e) {
    die("System Error: " . $e->getMessage());
}
?>