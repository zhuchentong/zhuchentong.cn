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
      '/workbook/pinyin': './src/apps/workbook/pages/pinyin.astro',
      '/english': './src/apps/english/pages/index.astro',
      '/english/admin': './src/apps/english/pages/admin.astro',
      '/english/gallery': './src/apps/english/pages/gallery.astro',
      '/english/learner': './src/apps/english/pages/learner.astro',
      '/english/api/textbooks': './src/apps/english/pages/api/textbooks.ts',
      '/english/api/units': './src/apps/english/pages/api/units.ts',
      '/english/api/words': './src/apps/english/pages/api/words.ts',
      '/english/api/batch/words': './src/apps/english/pages/api/batch/words.ts',
      '/english/api/batch/sentences': './src/apps/english/pages/api/batch/sentences.ts',
      '/english/api/words-search': './src/apps/english/pages/api/words-search.ts',
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
