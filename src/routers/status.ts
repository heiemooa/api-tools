/**
 * 反代 Uptimerobot API
 */

import { Context } from "koa";
import axios from "axios";
import Router from "@koa/router";
import logger from "../utils/logger";

const router = new Router();

// 调用路径
const url = "https://api.uptimerobot.com/v2/getMonitors";

// GET
router.get("/status", async (ctx: Context) => {
  ctx.status = 400;
  ctx.body = {
    code: 400,
    message: "请使用 POST 请求",
  };
});

// POST
router.post("/status", async (ctx: Context) => {
  try {
    // 在这里调用 Uptimerobot API
    const response = await axios.post(url, ctx.request.body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    // 将 Uptimerobot API 的响应返回给客户端
    ctx.body = response.data;
  } catch (error) {
    logger.error("Uptimerobot API 请求失败：", error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "Uptimerobot API 请求失败",
    };
  }
});

export default router;
