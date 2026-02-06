class SmartLocker {
  constructor() {
    this.waitList = [];
  }
  waitPackage() {
    return new Promise((resolve) => {
      this.waitList.push(resolve);
    });
  }
  deliver(s) {
    this.waitList.forEach((resolve) => resolve(s));
    this.waitList = [];
  }
}
const locker = new SmartLocker();

// 消费者 A 在等
locker.waitPackage().then((data) => {
  console.log(`📦 消费者 A 拆开了包裹，里面是：${data}`);
});

// 消费者 B 也在等
locker.waitPackage().then((data) => {
  console.log(`📦 消费者 B 拆开了包裹，里面是：${data}`);
});

setTimeout(() => {
  locker.deliver("一台新款 MacBook Pro"); // 3秒后送达
}, 3000);
