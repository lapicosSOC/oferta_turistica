import { Inter, Sora } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata = {
  title: "ICTRC 2026 · Mapa de oferta turística",
  description: "Visualizador de la oferta turística reportada al ICTRC 2026 (Naturaleza, Cultura, Gastronómico)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`h-full ${inter.variable} ${sora.variable}`}>
      <body className="min-h-full lg:h-full antialiased bg-[var(--background)] text-[var(--foreground)] font-sans">
        {children}
      </body>
    </html>
  );
}
