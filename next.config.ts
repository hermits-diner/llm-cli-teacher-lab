import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  async headers() {
    // Force download instead of showing the file in the browser.
    return ["/setup.bat", "/ai-lab.zip"].map((source) => ({
      source,
      headers: [{ key: "Content-Disposition", value: "attachment" }],
    }));
  },
};

// Turbopack needs serializable options, so plugins are referenced by name.
const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
  },
});

export default withMDX(nextConfig);
