class SmartCat {
  constructor() {
    this.waitList = []; // 订单队列：存放所有待执行的 resolve 开关
  }

  // 1. 读者下单：返回一个“现在还没结果”的承诺（Promise）
  waitForMeow() {
    return new Promise((resolve) => {
      this.waitList.push(resolve);
    });
  }

  // 2. 生产者发货：猫一叫，按下所有开关
  meow() {
    console.log("🐱：喵！！（正在触发所有 resolve）");

    // 遍历名单，执行每一个 resolve 函数
    this.waitList.forEach((resolve) => {
      resolve(); // 按下开关，对应的 await 或 .then() 就会立刻被激活
    });

    // 清空名单（一次性兑现）
    this.waitList = [];
  }
}

// --- 运行效果 ---
const cat = new SmartCat();

// 老鼠 A 和 B 只是在“等”，代码停在了这里
cat.waitForMeow().then(() => console.log("🐭 老鼠 A 收到通知：猫叫了，快跑！"));
cat.waitForMeow().then(() => console.log("🐭 老鼠 B 收到通知：撤退！"));

console.log("... 此时老鼠们正在静静等待 ...");

setTimeout(() => {
  cat.meow(); // 3秒后，猫叫，上面的两个 .then() 才会打印
}, 3000);
