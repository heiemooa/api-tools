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
// import axios from "axios";

const router = new Router();

const ALLOW_RAW_OUTPUT = process.env.ALLOW_RAW_OUTPUT || false;

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

    // json 格式
    if (type === "json") {
      ctx.response.set("Content-Type", "application/json");
      ctx.body = {
        code: 200,
        id,
        url: imgsArray[id - 1],
      };
      return;
    }
    const imageUrl = path.join(imageDir, imgsArray[id - 1]);

    // 服务端读取图片后回传
    if (type === "raw") {
      if (!ALLOW_RAW_OUTPUT) {
        ctx.throw(403);
        return;
      }
      ctx.response.set("Content-Type", "image/jpeg");
      ctx.body = fs.createReadStream(imageUrl);

      //   const imageResponse = await axios.get(
      //     "https://z3.ax1x.com/2021/08/19/fqDQns.png",
      //     {
      //       responseType: "arraybuffer",
      //     }
      //   );
      //   ctx.body = Buffer.from(imageResponse.data, "binary");
      return;
    }

    ctx.set("Referrer-Policy", "no-referrer");
    ctx.redirect(`/images/${imgsArray[id - 1]}`);
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
