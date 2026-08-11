import "./globals.css";
import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "ICTRC 2026 · Mapa de oferta turística",
  description: "Visualizador de la oferta turística reportada al ICTRC 2026 (Naturaleza, Cultura, Gastronómico)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
