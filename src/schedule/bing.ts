import schedule from "node-schedule";
import * as path from "path";
import axios from "axios";
import SimpleGit, { SimpleGitOptions } from "simple-git";
import fs from "fs-extra";
import isEmpty from "lodash.isempty";

const start = (time = "0 20 * * *") => {
  // 定时拉取必应图片上传Github ~ 每日晚上8点
  schedule.scheduleJob(time, async (date) => {
    try {
      console.info("定时任务开始，同步今日必应图片～");

      const root_dir = path.join(process.cwd(), "../"); // 根路径
      const folder = path.join(root_dir, "folder"); // 资源文件夹路径
      const folder_bing = path.join(folder, "/image/bing"); // 资源文件夹下的bing目录

      const api_tools = path.join(process.cwd());
      const api_tools_images = path.join(api_tools, "/build/images");

      const http = axios.create({
        baseURL: `http://localhost:${process.env.PORT}`,
      });

      // 获取当前日期，格式为 YYYY-MM-DD
      const currentDate = date.toISOString().split("T")[0];
      const image = path.join(api_tools_images, `/${currentDate}.jpg`);

      // 判断本地图片是否存在，如果不存在创建图片
      if (!fs.pathExistsSync(image)) {
        console.info("本地不存在，拉取今日必应新图片");
        await http.get("/bing/image");
      }

      // 删除本地文件仓库
      console.info(`删除本地文件仓库：${folder}`);
      fs.removeSync(folder);

      const options: Partial<SimpleGitOptions> = {
        baseDir: root_dir,
        binary: "git",
        maxConcurrentProcesses: 6,
        trimmed: false,
      };

      // 克隆仓库
      console.info(`克隆仓库 git@github.com:heiemooa/folder.git 到 ${folder}`);
      const git = SimpleGit(options);
      await git.clone("git@github.com:heiemooa/folder.git", { "--depth": 1 });

      // 同步新突破
      console.info(`开始同步图片..`);
      fs.ensureDirSync(folder_bing);
      fs.copySync(api_tools_images, folder_bing, { overwrite: false });

      // 推送远程
      git.cwd(folder);
      const status = await git.status();
      if (!isEmpty(status.not_added)) {
        console.info("监测到更新，开始推送远程..");
        await git.add(".");
        await git.commit(`update: ${status.not_added}`);
        await git.push();
        fs.removeSync(folder);
        console.info("同步完成，新增：", status.not_added);
      } else {
        fs.removeSync(folder);
        console.info("同步完成, 无新增");
      }
    } catch (e) {
      console.error(e);
    }
  });
};

export default start;
