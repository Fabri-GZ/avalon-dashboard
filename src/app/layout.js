import { Poppins, Unbounded } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins-sans",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Arial", "sans-serif"],
  preload: true,
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded-display",
  display: "swap",
  adjustFontFallback: true,
  fallback: ["Arial", "sans-serif"],
  preload: true,
});

export const metadata = {
  title: "Avalon Dashboard",
  description: ".",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${poppins.variable} ${unbounded.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
