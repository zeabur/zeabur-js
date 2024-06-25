import path from "path";
import { defineConfig } from "vite";


const fileName = {
  es: 'index.mjs',
  cjs: 'index.cjs',
  iife: 'index.iife.js',
};

const formats = Object.keys(fileName) as Array<keyof typeof fileName>;

module.exports = defineConfig({
  base: "./",
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: 'Zeabur',
      formats,
      fileName: (format) => fileName[format],
    },
  },
});
