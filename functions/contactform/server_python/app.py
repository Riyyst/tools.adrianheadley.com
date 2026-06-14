from flask import Flask, request, jsonify
import os, smtplib, ssl, re
from email.message import EmailMessage
from dotenv import load_dotenv
from time import time

load_dotenv()

app = Flask(__name__)

# --- Simple in-memory rate limit: 5 submissions / 10 minutes per IP ---
WINDOW_SECONDS = 600
MAX_REQUESTS = 5
ip_hits = {}

def rate_limited(ip: str) -> bool:
    now = time()
    window = ip_hits.get(ip, [])
    window = [t for t in window if now - t < WINDOW_SECONDS]
    if len(window) >= MAX_REQUESTS:
        ip_hits[ip] = window
        return True
    window.append(now)
    ip_hits[ip] = window
    return False

# --- Config from environment ---
SMTP_HOST   = os.getenv("SMTP_HOST", "")
SMTP_PORT   = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER   = os.getenv("SMTP_USER", "")
SMTP_PASS   = os.getenv("SMTP_PASS", "")
TO_EMAIL    = os.getenv("TO_EMAIL", "riystt@pm.me")
FROM_EMAIL  = os.getenv("FROM_EMAIL", SMTP_USER or "no-reply@localhost")
RE_CAPTCHA_SECRET = os.getenv("RE_CAPTCHA_SECRET", "")  # optional

EMAIL_SUBJECT_PREFIX = os.getenv("EMAIL_SUBJECT_PREFIX", "[riyst.com] Contact")

# --- Utilities ---
EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

def send_email(subject: str, body: str):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = FROM_EMAIL
    msg["To"] = TO_EMAIL
    msg.set_content(body)
    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls(context=context)
        if SMTP_USER:
            server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)

@app.post("/api/contact")
def contact():
    # Basic CSRF mitigation: require same-origin via Referer (works for browsers)
    ref = request.headers.get("Referer", "")
    host = request.host_url.rstrip("/")
    if host not in ref:
        # You may choose to only warn or disable this in dev
        pass

    if rate_limited(request.remote_addr or "unknown"):
        return jsonify({"ok": False, "error": "Too many submissions. Please try again later."}), 429

    data = request.get_json(silent=True) or request.form

    # Honeypot
    if (data.get("website") or "").strip():
        return jsonify({"ok": True}), 200  # pretend success for bots

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    topic = (data.get("topic") or "").strip()
    message = (data.get("message") or "").strip()
    consent = str(data.get("consent") or "").lower() in ("true", "1", "on", "yes")

    errors = {}
    if not name:
        errors["name"] = "Please enter your name."
    if not EMAIL_RE.match(email or ""):
        errors["email"] = "Please enter a valid email."
    if not topic:
        errors["topic"] = "Please choose a topic."
    if not message:
        errors["message"] = "Please enter a message."
    if not consent:
        errors["consent"] = "Please confirm consent."

    if errors:
        return jsonify({"ok": False, "errors": errors}), 400

    # Build email body
    subject = f"{EMAIL_SUBJECT_PREFIX}: {topic.title()}"
    body = f"""New contact form submission

Name: {name}
Email: {email}
Topic: {topic}
Consent: {consent}

Message:
{message}
"""

    try:
        send_email(subject, body)
    except Exception as e:
        # Log in real app
        return jsonify({"ok": False, "error": "Server error sending email."}), 500

    return jsonify({"ok": True}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
