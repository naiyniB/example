const obj = {
  q: [], // 观察者队列
  V: 1, // 状态值

  // 修改值并通知所有人
  setV(v) {
    this.V = v;
    this.q.forEach((callback) => {
      callback(v);
    });
  },

  // 订阅并获取当前值
  subscribe(callback) {
    this.q.push(callback);
    return this.V;
  },
};

// 使用 let 允许变量被更新
let b = obj.subscribe((v) => {
  b = v;
  console.log("b 更新了:", b);
});

let c = obj.subscribe((v) => {
  c = v;
  console.log("c 更新了:", c);
});
let c1 = obj.subscribe((v) => {
  c = v;
  console.log("1c 更新了:", c);
});
console.log("初始值:", b, c);

// 测试更新
obj.setV(100123);
obj.setV(1001231);
