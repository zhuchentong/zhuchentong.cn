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
      '/api/copybook/font-subset': './src/apps/copybook/pages/api/font-subset.ts',
      '/workbook/pinyin': './src/apps/workbook/pages/pinyin.astro',
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
