import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // This tells Next.js to create the /out folder
  trailingSlash: true, // Forces `/projects` to output as `/projects/index.html` instead of `/projects.html` to prevent server directory indexing
  images: {
    unoptimized: true, // Required for static exports using Next <Image> tags
  },
  reactCompiler: true,
};

export default nextConfig;
