import { useEffect, useMemo } from "react";
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { deriveStatus, findCity, GERMANY_CENTER, type Station } from "@/lib/stations";
import { useAppStore } from "@/lib/store";
import { STATUS_COLOR } from "./status-badge";

function pinIcon(color: string, selected: boolean) {
  return L.divIcon({
    className: `bl-marker${selected ? " is-selected" : ""}`,
    html: `<span class="bl-marker-dot" style="background:${color};--pin:${color}"></span>`,
    iconSize: selected ? [28, 28] : [22, 22],
    iconAnchor: selected ? [14, 14] : [11, 11],
  });
}

function MapFly({
  selected,
  userPos,
  place,
  sheet,
  stations,
  radiusKm,
}: {
  selected?: Station;
  userPos: { lat: number; lng: number } | null;
  place: { lat: number; lng: number } | null;
  sheet: "peek" | "mid" | "full";
  stations: Station[];
  radiusKm: number;
}) {
  const map = useMap();
  const stationKey = stations.map((s) => s.id).join(",");

  useEffect(() => {
    map.invalidateSize();
  }, [sheet, map]);

  useEffect(() => {
    if (!selected) return;
    const zoom = Math.max(map.getZoom(), 11);
    map.flyTo([selected.lat, selected.lng], zoom, { duration: 0.55 });
    const shift = () => {
      if (window.innerWidth >= 768) return;
      const fraction = sheet === "full" ? 0.32 : sheet === "mid" ? 0.22 : 0.1;
      map.panBy([0, map.getSize().y * fraction], { animate: true, duration: 0.35 });
    };
    map.once("moveend", shift);
    return () => {
      map.off("moveend", shift);
    };
  }, [selected, map, sheet]);

  useEffect(() => {
    if (selected) return;
    const origin = place ?? userPos;
    const padBottom = window.innerWidth < 768 ? (sheet === "full" ? 280 : sheet === "mid" ? 200 : 110) : 48;
    const fit = (bounds: L.LatLngBoundsExpression) => {
      map.fitBounds(bounds, {
        paddingTopLeft: [36, 72],
        paddingBottomRight: [36, padBottom],
        maxZoom: 13,
        animate: true,
        duration: 0.55,
      });
    };
    if (stations.length >= 2) {
      const b = L.latLngBounds(stations.map((s) => [s.lat, s.lng] as [number, number]));
      if (origin) b.extend([origin.lat, origin.lng]);
      fit(b);
      return;
    }
    if (stations.length === 1) {
      const s = stations[0]!;
      const b = L.latLngBounds([[s.lat, s.lng], [s.lat, s.lng]]);
      if (origin) b.extend([origin.lat, origin.lng]);
      b.extend([s.lat + 0.01, s.lng + 0.01]);
      b.extend([s.lat - 0.01, s.lng - 0.01]);
      fit(b);
      return;
    }
    if (!origin) return;
    const km = radiusKm > 0 ? radiusKm : 8;
    const dLat = km / 111;
    const dLng = km / (111 * Math.max(0.2, Math.cos((origin.lat * Math.PI) / 180)));
    fit([
      [origin.lat - dLat, origin.lng - dLng],
      [origin.lat + dLat, origin.lng + dLng],
    ]);
  }, [userPos, place, selected, map, sheet, stationKey, radiusKm, stations]);
  return null;
}

function MapClickPeek() {
  const map = useMap();
  const select = useAppStore((s) => s.select);
  const setSheet = useAppStore((s) => s.setSheet);
  const setPanel = useAppStore((s) => s.setPanel);
  useEffect(() => {
    const onClick = (e: L.LeafletMouseEvent) => {
      const t = e.originalEvent?.target as HTMLElement | undefined;
      if (t?.closest(".leaflet-marker-icon, .bl-marker")) return;
      select(null);
      setPanel("list");
      if (window.innerWidth < 768) setSheet("peek");
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map, select, setSheet, setPanel]);
  return null;
}

export function StationMap({ stations }: { stations: Station[] }) {
  const selectedId = useAppStore((s) => s.selectedId);
  const select = useAppStore((s) => s.select);
  const reports = useAppStore((s) => s.reports);
  const userPos = useAppStore((s) => s.userPos);
  const route = useAppStore((s) => s.route);
  const sheet = useAppStore((s) => s.sheet);
  const placeName = useAppStore((s) => s.filters.place);
  const query = useAppStore((s) => s.query);
  const radiusKm = useAppStore((s) => s.filters.radiusKm);
  const selected = stations.find((s) => s.id === selectedId);
  const place = findCity(placeName) ?? findCity(query) ?? null;
  const searchOrigin = place ?? userPos;

  const routeLine = useMemo(() => {
    if (!route) return null;
    const a = findCity(route.from);
    const b = findCity(route.to);
    if (!a || !b) return null;
    return [
      [a.lat, a.lng] as [number, number],
      [b.lat, b.lng] as [number, number],
    ];
  }, [route]);

  return (
    <MapContainer
      center={[GERMANY_CENTER.lat, GERMANY_CENTER.lng]}
      zoom={6}
      className="h-full w-full"
      zoomControl={false}
      attributionControl
    >
      <ZoomControl position="topright" />
      <TileLayer
        attribution="&copy; OSM &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <MapFly
        selected={selected}
        userPos={userPos}
        place={place}
        sheet={sheet}
        stations={stations}
        radiusKm={radiusKm}
      />
      <MapClickPeek />
      {searchOrigin && radiusKm > 0 ? (
        <Circle
          center={[searchOrigin.lat, searchOrigin.lng]}
          radius={radiusKm * 1000}
          pathOptions={{ color: "#3ecfc0", weight: 1, opacity: 0.45, fillColor: "#3ecfc0", fillOpacity: 0.07 }}
        />
      ) : null}
      {routeLine ? (
        <Polyline
          positions={routeLine}
          pathOptions={{ color: "#3ecfc0", weight: 3, opacity: 0.7 }}
        />
      ) : null}
      {userPos ? (
        <CircleMarker
          center={[userPos.lat, userPos.lng]}
          radius={8}
          pathOptions={{
            color: "#e8f4f2",
            fillColor: "#2bb8a8",
            fillOpacity: 1,
            weight: 2,
          }}
        />
      ) : null}
      {stations.map((s) => {
        const status = deriveStatus(s, reports[s.id]);
        const color = STATUS_COLOR[status];
        return (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={pinIcon(color, s.id === selectedId)}
            eventHandlers={{
              click: (e) => {
                if (e.originalEvent) L.DomEvent.stopPropagation(e.originalEvent);
                select(s.id);
              },
            }}
            zIndexOffset={s.id === selectedId ? 1000 : 0}
          />
        );
      })}
      {routeLine
        ? [findCity(route?.from ?? ""), findCity(route?.to ?? "")].filter(Boolean).map((c) => (
            <CircleMarker
              key={c!.name}
              center={[c!.lat, c!.lng]}
              radius={6}
              pathOptions={{ color: "#e8f4f2", fillColor: "#7eb6ff", fillOpacity: 1 }}
            />
          ))
        : null}
    </MapContainer>
  );
}
