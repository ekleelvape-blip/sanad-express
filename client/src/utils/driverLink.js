let cachedNetworkInfo = null;

export async function fetchNetworkInfo() {
  if (cachedNetworkInfo) return cachedNetworkInfo;
  try {
    const res = await fetch('/api/network-info');
    if (res.ok) {
      cachedNetworkInfo = await res.json();
      return cachedNetworkInfo;
    }
  } catch (e) {}
  return null;
}

export function getCachedNetworkInfo() {
  return cachedNetworkInfo;
}

export function getDriverAppUrl(networkInfo) {
  const info = networkInfo || cachedNetworkInfo;
  if (info?.bestDriverUrl) {
    return info.bestDriverUrl;
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return window.location.origin + '/driver';
    }
    return 'https://trans-meetings-billing-everything.trycloudflare.com/driver';
  }
  return '/driver';
}
