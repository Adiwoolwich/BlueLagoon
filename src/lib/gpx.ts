import { hasPreciseCoords, type Station } from "./stations";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function waypoint(station: Station): string {
  const desc = [station.address, `${station.postalCode} ${station.city}`.trim()]
    .filter(Boolean)
    .join(", ");
  return `  <wpt lat="${station.lat}" lon="${station.lng}">
    <name>${escapeXml(station.name)}</name>
    <desc>${escapeXml(desc)}</desc>
    <type>Entsorgungsstation</type>
  </wpt>`;
}

export function stationsToGpx(stations: Station[]): string {
  const wpts = stations.filter(hasPreciseCoords).map(waypoint).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Blue Lagune" xmlns="http://www.topografix.com/GPX/1/1">
${wpts}
</gpx>
`;
}

export function downloadGpx(stations: Station[], filename = "blue-lagune.gpx") {
  const list = stations.filter(hasPreciseCoords);
  if (list.length === 0) return false;
  const blob = new Blob([stationsToGpx(list)], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

export function downloadStationGpx(station: Station): boolean {
  return downloadGpx([station], `${station.id}.gpx`);
}
