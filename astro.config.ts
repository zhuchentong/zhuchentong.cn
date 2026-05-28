import node from '@astrojs/node'
import Vue from '@astrojs/vue'
import { defineConfig, fontProviders, passthroughImageService } from 'astro/config'
import UnoCSS from 'unocss/astro'

// import vercel from '@astrojs/vercel/serverless'

// https://astro.build/config
export default defineConfig({
  site: 'https://www.zhuchentong.cn',
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
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'MaShanZheng',
      cssVariable: '--font-ma-shan-zheng',
      fallbacks: ['KaiTi', 'STKaiti', 'serif'],
      options: {
        variants: [{
          src: ['./src/assets/fonts/MaShanZheng-Regular.woff2'],
          weight: 'normal',
          style: 'normal',
        }],
      },
    },
  ],
})
