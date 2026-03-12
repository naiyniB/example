const { WebSocketServer } = require("ws");

// 在 8080 端口启动服务器
const wss = new WebSocketServer({ port: 8080 });
const user = [];
wss.on("connection", (ws) => {
  console.log("新客户端连接成功！");
  user.push(ws);
  // 监听客户端发来的消息
  ws.on("message", (data) => {
    // 原生收到的是 Buffer 数据，需要转成字符串
    console.log("收到消息:", data.toString());
    user.forEach((client) => {
      // 改名为 client 避免冲突
      if (client !== ws) {
        // 直接用外层的 ws，不用 this
        client.send(data.toString());
      }
    });
  });

  wss.on("close", () => {
    const index = user.indexOf(ws);
    if (index !== -1) {
      user.splice(index, 1); // 从数组中移除断开的连接
    }
    console.log("客户端已断开，当前人数:", user.length);
  });
});

console.log("WebSocket 服务器运行在 ws://localhost:8080");
