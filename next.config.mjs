/** @type {import('next').NextConfig} */
const nextConfig = {
  optimizeFonts: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/objective",
        permanent: true, // or false for temporary redirect
      },
    ];
  },
};

export default nextConfig;
