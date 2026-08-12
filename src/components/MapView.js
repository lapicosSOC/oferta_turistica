"use client";
import { useMemo, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import { THEME_META } from "@/lib/theme";

const radiusFor = (count) => Math.min(6 + Math.sqrt(count) * 2.2, 34);

// Encuadre por defecto ceñido a donde vive el inventario (lat 1.1–12.6,
// lng -79–-67.5), no a los límites políticos: así el país llena el marco en
// lugar de dejar océano vacío. San Andrés queda fuera del encuadre inicial —son
// 3 registros— pero se alcanza filtrando por ese departamento o desplazando.
const COLOMBIA_BOUNDS = [
  [0.8, -79.4],
  [13.0, -67.2],
];

// Los topónimos van en un panel propio por encima de los círculos (z-index 450,
// entre overlayPane y markerPane) para que no queden tapados por los datos.
// Los topónimos se dibujan en `markerPane` (z-index 600), que Leaflet ya crea
// por defecto y queda por encima del canvas de los círculos (overlayPane, 400)
// y por debajo de los tooltips (650). Así los nombres de ciudad no quedan
// sepultados bajo los datos, sin necesidad de registrar un panel propio.
// `pointer-events: none` (ver globals.css) deja pasar el clic a los marcadores.
function LabelsLayer() {
  return (
    <TileLayer
      pane="markerPane"
      className="mapa-etiquetas"
      url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
    />
  );
}

function MapContent({ locations, filteredData, selectedKey, onSelect, bounds, resetToken }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds || COLOMBIA_BOUNDS, { padding: [50, 50] });
  }, [bounds, resetToken, map]);

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

  const selected = locations.find((l) => l.key === selectedKey);

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />
      {locations.map((loc) => {
        const temas = temasByLocation.get(loc.key) || [];
        const primaryTema = temas[0] || "naturaleza";
        const meta = THEME_META[primaryTema];
        const radius = radiusFor(loc.count);
        const isSelected = loc.key === selectedKey;
        return (
          <CircleMarker
            key={loc.key}
            center={[loc.lat, loc.lng]}
            radius={radius}
            pathOptions={{
              color: isSelected ? "#0b2540" : meta.ring,
              weight: isSelected ? 2.5 : 1.5,
              fillColor: meta.color,
              fillOpacity: isSelected ? 0.8 : 0.55,
            }}
            eventHandlers={{
              click: () => onSelect(loc.key),
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
              <div className="font-sans">
                <div className="font-heading text-xs font-semibold text-navy-900">{loc.entidad}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {loc.count.toLocaleString("es-CO")} producto{loc.count !== 1 ? "s" : ""}
                  {loc.precision === "aproximada" && " · ubicación aproximada"}
                </div>
                <div className="mt-1 flex gap-1.5">
                  {temas.map((t) => (
                    <span key={t} className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: THEME_META[t].color }}
                      />
                      {THEME_META[t].label}
                    </span>
                  ))}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {/* Anillo de selección: se dibuja al final para que quede sobre los demás
          puntos, sin relleno para no tapar el marcador que señala. */}
      {selected && (
        <CircleMarker
          center={[selected.lat, selected.lng]}
          radius={radiusFor(selected.count) + 9}
          interactive={false}
          pathOptions={{ color: "#0b2540", weight: 1.5, opacity: 0.55, fill: false }}
        />
      )}

      <LabelsLayer />
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
    <div className="pointer-events-none absolute bottom-5 left-5 z-[1000] hidden lg:block">
      <div className="pointer-events-auto rounded-xl border border-slate-200/70 bg-white/95 px-4 py-3 shadow-xl shadow-navy-900/10 backdrop-blur-sm">
        <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Leyenda
        </p>

        <div className="mt-2 flex flex-col gap-1.5">
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

        <div className="mt-3 border-t border-slate-100 pt-2.5">
          {/* Escala de tamaño a media escala real: los radios guardan la misma
              proporción que los círculos del mapa. */}
          <svg viewBox="0 0 104 42" className="h-[42px] w-[104px]" role="img" aria-label="Escala de tamaño">
            {[
              { n: 1, cx: 11 },
              { n: 25, cx: 39 },
              { n: 100, cx: 76 },
            ].map(({ n, cx }) => (
              <g key={n}>
                <circle
                  cx={cx}
                  cy={17}
                  r={radiusFor(n) / 2}
                  fill="#0b2540"
                  fillOpacity="0.07"
                  stroke="#94a3b8"
                  strokeWidth="1"
                />
                <text x={cx} y={38} textAnchor="middle" fontSize="9" fill="#94a3b8">
                  {n}
                </text>
              </g>
            ))}
          </svg>
          <p className="text-[10px] leading-snug text-slate-400">Productos por ubicación</p>
        </div>
      </div>
    </div>
  );
}

export default function MapView({ locations, filteredData, selectedKey, onSelect, bounds, resetToken }) {
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
          resetToken={resetToken}
        />
      </MapContainer>
      <MapLegend filteredData={filteredData} />
    </div>
  );
}
