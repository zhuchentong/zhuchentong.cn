/// <reference types="astro/client" />
declare interface User {}

declare namespace App {
  interface Locals {
    theme?: 'light' | 'dark'
    userToken?: string
    user?: User
  }
}

interface ImportMetaEnv {
  readonly DATABASE_HOST: string
  readonly DATABASE_USER: string
  readonly DATABASE_PORT: string
  readonly DATABASE_PASSWORD: string
  readonly DATABASE_DB: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
