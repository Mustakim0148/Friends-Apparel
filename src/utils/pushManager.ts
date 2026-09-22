// Web Push Notification Helper for Friends Apparel (Background notifications when app is closed)

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
    // 2. Fetch VAPID Public Key from server
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) {
      throw new Error('Failed to retrieve push server key');
    }
    const { publicKey } = await res.json();
    if (!publicKey) {
      throw new Error('Push public key not provided');
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

    // 4. Send subscription data to server
    const subJSON = subscription.toJSON();
    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: subJSON.keys,
        userAgent: navigator.userAgent,
      }),
    });

    if (!saveRes.ok) {
      throw new Error('Failed to save subscription on server');
    }

    localStorage.setItem('friends_apparel_bg_push_enabled', 'true');
    return {
      success: true,
      message: 'ব্যাকগ্রাউন্ড নোটিফিকেশন সফলভাবে চালু করা হয়েছে! অ্যাপ বন্ধ থাকলেও নোটিফিকেশন আসবে।',
    };
  } catch (err: any) {
    console.error('Subscription error:', err);
    return {
      success: false,
      message: err.message || 'সাবস্ক্রিপশন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।',
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
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }
    localStorage.removeItem('friends_apparel_bg_push_enabled');
    return true;
  } catch (err) {
    console.warn('Unsubscribe error:', err);
    return false;
  }
}

export async function triggerTestPushNotification(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: 'টেস্ট নোটিফিকেশন পাঠানো হয়েছে! ৩-৫ সেকেন্ডের মধ্যে আপনার ডিভাইসে নোটিফিকেশন দেখতে পাবেন।',
      };
    }
    throw new Error(data.error || 'Test notification failed');
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'টেস্ট নোটিফিকেশন পাঠানো যায়নি।',
    };
  }
}
