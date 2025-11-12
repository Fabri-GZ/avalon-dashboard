import "./globals.css";

export const metadata = {
  title: "Avalon Dashboard",
  description: ".",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
