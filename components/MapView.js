"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { THEME_META } from "@/lib/theme";

export default function MapView({ locations, activeTema, selectedKey, onSelect }) {
  return (
    <MapContainer
      center={[4.6, -74.2]}
      zoom={6}
      minZoom={5}
      maxBounds={[
        [-5.5, -84],
        [16, -60],
      ]}
      className="h-full w-full"
      preferCanvas
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {locations.map((loc) => {
        const meta = THEME_META[activeTema];
        const radius = Math.min(6 + Math.sqrt(loc.count) * 2.2, 34);
        const isSelected = loc.key === selectedKey;
        return (
          <CircleMarker
            key={loc.key}
            center={[loc.lat, loc.lng]}
            radius={radius}
            pathOptions={{
              color: isSelected ? "#0f172a" : meta.ring,
              weight: isSelected ? 3 : 1.5,
              fillColor: meta.color,
              fillOpacity: 0.55,
            }}
            eventHandlers={{
              click: () => onSelect(loc.key),
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
              <div className="text-xs">
                <div className="font-semibold">{loc.entidad}</div>
                <div className="text-slate-500">
                  {loc.count} producto{loc.count !== 1 ? "s" : ""}
                  {loc.precision === "aproximada" && " · ubicación aproximada"}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
