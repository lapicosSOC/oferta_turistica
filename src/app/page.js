"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ProductCard from "@/components/ProductCard";
import { THEME_META } from "@/lib/theme";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
      Cargando mapa…
    </div>
  ),
});

const TEMAS = ["naturaleza", "cultura", "gastronomico"];

export default function Home() {
  const [data, setData] = useState(null);
  const [temasFiltro, setTemasFiltro] = useState(TEMAS);
  const [search, setSearch] = useState("");
  const [soloValidados, setSoloValidados] = useState(false);
  const [departamentoFiltro, setDepartamentoFiltro] = useState("Todos");
  const [municipioFiltro, setMunicipioFiltro] = useState("Todos");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [tipologiaFiltro, setTipologiaFiltro] = useState("Todos");
  const [selectedKey, setSelectedKey] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);

  useEffect(() => {
    fetch("/data/data.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, []);

  const toggleTema = (t) => {
    setTemasFiltro((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const restablecerFiltros = () => {
    setTemasFiltro(TEMAS);
    setSearch("");
    setSoloValidados(false);
    setDepartamentoFiltro("Todos");
    setMunicipioFiltro("Todos");
    setTipoFiltro("Todos");
    setTipologiaFiltro("Todos");
    setSelectedKey(null);
    setMapBounds(null);
  };

  const filteredByTema = useMemo(() => {
    if (!data) return [];
    let rows = data.filter((r) => temasFiltro.includes(r.tema) && r.lat != null && r.lng != null);
    if (soloValidados) rows = rows.filter((r) => r.validado);
    if (departamentoFiltro !== "Todos") rows = rows.filter((r) => r.departamento === departamentoFiltro);
    if (municipioFiltro !== "Todos") rows = rows.filter((r) => r.entidad === municipioFiltro);
    if (tipoFiltro !== "Todos") rows = rows.filter((r) => r.tipo === tipoFiltro);
    if (tipologiaFiltro !== "Todos") rows = rows.filter((r) => (r.tipologia_propuesta || r.tipologia) === tipologiaFiltro);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          String(r.producto_corregido || r.producto || "").toLowerCase().includes(q) ||
          String(r.entidad || "").toLowerCase().includes(q) ||
          String(r.tipologia_propuesta || r.tipologia || "").toLowerCase().includes(q)
      );
    }
    return rows;
  }, [data, temasFiltro, soloValidados, departamentoFiltro, municipioFiltro, tipoFiltro, tipologiaFiltro, search]);

  const locations = useMemo(() => {
    const map = new Map();
    for (const r of filteredByTema) {
      const key = `${r.entidad}__${r.lat.toFixed(3)}__${r.lng.toFixed(3)}`;
      if (!map.has(key)) {
        map.set(key, { key, entidad: r.entidad, lat: r.lat, lng: r.lng, precision: r.precision, count: 0 });
      }
      map.get(key).count += 1;
    }
    return Array.from(map.values());
  }, [filteredByTema]);

  const cards = useMemo(() => {
    if (selectedKey) {
      return filteredByTema.filter((r) => {
        const key = `${r.entidad}__${r.lat.toFixed(3)}__${r.lng.toFixed(3)}`;
        return key === selectedKey;
      });
    }
    return filteredByTema.slice(0, 60);
  }, [filteredByTema, selectedKey]);

  const selectedLocation = locations.find((l) => l.key === selectedKey);

  const departamentos = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map((r) => r.departamento))].filter(Boolean).sort();
  }, [data]);

  const municipios = useMemo(() => {
    if (!data) return [];
    if (departamentoFiltro === "Todos") return [];
    const municipiosDelDepto = [...new Set(data
      .filter((r) => r.departamento === departamentoFiltro)
      .map((r) => r.entidad))].filter(Boolean).sort();
    return municipiosDelDepto;
  }, [data, departamentoFiltro]);

  const tipos = useMemo(() => {
    if (!filteredByTema.length) return [];
    return [...new Set(filteredByTema.map((r) => r.tipo))].filter(Boolean).sort();
  }, [filteredByTema]);

  const tipologias = useMemo(() => {
    if (!filteredByTema.length) return [];
    let datos = filteredByTema;
    if (tipoFiltro !== "Todos") {
      datos = datos.filter((r) => r.tipo === tipoFiltro);
    }
    return [...new Set(datos.map((r) => r.tipologia_propuesta || r.tipologia))].filter(Boolean).sort();
  }, [filteredByTema, tipoFiltro]);

  useEffect(() => {
    if (departamentoFiltro !== "Todos" && data) {
      const deptoData = data.filter((r) => r.departamento === departamentoFiltro);
      if (deptoData.length > 0) {
        const lats = deptoData.map((r) => r.lat);
        const lngs = deptoData.map((r) => r.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        setMapBounds([[minLat - 0.2, minLng - 0.2], [maxLat + 0.2, maxLng + 0.2]]);
      }
    } else {
      setMapBounds(null);
    }
    setMunicipioFiltro("Todos");
  }, [departamentoFiltro, data]);

  useEffect(() => {
    if (municipioFiltro !== "Todos" && data) {
      const municipioData = data.filter((r) => r.entidad === municipioFiltro);
      if (municipioData.length > 0) {
        const lats = municipioData.map((r) => r.lat);
        const lngs = municipioData.map((r) => r.lng);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const padding = Math.max(maxLat - minLat, maxLng - minLng) * 0.8;
        setMapBounds([[minLat - padding, minLng - padding], [maxLat + padding, maxLng + padding]]);
      }
    }
  }, [municipioFiltro, data]);

  useEffect(() => {
    setTipologiaFiltro("Todos");
  }, [tipoFiltro]);

  return (
    <div className="h-full flex flex-col">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              ICTRC 2026 · Mapa de oferta turística
            </h1>
            <p className="text-xs text-slate-500">
              Inventario de Colombia por Naturaleza, Cultura y Gastronómico · Atlántico validado con
              detalle · resto del país como reporte preliminar
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {TEMAS.map((t) => {
                const m = THEME_META[t];
                const active = temasFiltro.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTema(t)}
                    className={`rounded px-2 py-1.5 text-sm font-medium transition-colors ${
                      active ? "text-white" : "text-slate-600 hover:bg-white"
                    }`}
                    style={active ? { background: m.color } : undefined}
                    title={`${active ? "Quitar" : "Agregar"} ${m.label}`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <select
              value={departamentoFiltro}
              onChange={(e) => setDepartamentoFiltro(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="Todos">Todos los departamentos</option>
              {departamentos.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {municipios.length > 0 && (
              <select
                value={municipioFiltro}
                onChange={(e) => setMunicipioFiltro(e.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              >
                <option value="Todos">Todos los municipios</option>
                {municipios.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="Todos">Todos los tipos</option>
              {tipos.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={tipologiaFiltro}
              onChange={(e) => setTipologiaFiltro(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="Todos">Todas las tipologías</option>
              {tipologias.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={soloValidados}
                onChange={(e) => setSoloValidados(e.target.checked)}
                className="rounded border-slate-300"
              />
              Solo validados
            </label>

            <span className="ml-auto text-xs text-slate-400">
              {filteredByTema.length.toLocaleString("es-CO")} productos · {locations.length.toLocaleString("es-CO")} ubicaciones
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-slate-400 flex-1 min-w-xs"
            />

            {selectedKey && (
              <button
                onClick={() => setSelectedKey(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                ✕ Quitar selección
              </button>
            )}

            <button
              onClick={restablecerFiltros}
              disabled={temasFiltro.length === TEMAS.length && !search && !soloValidados && departamentoFiltro === "Todos" && municipioFiltro === "Todos" && tipoFiltro === "Todos" && tipologiaFiltro === "Todos" && !selectedKey}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:text-slate-300 disabled:cursor-default enabled:text-slate-600 enabled:hover:bg-slate-100 enabled:hover:text-slate-900"
            >
              ↻ Restablecer
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="h-[45vh] lg:h-auto lg:flex-1">
          {data ? (
            <MapView
              locations={locations}
              filteredData={filteredByTema}
              selectedKey={selectedKey}
              onSelect={(key) => setSelectedKey((prev) => (prev === key ? null : key))}
              bounds={mapBounds}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">
              Cargando datos…
            </div>
          )}
        </div>

        <aside className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-semibold text-slate-800">
              {selectedLocation ? selectedLocation.entidad : "Fichas de productos"}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedLocation
                ? `${cards.length} producto${cards.length !== 1 ? "s" : ""} en esta ubicación`
                : "Haz clic en un punto del mapa o usa el buscador"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {cards.length === 0 && (
              <p className="text-sm text-slate-400 px-2 py-8 text-center">
                No hay productos que coincidan con los filtros actuales.
              </p>
            )}
            {cards.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
            {!selectedLocation && filteredByTema.length > cards.length && (
              <p className="text-xs text-slate-400 text-center py-2">
                Mostrando {cards.length} de {filteredByTema.length.toLocaleString("es-CO")} — filtra o
                selecciona un punto del mapa para ver más.
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
