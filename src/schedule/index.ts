import bing from "./bing";
import schedule from "node-schedule";

const ALLOW_SCHEDULE = process.env.ALLOW_SCHEDULE || false;

if (ALLOW_SCHEDULE) {
  console.log("定时任务已开启: bing");
  schedule.scheduleJob("0 20 * * *", async () => {
    bing();
  });
}
