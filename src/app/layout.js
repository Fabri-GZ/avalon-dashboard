import "./globals.css";
import ClientLoaderWrapper from "./components/Loader/ClientLoaderWrapper";

export const metadata = {
  title: "Avalon Dashboard",
  description: ".",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ClientLoaderWrapper>
          {children}
        </ClientLoaderWrapper>
      </body>
    </html>
  );
}
