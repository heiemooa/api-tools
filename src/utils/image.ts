const Jimp = require("jimp");
const Vibrant = require("node-vibrant");
const path = require("path");

// ------ 逻辑函数 start ------
// 16进制转换
function componentToHex(num: number) {
  var hex = num.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

// 将rgb颜色转换为16进制颜色
function rgbToHex([r, g, b]: number[]) {
  return (
    "#" +
    componentToHex(Math.round(r)) +
    componentToHex(Math.round(g)) +
    componentToHex(Math.round(b))
  );
}
// ------ 逻辑函数 end ------

// 处理图片 灰度
export const processImageGrey = async function (
  image: string,
  { quality }: { quality: number }
) {
  console.info("图片处理中: 灰度");

  const img = await Jimp.read(image);

  img
    .greyscale()
    .quality(quality)
    .write(`${path.dirname(image)}/hd_greyscale.jpg`);
  console.info("图片处理成功: 灰度");
};

// 处理图片 高斯模糊
export const processImageGauss = async (
  image: string,
  { pixels, quality }: { pixels: number; quality: number }
) => {
  console.info("图片处理中: 高斯模糊");
  const img = await Jimp.read(image);
  img
    .quality(quality)
    .gaussian(pixels)
    .write(`${path.dirname(image)}/hd_gaussian_${pixels}.jpg`);
  console.info("图片处理成功: 高斯模糊");
};

// 处理图片 缩放 质量
export const processImageResize = async (
  image: string,
  { width, height, quality }: { width: number; height: number; quality: number }
) => {
  console.info("图片处理中: 缩放");
  const img = await Jimp.read(image);
  await img
    .resize(width, height)
    .quality(quality)
    .write(`${path.dirname(image)}/hd_thumbnail_${width}_${height}.jpg`);
  console.info(`图片处理成功: 缩放 width:${width} height:${height}`);
};

// 处理图片 base64编码
export const getImageBase64 = async (
  image: string,
  { width, height, quality }: { width: number; height: number; quality: number }
) => {
  console.info("图片处理中: base64");
  const img = await Jimp.read(image);
  const base64Image = await img
    .resize(width, height)
    .quality(quality)
    .getBase64Async(Jimp.AUTO);
  console.info("图片处理成功: base64");
  return base64Image;
};

// 获取图片的主要颜色
export const getImageMainColor = async function (image: string) {
  const palette = await Vibrant.from(image).getPalette();
  const paletteObj: { [key: string]: any } = {};
  Object.keys(palette).map((item) => {
    paletteObj[item] = rgbToHex(palette[item].rgb);
  });
  console.info("图片处理成功: 获取主要颜色");
  return paletteObj;
};
