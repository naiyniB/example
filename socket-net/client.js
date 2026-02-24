const net = require("net");

// 连接到 3000 端口
const client = net.createConnection({ port: 3000 }, () => {
  console.log("成功连接到服务器！");
  client.write("Hello Server, 我是客户端！");
});

// 接收服务器的回传数据
client.on("data", (data) => {
  console.log(`收到回信: ${data.toString()}`);
  // 通信完可以手动关闭
  client.end();
});
