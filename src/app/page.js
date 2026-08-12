"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import ProductCard from "@/components/ProductCard";
import { CloseIcon, MapPinIcon, ResetIcon, SearchIcon } from "@/components/icons";
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
  // Cambia en cada "Restablecer" para reencuadrar el mapa aunque `mapBounds` ya
  // fuera null: si no, un zoom manual sobrevive al reinicio de filtros.
  const [resetToken, setResetToken] = useState(0);

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
    setResetToken((n) => n + 1);
  };

  // Filtros en cascada: cada nivel alimenta las opciones del siguiente, de modo que
  // los desplegables solo ofrecen valores que realmente devuelven resultados.
  const rowsSinTipo = useMemo(() => {
    if (!data) return [];
    let rows = data.filter((r) => r.lat != null && r.lng != null);
    if (soloValidados) rows = rows.filter((r) => r.validado);
    if (departamentoFiltro !== "Todos") rows = rows.filter((r) => r.departamento === departamentoFiltro);
    if (municipioFiltro !== "Todos") rows = rows.filter((r) => r.entidad === municipioFiltro);
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
  }, [data, soloValidados, departamentoFiltro, municipioFiltro, search]);

  const rowsSinTipologia = useMemo(
    () => (tipoFiltro === "Todos" ? rowsSinTipo : rowsSinTipo.filter((r) => r.tipo === tipoFiltro)),
    [rowsSinTipo, tipoFiltro]
  );

  const rowsSinTema = useMemo(
    () =>
      tipologiaFiltro === "Todos"
        ? rowsSinTipologia
        : rowsSinTipologia.filter((r) => (r.tipologia_propuesta || r.tipologia) === tipologiaFiltro),
    [rowsSinTipologia, tipologiaFiltro]
  );

  const filteredByTema = useMemo(
    () => rowsSinTema.filter((r) => temasFiltro.includes(r.tema)),
    [rowsSinTema, temasFiltro]
  );

  // Cuántos productos aportaría cada tema con los demás filtros aplicados: es el
  // número que va en cada chip, por eso se cuenta antes de filtrar por tema.
  const temaCounts = useMemo(() => {
    const counts = Object.fromEntries(TEMAS.map((t) => [t, 0]));
    for (const r of rowsSinTema) {
      if (counts[r.tema] != null) counts[r.tema] += 1;
    }
    return counts;
  }, [rowsSinTema]);

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

  const tipos = useMemo(
    () =>
      [...new Set(
        rowsSinTipo.filter((r) => temasFiltro.includes(r.tema)).map((r) => r.tipo)
      )].filter(Boolean).sort(),
    [rowsSinTipo, temasFiltro]
  );

  const tipologias = useMemo(
    () =>
      [...new Set(
        rowsSinTipologia
          .filter((r) => temasFiltro.includes(r.tema))
          .map((r) => r.tipologia_propuesta || r.tipologia)
      )].filter(Boolean).sort(),
    [rowsSinTipologia, temasFiltro]
  );

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
      <header className="relative overflow-hidden bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "18px 18px",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-16 -top-40 h-80 w-[32rem] rounded-full bg-gold-400/12 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-4 px-8 py-5">
          <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0 text-gold-400" aria-hidden="true">
            <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeOpacity="0.28" />
            <circle cx="20" cy="20" r="12.5" fill="none" stroke="currentColor" strokeOpacity="0.5" />
            <circle cx="20" cy="20" r="5" fill="currentColor" />
          </svg>

          {/* clamp mantiene el titular en una sola línea entre ~1200px y pantallas
              anchas, que es donde se ve mejor equilibrado. */}
          <h1 className="font-heading font-bold leading-tight tracking-tight text-white text-[clamp(1.1rem,2.05vw,2rem)]">
            <span className="text-gold-400">ICTRC 2026</span>
            <span className="text-white/25"> · </span>
            Inventario de la oferta turística de Colombia
            <span className="text-white/25"> · </span>
            <span className="font-normal text-navy-100/65">Información preliminar.</span>
          </h1>
        </div>

        {/* Composición por tema de lo que está en el mapa. Las cifras exactas viven
            en los chips de abajo, así que la franja nunca es el único canal. */}
        <div className="relative flex h-1.5 w-full gap-[2px] bg-navy-950">
          {TEMAS.filter((t) => temasFiltro.includes(t) && temaCounts[t] > 0).map((t) => (
            <div
              key={t}
              className="h-full"
              style={{ flexGrow: temaCounts[t], background: THEME_META[t].color }}
            />
          ))}
        </div>
      </header>

      <div className="relative z-10 border-b border-slate-200 bg-white px-8 py-4 shadow-[0_1px_3px_rgba(11,37,64,0.04)]">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {TEMAS.map((t) => {
                const m = THEME_META[t];
                const active = temasFiltro.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleTema(t)}
                    aria-pressed={active}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      active
                        ? "text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-800"
                    }`}
                    style={active ? { background: m.color } : undefined}
                    title={`${active ? "Quitar" : "Agregar"} ${m.label}`}
                  >
                    {!active && (
                      <span
                        className="h-2 w-2 rounded-full opacity-45"
                        style={{ background: m.color }}
                        aria-hidden="true"
                      />
                    )}
                    {m.label}
                    <span className={active ? "text-white/70" : "text-slate-400"}>
                      {temaCounts[t].toLocaleString("es-CO")}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[260px] flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto, municipio o tipología…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-10 pr-9 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-navy-600 focus:bg-white focus:ring-4 focus:ring-navy-600/8"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy-900"
                >
                  <CloseIcon />
                </button>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-600 transition-colors hover:text-navy-900">
              <input
                type="checkbox"
                checked={soloValidados}
                onChange={(e) => setSoloValidados(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-navy-600/30"
              />
              Solo validados
            </label>

            {selectedKey && (
              <button
                onClick={() => setSelectedKey(null)}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy-900"
              >
                <CloseIcon />
                Quitar selección
              </button>
            )}

            <button
              onClick={restablecerFiltros}
              disabled={!filtrosActivos}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-default disabled:text-slate-300 enabled:text-navy-700 enabled:hover:bg-navy-100 enabled:hover:text-navy-900"
            >
              <ResetIcon />
              Restablecer
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
              resetToken={resetToken}
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-slate-400">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-navy-700" />
              <span className="text-sm">Cargando mapa…</span>
            </div>
          )}
        </div>

        <aside className="w-full lg:w-[420px] lg:flex-none border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-100/70 flex flex-col">
          <div className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {selectedLocation ? "Ubicación seleccionada" : "Resultados"}
                </p>
                <h2 className="mt-1 truncate font-heading text-base font-semibold text-navy-900">
                  {selectedLocation ? selectedLocation.entidad : "Fichas de producto"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {selectedLocation ? (
                    `${cards.length.toLocaleString("es-CO")} producto${cards.length !== 1 ? "s" : ""} en esta ubicación`
                  ) : (
                    <>
                      <span className="font-medium text-navy-900">
                        {filteredByTema.length.toLocaleString("es-CO")}
                      </span>{" "}
                      productos
                      <span className="text-slate-300"> · </span>
                      <span className="font-medium text-navy-900">
                        {locations.length.toLocaleString("es-CO")}
                      </span>{" "}
                      ubicaciones
                    </>
                  )}
                </p>
              </div>
              {selectedLocation && (
                <button
                  onClick={() => setSelectedKey(null)}
                  className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-navy-900"
                >
                  Ver todo
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {cards.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-2 py-16 text-center">
                <MapPinIcon className="h-9 w-9 text-slate-300" />
                <p className="text-sm text-slate-400">
                  No hay productos que coincidan con los filtros actuales.
                </p>
              </div>
            )}
            {cards.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
            {!selectedLocation && filteredByTema.length > cards.length && (
              <p className="px-2 py-3 text-center text-xs leading-relaxed text-slate-400">
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
  const activo = value !== "Todos";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-w-[9rem] rounded-lg border px-2.5 py-1.5 text-sm outline-none transition-all focus:border-navy-600 focus:ring-4 focus:ring-navy-600/8 ${
          activo
            ? "border-navy-600/40 bg-navy-100/50 font-medium text-navy-900"
            : "border-slate-200 bg-slate-50/60 text-slate-700 hover:border-slate-300"
        }`}
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
