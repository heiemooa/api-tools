import axios from "axios";
import fs from "fs-extra";
import logger from "../utils/logger";

export const downloadFile = async (url: string, dir?: string) => {
  // 下载图片并将其保存到本地
  const imageResponse = await axios.get(url, {
    responseType: "arraybuffer",
  });
  const imageData = Buffer.from(imageResponse.data, "binary");
  if (dir) {
    fs.writeFileSync(dir, imageData);
  }
  logger.info("下载完成：", url, dir);
  return imageData;
};
