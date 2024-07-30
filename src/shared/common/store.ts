import { setPersistentEngine } from '@nanostores/persistent'
import type { AstroCookies } from 'astro'
import * as cookies from './cookies'

export function defineStore<T>(setup: () => T): T {
  return setup()
}

function setupStoreCookiePersistent(setCookie: (name: string, value: string) => void, getCookie: (name: string) => string | undefined) {
  type PersistentListener = ((e: { key: string, newValue?: string }) => void)
  let listeners: ((e: { key: string, newValue?: string }) => void)[] = []

  const events = {
    addEventListener(key: string, callback: PersistentListener) {
      listeners.push(callback)
    },
    removeEventListener(key: string, callback: PersistentListener) {
      listeners = listeners.filter(i => i !== callback)
    },
    perKey: false,
  }

  function onChange(key: string, newValue?: string) {
    const event = { key, newValue }
    for (const listener of listeners) {
      listener(event)
    }
  }

  const storage = new Proxy<Record<string, string>>({}, {
    set(target, name: string, value: string) {
      target[name] = value
      setCookie(name, value)
      onChange(name, value)
      return true
    },
    get(target, name: string) {
      return target[name] || getCookie(name)
    },
    deleteProperty(target, name: string) {
      delete target[name]
      onChange(name, undefined)
      return true
    },
  })

  setPersistentEngine(storage, events as any)
}

export function setupStoreCookiePersistentClient() {
  setupStoreCookiePersistent(cookies.setCookie, cookies.getCookie)
}

export function setupStoreCookiePersistentServer(cookies: AstroCookies) {
  const setCookies = (name: string, value: string) => {
    cookies.set(name, value)
  }

  const getCookie = (name: string) => {
    return cookies.get(name)?.value
  }

  setupStoreCookiePersistent(setCookies, getCookie)
}
