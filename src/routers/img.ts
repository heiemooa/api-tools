/**
 * 随机图片 API
 * @param {number} id - 指定要获取的图片ID，从1开始，跳转至images中的第{id}张图片
 * @param {number} json - 返回json格式数据
 * @param {string} raw - 服务端加载并返回
 */

import { Context } from "koa";
import { ParsedUrlQuery } from "querystring";
import Router from "@koa/router";
import axios from "axios";
import size from "lodash.size";
import get from "lodash.get";

const router = new Router();

const ALLOW_RAW_OUTPUT = process.env.ALLOW_RAW_OUTPUT || true;

type IQuery = {
  id?: number;
  type?: "json" | "raw";
} & ParsedUrlQuery;

type Icontext = Context & {
  query: IQuery;
};

// jsdelivr 在大陆已被墙
// const jsdelivr_cdn = "https://cdn.jsdelivr.net/gh/heiemooa/folder@main";
const emooa_cdn = "https://cdn.emooa.com";

// 获取列表数据
router.get("/img", async (ctx: Icontext) => {
  try {
    let { id, type, filter = "bing" } = ctx.query;

    // 从 cdn 上获取资源
    const output = await axios.get(`${emooa_cdn}/output.json`);
    const images = get(output, `data.image.${filter}`, []);

    // 拿到参数ID
    id = parseInt(String(id));
    if (id && id > 0 && id <= size(images)) {
      ctx.response.set("Cache-Control", "public, max-age=86400");
    } else {
      ctx.response.set("Cache-Control", "no-cache");
      id = Math.ceil(Math.random() * size(images));
    }

    const image = get(images, `[${id - 1}].url.hd`);
    // 不存在时返回必应今日图片
    const url = image
      ? `${emooa_cdn}/${image}`
      : "https://api-tools.emooa.com/bing/image";

    // json 格式
    if (type === "json") {
      ctx.response.set("Content-Type", "application/json");
      ctx.body = {
        code: 200,
        id,
        url,
      };
      return;
    }

    // 服务端读取图片后回传
    if (type === "raw") {
      console.info(`RAW: ${url}`);
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

    console.info(`返回随机图片: ${url}`);
    ctx.set("Referrer-Policy", "no-referrer");
    ctx.redirect(url);
  } catch (error: any) {
    console.error(error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: error.message,
    };
  }
});

export default router;
