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
      '/wordbook': './src/apps/wordbook/pages/index.astro',
      '/wordbook/admin': './src/apps/wordbook/pages/admin.astro',
      '/wordbook/api/textbooks': './src/apps/wordbook/pages/api/textbooks.ts',
      '/wordbook/api/units': './src/apps/wordbook/pages/api/units.ts',
      '/wordbook/api/words': './src/apps/wordbook/pages/api/words.ts',
      '/wordbook/api/batch/words': './src/apps/wordbook/pages/api/batch/words.ts',
      '/wordbook/api/batch/sentences': './src/apps/wordbook/pages/api/batch/sentences.ts',
      '/wordbook/api/words-search': './src/apps/wordbook/pages/api/words-search.ts',
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
