const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" }, // 允许跨域
});

app.use(express.static(__dirname));

io.on("connection", (socket) => {
  console.log("一位乐手连接成功，ID:", socket.id);

  // 接收某人的演奏信号，广播给所有人
  socket.on("play_note", (data) => {
    // data 包含 { role: 'piano' }
    io.emit("listen_note", {
      ...data,
      sender: socket.id,
    });
  });

  socket.on("disconnect", () => {
    console.log("乐手断开连接");
  });
});

const PORT = 3100;
http.listen(PORT, () => {
  console.log(`
    🎸 乐队服务器已启动！
    地址: http://localhost:${PORT}
    请在三个浏览器窗口打开此地址进行联机。
    `);
});
