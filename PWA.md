# VICOBA Community Hub PWA

## Architecture

The PWA uses a dependency-free, TypeScript service worker compatible with the
Next.js 16 App Router. `src/service-worker.ts` is compiled by
`tsconfig.sw.json` into `public/sw.js` before every production build. The
service worker is registered by `PwaManager` only in production and only in a
secure browser context (HTTPS or localhost).

Key files:

- `src/app/manifest.ts`: install manifest, icons, screenshots, shortcuts, and branding.
- `src/service-worker.ts`: offline, caching, lifecycle, push, and sync extension points.
- `src/lib/pwa/register.ts`: production registration, update checks, and cache cleanup.
- `src/lib/pwa/sync.ts`: future background-sync registration boundary.
- `src/components/pwa/PwaManager.tsx`: install and update user experience.
- `src/app/offline/page.tsx`: navigation fallback with automatic reconnect detection.

## Caching strategy

| Request | Strategy | Cache |
| --- | --- | --- |
| App navigation | Network first, cached page, then `/offline` | `pages` |
| Next.js JS/CSS and fonts | Cache first | `static` |
| Images, logos, avatars, media, and documents | Cache first | `media` |
| Same-origin GET API data | Network first with cached fallback | `api` |
| Authentication and authorized-header requests | Network only; never cached | none |

Only successful responses without `private` or `no-store` cache directives are
stored. Authentication routes, authorization headers, password requests, and
responses that set cookies are excluded. A logout request clears cached pages
and API data. Cache names are versioned, and old VICOBA caches are removed when
a new service worker activates.

## Offline behavior

Previously visited pages, successful cacheable GET responses, images, fonts,
CSS, and JavaScript remain available offline. A navigation that has never been
visited opens `/offline`. The offline page retries manually and reloads
automatically when connectivity returns. Financial mutations are not faked or
silently queued, preventing duplicate payments and unsafe offline writes.

## Installation

Chromium browsers receive the native `beforeinstallprompt` flow through the
custom Install button. The prompt disappears after installation. iPhone and
iPad users receive concise Share → Add to Home Screen instructions. The app
manifest includes standard, Apple, shortcut, and maskable icons.

Production installation requires HTTPS. Local install testing can use a normal
localhost production server because browsers treat localhost as secure.

## Update flow

The app checks for service-worker updates on focus and once per hour. When a
new worker is waiting, the UI displays “A new version is available.” Selecting
Update sends `SKIP_WAITING`; the worker claims clients and the page reloads once
the new controller takes over. The service-worker response itself is sent with
`no-cache, no-store` headers.

## Future push notifications

The service worker already contains safe `push` and `notificationclick`
listeners. A future implementation should:

1. Generate VAPID keys or configure Firebase Cloud Messaging.
2. Store subscriptions per authenticated user in Django.
3. Add authenticated subscribe/unsubscribe API endpoints.
4. Validate notification payload URLs before sending them.
5. Keep private keys server-side and rotate them according to policy.

No notification permission is requested today.

## Future background sync

`requestPendingActionSync()` registers the `vicoba-pending-actions` tag when
the browser supports Background Sync. The worker currently notifies open app
clients when that tag fires. Before enabling queued contributions, attendance,
loan requests, or profile updates, add an encrypted, user-scoped IndexedDB
queue with idempotency keys, expiry, validation, explicit logout cleanup, and a
review UI. Payment initiation must remain online-only.

## Build and test

```bash
npm run pwa:build-sw
npm run build
npm run start
```

Then test in a clean Chrome profile:

1. Open the production app on HTTPS or localhost.
2. In DevTools → Application, verify the manifest and service-worker scope `/`.
3. Install the app and confirm it opens in standalone mode.
4. Visit several pages, enable DevTools Offline, and revisit those routes.
5. Open an uncached route and verify the offline fallback.
6. Deploy a changed service worker and confirm the Update prompt appears.
7. Run Lighthouse for PWA, Accessibility, Best Practices, Performance, and SEO.
8. Log out and verify the private API/page caches are removed.

Development mode does not register the service worker. If a production worker
was previously installed on localhost, unregister it in DevTools before normal
development testing.

## Next.js 16 compatibility

The project uses Next.js 16.2.5. A native service worker was chosen because the
standard Serwist bundler integration currently requires webpack and the local
Turbopack production build stalled during verification. The production script
therefore uses Next.js 16's supported `--webpack` build mode and compiles the
standalone worker with TypeScript first. Development remains on Turbopack.
