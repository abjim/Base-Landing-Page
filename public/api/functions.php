<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

// Function to Send Email via SMTP
function sendProductEmail($to, $name, $orderId) {
    // Check for Upsells
    $hasUpsells = false;
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->exec("SET time_zone = '+06:00'");
        $stmt = $pdo->prepare("SELECT upsell_items FROM orders WHERE id = ?");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        $upsellItems = !empty($order['upsell_items']) ? json_decode($order['upsell_items'], true) : [];
        $hasUpsells = !empty($upsellItems);
    } catch (Exception $e) {
        // Ignore DB error, proceed with default email
    }

    $defaultSubject = "Download Your অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট eBook";
    if ($hasUpsells) {
        $defaultSubject .= " & Bonuses";
    }

    $subject = defined('SUCCESS_EMAIL_SUBJECT') && SUCCESS_EMAIL_SUBJECT !== '' ? SUCCESS_EMAIL_SUBJECT : $defaultSubject;
    $downloadLink = SITE_URL . "/api/download.php?order_id=" . $orderId;
    
    $customBody = defined('SUCCESS_EMAIL_BODY') ? SUCCESS_EMAIL_BODY : '';

    if (!empty($customBody)) {
        // Replace placeholders
        $body = str_replace(
            ['{name}', '{order_id}', '{download_link}', '{site_url}'],
            [$name, $orderId, $downloadLink, SITE_URL],
            $customBody
        );
        // Ensure HTML wrapper if not present (basic check)
        if (strpos($body, '<html') === false) {
            $body = "<html><body>" . nl2br($body) . "</body></html>";
        }
    } else {
        // Default Template
        $itemsText = $hasUpsells ? "<strong>'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট'</strong> and your <strong>Bonus Materials</strong>" : "<strong>'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট'</strong>";
        $buttonText = $hasUpsells ? "Access All Downloads" : "Download eBook PDF";

        $body = "
        <html>
        <head><title>Download Your Files</title></head>
        <body style='font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;'>
          <div style='max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px;'>
            <h2 style='color: #4f46e5;'>Congratulations, $name!</h2>
            <p>Thank you for purchasing $itemsText.</p>
            <p>Your order (ID: #$orderId) is confirmed.</p>
            <br>
            <a href='$downloadLink' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>$buttonText</a>
            <br><br>
            <p style='font-size: 12px; color: #666;'>Or click here: <a href='$downloadLink'>$downloadLink</a></p>
            
            <div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin-top: 20px;'>
                <h3 style='color: #166534; margin-top:0;'>Bonus: Join Secret Facebook Group</h3>
                <p style='color: #166534; font-size: 14px;'>Join our exclusive Facebook group to practice with others.</p>
                <a href='https://www.facebook.com/groups/LearningBangladesh71' style='color: #15803d; font-weight: bold; text-decoration: underline;'>Join Facebook Group</a>
            </div>
    
            <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>
            <p>For any help, simply reply to this email.</p>
            <p>Happy Learning,<br><strong>Shehzin Publications</strong></p>
          </div>
        </body>
        </html>";
    }

    sendCustomEmail($to, $subject, $body);
}

