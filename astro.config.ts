import { defineConfig, passthroughImageService } from 'astro/config'
import node from '@astrojs/node'
import UnoCSS from 'unocss/astro'
import Vue from '@astrojs/vue'

// import vercel from '@astrojs/vercel/serverless'

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [Vue({
    jsx: true,
    appEntrypoint: '/src/pages/_app',
  }), UnoCSS({
    injectReset: true,
  })],
  image: {
    service: passthroughImageService(),
  },
  devToolbar: {
    enabled: false,
  },
})
