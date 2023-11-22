import bing from "./bing";

const ALLOW_SCHEDULE = process.env.ALLOW_SCHEDULE || false;

if (ALLOW_SCHEDULE) {
  bing("0 20 * * *");
}
