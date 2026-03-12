// 1. 创建 Worker
const worker = new Worker("./b.js");

// 2. 发送消息给 Worker
worker.postMessage({
  type: "CALCULATE",
  data: [1, 2, 3, 4, 5],
});

// 3. 接收 Worker 的消息
worker.onmessage = function (event) {
  console.log("收到Worker结果:", event.data);

  // 4. 使用完成后终止 Worker
  worker.terminate();
};

// 错误处理
worker.onerror = function (error) {
  console.error("Worker 错误:", error);
};
