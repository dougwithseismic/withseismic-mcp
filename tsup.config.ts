import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/sse.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  clean: true,
  outDir: "dist",
  sourcemap: true,
});
