import * as appStore from './app.store'
import * as userStore from './user.store'

const stores = {
  app: appStore,
  user: userStore,
}

export function useStore() {
  return stores
}
