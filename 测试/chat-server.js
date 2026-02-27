const { WebSocketServer } = require("ws");

// 在 8080 端口启动服务器
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  console.log("新客户端连接成功！");

  // 监听客户端发来的消息
  ws.on("message", (data) => {
    // 原生收到的是 Buffer 数据，需要转成字符串
    console.log("收到消息:", data.toString());

    // 回复客户端
    ws.send("服务器已收到：" + data);
  });

  ws.on("close", () => {
    console.log("客户端已断开");
  });
});

console.log("WebSocket 服务器运行在 ws://localhost:8080");
