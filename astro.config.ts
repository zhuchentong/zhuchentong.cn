import node from '@astrojs/node'
import react from '@astrojs/react'
import { customRouting } from '@inox-tools/custom-routing'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, passthroughImageService } from 'astro/config'

export default defineConfig({
  site: 'https://www.zhuchentong.cn',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react(),
    customRouting({
      '/copybook/hanzi': './src/apps/copybook/pages/hanzi.astro',
      '/api/font-subset': './src/apps/copybook/pages/api/font-subset.ts',
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    service: passthroughImageService(),
  },
  devToolbar: {
    enabled: false,
  },
})
