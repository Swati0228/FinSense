# 🔔 Push Notifications — FinSense PWA

> **Feature:** Daily expense reminder at a user-chosen time, delivered as a PWA push notification.
> **PWA-only:** Notifications only work when the user has **installed the app** to their home screen.

---

## 📖 Table of Contents

1. [How Push Notifications Work in PWA](#1-how-push-notifications-work-in-pwa)
2. [Why PWA-Only?](#2-why-pwa-only)
3. [The Feature We Are Building](#3-the-feature-we-are-building)
4. [Core Concepts Explained](#4-core-concepts-explained)
5. [Architecture Overview](#5-architecture-overview)
6. [What is VAPID?](#6-what-is-vapid)
7. [What is a PushSubscription?](#7-what-is-a-pushsubscription)
8. [How the Daily Reminder Works](#8-how-the-daily-reminder-works)
9. [Database Changes (User Model)](#9-database-changes-user-model)
10. [Files to Create / Modify](#10-files-to-create--modify)
11. [Step-by-Step Implementation Plan](#11-step-by-step-implementation-plan)
    - [Step 1: Generate VAPID Keys](#step-1-generate-vapid-keys)
    - [Step 2: Install web-push](#step-2-install-web-push)
    - [Step 3: Update User Model](#step-3-update-user-model)
    - [Step 4: Subscribe API Route](#step-4-subscribe-api-route)
    - [Step 5: Save Reminder Time API](#step-5-save-reminder-time-api)
    - [Step 6: Send Notification API](#step-6-send-notification-api)
    - [Step 7: Cron Job (Scheduler)](#step-7-cron-job-scheduler)
    - [Step 8: Service Worker Push Handler](#step-8-service-worker-push-handler)
    - [Step 9: Frontend - Notification Permission Component](#step-9-frontend---notification-permission-component)
    - [Step 10: Profile Page - Reminder Time Picker](#step-10-profile-page---reminder-time-picker)
12. [Complete Data Flow Diagram](#12-complete-data-flow-diagram)
13. [Platform Support & Limitations](#13-platform-support--limitations)
14. [Environment Variables Needed](#14-environment-variables-needed)
15. [Testing Push Notifications](#15-testing-push-notifications)
16. [Common Errors & Fixes](#16-common-errors--fixes)
17. [Interview Notes](#17-interview-notes)

---

## 1. How Push Notifications Work in PWA

Push notifications in a PWA involve 4 actors:

```
[FinSense Server] ──────► [Push Service] ──────► [Service Worker] ──────► [User Sees Notification]
  (your backend)         (Google FCM /          (sw.js running in         (popup on phone/desktop)
                          Mozilla Push)          background)
```

### The Full Journey:

```
Step 1: User opens FinSense PWA (installed on home screen)
Step 2: App asks "Allow Notifications?" → User clicks Allow
Step 3: Browser contacts its Push Service (Google for Chrome, Mozilla for Firefox)
Step 4: Push Service returns a unique "PushSubscription" object (endpoint URL + keys)
Step 5: FinSense app sends this subscription to YOUR backend → saved in MongoDB
Step 6: User sets their daily reminder time in Profile (e.g., 9:00 PM)
Step 7: Your backend saves reminder time in MongoDB
Step 8: A Cron Job runs every minute on your server
Step 9: It checks: "Is it 9:00 PM for any user right now?"
Step 10: If YES → calls web-push.sendNotification() → Push Service → Service Worker
Step 11: Service Worker receives push event → shows notification popup
Step 12: User taps notification → app opens at /dashboard/addexpense
```

---

## 2. Why PWA-Only?

Push notifications in the browser require a **Service Worker** to receive them.

- Service Workers are only registered when the PWA is installed or when HTTPS is active
- On **iOS Safari**, push notifications ONLY work if the user has **installed the PWA to their home screen** (iOS 16.4+ requirement)
- On **Android Chrome** and **Desktop Chrome/Edge**, push works even without installing — but installing gives a better experience

**How we detect if the user is in PWA mode:**

```js
const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                  || navigator.standalone === true; // iOS specific
```

We only show the "Enable Notifications" button when `isStandalone === true`.
This ensures regular browser visitors don't see notification prompts.

---

## 3. The Feature We Are Building

### Feature: Daily Expense Reminder

**User Story:**
> As a FinSense user, I want to receive a daily notification at a time I choose,
> reminding me to log my expenses for the day.

**How it looks:**
1. User goes to **Profile Page**
2. They see: **"Daily Expense Reminder"** section
3. They toggle it ON and pick a time: e.g., `9:30 PM`
4. They click Save
5. Every day at 9:30 PM → they get a notification:
   > **📝 FinSense Reminder**
   > *"Don't forget to log today's expenses!"*
6. They tap it → opens directly at `/dashboard/addexpense`

---

## 4. Core Concepts Explained

### 4.1 Service Worker (`sw.js`)
- JavaScript file that runs in the **background** in the browser
- Separate from your webpage — survives even when tab/browser is closed
- Listens for `push` events from the browser
- When it receives a push → calls `showNotification()` to display the popup
- Auto-generated by `next-pwa` (`public/sw.js`)
- We add **custom push handling** code on top of it

### 4.2 Notification API
```js
self.registration.showNotification("Title", {
  body: "Message text",
  icon: "/icons/icon-192x192.png",
  badge: "/icons/icon-72x72.png",
  data: { url: "/dashboard/addexpense" }
});
```

### 4.3 Push API
```js
// On frontend — subscribe to push
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY   // your public VAPID key
});
```

### 4.4 Permission API
```js
const permission = await Notification.requestPermission();
// Returns: "granted" | "denied" | "default"
// "default" = user hasn't decided yet
// "denied"  = user said no (can't ask again, must go to browser settings)
// "granted" = ✅ we can show notifications
```

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MONGODB                              │
│  User: {                                                │
│    pushSubscription: { endpoint, keys: {p256dh, auth}} │
│    reminderTime: "21:30"   ← user's chosen time (HH:MM)│
│    reminderEnabled: true                                │
│  }                                                      │
└──────────────────────┬──────────────────────────────────┘
                       │ read/write
┌──────────────────────▼──────────────────────────────────┐
│                  NEXT.JS BACKEND                        │
│                                                         │
│  POST /api/push/subscribe    ← save subscription        │
│  DELETE /api/push/subscribe  ← remove subscription      │
│  POST /api/push/reminder     ← save time preference     │
│  POST /api/push/send-test    ← send test notification   │
│                                                         │
│  Cron Job (node-cron)        ← runs every minute        │
│    → checks who needs a reminder right now              │
│    → calls web-push.sendNotification()                  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS push via VAPID
┌──────────────────────▼──────────────────────────────────┐
│              PUSH SERVICE (Google FCM / Mozilla)        │
│   Acts as the middleman — delivers to the right device  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              SERVICE WORKER (sw.js in browser)          │
│   Receives push event → shows notification popup        │
│   On click → opens /dashboard/addexpense                │
└─────────────────────────────────────────────────────────┘
```

---

## 6. What is VAPID?

**VAPID = Voluntary Application Server Identification**

It's a security mechanism that **proves to the Push Service that the push is coming from YOUR server** and not a random attacker.

### How it works:
- You generate a pair of cryptographic keys (like SSH keys):
  - `VAPID_PUBLIC_KEY` → embedded in your frontend app (safe to expose)
  - `VAPID_PRIVATE_KEY` → stored only in your backend `.env` (secret, never expose)

- When the browser subscribes to push, it uses your **public key** to link the subscription to you
- When your server sends a push, it **signs the message** with the **private key**
- Google/Mozilla's Push Service **verifies the signature** — if it doesn't match, push is rejected

### Generate VAPID Keys (One Time Only):

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key:  BHoR5_aQe0w...long key...
Private Key: abc123...long key...
```

Add these to your `.env`:
```env
VAPID_PUBLIC_KEY=BHoR5_aQe0w...
VAPID_PRIVATE_KEY=abc123...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BHoR5_aQe0w...   ← same key, but NEXT_PUBLIC_ prefix makes it available on frontend
```

> ⚠️ **Never regenerate VAPID keys** unless absolutely necessary.
> If you regenerate, ALL existing subscriptions in your DB become invalid.
> Every user would need to re-subscribe.

---

## 7. What is a PushSubscription?

When a user grants notification permission, the browser creates a subscription object:

```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/dkj3lk2j3lk2j3lk2jl3k2jlk23",
  "expirationTime": null,
  "keys": {
    "p256dh": "BHoR5...very long base64 encoded key...",
    "auth": "abc123short"
  }
}
```

| Field | Meaning |
|-------|---------|
| `endpoint` | Unique URL on Google/Mozilla's push server for this user+device+browser combo |
| `p256dh` | Encryption public key — your server uses this to encrypt the message payload |
| `auth` | Authentication secret — used alongside p256dh for encryption |

**This object must be saved to MongoDB per user.**

> If the same user uses Chrome on phone AND laptop, they have **2 different subscriptions**.
> For FinSense, we store one subscription per user (their most recently logged-in device).
> Advanced: store array of subscriptions to notify all devices.

---

## 8. How the Daily Reminder Works

### The Scheduling Problem

Push notifications are not like a simple `setTimeout()` — you can't schedule them from the browser because:
- Browser tabs close
- Users lock their phones

The **server** must be responsible for timing. Here's how:

### Solution: Cron Job on the Server

A **Cron Job** is a task that runs automatically at set intervals on the server.

We use the `node-cron` library to run a task **every minute**:

```
Every minute → check all users where reminderEnabled = true
             → compare their reminderTime (e.g., "21:30") with current time
             → if it matches → send push notification
```

### Timezone Handling

This is the tricky part. Users are in different timezones.

**Solution:** Store the user's timezone in the DB (e.g., `"Asia/Kolkata"`).
When the cron job runs, convert their `reminderTime` to the server's UTC time and compare.

```js
// User has reminderTime: "21:30" and timezone: "Asia/Kolkata"
// Cron runs at UTC 16:00 → that's 21:30 in India (IST = UTC+5:30) → SEND!
```

---

## 9. Database Changes (User Model)

Current User model in `src/models/User.ts` needs these new fields:

```typescript
// Add to IUser interface:
pushSubscription?: {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};
reminderEnabled: boolean;
reminderTime: string;       // "HH:MM" format e.g., "21:30"
timezone: string;           // e.g., "Asia/Kolkata"

// Add to userSchema:
pushSubscription: {
  endpoint: { type: String, default: null },
  keys: {
    p256dh: { type: String, default: null },
    auth: { type: String, default: null },
  }
},
reminderEnabled: { type: Boolean, default: false },
reminderTime: { type: String, default: "21:00" },  // default 9 PM
timezone: { type: String, default: "Asia/Kolkata" },
```

---

## 10. Files to Create / Modify

| Action | File | Purpose |
|--------|------|---------|
| ✏️ Modify | `src/models/User.ts` | Add push subscription + reminder fields |
| 🆕 Create | `src/app/api/push/subscribe/route.ts` | Save/delete push subscription |
| 🆕 Create | `src/app/api/push/reminder/route.ts` | Save reminder time + timezone |
| 🆕 Create | `src/app/api/push/send-test/route.ts` | Send a test notification to self |
| 🆕 Create | `src/lib/webpush.ts` | VAPID setup + sendNotification helper |
| 🆕 Create | `src/lib/cron.ts` | Cron job that fires reminders every minute |
| ✏️ Modify | `src/app/api/auth/login/route.ts` | Start cron when server starts |
| 🆕 Create | `src/components/NotificationPermission.tsx` | "Enable Notifications" button (PWA-only) |
| ✏️ Modify | `src/app/dashboard/profile/page.tsx` | Add reminder time picker UI |
| 🆕 Create | `public/sw-push.js` | Custom push event handler injected into SW |

---

## 11. Step-by-Step Implementation Plan

### Step 1: Generate VAPID Keys

Run this **once** in your terminal:

```bash
npx web-push generate-vapid-keys
```

Copy the output and add to `.env`:

```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_EMAIL=mailto:admin@finsense.com
```

> `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — same public key but with `NEXT_PUBLIC_` prefix
> so Next.js exposes it to the browser (needed when subscribing to push).

---

### Step 2: Install web-push

```bash
npm install web-push node-cron
npm install --save-dev @types/web-push @types/node-cron
```

---

### Step 3: Update User Model

File: `src/models/User.ts`

Add the new fields to `IUser` interface and `userSchema`.
(Full code will be written during implementation.)

---

### Step 4: Subscribe API Route

File: `src/app/api/push/subscribe/route.ts`

```
POST → receives { subscription } from browser → saves to user's MongoDB doc
DELETE → removes subscription (when user turns off notifications)
```

Flow:
1. Read JWT from cookies → get user ID
2. Find user in MongoDB
3. Save `subscription.endpoint`, `subscription.keys.p256dh`, `subscription.keys.auth`
4. Return `{ success: true }`

---

### Step 5: Save Reminder Time API

File: `src/app/api/push/reminder/route.ts`

```
POST → receives { reminderTime: "21:30", timezone: "Asia/Kolkata", enabled: true }
     → saves to user's MongoDB doc
```

Flow:
1. Validate time format (HH:MM)
2. Validate timezone (use `Intl.supportedValuesOf('timeZone')`)
3. Update user's `reminderTime`, `timezone`, `reminderEnabled` fields

---

### Step 6: Send Notification API

File: `src/lib/webpush.ts`

```typescript
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; icon: string; url: string }
) {
  await webpush.sendNotification(
    subscription,
    JSON.stringify(payload)
  );
}
```

---

### Step 7: Cron Job (Scheduler)

File: `src/lib/cron.ts`

```typescript
import cron from 'node-cron';
import User from '@/models/User';

// Runs every minute: "* * * * *"
cron.schedule('* * * * *', async () => {
  const now = new Date();

  // Find all users with reminders enabled and a valid subscription
  const users = await User.find({
    reminderEnabled: true,
    'pushSubscription.endpoint': { $exists: true, $ne: null }
  });

  for (const user of users) {
    // Convert current UTC time to user's timezone
    const userTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: user.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);  // e.g., "21:30"

    if (userTime === user.reminderTime) {
      await sendPushNotification(user.pushSubscription, {
        title: '📝 FinSense Reminder',
        body: "Don't forget to log today's expenses!",
        icon: '/icons/icon-192x192.png',
        url: '/dashboard/addexpense'
      });
    }
  }
});
```

> The cron job runs every minute. When `userTime === user.reminderTime` is true,
> it sends the notification. This works across all timezones automatically.

---

### Step 8: Service Worker Push Handler

File: Custom SW code (injected via `next-pwa`'s custom worker support)

```javascript
// Fires when your server sends a push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],          // vibration pattern on mobile
      data: { url: data.url },           // passed to click handler
      actions: [
        { action: 'open', title: '📝 Add Expense' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

// Fires when user taps the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/dashboard/addexpense';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open → focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(url);
            return;
          }
        }
        // App not open → open a new window
        clients.openWindow(url);
      })
  );
});
```

---

### Step 9: Frontend - Notification Permission Component

File: `src/components/NotificationPermission.tsx`

This component:
- Only renders if `display-mode: standalone` (PWA installed)
- Shows a button: "🔔 Enable Notifications"
- On click → calls `Notification.requestPermission()`
- If granted → subscribes to push → sends subscription to backend
- If denied → shows message to enable from browser settings

```tsx
"use client";

// Only renders in installed PWA mode
// Handles the full permission → subscribe → save-to-db flow
```

---

### Step 10: Profile Page - Reminder Time Picker

Add this section to `src/app/dashboard/profile/page.tsx`:

**UI to add:**
```
┌─────────────────────────────────────┐
│  🔔 Daily Expense Reminder          │
│                                     │
│  [Toggle ON/OFF]                    │
│                                     │
│  Remind me at: [09:30 PM  ▼]       │
│                                     │
│  Timezone: [Asia/Kolkata  ▼]        │
│                                     │
│           [Save Reminder]           │
└─────────────────────────────────────┘
```

On Save:
1. Call `POST /api/push/reminder` with `{ reminderTime, timezone, enabled }`
2. If notifications not enabled yet → prompt to enable first
3. Show success toast

---

## 12. Complete Data Flow Diagram

```
USER ACTION                    FRONTEND                  BACKEND               DB
──────────                    ────────                  ───────               ──

1. Opens PWA app           → detect standalone mode
2. Taps "Enable Notifs"   → requestPermission()
3. Clicks Allow           → pushManager.subscribe()   → POST /api/push/subscribe
                             (gets PushSubscription)  → save to User.pushSubscription  MongoDB ✅

4. Goes to Profile
5. Sets time to "21:30"   → PATCH /api/push/reminder  → save reminderTime,
   clicks Save                                           timezone, enabled    MongoDB ✅

                                                       CRON JOB (every minute)
                                                       → find users where enabled=true
                                                       → check if current time matches
                                                       → web-push.sendNotification()

                                                       → Google FCM / Mozilla Push

6. Gets notification      ← Service Worker (sw.js)
   on their device           receives push event
                             → showNotification()

7. Taps notification      → notificationclick event
                          → opens /dashboard/addexpense
```

---

## 13. Platform Support & Limitations

| Platform | Supported? | Notes |
|----------|-----------|-------|
| Chrome (Android) | ✅ Yes | Works best — full support |
| Chrome (Desktop) | ✅ Yes | Works without installation |
| Edge (Desktop) | ✅ Yes | Uses same Chromium engine |
| Firefox (Desktop) | ✅ Yes | Uses Mozilla Push Service |
| Safari (macOS 13+) | ✅ Yes | Added in Safari 16 |
| **Safari iOS (iPhone/iPad)** | ⚠️ Partial | iOS 16.4+ only, **must install PWA to home screen first** |
| Samsung Internet | ✅ Yes | Android Samsung devices |
| Opera | ✅ Yes | Chromium-based |

### iOS Important Note for Interview:
> On iPhone/iPad, push notifications in PWA only work if:
> 1. iOS version is 16.4 or higher
> 2. The user has **installed the PWA** to their home screen (not just visiting in Safari)
>
> If they're browsing in Safari without installing, `pushManager` is undefined on iOS.

### How to handle iOS gracefully:
```js
if (!('PushManager' in window)) {
  // iOS Safari without PWA install, or very old browser
  showMessage("Please install FinSense to your home screen first to enable notifications");
}
```

---

## 14. Environment Variables Needed

Add these to `.env` and `.env.sample`:

```env
# Push Notifications (VAPID Keys — generate once with: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=your_public_vapid_key_here
VAPID_PRIVATE_KEY=your_private_vapid_key_here
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_vapid_key_here
VAPID_EMAIL=mailto:admin@finsense.com
```

> `NEXT_PUBLIC_VAPID_PUBLIC_KEY` must have the `NEXT_PUBLIC_` prefix.
> Next.js only exposes env variables to the browser if they start with `NEXT_PUBLIC_`.

---

## 15. Testing Push Notifications

### Test 1: Check Permission State
```js
// In browser console on your PWA:
console.log(Notification.permission); // should be "granted"
```

### Test 2: Test Subscription
```js
// In browser console:
const reg = await navigator.serviceWorker.ready;
const sub = await reg.pushManager.getSubscription();
console.log(sub); // should show endpoint + keys
```

### Test 3: Send Test Notification (via API)
After implementation, call:
```bash
curl -X POST https://your-domain.com/api/push/send-test \
  -H "Authorization: Bearer YOUR_TOKEN"
```
You should receive a notification immediately.

### Test 4: Test Reminder Cron
1. Set your `reminderTime` to 2 minutes from now
2. Watch the server logs
3. At that minute, you should receive the notification

### Test 5: Offline Notification
1. Receive a push while network is off
2. Push still arrives (delivered via Push Service before you went offline)

---

## 16. Common Errors & Fixes

### ❌ `pushManager is undefined`
**Cause:** Service Worker not registered, or browser doesn't support Push API
**Fix:** Check if running in HTTPS + installed PWA. In dev, SW is disabled.

### ❌ `DOMException: Registration failed - permission denied`
**Cause:** User previously denied notifications
**Fix:** Show message to go to browser Settings → Notifications → Allow FinSense

### ❌ `WebPush Error: 410 Gone`
**Cause:** The subscription has expired or the user uninstalled the app
**Fix:** On 410 error, delete that subscription from MongoDB:
```js
if (error.statusCode === 410) {
  await User.updateOne({ _id: userId }, { $unset: { pushSubscription: "" } });
}
```

### ❌ Notification not showing even though push was sent
**Cause:** Service Worker push handler code is missing or has an error
**Fix:** Check browser DevTools → Application → Service Workers → push logs

### ❌ Cron job fires but wrong timezone
**Cause:** Server running in UTC but not converting to user's timezone
**Fix:** Always use `Intl.DateTimeFormat` with the user's stored timezone to compare times

### ❌ `NEXT_PUBLIC_VAPID_PUBLIC_KEY is undefined` on frontend
**Cause:** Missing `NEXT_PUBLIC_` prefix or not in `.env`
**Fix:** Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value as `VAPID_PUBLIC_KEY`) to `.env`
and restart the dev server

---

## 17. Interview Notes

| Question | Answer |
|---|---|
| How do PWA push notifications work? | Server → VAPID-signed push → Push Service (Google/Mozilla) → Service Worker → `showNotification()` |
| What is VAPID? | Cryptographic key pair that authenticates your server with the push service |
| What is a PushSubscription? | Unique object per user+device containing endpoint URL + encryption keys |
| Where do you store subscriptions? | MongoDB, per user (or array for multi-device) |
| What fires when a push arrives? | `push` event on the Service Worker |
| What fires when user taps notification? | `notificationclick` event on the Service Worker |
| What library sends push from Node.js? | `web-push` npm package |
| How do you schedule notifications? | Cron job on server using `node-cron` — checks every minute |
| Why PWA-only notifications? | Service Workers (required for push) only run in PWA/HTTPS context |
| Does push work when app is closed? | Yes — Service Worker runs in background |
| iOS limitation? | iPhone users must install PWA to home screen first (iOS 16.4+) |
| What if subscription expires? | Handle `410 Gone` error from web-push → delete expired subscription from DB |
| What is `userVisibleOnly: true`? | Promise to the browser that every push will show a visible notification (no silent pushes) |

---

## Summary: What We'll Build

```
✅ User enables notifications → subscription saved in MongoDB
✅ User sets reminder time in Profile (e.g., 9:30 PM)
✅ User sets their timezone (auto-detected from browser)
✅ Cron job runs every minute → matches users whose reminder time has come
✅ Server sends push via web-push → user's device shows notification
✅ User taps notification → opens /dashboard/addexpense
✅ Only works in installed PWA (graceful fallback message for regular browser)
✅ iOS users shown "Add to Home Screen" instructions first
```

---

*Created for FinSense — Next.js 15 + @ducanh2912/next-pwa + web-push + node-cron*
