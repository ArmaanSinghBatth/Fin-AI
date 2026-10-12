/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
