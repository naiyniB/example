const net = require("net");

// 1. 创建一个“名单”，用来存放所有的客户端 socket
let clients = [];

const server = net.createServer((socket) => {
  let name = "";
  // 为每个新连接起个临时名字
  const clientAddress = `${socket.remoteAddress}:${socket.remotePort}`;
  console.log(`[新连接] ${clientAddress} 加入了聊天室`);
  clients.forEach((client) => {
    client.write(`[新连接] ${clientAddress} 加入了聊天室\n`);
    client.write(`当前在线人数: ${clients.length + 1}\n`);
  });
  // 2. 把新客人的实例存入名单
  clients.push(socket);

  // 欢迎语（仅发给当前这一个人）
  socket.write(`欢迎来到 Node.js 聊天室！当前在线人数: ${clients.length}\n`);

  // 3. 监听说话事件
  socket.on("data", (data) => {
    if (!name) {
      name = data.toString().trim();
      console.log(`[设置名字] ${clientAddress} 设置名字为: ${name}`);
      return;
    }
    const message = data.toString().trim();
    console.log(`[收到消息] ${clientAddress}: ${message}`);
    clients.forEach((client) => {
      if (client !== socket) {
        client.write(`[${name}] 说: ${message}\n`);
      }
    });
  });

  // 4. 监听离开事件
  socket.on("end", () => {
    console.log(`[断开连接] ${clientAddress} 离开了`);
    // 从名单中剔除
    clients = clients.filter((c) => c !== socket);
  });

  // 5. 错误处理（防止客户端强行关闭导致服务器崩溃）
  socket.on("error", (err) => {
    console.log(`[发生错误] ${clientAddress}: ${err.message}`);
    clients = clients.filter((c) => c !== socket);
  });
});

// 6. 启动服务器
server.listen(3000, () => {
  console.log("聊天室服务器已在 3000 端口启动...");
});
