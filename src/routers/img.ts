/**
 * 随机图片 API
 * @param {number} id - 指定要获取的图片ID，从1开始，跳转至images中的第{id}张图片
 * @param {number} json - 返回json格式数据
 * @param {string} raw - 服务端加载并返回
 */

import { Context } from "koa";
import { ParsedUrlQuery } from "querystring";
import Router from "@koa/router";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
// import axios from "axios";

const router = new Router();

const ALLOW_RAW_OUTPUT = process.env.ALLOW_RAW_OUTPUT || true;

type IQuery = {
  id?: number;
  type?: "json" | "raw";
} & ParsedUrlQuery;

type Icontext = Context & {
  query: IQuery;
};

// 获取列表数据
router.get("/img", async (ctx: Icontext) => {
  try {
    let imageDir = path.join(__dirname, "../images");
    let imgsArray = fs.readdirSync(imageDir);

    // 拿到参数ID
    let { id, type } = ctx.query;
    id = parseInt(String(id));
    if (id && id > 0 && id <= imgsArray.length) {
      ctx.response.set("Cache-Control", "public, max-age=86400");
    } else {
      ctx.response.set("Cache-Control", "no-cache");
      id = Math.ceil(Math.random() * imgsArray.length);
    }

    const imagePath = `/images/${imgsArray[id - 1]}`;

    // json 格式
    if (type === "json") {
      console.info(`JSON: ${imagePath}`);
      ctx.response.set("Content-Type", "application/json");
      ctx.body = {
        code: 200,
        id,
        url: ctx.origin + imagePath,
      };
      return;
    }

    // 服务端读取图片后回传
    if (type === "raw") {
      console.info(`RAW: ${imagePath}`);
      if (!ALLOW_RAW_OUTPUT) {
        ctx.throw(403);
        return;
      }
      ctx.response.set("Content-Type", "image/jpeg");

      try {
        // 读取远程图片文件
        const imageResponse = await axios.get(ctx.origin + imagePath, {
          responseType: "arraybuffer",
        });
        ctx.body = Buffer.from(imageResponse.data, "binary");
      } catch (e) {
        console.warn(`raw error: `, e);
        console.warn(`raw local: ${path.join(__dirname, "../", imagePath)}`);
        // 读取本地图片文件
        ctx.body = fs.createReadStream(path.join(__dirname, "../", imagePath));
      }
      return;
    }

    console.info(`返回随机图片: ${imagePath}`);
    ctx.set("Referrer-Policy", "no-referrer");
    ctx.redirect(imagePath);
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
