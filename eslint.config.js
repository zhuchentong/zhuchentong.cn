import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  astro: true,
  react: true,
  markdown: false,
}, {
  ignores: [
    '.opencode/**/*',
    'docs/**/*',
    'src/components/ui/**/*',
  ],
}, {
  rules: {
    'no-alert': 'off',
    'no-console': 'off',
  },
})
