/// <reference types="astro/client" />
declare interface User {}

declare namespace App {
  interface Locals {
    userToken?: string
    user?: User
  }
}