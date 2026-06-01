import api from '../api/client';

/**
 * Helper to convert base64 url-safe VAPID public key to a Uint8Array
 * required by the browser's PushManager.subscribe() call.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if Push Notifications and Service Workers are supported by the browser.
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Returns current permission status ('granted', 'denied', or 'default')
 */
export function getPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Returns the current local subscription object, if one exists on the browser.
 */
export async function getActiveSubscription() {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.error('[Push Service] Error getting active subscription:', err);
    return null;
  }
}

/**
 * Prompts user for notification permission, creates a push subscription,
 * and synchronizes the subscription details with the backend database.
 */
export async function subscribeUser() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this browser or device.');
  }

  // 1. Request notifications permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was denied by the user.');
  }

  // 2. Access active service worker registration
  const registration = await navigator.serviceWorker.ready;
  if (!registration) {
    throw new Error('Active Service Worker registration not found.');
  }

  // 3. Check if subscription already exists
  let subscription = await registration.pushManager.getSubscription();

  // 4. If not registered, create new push subscription
  if (!subscription) {
    // Fetch base64url VAPID public key from backend
    const response = await api.get('achievements/push/public-key');
    const publicKey = response.public_key;
    if (!publicKey) {
      throw new Error('VAPID public key not found or returned empty by backend.');
    }

    // Convert standard base64url VAPID key to Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);

    // Subscribe via browser PushManager
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });
  }

  // 5. POST subscription details to backend (endpoint + p256dh + auth keys)
  const subJson = subscription.toJSON();
  await api.post('achievements/push/subscribe', subJson);

  return subscription;
}

/**
 * Deletes push subscription on browser and informs the backend to remove registration details.
 */
export async function unsubscribeUser() {
  if (!isPushSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;

      // Unsubscribe locally in the browser
      await subscription.unsubscribe();

      // Delete subscription record from backend database
      await api.post('achievements/push/unsubscribe', { endpoint });
    }
  } catch (err) {
    console.error('[Push Service] Error during unsubscribe:', err);
    throw err;
  }
}

/**
 * Completely resets, unregisters, and purges all active service workers on this domain.
 * This is a critical debugging utility to clear corrupt browser push service states on localhost.
 */
export async function resetPushService() {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('[Push Service] Unregistered service worker:', reg.active?.scriptURL);
      }
      return true;
    } catch (err) {
      console.error('[Push Service] Failed to unregister service workers:', err);
      return false;
    }
  }
  return false;
}
