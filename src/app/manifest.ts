import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Craig's Saloon — Franchise Platform",
    short_name: "Craig's",
    description:
      "Franchise management platform for Craig's Saloon — four locations across Harare.",
    start_url: "/",
    display: "standalone",
    background_color: "#16130d",
    theme_color: "#16130d",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
