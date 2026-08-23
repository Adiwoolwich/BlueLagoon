import { useEffect, useMemo } from "react";
import {
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
}: {
  selected?: Station;
  userPos: { lat: number; lng: number } | null;
  place: { lat: number; lng: number } | null;
  sheet: "peek" | "mid" | "full";
}) {
  const map = useMap();

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
    if (place) {
      map.setView([place.lat, place.lng], 9);
      return;
    }
    if (userPos) {
      map.setView([userPos.lat, userPos.lng], 9);
    }
  }, [userPos, place, selected, map]);
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
  const selected = stations.find((s) => s.id === selectedId);
  const place = findCity(placeName) ?? null;

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
      <MapFly selected={selected} userPos={userPos} place={place} sheet={sheet} />
      <MapClickPeek />
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
