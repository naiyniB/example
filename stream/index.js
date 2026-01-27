// 1️⃣ 创建一个可读流
const stream = new ReadableStream({
  start(controller) {
    let i = 0;

    // 每秒生成一个 chunk
    const id = setInterval(() => {
      const chunk = `Chunk ${i}`;
      console.log("生成 chunk:", chunk);

      controller.enqueue(chunk); // 推送到流里
      i++;

      if (i > 4) {
        // 生成5个 chunk 后结束
        controller.close(); // 关闭流
        clearInterval(id);
        console.log("流已关闭");
      }
    }, 1000);
  },
});

// 2️⃣ 读取这个流
async function readStream() {
  const reader = stream.getReader();

  while (true) {
    const { value, done } = await reader.read(); // 每次 await 得到一个 chunk
    if (done) break; // 流结束
    console.log("读取 chunk:", value);
  }

  console.log("读取完成");
}

// 3️⃣ 开始读取
readStream();
