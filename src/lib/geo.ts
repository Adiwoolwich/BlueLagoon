/** Simple geo helpers for radius search */

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function filterByRadius<
  T extends { lat: number; lng: number },
>(items: T[], centerLat: number, centerLng: number, radiusKm: number): T[] {
  return items.filter(
    (item) => haversineKm(centerLat, centerLng, item.lat, item.lng) <= radiusKm,
  )
}