function sendCustomEmail($to, $subject, $htmlContent) {
    $mail = new PHPMailer(true);

    try {
        $mail->CharSet = 'UTF-8';
        $mail->Encoding = 'base64';

        // Server settings
        $mail->isSMTP();
        $mail->Host       = SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USER;
        $mail->Password   = SMTP_PASS;
        if (SMTP_PORT == 587) {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        }
        $mail->Port       = SMTP_PORT;

        // Recipients
        $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $htmlContent;
        $mail->AltBody = strip_tags($htmlContent);

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}

// Function to Send SMS via BulkSMSBD
function sendSMS($number, $text) {
    $clean_number = preg_replace('/[^0-9]/', '', $number);
    if (strlen($clean_number) == 11) {
        $clean_number = '88' . $clean_number;
    }
    
    $url = "http://bulksmsbd.net/api/smsapi?api_key=" . SMS_API_KEY . "&type=text&number=" . $clean_number . "&senderid=" . SMS_SENDER_ID . "&message=" . urlencode($text);
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    return $response;
}

/**
 * Send Facebook Conversions API (CAPI) Event
 * 
 * @param array $userData  Contains email, phone, name
 * @param float $amount    Transaction amount
 * @param string $orderId  Unique Order ID for Deduplication
 */
function sendFacebookCAPI($userData, $amount, $orderId) {
    if (!defined('FB_PIXEL_ID') || !defined('FB_ACCESS_TOKEN')) return;

    $url = "https://graph.facebook.com/v19.0/" . FB_PIXEL_ID . "/events?access_token=" . FB_ACCESS_TOKEN;
    
    // Hash User Data (SHA-256)
    // Phone must include country code without + (e.g. 88017...)
    $phone = preg_replace('/[^0-9]/', '', $userData['phone']);
    if (strlen($phone) == 11) $phone = '88' . $phone; // Assume BD if 11 digits

    $hashedEmail = hash('sha256', strtolower(trim($userData['email'])));
    $hashedPhone = hash('sha256', $phone);
    $hashedName  = hash('sha256', strtolower(trim($userData['name'])));

    // Event Time
    $eventTime = time();

    // Construct Payload
    $data = [
        [
            "event_name" => "Purchase",
            "event_time" => $eventTime,
            "event_id"   => (string)$orderId, // CRITICAL for Deduplication
            "event_source_url" => SITE_URL,
            "action_source" => "website",
            "user_data" => [
                "em" => [$hashedEmail],
                "ph" => [$hashedPhone],
                "fn" => [$hashedName],
                // We send IP and User Agent if available in server context
                "client_ip_address" => $_SERVER['REMOTE_ADDR'] ?? null,
                "client_user_agent" => $_SERVER['HTTP_USER_AGENT'] ?? null
            ],
            "custom_data" => [
                "currency" => "BDT",
                "value"    => (float)$amount,
                "content_name" => "অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট (eBook)",
                "content_ids"  => ["ZERO-EBOOK-01"],
                "content_type" => "product"
            ]
        ]
    ];

    // Payload wrapper
    $payload = [
        "data" => $data,
        // "test_event_code" => "TEST12345" // Use only for testing in Events Manager
    ];

    // Send Request
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    // Execute (Fire and Forget logic ideally, but waiting is fine here)
    $response = curl_exec($ch);
    // $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE); 
    // error_log("CAPI Response: " . $response); // Debugging
    curl_close($ch);
}
/**
 * Process Affiliate Commission
 * 
 * @param int $orderId
 */
function processAffiliateCommission($orderId) {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        // Fetch order details
        $stmt = $pdo->prepare("SELECT amount, affiliate_id FROM orders WHERE id = ? AND status = 'PAID'");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($order && !empty($order['affiliate_id'])) {
            $affiliateId = $order['affiliate_id'];
            $amount = (float)$order['amount'];

            // Check if commission was already processed for this order
            $stmtCheck = $pdo->prepare("SELECT id FROM affiliate_transactions WHERE order_id = ? AND type = 'COMMISSION'");
            $stmtCheck->execute([$orderId]);
            if ($stmtCheck->fetch()) {
                return; // Already processed
            }

            // Get commission percentage
            $stmtSettings = $pdo->prepare("SELECT setting_value FROM settings WHERE setting_key = 'affiliate_commission_percent'");
            $stmtSettings->execute();
            $setting = $stmtSettings->fetch(PDO::FETCH_ASSOC);
            $percentage = $setting ? (float)$setting['setting_value'] : 20.0; // Default 20%

            $commission = round(($amount * $percentage) / 100, 2);

            if ($commission > 0) {
                $pdo->beginTransaction();

                // Update affiliate balance
                $stmtUpdate = $pdo->prepare("UPDATE users SET balance = balance + ?, total_earnings = total_earnings + ? WHERE id = ?");
                $stmtUpdate->execute([$commission, $commission, $affiliateId]);

                // Log transaction
                $stmtLog = $pdo->prepare("INSERT INTO affiliate_transactions (affiliate_id, type, amount, order_id, details) VALUES (?, 'COMMISSION', ?, ?, ?)");
                $stmtLog->execute([$affiliateId, $commission, $orderId, "Commission for order #$orderId"]);

                $pdo->commit();

                // Fetch affiliate details for notification
                $stmtAff = $pdo->prepare("SELECT name, email, phone, total_earnings, affiliate_code FROM users WHERE id = ?");
                $stmtAff->execute([$affiliateId]);
                $affiliate = $stmtAff->fetch(PDO::FETCH_ASSOC);

                if ($affiliate) {
                    // Fetch notification settings
                    $stmtNotif = $pdo->query("SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('affiliate_notification_sms', 'affiliate_notification_email_subject', 'affiliate_notification_email_body')");
                    $notifSettings = [];
                    while ($row = $stmtNotif->fetch(PDO::FETCH_ASSOC)) {
                        $notifSettings[$row['setting_key']] = $row['setting_value'];
                    }

                    $smsTemplate = $notifSettings['affiliate_notification_sms'] ?? '';
                    $emailSubjectTemplate = $notifSettings['affiliate_notification_email_subject'] ?? '';
                    $emailBodyTemplate = $notifSettings['affiliate_notification_email_body'] ?? '';

                    $placeholders = ['{name}', '{commission}', '{total_earnings}', '{order_amount}', '{code}', '{order_id}'];
                    $replacements = [
                        $affiliate['name'] ?? 'Affiliate',
                        $commission,
                        $affiliate['total_earnings'],
                        $amount,
                        $affiliate['affiliate_code'],
                        $orderId
                    ];

                    if (!empty($smsTemplate) && !empty($affiliate['phone'])) {
                        $smsBody = str_replace($placeholders, $replacements, $smsTemplate);
                        sendSMS($affiliate['phone'], $smsBody);
                    }

                    if (!empty($emailSubjectTemplate) && !empty($emailBodyTemplate) && !empty($affiliate['email'])) {
                        $emailSubject = str_replace($placeholders, $replacements, $emailSubjectTemplate);
                        $emailBody = str_replace($placeholders, $replacements, $emailBodyTemplate);
                        // Ensure HTML wrapper if not present
                        if (strpos($emailBody, '<html') === false) {
                            $emailBody = "<html><body>" . nl2br($emailBody) . "</body></html>";
                        }
                        sendCustomEmail($affiliate['email'], $emailSubject, $emailBody);
                    }
                }
            }
        }
    } catch (Exception $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Affiliate Commission Error: " . $e->getMessage());
    }
}
?>