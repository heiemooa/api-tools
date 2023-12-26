import bing from "./bing";
import schedule from "node-schedule";
import logger from "../utils/logger";

const ALLOW_SCHEDULE = process.env.ALLOW_SCHEDULE || false;

if (ALLOW_SCHEDULE) {
  logger.info("定时任务已开启: bing");
  schedule.scheduleJob("0 0 * * *", async () => {
    bing();
  });
}
