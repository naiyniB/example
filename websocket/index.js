const { WebSocketServer } = require("ws");

// 在 8080 端口创建 WebSocket 服务器
const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (socket) => {
  console.log("新用户连接成功！");

  // 监听客户端发来的消息
  socket.on("message", (data) => {
    console.log("收到原始数据:", data);

    // 将消息广播给所有连接的客户端
    wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // 1 表示连接处于 OPEN 状态
        client.send(`广播消息: ${data}`);
      }
    });
  });

  socket.on("close", () => console.log("用户断开连接"));
});

console.log("聊天室服务器运行在 ws://localhost:8080");
