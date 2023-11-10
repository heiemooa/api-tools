/**
 * 1、部署 vercel 之后，如果通过动态注册路由失败
 * 2、path.join(__dirname) 得到 ["index.js","index.js.map"]，img、bing等文件似乎被忽略了
 * 3、本地运行没问题，有人知道是为什么吗
 */

// import * as path from "path";
// import * as fs from "fs";
import Router from "@koa/router";
import ip from "./ip";
import status from "./status";
import bing from "./bing";
import img from "./img";

const router = new Router();

router.use(bing.routes());
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
