# Settings

Route: `/settings`  
Access: All authenticated users (tabs vary by role)

The Settings page has three tabs. Not all tabs are visible to all users.

---

## Personalization Tab

Access: **Admin only**

Customize the look and feel of the panel.

| Setting | Description |
|---------|-------------|
| Panel Name | The name shown on the login page and browser tab (e.g. "Rhamphor" or "My Hosting Panel") |
| Logo URL | URL of the logo image displayed above the login form |
| Favicon URL | URL of the favicon |
| Theme Color | Primary accent color. Eight presets are provided (Violet, Blue, Green, Red, Orange, Pink, Slate, Rose). Custom hex values are also accepted. |
| Login Background | URL of a background image for the login page |
| Custom CSS | Raw CSS injected into the panel's `<head>`. Use this to override styles without forking the codebase. |

Changes are saved immediately on blur/confirm and applied panel-wide. The login page picks up the new branding without a page reload (it reads from `GET /api/settings/public`).

---

## Security Tab

Access: **Admin only**

Configure optional security features.

### reCAPTCHA v2

When enabled, the login form shows a Google reCAPTCHA v2 checkbox before allowing sign-in.

| Field | Description |
|-------|-------------|
| Enable reCAPTCHA | Toggle on/off |
| Site Key | Public key from [google.com/recaptcha](https://www.google.com/recaptcha) — displayed in the login form |
| Secret Key | Private key — validated server-side against the Google reCAPTCHA API |

**To set up:**
1. Go to [google.com/recaptcha](https://www.google.com/recaptcha) → Admin Console
2. Register a new site, choose **reCAPTCHA v2 → "I'm not a robot" Checkbox**
3. Add your panel's domain to the allowed domains list
4. Copy the Site Key and Secret Key into Settings → Security
5. Toggle "Enable reCAPTCHA" on
6. Log out and log back in to verify it appears on the login form

---

## Account Tab

Access: **All authenticated users**

Update your own account details.

| Field | Description |
|-------|-------------|
| Username | Change your display name and login username |
| Email | Change your email address |
| Current Password | Required to save any changes |
| New Password | Leave blank to keep the current password |
| Confirm New Password | Must match New Password |

Changes are saved to your user record in the database. Your session remains active after saving.
