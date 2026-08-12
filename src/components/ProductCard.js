"use client";
import { THEME_META } from "@/lib/theme";

export default function ProductCard({ item }) {
  const theme = THEME_META[item.tema];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ background: theme.soft, color: theme.ring }}
        >
          {theme.label}
        </span>
        <div className="flex flex-wrap gap-1 justify-end">
          {item.validado ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
              Validado
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">
              Sin validar
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-2 text-sm font-semibold text-slate-900 leading-snug">
        {item.producto_corregido || item.producto}
      </h3>
      {item.producto_corregido && item.producto_corregido !== item.producto && (
        <p className="text-xs text-slate-400 line-clamp-1">Reportado como: {item.producto}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        <span>
          <span className="text-slate-400">Tipo:</span> {item.tipo_propuesto || item.tipo || "—"}
        </span>
        <span>
          <span className="text-slate-400">Tipología:</span> {item.tipologia_propuesta || item.tipologia || "—"}
        </span>
      </div>

      <div className="mt-1 text-xs text-slate-500">
        <span className="text-slate-400">Ubicación:</span> {item.entidad}
        {item.nivel && <span className="text-slate-400"> ({item.nivel})</span>}
      </div>

      {(item.alerta_duplicado === "SI" || item.producto_compartido === "SI") && (
        <div className="mt-2 space-y-1">
          {item.alerta_duplicado === "SI" && (
            <div className="rounded-lg bg-pink-50 border border-pink-200 px-2 py-1 text-xs text-pink-700">
              <span className="font-medium">Posible duplicado.</span>{" "}
              <span className="line-clamp-2">{item.detalle_alerta}</span>
            </div>
          )}
          {item.producto_compartido === "SI" && (
            <div className="rounded-lg bg-sky-50 border border-sky-200 px-2 py-1 text-xs text-sky-700">
              <span className="font-medium">Producto compartido.</span>{" "}
              <span className="line-clamp-2">{item.detalle_compartido}</span>
            </div>
          )}
        </div>
      )}

      {(item.url_oficial || item.fuentes_web) && (
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          {item.url_oficial && (
            <a
              href={item.url_oficial}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-700 hover:underline"
            >
              Sitio oficial ↗
            </a>
          )}
          {item.fuentes_web && (
            <a
              href={item.fuentes_web.split("\n")[0]}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:underline"
            >
              Fuente ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
