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
    if (selectedKey && locations.some((l) => l.key === selectedKey)) {
      return filteredByTema.filter((r) => {
        const key = `${r.entidad}__${r.lat.toFixed(3)}__${r.lng.toFixed(3)}`;
        return key === selectedKey;
      });
    }
    return filteredByTema.slice(0, 60);
  }, [filteredByTema, selectedKey, locations]);

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

  useEffect(() => {
    setTipoFiltro("Todos");
    setTipologiaFiltro("Todos");
  }, [temasFiltro]);

  const filtrosActivos =
    temasFiltro.length !== TEMAS.length ||
    !!search ||
    soloValidados ||
    departamentoFiltro !== "Todos" ||
    municipioFiltro !== "Todos" ||
    tipoFiltro !== "Todos" ||
    tipologiaFiltro !== "Todos" ||
    !!selectedKey;

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <header className="relative overflow-hidden bg-navy-900 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-5">
            <div>
              <p className="font-heading text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-400">
                Inventario Turístico Nacional
              </p>
              <h1 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-white sm:text-3xl">
                ICTRC 2026 · Mapa de oferta turística
              </h1>
              <p className="mt-1.5 hidden max-w-2xl text-sm leading-relaxed text-navy-100/75 sm:block">
                Inventario de Colombia por Naturaleza, Cultura y Gastronomía. Atlántico validado con
                detalle · resto del país como reporte preliminar.
              </p>
            </div>

            <div className="flex gap-5 sm:gap-8">
              <div>
                <div className="font-heading text-xl font-bold text-white sm:text-2xl">
                  {filteredByTema.length.toLocaleString("es-CO")}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-navy-100/60">Productos</div>
              </div>
              <div>
                <div className="font-heading text-xl font-bold text-white sm:text-2xl">
                  {locations.length.toLocaleString("es-CO")}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-navy-100/60">Ubicaciones</div>
              </div>
              <div className="hidden sm:block">
                <div className="font-heading text-xl font-bold text-white sm:text-2xl">
                  {departamentos.length}
                </div>
                <div className="text-[11px] uppercase tracking-wide text-navy-100/60">Departamentos</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {TEMAS.map((t) => {
                const m = THEME_META[t];
                const active = temasFiltro.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTema(t)}
                    className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                      active ? "text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-slate-800"
                    }`}
                    style={active ? { background: m.color } : undefined}
                    title={`${active ? "Quitar" : "Agregar"} ${m.label}`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="relative flex-1 min-w-[220px]">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔎
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto, municipio o tipología…"
                className="w-full rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10"
              />
            </div>

            <label className="flex items-center gap-1.5 text-sm text-slate-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={soloValidados}
                onChange={(e) => setSoloValidados(e.target.checked)}
                className="rounded border-slate-300 text-navy-700 focus:ring-navy-600/30"
              />
              Solo validados
            </label>

            {selectedKey && (
              <button
                onClick={() => setSelectedKey(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap"
              >
                ✕ Quitar selección
              </button>
            )}

            <button
              onClick={restablecerFiltros}
              disabled={!filtrosActivos}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:text-slate-300 disabled:cursor-default enabled:text-navy-700 enabled:hover:bg-navy-100 enabled:hover:text-navy-900"
            >
              ↻ Restablecer
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-2.5">
            <FilterSelect
              label="Departamento"
              value={departamentoFiltro}
              onChange={setDepartamentoFiltro}
              options={departamentos}
              allLabel="Todos los departamentos"
            />
            {municipios.length > 0 && (
              <FilterSelect
                label="Municipio"
                value={municipioFiltro}
                onChange={setMunicipioFiltro}
                options={municipios}
                allLabel="Todos los municipios"
              />
            )}
            <FilterSelect
              label="Tipo"
              value={tipoFiltro}
              onChange={setTipoFiltro}
              options={tipos}
              allLabel="Todos los tipos"
            />
            <FilterSelect
              label="Tipología"
              value={tipologiaFiltro}
              onChange={setTipologiaFiltro}
              options={tipologias}
              allLabel="Todas las tipologías"
            />
          </div>
        </div>
      </div>

      <main className="flex flex-col lg:flex-1 lg:min-h-0 lg:flex-row">
        <div className="h-[340px] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1 border-b lg:border-b-0 border-slate-200">
          {data ? (
            <MapView
              locations={locations}
              filteredData={filteredByTema}
              selectedKey={selectedKey}
              onSelect={(key) => setSelectedKey((prev) => (prev === key ? null : key))}
              bounds={mapBounds}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-navy-700" />
              <span className="text-sm">Cargando mapa…</span>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-[420px] lg:flex-none border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 flex flex-col">
          <div className="px-4 py-3.5 border-b border-slate-200 bg-white">
            <h2 className="font-heading text-sm font-semibold text-navy-900">
              {selectedLocation ? selectedLocation.entidad : "Fichas de producto"}
            </h2>
            <p className="text-xs text-slate-500">
              {selectedLocation
                ? `${cards.length} producto${cards.length !== 1 ? "s" : ""} en esta ubicación`
                : "Haz clic en un punto del mapa o usa el buscador"}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {cards.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-2 py-12 text-center">
                <span className="text-3xl opacity-40">🗺️</span>
                <p className="text-sm text-slate-400">
                  No hay productos que coincidan con los filtros actuales.
                </p>
              </div>
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

function FilterSelect({ label, value, onChange, options, allLabel }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-navy-600 focus:ring-2 focus:ring-navy-600/10"
      >
        <option value="Todos">{allLabel}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
