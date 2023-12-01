/**
 * 图片处理
 *
 * @param {string} url - 必填。指定图片地址
 * @param {boolean} type - 必填。用于指定返回格式：theme（主题色）、greyscale（高斯模糊）、greyscale（灰度图）、base64（base64图片字符串）、scale（缩略图
 * @param {boolean} width - 非必填，指定宽度
 * @param {boolean} height - 非必填，指定高度
 */

import { Context } from "koa";
import { ParsedUrlQuery } from "querystring";
import Router from "@koa/router";
import dayjs from "dayjs";
import { getImageMainColor, processImage } from "../utils/image";
import Jimp from "jimp";
import * as cache from "../utils/cache";

const router = new Router();

// 调用时间

type IQuery = {
  url: string;
  theme?: boolean;
  base64?: boolean;
  greyscale?: boolean;
  gaussian?: number;
  quality?: number;
  width?: number;
  height?: number;
} & ParsedUrlQuery;

type IContext = Context & {
  query: IQuery;
};

// 显示图片
router.get("/img", async (ctx: IContext) => {
  try {
    const {
      url,
      theme = false,
      base64 = false,
      greyscale = false,
      quality = 100,
      gaussian = 0,
      width,
      height,
    } = ctx.query;

    if (!url) {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: "url不存在",
      };
      return;
    }
    const time = dayjs().format("YYYY-YY-DD");
    const params = {
      name: "img",
      time,
      url,
      theme,
      base64,
      greyscale,
      quality,
      gaussian,
      width,
      height,
    };
    const cacheKey = JSON.stringify(params);

    // 从缓存中获取数据
    let data = await cache.get(cacheKey);
    if (data) {
      ctx.response.set("Cache-Control", "public, max-age=86400");
      console.log("触发缓存", params);
      ctx.status = 200;
      if (theme || base64) {
        ctx.body = data;
      } else {
        ctx.response.set("Content-Type", "image/jpeg"); // 服务端渲染返回
        ctx.body = data;
      }
      return;
    }
    // 无缓存
    ctx.response.set("Cache-Control", "no-cache");

    // 读取主题色
    if (theme) {
      ctx.status = 200;
      data = {
        code: 200,
        message: "OK",
        data: await getImageMainColor(url),
      };
      ctx.body = data;
      await cache.set(cacheKey, data);
      return;
    }

    // 图片处理
    const image = await processImage(url, {
      greyscale,
      base64,
      gaussian: Number(gaussian),
      quality: Number(quality),
      width: Number(width),
      height: Number(height),
    });

    // 返回base64
    if (base64) {
      ctx.status = 200;
      data = {
        code: 200,
        message: "OK",
        data: image,
      };
      ctx.body = data;
      await cache.set(cacheKey, data);
      return;
    }
    // 返回灰度、缩略图、高斯模糊、图片质量
    ctx.status = 200;
    // ctx.response.set("Content-Disposition", `attachment; filename=${url}`); // 直接下载
    ctx.response.set("Content-Type", "image/jpeg"); // 服务端渲染返回
    data = await image.getBufferAsync(Jimp.AUTO);
    ctx.body = data;
    await cache.set(cacheKey, data);
  } catch (error) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "获取失败",
    };
  }
});

export default router;
