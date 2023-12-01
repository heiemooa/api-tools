import Koa, { Context } from "koa";
import router from "./routers";
import server from "koa-static";
import views from "koa-views";
import cors from "koa2-cors";
import bodyParser from "koa-bodyparser";
import * as fs from "fs";
import logger from "koa-logger";
import dotenv from "dotenv";
import "./schedule";

dotenv.config();

// 配置信息
const domain = process.env.ALLOWED_DOMAIN || "*";

const dev = process.env.NODE_ENV !== "production";

const app = new Koa({ proxy: !dev });

app.use(logger());
app.use(server(__dirname));
app.use(views(__dirname));

app.use(bodyParser());

app.use(
  cors({
    origin: domain,
  })
);

app.use(async (ctx: Context, next: () => any) => {
  // console.log("ctx.headers", ctx.headers);
  if (domain === "*") {
    await next();
  } else {
    if (ctx.headers.origin === domain || ctx.headers.referer === domain) {
      await next();
    } else {
      ctx.status = 403;
      ctx.body = {
        code: 403,
        message: "访问受限",
      };
    }
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

// 添加404处理中间件
app.use((ctx: Context) => {
  ctx.status = 404;
  ctx.type = "html";
  ctx.body = fs.readFileSync(__dirname + "/404.html", "utf-8");
});
export default app;
