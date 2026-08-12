"use client";
import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { THEME_META } from "@/lib/theme";

function MapContent({ locations, filteredData, selectedKey, onSelect, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([4.6, -74.2], 6);
    }
  }, [bounds, map]);

  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [map]);
  const temasByLocation = useMemo(() => {
    const map = new Map();
    for (const item of filteredData) {
      const key = `${item.entidad}__${item.lat.toFixed(3)}__${item.lng.toFixed(3)}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      if (!map.get(key).includes(item.tema)) {
        map.get(key).push(item.tema);
      }
    }
    return map;
  }, [filteredData]);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {locations.map((loc) => {
        const temas = temasByLocation.get(loc.key) || [];
        const primaryTema = temas[0] || "naturaleza";
        const meta = THEME_META[primaryTema];
        const radius = Math.min(6 + Math.sqrt(loc.count) * 2.2, 34);
        const isSelected = loc.key === selectedKey;
        return (
          <CircleMarker
            key={loc.key}
            center={[loc.lat, loc.lng]}
            radius={radius}
            pathOptions={{
              color: isSelected ? "#0b2540" : meta.ring,
              weight: isSelected ? 3 : 1.5,
              fillColor: meta.color,
              fillOpacity: isSelected ? 0.75 : 0.55,
            }}
            eventHandlers={{
              click: () => onSelect(loc.key),
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={0.97}>
              <div className="font-sans text-xs">
                <div className="font-heading font-semibold text-navy-900">{loc.entidad}</div>
                <div className="text-slate-500">
                  {loc.count} producto{loc.count !== 1 ? "s" : ""}
                  {loc.precision === "aproximada" && " · ubicación aproximada"}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}

function MapLegend({ filteredData }) {
  const activeThemes = useMemo(() => {
    const present = new Set(filteredData.map((r) => r.tema));
    return Object.keys(THEME_META).filter((t) => present.has(t));
  }, [filteredData]);

  if (activeThemes.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] hidden sm:block">
      <div className="pointer-events-auto rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-3 shadow-lg shadow-slate-900/10 backdrop-blur-sm">
        <p className="font-heading text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Leyenda
        </p>
        <div className="mt-1.5 flex flex-col gap-1">
          {activeThemes.map((t) => {
            const m = THEME_META[t];
            return (
              <div key={t} className="flex items-center gap-2 text-xs text-navy-900">
                <span
                  className="h-2.5 w-2.5 rounded-full border"
                  style={{ background: m.color, borderColor: m.ring }}
                />
                {m.label}
              </div>
            );
          })}
        </div>
        <p className="mt-2 max-w-[10rem] border-t border-slate-100 pt-1.5 text-[10px] leading-snug text-slate-400">
          El tamaño del círculo indica la cantidad de productos.
        </p>
      </div>
    </div>
  );
}

export default function MapView({ locations, filteredData, selectedKey, onSelect, bounds }) {
  return (
    <div className="relative h-full w-full">
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
        <MapContent
          locations={locations}
          filteredData={filteredData}
          selectedKey={selectedKey}
          onSelect={onSelect}
          bounds={bounds}
        />
      </MapContainer>
      <MapLegend filteredData={filteredData} />
    </div>
  );
}
