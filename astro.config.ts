import node from '@astrojs/node'
import react from '@astrojs/react'
import { customRouting } from '@inox-tools/custom-routing'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, passthroughImageService } from 'astro/config'
import { copybookRoutes } from './src/apps/copybook/route'
import { englishRoutes } from './src/apps/english/route'
import { historyRoutes } from './src/apps/history/route'
import { workbookRoutes } from './src/apps/workbook/route'

export default defineConfig({
  site: 'https://www.zhuchentong.cn',
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [
    react(),
    customRouting({
      ...copybookRoutes,
      ...workbookRoutes,
      ...englishRoutes,
      ...historyRoutes,
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
