import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
  // 拦截一个请求里的数据
  // 可选地修改 `locals` 中的属性
  context.locals.test = Date.now();
  // 返回一个 Response 或者调用 `next()` 的结果
  return next();
});