import type { App } from 'vue'

export default (app: App) => {
  app.mixin({
    inheritAttrs: false,
  })
}
