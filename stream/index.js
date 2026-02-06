class MiniStream {
  constructor({ start, pull, highWaterMark = 3 }) {
    this.dataQueue = []; // 货架：存放数据 (Data Chunks)
    this.readRequests = []; // 账本：存放读者的订单 (Promise Resolvers)
    this.hwm = highWaterMark; // 高水位线：仓库最大容量
    this.isClosed = false;

    // 1. 生产者代理人 (Controller)
    const controller = {
      // 这里的箭头函数保证了 this 指向 MiniStream 实例
      enqueue: (chunk) => this._enqueue(chunk),
      close: () => this._close(),
      // 暴露给生产者的仪表盘：还剩多少空间可以生产？
      desiredSize: () => this.hwm - this.dataQueue.length,
    };

    this._pull = pull;

    // 2. 启动初始化
    if (start) {
      start(controller);
    }
  }

  // --- 内部逻辑：生产者入库 ---
  _enqueue(chunk) {
    if (this.isClosed) return;

    if (this.readRequests.length > 0) {
      // 【观察者模式】：有人在等，直接“通知”排在第一位的观察者
      const resolve = this.readRequests.shift();
      resolve({ value: chunk, done: false });
    } else {
      // 没人等货，存入仓库
      this.dataQueue.push(chunk);
    }
  }

  _close() {
    this.isClosed = true;
    // 结业清理：兑现所有剩余订单
    while (this.readRequests.length > 0) {
      const resolve = this.readRequests.shift();
      resolve({ value: undefined, done: true });
    }
  }

  // --- 消费端接口：Reader ---
  getReader() {
    return {
      read: async () => {
        // 1. 【迭代器模式】：如果有现货，按序拿走
        if (this.dataQueue.length > 0) {
          const chunk = this.dataQueue.shift();
          return { value: chunk, done: false };
        }

        // 2. 已关闭状态
        if (this.isClosed) {
          return { value: undefined, done: true };
        }

        // 3. 【观察者模式】：没货，留下一个“欠条”（Promise）
        const promise = new Promise((resolve) => {
          this.readRequests.push(resolve);
        });

        // 4. 【背压反馈】：发现货不够，立刻触发补货
        // 只有当仓库还没爆满时，才去喊生产者补货
        if (this._pull && this.dataQueue.length < this.hwm) {
          this._pull({
            enqueue: (c) => this._enqueue(c),
            close: () => this._close(),
          });
        }

        return promise;
      },
    };
  }
}
// 1. 定义流
const myStream = new MiniStream({
  highWaterMark: 2, // 仓库只能放2个货
  async pull(controller) {
    console.log("🛠️ [生产者] 收到补货信号...");
    // 模拟异步生产
    setTimeout(() => {
      const data = `商品-${Math.floor(Math.random() * 100)}`;
      console.log(`📦 [生产者] 生产完成并入库: ${data}`);
      controller.enqueue(data);
    }, 1000);
  },
});

// 2. 获取读取器
const reader = myStream.getReader();

// 3. 消费者开始“拉取”
async function startConsuming() {
  console.log("🚀 [消费者] 请求第1个数据...");
  const res1 = await reader.read();
  console.log("✅ [消费者] 拿到:", res1.value);

  console.log("🚀 [消费者] 请求第2个数据...");
  const res2 = await reader.read();
  console.log("✅ [消费者] 拿到:", res2.value);
}

startConsuming();
