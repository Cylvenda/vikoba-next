# Vercel deployment

Import this frontend repository into Vercel with the Next.js framework preset.
Because this is already the frontend repository, its Root Directory is `.`.

Configure Production and Preview variables:

```text
BACKEND_API_BASE=https://vikoba-api.onrender.com/api/
NEXT_PUBLIC_SITE_URL=https://vikoba.cylvenda.co.tz
AUTH_COOKIE_ACCESS_MAX_AGE=3600
AUTH_COOKIE_REFRESH_MAX_AGE=7200
```

Keep `BACKEND_API_BASE` server-only. The browser calls the same-origin
`/api/proxy/`; Vercel communicates with Render and stores JWTs in HTTP-only
cookies.

After deployment, connect the custom domain, verify registration/login/logout,
install the PWA, test cached pages offline, and confirm the update prompt after
a second deployment.
