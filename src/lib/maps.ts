/** Google Maps deep-link helpers (app first, web fallback) */

export function googleMapsWebUrl(lat: number, lng: number, label?: string) {
  const dest = label
    ? encodeURIComponent(`${label}@${lat},${lng}`)
    : `${lat},${lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving&dir_action=navigate`
}

export function openGoogleMapsApp(lat: number, lng: number, label?: string) {
  const web = googleMapsWebUrl(lat, lng, label)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isAndroid = /Android/i.test(navigator.userAgent)

  if (isIOS) {
    // Try Google Maps app scheme, fall back to web
    const appUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`
    window.location.href = appUrl
    setTimeout(() => {
      window.location.href = web
    }, 800)
    return
  }

  if (isAndroid) {
    const intent = `intent://maps.google.com/maps?daddr=${lat},${lng}&directionsmode=driving#Intent;scheme=https;package=com.google.android.apps.maps;end`
    window.location.href = intent
    setTimeout(() => {
      window.location.href = web
    }, 800)
    return
  }

  window.location.href = web
}
