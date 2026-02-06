class SimpleStream {
  constructor() {
    this.queue = []; // 存放包裹
    this.waiters = []; // 存放正在【等待包裹】的消费者 (观察者模式)
    this.pausedBuffer = []; // 存放正在【被挂起】的生产者 resolve (背压控制)
    this.limit = 2; // 最大缓存数
  }

  enqueue(item) {
    if (this.waiters.length > 0) {
      const resolve = this.waiters.shift();
      resolve({ value: item, done: false });
      return Promise.resolve();
    }

    if (this.queue.length < this.limit) {
      this.queue.push(item);
      return Promise.resolve();
    } else {
      console.log("⚠️ 库存满了，生产者请排队等待...");
      return new Promise((resolve) => {
        this.pausedBuffer.push(() => {
          this.enqueue(item);
          resolve();
        });
      });
    }
  }

  // 消费者调用：异步迭代器暗号
  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.queue.length > 0) {
          const item = this.queue.shift();
          if (this.pausedBuffer.length > 0) {
            const resolve = this.pausedBuffer.shift();
            resolve();
          }
          return Promise.resolve({ value: item, done: false });
        }
        // 没有包裹就存进等待队列

        return new Promise((resolve) => this.waiters.push(resolve));
      },
    };
  }
}

const stream = new SimpleStream();

(async () => {
  for (let i = 1; i <= 5; i++) {
    await stream.enqueue(`包裹 ${i}`);
    console.log(`✅ 成功塞入: 包裹 ${i}`);
  }
})();

setTimeout(async () => {
  for await (const pkg of stream) {
    console.log(`📦 消费了: ${pkg}`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}, 1000);
