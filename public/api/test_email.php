<?php
require_once 'config.php';
require_once 'functions.php';

$email = isset($_GET['email']) ? $_GET['email'] : ADMIN_EMAIL;

echo "<h1>Email Test</h1>";
echo "<p>Trying to send email to: $email</p>";
echo "<p>SMTP Host: " . SMTP_HOST . "</p>";
echo "<p>SMTP Port: " . SMTP_PORT . "</p>";
echo "<p>SMTP User: " . SMTP_USER . "</p>";

$mail = new PHPMailer\PHPMailer\PHPMailer(true);

try {
    $mail->SMTPDebug = 2; // Enable verbose debug output
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = SMTP_PORT;

    $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
    $mail->addAddress($email);

    $mail->isHTML(true);
    $mail->Subject = 'Test Email from Organic Panel';
    $mail->Body    = 'This is a test email to verify SMTP settings.';

    $mail->send();
    echo '<p style="color:green">Message has been sent</p>';
} catch (Exception $e) {
    echo '<p style="color:red">Message could not be sent. Mailer Error: ' . $mail->ErrorInfo . '</p>';
}
?>
