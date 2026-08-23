import { openGoogleMapsApp } from '~/lib/maps'

export function GoogleMapsButton({
  lat,
  lng,
  label,
}: {
  lat: number
  lng: number
  label?: string
}) {
  return (
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`}
      onClick={(e) => {
        e.preventDefault()
        openGoogleMapsApp(lat, lng, label)
      }}
      className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-cyan-500 active:scale-[0.98]"
    >
      <span>In Google Maps öffnen</span>
    </a>
  )
}
