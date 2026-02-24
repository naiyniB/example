const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// 初始化 Socket.io 并处理跨域
const io = new Server(server, {
  cors: {
    origin: "*", // 允许所有来源连接
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e7, // 允许发送最大 10MB 的文件（默认 1MB）
});

const users = {}; // 存储用户信息 { socketId: nickname }

io.on("connection", (socket) => {
  console.log(`新连接: ${socket.id}`);

  // 1. 设置昵称
  socket.on("set nickname", (name) => {
    users[socket.id] = name || "无名大侠";
    // 全局广播欢迎语
    io.emit("chat message", {
      user: "系统",
      type: "text",
      content: `🎉 ${users[socket.id]} 加入了聊天室`,
    });
  });

  // 2. 统一处理消息（文字或图片）
  socket.on("chat message", (data) => {
    // data 格式预期: { type: 'text'|'img', content: '内容' }
    const payload = {
      user: users[socket.id] || "匿名",
      type: data.type || "text",
      content: data.content,
    };

    // 广播给所有人（包括发送者自己，方便前端渲染）
    io.emit("chat message", payload);
  });

  // 3. 断开连接
  socket.on("disconnect", () => {
    if (users[socket.id]) {
      const name = users[socket.id];
      delete users[socket.id];
      io.emit("chat message", {
        user: "系统",
        type: "text",
        content: `👋 ${name} 离开了`,
      });
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`服务器启动在: http://localhost:${PORT}`);
});
