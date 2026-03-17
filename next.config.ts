import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // This tells Next.js to create the /out folder
  images: {
    unoptimized: true, // Required for static exports using Next <Image> tags
  },
  reactCompiler: true,
};

export default nextConfig;
