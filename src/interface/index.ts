export interface IImage {
  startdate: string;
  fullstartdate: string;
  enddate: string;
  url: string;
  urlbase: string;
  copyright: string;
  copyrightlink: string;
  title: string;
  quiz: string;
  wp: true;
  hsh: string;
  drk: number;
  top: number;
  bot: number;
  hs: any[];
}
export interface IBingData {
  images: IImage[];
  tooltips: {
    loading: string;
    previous: string;
    next: string;
    walle: string;
    walls: string;
  };
}

export interface IImageBody {
  code: number;
  message: string;
  from?: "cache" | "server";
  updateTime?: string;
  images?: IImage[];
}
