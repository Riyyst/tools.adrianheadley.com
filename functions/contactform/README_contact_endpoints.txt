# Contact Form Backend (Python or PHP)

Choose one of the two options below.

## Option A — Python (Flask)

1. Go to `server_python/` and create your `.env` by copying `.env.example`.
2. Fill in SMTP details and recipient email.
3. Install deps and run the server:
   ```bash
   pip install -r server_python/requirements.txt
   python server_python/app.py
   ```
4. Deploy behind your site (e.g., as a service at `https://riyst.com/api/contact`).

The contact form in `contact.html` already posts JSON to `/api/contact` via `fetch`.

## Option B — PHP (Default: Ready Now)

1. Upload `server_php/contact.php` to your web root (so it is available at `/contact.php`). It is preconfigured to send to **riystt@pm.me**.
2. Optionally set an env var `TO_EMAIL` on your host.
3. Edit `contact.html` JS to point to `/contact.php` instead of `/api/contact`:
   ```js
   const endpoint = '/contact.php';
   ```

> Note: For better deliverability than `mail()`, consider installing PHPMailer and SMTP credentials.
