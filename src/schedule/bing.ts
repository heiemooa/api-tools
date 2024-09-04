import * as path from "path";
import axios from "axios";
import SimpleGit, { SimpleGitOptions } from "simple-git";
import fs from "fs-extra";
import isEmpty from "lodash.isempty";
import { spawnSync } from "child_process";
import get from "lodash.get";
import { downloadFile } from "../utils/file";
import {
  processImageGrey,
  processImageResize,
  processImageGauss,
  getImageMainColor,
  getImageBase64,
} from "../utils/image";
import dayjs from "dayjs";
import readline from "readline";
import logger from "../utils/logger";

let retryTime = 0; // 重试次数
let errorList: string | any[] = []; // 错误列表

const job = async () => {
  try {
    logger.info("定时任务开始，同步今日必应图片～");
    const time = dayjs().format("YYYY-MM-DD");

    const gits_dir = path.join(process.cwd(), "/build/gits"); // 保持到指定路径
    const folder = path.join(gits_dir, "folder"); // 资源文件夹路径
    const folder_bing = path.join(folder, "/image/bing", time); // 资源文件夹下的bing目录
    const api_tools = path.join(process.cwd());
    const api_tools_images = path.join(api_tools, `/build/images/bing/${time}`);

    logger.info("当前时间: " + time);
    logger.info("保存目录: " + folder);

    fs.ensureDirSync(gits_dir);
    fs.ensureDirSync(api_tools_images);

    // 获取bing官方数据
    const bing = await getBing();

    // 下载图片
    await Promise.all([
      downloadFile(
        "https://cn.bing.com" + bing.images[0].url,
        `${api_tools_images}/hd.jpg`
      ),
      downloadFile(
        "https://cn.bing.com" + bing.images[0].urlbase + "_UHD.jpg",
        `${api_tools_images}/uhd.jpg`
      ),
    ]);
    // 高斯/模糊/缩略图
    await Promise.all([
      processImageGrey(
        `${api_tools_images}/hd.jpg`,
        { quality: 90 },
        { write: `${api_tools_images}/greyscale.jpg` }
      ),
      processImageResize(
        `${api_tools_images}/hd.jpg`,
        {
          width: 480,
          height: 270,
          quality: 90,
        },
        {
          write: `${api_tools_images}/thumbnail.jpg`,
        }
      ),
      processImageGauss(
        `${api_tools_images}/hd.jpg`,
        {
          pixels: 20,
          quality: 90,
        },
        { write: `${api_tools_images}/gaussian.jpg` }
      ),
    ]);

    const json = {
      title: get(bing, "images[0].title", ""),
      copyright: get(bing, "images[0].copyright", ""),
      time,
      base64: await getImageBase64(`${api_tools_images}/hd.jpg`, {
        width: 16,
        height: 9,
        quality: 90,
      }),
      color: await getImageMainColor(`${api_tools_images}/hd.jpg`),
    };

    // 本来想用 data.json, 但是 nodemon 强大的监视功能会导致不断重启，虽然生产 pm2 不会有问题。索性不用json文件
    fs.writeFileSync(
      `${api_tools_images}/data.txt`,
      JSON.stringify(json, null, 2)
    );

    // 删除本地文件仓库
    logger.info(`删除本地文件仓库：${folder}`);
    fs.removeSync(folder);

    let _stage = "remote:";
    const options: Partial<SimpleGitOptions> = {
      baseDir: gits_dir,
      binary: "git",
      maxConcurrentProcesses: 6,
      trimmed: false,
      progress: ({ stage, progress, processed, total }) => {
        switch (stage) {
          case "remote:":
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
              `${stage}  ${progress}% (${processed}/${total})`
            );
            break;
          default:
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
              `${stage}:  ${progress}% (${processed}/${total})`
            );
            break;
        }

        if (_stage !== stage) {
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(`${_stage}  100% (${total}/${total}), done \n`);
          _stage = stage;
        }
      },
    };

    // 克隆仓库
    logger.info(`Cloning into:`, folder, "git@github.com:heiemooa/folder.git");
    const git = SimpleGit(options);
    await git.clone("git@github.com:heiemooa/folder.git", { "--depth": 1 });

    // 同步新图片
    logger.info(`, done \n开始同步图片..`, folder_bing);

    fs.ensureDirSync(folder_bing);
    fs.copySync(api_tools_images, folder_bing, {
      overwrite: false,
    });

    // 推送远程
    git.cwd(folder);
    const status = await git.status();
    if (!isEmpty(status.not_added)) {
      // 建立子进程，执行 folder 脚本程序，生成新的 output.json
      logger.log(`子进程 yarn && yarn deploy, cwd: ${folder}`);
      const yarn = spawnSync("yarn", [], {
        cwd: folder,
        stdio: "inherit",
      });
      const deploy = spawnSync("yarn", ["deploy"], {
        cwd: folder,
        stdio: "inherit",
      });
      // 获取子进程的输出和错误信息
      // 获取子进程的退出码
      if (yarn.status !== 0) {
        throw `部署失败, 子进程出错：${yarn.stderr.toString()}`;
      }
      if (deploy.status !== 0) {
        throw `部署失败, 子进程出错：${deploy.stderr.toString()}`;
      }

      logger.info("监测到更新，开始推送远程..");
      await git.add(".");
      await git.commit(`定时任务自动更新： ${status.not_added}`);
      await git.push();
      fs.removeSync(folder);
      logger.info("同步完成，新增：", status.not_added);
    } else {
      fs.removeSync(folder);
      logger.info("同步完成, 无新增");
    }
  } catch (e) {
    logger.error(e);
    retry();
  }
};

const retry = () => {
  if (retryTime >= 10) {
    retryTime = 0;
    logger.error("失败 " + errorList);
    return;
  }
  retryTime++;
  logger.error("发生了错误,正在重试中 次数: " + retryTime);
  errorList = [];
  setTimeout(function () {
    job();
  }, 10000 * retryTime);
};

const getBing = async () => {
  const response = await axios({
    method: "get",
    url: "https://cn.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN",
  });
  return response.data;
};

/**
 *  定时拉取必应图片上传Github ~ 每晚0点
 **/
export default job;
