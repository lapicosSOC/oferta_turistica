"use client";
import { THEME_META } from "@/lib/theme";

export default function ProductCard({ item }) {
  const theme = THEME_META[item.tema];

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white pl-4 pr-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: theme.color }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: theme.soft, color: theme.ring }}
        >
          {theme.label}
        </span>
        <div className="flex flex-wrap gap-1 justify-end">
          {item.validado ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-navy-100 bg-navy-900 px-2 py-0.5 text-[11px] font-medium text-white">
              ✓ Validado
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              Sin validar
            </span>
          )}
        </div>
      </div>

      <h3 className="mt-2.5 font-heading text-sm font-semibold leading-snug text-navy-900">
        {item.producto_corregido || item.producto}
      </h3>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        <span>
          <span className="text-slate-400">Tipo:</span> {item.tipo_propuesto || item.tipo || "—"}
        </span>
        <span>
          <span className="text-slate-400">Tipología:</span> {item.tipologia_propuesta || item.tipologia || "—"}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
        <span className="text-slate-400">📍</span> {item.entidad}
        {item.nivel && <span className="text-slate-400">· {item.nivel}</span>}
      </div>

      {item.producto_compartido === "SI" && (
        <div className="mt-2.5 rounded-lg bg-gold-100 border border-gold-400/40 px-2.5 py-1.5 text-xs text-gold-600">
          <span className="font-semibold">Producto compartido.</span>{" "}
          <span className="line-clamp-2">{item.detalle_compartido}</span>
        </div>
      )}

      {(item.url_oficial || item.fuentes_web) && (
        <div className="mt-2.5 flex flex-wrap gap-3 border-t border-slate-100 pt-2 text-xs">
          {item.url_oficial && (
            <a
              href={item.url_oficial}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-navy-700 hover:text-navy-900 hover:underline"
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
