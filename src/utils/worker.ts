import { Worker } from "worker_threads";
import logger from "../utils/logger";

/**
 * 创建新线程
 * @param filePath
 * @returns
 */
export function runWorker(filePath: string) {
  logger.info(`Beginning worker: ${filePath}`);

  return new Promise((resolve, reject) => {
    const worker = new Worker(filePath);

    worker.on("message", (data) => {
      logger.info(`${filePath} worker success`, data);
      resolve(data);
    }); // 处理线程发送的消息
    worker.on("error", (e) => {
      logger.error(`${filePath} worker error`, e);
      reject(e);
    }); // 处理线程的错误
    worker.on("exit", (code: number) => {
      if (code !== 0) {
        logger.error(`${filePath} Worker stopped with exit code ${code}`);
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
