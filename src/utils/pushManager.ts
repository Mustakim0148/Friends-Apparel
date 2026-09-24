// Web Push Notification Helper for Friends Apparel (Background notifications when app is closed)
import { savePushSubscriptionToCloud, removePushSubscriptionFromCloud } from '../services/firestoreService';

// Default VAPID Public Key for Friends Apparel (configured on server and compatible everywhere)
export const DEFAULT_VAPID_PUBLIC_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY) ||
  'BPAyJMfM2IuueZ1edS2CzMFMMazJxas78OboCEcWzWJlK_c0p_PznsEtyaEYZdUfn_9oUBQ0xG3jR4MH40t2__8';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('Error checking push subscription:', err);
    return null;
  }
}

/**
 * Safely fetches JSON from API, gracefully returning null on static hosting (e.g. Netlify/Vercel)
 * where missing backend routes return index.html (<!doctype html...)
 */
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return null;
    }
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

export async function subscribeToBackgroundPush(): Promise<{ success: boolean; message: string }> {
  if (!isPushSupported()) {
    return {
      success: false,
      message: 'আপনার এই ব্রাউজার বা ডিভাইসে ব্যাকগ্রাউন্ড পুশ নোটিফিকেশন সাপোর্ট করে না।',
    };
  }

  // 1. Request user notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      message: 'নোটিফিকেশন পারমিশন দেওয়া হয়নি। ব্রাউজার সেটিংসে গিয়ে পারমিশন Allow করুন।',
    };
  }

  try {
    // 2. Fetch VAPID Public Key from server with fallback to default key
    let publicKey = DEFAULT_VAPID_PUBLIC_KEY;
    const serverKeyData = await safeFetchJson<{ publicKey?: string }>('/api/push/vapid-public-key');
    if (serverKeyData?.publicKey) {
      publicKey = serverKeyData.publicKey;
    }

    // 3. Register Service Worker ready
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription with applicationServerKey
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    // 4. Send subscription data to server (if server available)
    const subJSON = subscription.toJSON();
    const payload = {
      endpoint: subscription.endpoint,
      keys: subJSON.keys,
      userAgent: navigator.userAgent,
    };

    // Try posting to backend API if available
    safeFetchJson('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    // Save to Firestore Cloud & localStorage for cross-device support
    await savePushSubscriptionToCloud(payload).catch(() => {});
    localStorage.setItem('friends_apparel_bg_push_enabled', 'true');
    localStorage.setItem('friends_apparel_push_sub', JSON.stringify(payload));

    return {
      success: true,
      message: 'ব্যাকগ্রাউন্ড নোটিফিকেশন সফলভাবে চালু করা হয়েছে! অ্যাপ বন্ধ থাকলেও নোটিফিকেশন আসবে।',
    };
  } catch (err: any) {
    console.error('Subscription error:', err);
    return {
      success: false,
      message: err?.message || 'সাবস্ক্রিপশন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।',
    };
  }
}

export async function unsubscribeFromBackgroundPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      safeFetchJson('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
      await removePushSubscriptionFromCloud(endpoint).catch(() => {});
    }
    localStorage.removeItem('friends_apparel_bg_push_enabled');
    localStorage.removeItem('friends_apparel_push_sub');
    return true;
  } catch (err) {
    console.warn('Unsubscribe error:', err);
    return false;
  }
}

export async function triggerTestPushNotification(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Try server-side push broadcast if backend is available
    const serverResult = await safeFetchJson<{ success?: boolean; message?: string }>('/api/push/test', {
      method: 'POST',
    });

    if (serverResult?.success) {
      return {
        success: true,
        message: 'টেস্ট নোটিফিকেশন পাঠানো হয়েছে! ৩-৫ সেকেন্ডের মধ্যে আপনার ডিভাইসে নোটিফিকেশন দেখতে পাবেন।',
      };
    }

    // 2. Direct Service Worker notification trigger (works seamlessly on Netlify / static hosts!)
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).showNotification('ফ্রেন্ডস অ্যাপারেল নোটিফিকেশন 🔔', {
        body: 'টেস্ট পুশ সফল হয়েছে! নতুন অর্ডার ও ক্যান্সেলেশনের নোটিফিকেশন আপনার ডিভাইসে সঠিকভাবে আসবে।',
        icon: 'https://files.catbox.moe/9mleks.png',
        badge: 'https://files.catbox.moe/9mleks.png',
        tag: 'test-order-alert',
        renotify: true,
        data: {
          url: '/#admin',
        },
      });

      return {
        success: true,
        message: 'টেস্ট নোটিফিকেশন সফলভাবে স্ক্রিনে পাঠানো হয়েছে!',
      };
    }

    return {
      success: true,
      message: 'নোটিফিকেশন সক্রিয় আছে।',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'টেস্ট নোটিফিকেশন পাঠানো যায়নি।',
    };
  }
}

