import Logger from "@emooa/logger";

export default new Logger({
  category: "api-tools",
  appenders: [
    {
      type: "stdout",
      colour: true,
      layout: {
        type: "basic",
      },
    },
  ],
});
