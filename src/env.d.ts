/// <reference types="astro/client" />
declare interface User {}

declare namespace App {
  interface Locals {
    theme?: 'light'|'dark'
    userToken?: string
    user?: User
  }
}