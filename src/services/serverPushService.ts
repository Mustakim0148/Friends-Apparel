import webpush from 'web-push';
import fs from 'fs';
import path from 'path';

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  subscribedAt?: string;
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BPAyJMfM2IuueZ1edS2CzMFMMazJxas78OboCEcWzWJlK_c0p_PznsEtyaEYZdUfn_9oUBQ0xG3jR4MH40t2__8';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'JV6rejvb0rMtaAgC8ulZWrOkZG6viQrzPkYSUZjHXuk';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@friendsapparel.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), 'data', 'push-subscriptions.json');

// In-memory cache of subscriptions
let subscriptionsCache: PushSubscriptionData[] = [];

// Load persisted subscriptions from disk on startup
function loadSubscriptions(): PushSubscriptionData[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      subscriptionsCache = JSON.parse(data);
      return subscriptionsCache;
    }
  } catch (err) {
    console.warn('Error reading push subscriptions file:', err);
  }
  return subscriptionsCache;
}

// Save subscriptions to disk
function persistSubscriptions() {
  try {
    const dir = path.dirname(SUBSCRIPTIONS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptionsCache, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error saving push subscriptions file:', err);
  }
}

// Initial load
loadSubscriptions();

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export function addPushSubscription(sub: PushSubscriptionData): boolean {
  if (!sub || !sub.endpoint || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) {
    return false;
  }

  // Remove existing entry for same endpoint if any
  subscriptionsCache = subscriptionsCache.filter(s => s.endpoint !== sub.endpoint);
  subscriptionsCache.push({
    ...sub,
    subscribedAt: new Date().toISOString(),
  });

  persistSubscriptions();
  console.log(`[PushService] Added subscription. Total active: ${subscriptionsCache.length}`);
  return true;
}

export function removePushSubscription(endpoint: string): boolean {
  const initialLen = subscriptionsCache.length;
  subscriptionsCache = subscriptionsCache.filter(s => s.endpoint !== endpoint);
  if (subscriptionsCache.length !== initialLen) {
    persistSubscriptions();
    console.log(`[PushService] Removed subscription. Remaining active: ${subscriptionsCache.length}`);
    return true;
  }
  return false;
}

export function getSubscriptionsCount(): number {
  return subscriptionsCache.length;
}

export async function broadcastPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<{ total: number; sent: number; failed: number }> {
  loadSubscriptions();
  const subs = [...subscriptionsCache];
  let sent = 0;
  let failed = 0;
  const expiredEndpoints: string[] = [];

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/#admin',
    tag: payload.tag || 'general-alert',
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        message,
        {
          TTL: 86400, // 24 hours delivery guarantee
          urgency: 'high',
        }
      );
      sent++;
    } catch (err: any) {
      failed++;
      console.warn(`[PushService] Failed sending to endpoint (${err?.statusCode || err?.message})`);
      // If 404 or 410 (Gone), the subscription is no longer valid on device
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        expiredEndpoints.push(sub.endpoint);
      }
    }
  }

  // Clean up expired subscriptions
  if (expiredEndpoints.length > 0) {
    subscriptionsCache = subscriptionsCache.filter(s => !expiredEndpoints.includes(s.endpoint));
    persistSubscriptions();
    console.log(`[PushService] Cleaned up ${expiredEndpoints.length} expired subscriptions.`);
  }

  return { total: subs.length, sent, failed };
}
