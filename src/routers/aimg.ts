/**
 * 获取必应每日背景图片信息
 *
 * @param {string} idx - 指定要获取的图片在历史记录中的索引，从0开始。0表示当天的图片，1表示昨天的图片，依此类推。最大值为无穷
 * @param {boolean} type - 用于指定是否获取超高分辨率（Ultra High Definition）的图片。可选值为 json、raw
 */

import { Context } from "koa";
import { ParsedUrlQuery } from "querystring";
import axios from "axios";
import Router from "@koa/router";
import * as cache from "../utils/cache";
import get from "lodash.get";
import size from "lodash.size";
import reverse from "lodash.reverse";
import dayjs from "dayjs";
import logger from "../utils/logger";

const router = new Router();

// 调用时间

const ALLOW_RAW_OUTPUT = process.env.ALLOW_RAW_OUTPUT || true;

type IBingImageQuery = {
  idx?: number;
  type?: "json";
} & {
  idx?: number;
  type?: "raw";
} & ParsedUrlQuery;

type IBingImageCcontext = Context & {
  query: IBingImageQuery;
};

// 显示图片
router.get("/aimg", async (ctx: IBingImageCcontext) => {
  try {
    // 从 cdn 上获取资源
    // jsdelivr 在大陆已被墙
    // const jsdelivr_cdn = "https://cdn.jsdelivr.net/gh/heiemooa/folder@main/output.json";

    const time = dayjs().format("YYYY-YY-DD");
    const params = { name: "aimg", time };
    const cacheKey = JSON.stringify(params);
    const emooa_cdn = "https://cdn.emooa.com";

    // 从缓存中获取数据
    let images = await cache.get(cacheKey);
    if (!images) {
      const output = await axios.get(`${emooa_cdn}/output.json`);
      images = reverse(get(output, `data.image.bing`, []));
      await cache.set(cacheKey, images, 300);
    } else {
      logger.info(`触发缓存 ${cacheKey}: ${`${emooa_cdn}/output.json`}`);
    }

    // 获取参数
    let { idx, type } = ctx.query;

    // 拿到参数ID
    idx = parseInt(String(idx));
    if (idx >= 0 && idx < size(images)) {
      ctx.response.set("Cache-Control", "public, max-age=86400");
    } else {
      ctx.response.set("Cache-Control", "no-cache");
      idx = Math.ceil(Math.random() * size(images));
    }

    // json 格式
    if (type === "json") {
      ctx.response.set("Content-Type", "application/json");
      ctx.body = {
        code: 200,
        message: "OK",
        data: get(images, `[${idx}]`),
      };
      return;
    }

    const img = get(images, `[${idx}].url.hd`);
    const url = img ? `${emooa_cdn}/${img}` : "";

    // 服务端读取图片后回传
    if (type === "raw") {
      logger.info(`RAW: ${url}`);
      if (!ALLOW_RAW_OUTPUT) {
        ctx.throw(403);
        return;
      }
      ctx.response.set("Content-Type", "image/jpeg");

      // 读取远程图片文件
      const imageResponse = await axios.get(url, {
        responseType: "arraybuffer",
      });
      ctx.body = Buffer.from(imageResponse.data, "binary");
      return;
    }

    logger.info(`返回随机图片: ${url}`);
    ctx.set("Referrer-Policy", "no-referrer");
    ctx.redirect(url);
  } catch (error) {
    logger.error(error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "获取失败",
    };
  }
});

export default router;
