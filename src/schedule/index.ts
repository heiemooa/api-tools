import bing from "./bing";

const ALLOW_SCHEDULE = process.env.ALLOW_SCHEDULE || false;

if (ALLOW_SCHEDULE) {
  console.log("定时任务已开启: bing");
  bing();
}
