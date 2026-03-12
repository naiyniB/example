class PaymentManager {
  constructor() {
    this.strategies = {}; // 存储支付策略
  }

  // 注册支付方式
  register(name, strategy) {
    this.strategies[name] = strategy;
  }

  // 执行支付
  pay(name, amount) {
    name.forEach((element) => {
      const p = this.strategies[element.name];
      if (!p) {
        console.log(`支付方式 ${element.name} 未注册`);
        return;
      }
      p(amount)
    });
  }
}
const a = new PaymentManager();
a.register("aliyun", () => {
  console.log("aliyun");
});
a.register("tenlent", () => {
  console.log("tenlent");
});
a.register("ApplePay", () => {
  console.log("tenlent");
});
