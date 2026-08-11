import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactCompiler: true disabled — causes React #310 in Next 16.1.4's app-router.tsx
  // useMemo on production builds (Vercel SSR streaming). Local prod doesn't repro
  // because timing differs. Re-enable when Next/React-Compiler interop is fixed.
  reactCompiler: false,
  productionBrowserSourceMaps: true,
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Turbopack's HTTP client is Rust-based and ignores NODE_TLS_REJECT_UNAUTHORIZED,
    // so next/font/google fails to reach fonts.googleapis.com behind a TLS-intercepting
    // proxy and silently falls back to Arial. Reading the OS certificate store lets it
    // validate the intercepting CA instead of skipping validation altogether.
    turbopackUseSystemTlsCerts: true,
  },
};

export default nextConfig;
