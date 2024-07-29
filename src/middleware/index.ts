import type { APIContext } from "astro";
import { defineMiddleware } from "astro:middleware";

async function setupTheme(context: APIContext){
  const theme = context.cookies.get('theme')?.value  as 'light'|'dark'
  context.locals.theme = theme || 'light'
}

export const onRequest = defineMiddleware(async (context, next) => {
  await setupTheme(context)
 
  return next();
});