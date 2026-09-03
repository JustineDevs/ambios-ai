import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AmbiOS AI",
    short_name: "AmbiOS",
    description: "Human-and-agent collaboration for safer operations.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0b1020",
  };
}
