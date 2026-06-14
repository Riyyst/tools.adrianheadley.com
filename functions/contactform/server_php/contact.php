<?php
// Basic contact handler for riyst.com (PHP)
// Place this file as /contact.php on your server.
// For better deliverability, consider PHPMailer instead of mail().

header('Content-Type: application/json');

function respond($code, $arr) {
  http_response_code($code);
  echo json_encode($arr);
  exit;
}

// Simple rate limiting via session (imperfect, improves with server-side caching or DB)
session_start();
if (!isset($_SESSION['hits'])) $_SESSION['hits'] = [];
$now = time();
$_SESSION['hits'] = array_filter($_SESSION['hits'], function($t) use ($now) { return $now - $t < 600; });
if (count($_SESSION['hits']) >= 5) {
  respond(429, ['ok' => false, 'error' => 'Too many submissions. Please try again later.']);
}
$_SESSION['hits'][] = $now;

// Accept both JSON and form-encoded
$input = file_get_contents('php://input');
$data = json_decode($input, true);
if (!$data) $data = $_POST;

// Honeypot
if (!empty($data['website'])) {
  respond(200, ['ok' => true]); // pretend success for bots
}

$name = trim($data['name'] ?? '');
$email = trim($data['email'] ?? '');
$topic = trim($data['topic'] ?? '');
$message = trim($data['message'] ?? '');
$consent = isset($data['consent']) && ($data['consent'] === 'true' || $data['consent'] === 'on' || $data['consent'] === '1');

$errors = [];
if ($name === '') $errors['name'] = 'Please enter your name.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email.';
if ($topic === '') $errors['topic'] = 'Please choose a topic.';
if ($message === '') $errors['message'] = 'Please enter a message.';
if (!$consent) $errors['consent'] = 'Please confirm consent.';

if (!empty($errors)) {
  respond(400, ['ok' => false, 'errors' => $errors]);
}

// Send mail
$to = getenv('TO_EMAIL') ?: 'riystt@pm.me';
$subject = '[riyst.com] Contact: ' . ucfirst($topic);
$body = "New contact form submission\n\nName: $name\nEmail: $email\nTopic: $topic\nConsent: " . ($consent ? 'true' : 'false') . "\n\nMessage:\n$message\n";
$headers = 'From: contact@riyst.com' . "\r\n" . 'Reply-To: ' . $email . "\r\n";

if (@mail($to, $subject, $body, $headers)) {
  respond(200, ['ok' => true]);
} else {
  respond(500, ['ok' => false, 'error' => 'Server error sending email.']);
}
?>
