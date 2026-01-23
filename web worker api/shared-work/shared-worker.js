// 共享 Worker 脚本
onconnect = function (e) {
  const port = e.ports[0];

  // 监听从页面来的消息
  port.onmessage = function (event) {
    console.log("Worker 收到消息:", event.data);

    // 处理收到的数据（例如：更新计数器）
    let updatedData = event.data + 1; // 假设数据是一个计数器

    // 向所有连接的页面发送更新后的数据
    port.postMessage(updatedData);
  };
};
