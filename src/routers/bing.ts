/**
 * 获取必应每日背景图片信息
 *
 * @param {string} idx - 指定要获取的图片在历史记录中的索引，从0开始。0表示当天的图片，1表示昨天的图片，依此类推。最大值为7
 * @param {number} n - 指定要获取的图片数量，从1到8。如果n大于idx+1，则返回的图片数量可能小于n
 * @param {string} mkt - 指定地区或市场代码，用于确定背景图片的地域和语言。mkt=zh-CN 表示中文（中国）地区的图片
 * @param {boolean} uhd - 用于指定是否获取超高分辨率（Ultra High Definition）的图片。可选值为 1（启用）或 0（禁用）
 * @param {number} uhdwidth - 如果启用了超高分辨率图片，可以使用这个参数来指定图片的宽度
 * @param {number} uhdheight - 如果启用了超高分辨率图片，可以使用这个参数来指定图片的高度
 */

import { Context } from "koa";
import { ParsedUrlQuery } from "querystring";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import isEmpty from "lodash.isempty";
import Router from "@koa/router";
import * as cache from "../utils/cache";
import logger from "../utils/logger";
import bingFunc from "../schedule/bing";

const router = new Router();

// 调用时间
let updateTime: string = new Date().toISOString();

export interface IImage {
  startdate: string;
  fullstartdate: string;
  enddate: string;
  url: string;
  urlbase: string;
  copyright: string;
  copyrightlink: string;
  title: string;
  quiz: string;
  wp: true;
  hsh: string;
  drk: number;
  top: number;
  bot: number;
  hs: any[];
}
export interface IBingData {
  images: IImage[];
  tooltips: {
    loading: string;
    previous: string;
    next: string;
    walle: string;
    walls: string;
  };
}

export interface IImageBody {
  code: number;
  message: string;
  from?: "cache" | "server";
  updateTime?: string;
  data?: any;
}

type IBingQuery = {
  idx: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  n: number;
  uhd: 0 | 1;
  uhdwidth: number;
  uhdheight: number;
} & ParsedUrlQuery;

type IBingCcontext = Context & {
  body: IImageBody | Buffer;
  query: IBingQuery;
};

// 获取
router.get("/bing", async (ctx: IBingCcontext) => {
  try {
    // 获取参数
    const { idx = 0, n = 1, uhd = 0, uhdwidth, uhdheight } = ctx.query;
    if (idx > 7 || n > 8) {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: "参数填写错误",
      };
      return;
    }

    // 缓存键名
    const params = { name: "bing", idx, n, uhd, uhdwidth, uhdheight };
    const cacheKey = JSON.stringify(params);

    // 从缓存中获取数据
    let data: IImage[] = await cache.get(cacheKey);
    const from = data ? "cache" : "server";

    if (!data) {
      // 从服务器拉取数据
      const params = {
        format: "js",
        idx,
        n,
        uhd,
        uhdwidth,
        uhdheight,
        mkt: "zh-CN",
      };
      const response: { data: IBingData } = await axios.get(
        "https://cn.bing.com/HPImageArchive.aspx",
        { params }
      );
      data = getData(response.data?.images);
      updateTime = new Date().toISOString();
      if (isEmpty(data)) {
        ctx.status = 500;
        ctx.body = {
          code: 500,
          message: "获取失败",
        };
        return;
      }
      // 将数据写入缓存
      await cache.set(cacheKey, data, 300);
    }
    ctx.body = {
      code: 200,
      message: "OK",
      from,
      updateTime,
      data,
    };
  } catch (error) {
    logger.error(error);
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: "获取失败",
    };
  }
});
router.get("/bing/update", async (ctx: IBingCcontext) => {
  logger.info("手动触发 Bing 图片更新");
  bingFunc();
  ctx.body = {
    code: 200,
    message: "OK",
    data: "手动触发 Bing 图片更新",
  };
});

// 本地图片缓存目录
const cacheDir = path.join(process.cwd(), "/build/images");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

// 数据处理
const getData = (data: IImage[]): any[] => {
  if (!data) return [];
  return data.map((v) => {
    return {
      hash: v.hsh,
      startdate: v.startdate,
      enddate: v.enddate,
      title: v.title,
      description: separateDesc(v.copyright)?.description,
      copyright: separateDesc(v.copyright)?.copyright,
      urlbase: v.urlbase,
      url: `https://cn.bing.com/${v.url}`,
      searchLink: v.copyrightlink,
      aboutLink: `https://cn.bing.com/${v.quiz}`,
    };
  });
};

/**
 * 分离描述和版权信息
 * @param {string} value - 包含描述和版权信息的字符串
 * @returns {Object} 包含分离后的描述和版权信息的对象
 */
const separateDesc = (value: string) => {
  try {
    // 使用正则表达式匹配并提取版权信息
    const copyrightRegex = /\(© ([^\)]+)\)/;
    const match = value.match(copyrightRegex);
    const copyright = match ? match[1] : "";

    // 使用正则表达式删除版权信息
    const description = value.replace(copyrightRegex, "").trim();

    // 返回分离后的结果
    return {
      description: description,
      copyright: copyright,
    };
  } catch (error) {
    logger.error("分离描述和版权信息出错:", error);
    return {
      description: "",
      copyright: "",
    };
  }
};

export default router;
