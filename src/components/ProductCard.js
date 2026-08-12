"use client";
import { THEME_META } from "@/lib/theme";

export default function ProductCard({ item }) {
  const theme = THEME_META[item.tema];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(11,37,64,0.05)] transition-all hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_8px_24px_-8px_rgba(11,37,64,0.18)]">
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: theme.color }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-2">
        <span
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{ background: theme.soft, color: theme.ring }}
        >
          {theme.label}
        </span>
        {item.validado ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-navy-900 px-2 py-0.5 text-[10px] font-medium text-white">
            ✓ Validado
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Sin validar
          </span>
        )}
      </div>

      <h3 className="mt-2.5 font-heading text-sm font-semibold leading-snug text-navy-900">
        {item.producto_corregido || item.producto}
      </h3>

      <dl className="mt-2.5 space-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-400">Tipo</dt>
          <dd className="text-slate-700">{item.tipo_propuesto || item.tipo || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-400">Tipología</dt>
          <dd className="text-slate-700">{item.tipologia_propuesta || item.tipologia || "—"}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-slate-400">Ubicación</dt>
          <dd className="text-slate-700">
            {item.entidad}
            {item.nivel && <span className="text-slate-400"> · {item.nivel}</span>}
          </dd>
        </div>
      </dl>

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
