const net = require("net");
let clients = [];
let server = net.createServer((socket) => {
  clients.push(socket);
  socket.write("Welcome to the server!");
  socket.on("data", (data) => {
    console.log(data.toString());
    clients.forEach((client) => {
      if (client !== socket) {
        client.write(data);
      }
    });
  });
  socket.on("end", () => {
    console.log("关闭");
    clients.splice(clients.indexOf(socket), 1);
    console.log(clients.length);
  });
});

server.listen(3000, () => {
  console.log("Server started on port 3000");
});
