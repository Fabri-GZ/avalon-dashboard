import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  turbopack: {
    root: path.resolve(),
  },
};

export default nextConfig;
