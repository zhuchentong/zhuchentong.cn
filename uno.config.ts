// uno.config.ts
import { defineConfig, presetUno } from 'unocss'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'
import transformerDirective from '@unocss/transformer-directives'
import presetIcons from '@unocss/preset-icons'
import presetAttributify from '@unocss/preset-attributify'
import transformerVariantGroup from '@unocss/transformer-variant-group'
import { breakpoints } from './package.json'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify({
      prefix: 'css:',
      prefixedOnly: true,
      nonValuedAttribute: true,
    }),
    presetIcons({
      prefix: 'icon-',
      collections: {
        'park-outline': () => import('@iconify-json/icon-park-outline').then(i => i.icons),
        'park-solid': () => import('@iconify-json/icon-park-solid').then(i => i.icons),
        'park': () => import('@iconify-json/icon-park').then(i => i.icons),
        'svg': importIconsFromSvg(),
      },
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),

  ],
  transformers: [
    transformerDirective(),
    transformerVariantGroup() as any,
  ],
  theme: {
    breakpoints: {
      xs: '320px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      ...customBreakpoints(),
    },
  },
  shortcuts: [
    ['flex-center', 'flex justify-center items-center'],
  ],
  safelist: [
    ...Array.from({ length: 10 }, (_, i) => `space-x-${i + 1}`),
    ...Array.from({ length: 10 }, (_, i) => `space-y-${i + 1}`),
  ],
})

function customBreakpoints() {
  return {
    mobile: `${breakpoints.mobile}px`,
    desktop: `${breakpoints.desktop}px`,
  }
}

function importIconsFromSvg() {
  return FileSystemIconLoader(
    './src/assets/svg',
    svg => svg.replace(/#fff/, 'currentColor'),
  )
}
