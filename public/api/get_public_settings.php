<?php
// public/api/get_public_settings.php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");

// Expose only Public IDs (Safe for Frontend)
$publicSettings = [
    'gtm_id' => defined('GTM_ID') ? GTM_ID : '',
    'ga4_id' => defined('GA4_ID') ? GA4_ID : '',
    'fb_pixel_id' => defined('FB_PIXEL_ID') ? FB_PIXEL_ID : '',
    
    // OTO Settings
    'oto_enabled' => defined('OTO_ENABLED') ? OTO_ENABLED : '0',
    'oto_image_url' => defined('OTO_IMAGE_URL') ? OTO_IMAGE_URL : '',
    'oto_copy' => defined('OTO_COPY') ? OTO_COPY : '',
    'oto_coupon_code' => defined('OTO_COUPON_CODE') ? OTO_COUPON_CODE : '',
    'oto_link' => defined('OTO_LINK') ? OTO_LINK : '',
    
    // Site Settings
    'favicon_url' => defined('FAVICON_URL') ? FAVICON_URL : ''
];

echo json_encode($publicSettings);
