/**
 * 1、部署 vercel 之后，如果通过动态注册路由失败
 * 2、path.join(__dirname) 得到 ["index.js","index.js.map"]，img、bing等文件似乎被忽略了
 * 3、本地运行没问题，有人知道是为什么吗
 */

import Router from "@koa/router";
import ip from "./ip";
import status from "./status";
import bing from "./bing";
import aimg from "./aimg";
import img from "./img";
import { Context } from "koa";

type IContext = Context & {
  query: {
    [key: string]: any;
  };
};

const router = new Router();

// 避免后面多个接口的 query 数据解析麻烦，统一处理
router.use(async (ctx: IContext, next: () => any) => {
  const query: any = ctx.query;
  for (let key in query) {
    if (query[key] === "true") {
      ctx.query[key] = true;
    }
    if (query[key] === "false") {
      ctx.query[key] = false;
    }
  }
  await next();
});
router.use(bing.routes());
router.use(aimg.routes());
router.use(img.routes());
router.use(ip.routes());
router.use(status.routes());

// function registerRoutes() {
//   const routesDir = path.join(__dirname);

//   const files = fs
//     .readdirSync(routesDir)
//     .filter((filename) => !/^index\.[a-zA-Z]+$/.test(filename))
//     .filter((filename) =>
//       [".js", ".ts"].includes(path.extname(filename).toLowerCase())
//     )
//     .forEach((filename) => {
//       const _router = require(path.join(routesDir, filename)).default;
//       if (_router instanceof Router) {
//         router.use(_router.routes());
//         router.use(_router.allowedMethods());
//       }
//     });

//   return files;
// }

// router.get("/register", (ctx) => {
//   ctx.body = registerRoutes();
// });

export default router;
