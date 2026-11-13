import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Snack Overflow",
    short_name: "Snack Overflow",
    description: "Collaborative office pantry discovery and inventory demo.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#f97316",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
