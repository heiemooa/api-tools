import axios from "axios";
import fs from "fs-extra";

export const downloadFile = async (url: string, dir?: string) => {
  // 下载图片并将其保存到本地
  const imageResponse = await axios.get(url, {
    responseType: "arraybuffer",
  });
  const imageData = Buffer.from(imageResponse.data, "binary");
  if (dir) {
    fs.writeFileSync(dir, imageData);
  }
  console.log("下载完成：", url, dir);
  return imageData;
};
