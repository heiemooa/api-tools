import app from "./app";
import net from "net";

process.env.PORT = process.env.PORT || "5555";
process.env.HOST = process.env.HOST || "127.0.0.1";

const port = Number(process.env.PORT);

// 启动应用程序并监听端口
const startApp = (port: number, host?: string) => {
  app.listen(port, host, () => {
    console.log(`运行: http://${host}:${port}`);
  });
};

// 检测端口是否被占用
const checkPort = (port: number) => {
  return new Promise((resolve, reject) => {
    const server = net
      .createServer()
      .once("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          console.log(`端口 ${port} 已被占用, 正在尝试其他端口...`);
          server.close();
          resolve(false);
        } else {
          reject(err);
        }
      })
      .once("listening", () => {
        server.close();
        resolve(true);
      })
      .listen(port);
  });
};

// 尝试启动应用程序
const tryStartApp = async (port: number, host: string) => {
  let isPortAvailable = await checkPort(port);
  while (!isPortAvailable) {
    port++;
    isPortAvailable = await checkPort(port);
  }
  startApp(port, host);
};

tryStartApp(port, process.env.HOST);
