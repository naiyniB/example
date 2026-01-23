// 这个代码将在 Worker 线程中执行

console.log("worker 开始执行了");

onmessage = function (e) {
  console.log("Worker received message:", e.data);

  // 模拟一个耗时任务
  let result = e.data * 2; // 假设我们在这里做一个计算
  postMessage(result); // 发送结果回主线程
};
