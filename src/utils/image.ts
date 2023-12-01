const Jimp = require("jimp");
const Vibrant = require("node-vibrant");

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
  url: string | Buffer,
  { quality }: { quality: number },
  config?: { write: string }
) {
  console.info("图片处理中: 灰度");
  const img = (await Jimp.read(url)).quality(quality).greyscale();
  if (config?.write) {
    img.write(config?.write);
  }
  console.info("图片处理成功: 灰度");
  return img;
};

// 处理图片 高斯模糊
export const processImageGauss = async (
  url: string,
  { pixels, quality }: { pixels: number; quality: number },
  config?: { write: string }
) => {
  console.info("图片处理中: 高斯模糊");
  const img = (await Jimp.read(url)).quality(quality).gaussian(pixels);

  if (config?.write) {
    img.write(config?.write);
  }
  console.info("图片处理成功: 高斯模糊");
  return img;
};

// 处理图片 缩放 质量
export const processImageResize = async (
  url: string,
  {
    width,
    height,
    quality,
  }: { width: number; height: number; quality: number },
  config?: { write: string }
) => {
  console.info("图片处理中: 缩放");
  const img = (await Jimp.read(url)).resize(width, height).quality(quality);
  if (config?.write) {
    img.write(config?.write);
  }
  console.info(`图片处理成功: 缩放 width:${width} height:${height}`);
  return img;
};

// 处理图片 base64编码
export const getImageBase64 = async (
  url: string,
  { width, height, quality }: { width: number; height: number; quality: number }
) => {
  console.info("图片处理中: base64");
  const img = (await Jimp.read(url)).resize(width, height).quality(quality);
  const base64Image = await img.getBase64Async(Jimp.AUTO);
  console.info("图片处理成功: base64");
  return base64Image;
};

// 获取图片的主要颜色
export const getImageMainColor = async function (url: string) {
  const palette = await Vibrant.from(url).getPalette();
  const paletteObj: { [key: string]: any } = {};
  Object.keys(palette).map((item) => {
    paletteObj[item] = rgbToHex(palette[item].rgb);
  });
  console.info("图片处理成功: 获取主要颜色");
  return paletteObj;
};

export const processImage = async function (
  url: string | Buffer,
  {
    gaussian,
    quality,
    width,
    height,
    greyscale,
    base64,
  }: {
    base64?: boolean;
    greyscale?: boolean;
    gaussian?: number;
    quality?: number;
    width?: number;
    height?: number;
  },
  config?: { write: string }
) {
  let img = await Jimp.read(url);
  if (width > 0 || height > 0) {
    console.info(`图片处理中: 缩放 ${width} x ${height}`);
    img = img.resize(width || Jimp.AUTO, height || Jimp.AUTO);
  }
  if (quality > 0 && quality < 100) {
    img = img.quality(quality);
  }
  if (greyscale) {
    console.info(`图片处理中: 灰度`);
    img = img.greyscale();
  }
  if (gaussian > 0 && gaussian < 20) {
    console.info(`图片处理中: 高斯模糊 ${gaussian}`);
    img = img.gaussian(gaussian);
  }
  if (config?.write) {
    img.write(config?.write);
  }
  if (base64) {
    console.info(`图片处理中: base64`);
    img = img.getBase64Async(Jimp.AUTO);
  }
  console.info("图片处理成功");
  return img;
};
