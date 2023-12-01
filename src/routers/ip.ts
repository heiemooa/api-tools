/**
 * 获取本地IP
 */

import Router from "@koa/router";
import axios from "axios";
import { Context } from "koa";

const router = new Router();

router.get("/ip", async (ctx: Context) => {
  try {
    // 在这里调用 Uptimerobot API
    const response = await axios.get(
      `https://www.ipaddress.com/ipv4/${ctx.ip}`,
      ctx.request.body
    );
    ctx.response.set("Content-Type", "text/html; charset=UTF-8");
    ctx.body = response.data;
  } catch (error) {
    console.error("IP 请求失败：", error);
    ctx.status = 500;
    ctx.body = error.response.data;
  }
});

export default router;
