/**
 * 获取本地IP
 */

import Router from "@koa/router";

const router = new Router();

router.get("/ip", (ctx) => {
  ctx.body = `当前IP：${ctx.ip}`;
});

export default router;
