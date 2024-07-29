import { defineConfig } from 'astro/config';
import node from "@astrojs/node";
import UnoCSS from 'unocss/astro';
import Vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: "standalone"
  }),
  integrations: [
    Vue({
      jsx: true
    }),
    UnoCSS({
      injectReset: true
    }),
  ]
});