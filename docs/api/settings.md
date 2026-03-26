# API — Settings

Panel settings are key-value pairs stored in the `settings` table. Only admins can read or write settings (except the public endpoint).

---

## GET /api/settings

Get all panel settings.

**Auth:** Required  
**Role:** Admin only

**Response `200 OK`:**

```json
{
  "panelName": "Rhamphor",
  "panelLogo": "https://example.com/logo.png",
  "panelFavicon": "",
  "themeColor": "#7c3aed",
  "customCss": "",
  "loginBackground": "",
  "recaptchaEnabled": "false",
  "recaptchaSiteKey": "",
  "recaptchaSecretKey": ""
}
```

> The `recaptchaSecretKey` is returned here for the admin to verify/edit. It is never exposed to unauthenticated requests.

---

## PATCH /api/settings

Update one or more settings.

**Auth:** Required  
**Role:** Admin only

**Request body:** Any subset of setting keys and their new values.

```json
{
  "panelName": "My Hosting Panel",
  "themeColor": "#2563eb",
  "recaptchaEnabled": "true"
}
```

**Response `200 OK`:**

```json
{ "ok": true }
```

---

## GET /api/settings/public

Get public settings for the login page.

**Auth:** Not required

Returns a safe subset — never includes the reCAPTCHA secret key or any sensitive values.

**Response `200 OK`:**

```json
{
  "panelName": "Rhamphor",
  "panelLogo": "https://example.com/logo.png",
  "panelFavicon": "",
  "themeColor": "#7c3aed",
  "loginBackground": "",
  "recaptchaEnabled": "true",
  "recaptchaSiteKey": "6Lc..."
}
```

This endpoint is called by the login page on load to apply branding before the user authenticates.
