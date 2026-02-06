// 这里的代码就是我们之前总结的“管家”逻辑
class EventEmitter {
  constructor() {
    this.events = {};
  }
  on(topic, cb) {
    if (!this.events[topic]) this.events[topic] = [];
    this.events[topic].push(cb);
  }
  emit(topic, data) {
    if (this.events[topic]) this.events[topic].forEach((cb) => cb(data));
  }
  off(topic) {
    topic.forEach((item) => {
      if (this.events[item]) {
        this.events[item].pop();
        console.log("event off" + item);
      }
    });
  }
}

const HomeCenter = new EventEmitter();
// 1. 空调：只关心温度
HomeCenter.on("temperature_change", (temp) => {
  if (temp > 28) {
    console.log(`[空调] 当前温度 ${temp}℃，太热了，自动开启制冷模式！`);
  } else {
    console.log(`[空调] 当前温度 ${temp}℃，很凉爽，保持待机。`);
  }
});

// 2. 灯光：关心门锁状态
HomeCenter.on("door_open", () => {
  console.log(`[灯光] 欢迎回家！客厅灯已为你点亮。`);
});

// 3. 报警器：同时关心门锁和温度（极端情况）
HomeCenter.on("door_open", () => {
  console.log(`[安全系统] 门已开启，正在进行人脸识别...`);
});

HomeCenter.on("temperature_change", (temp) => {
  if (temp > 50) {
    console.log(
      `[安全系统] ⚠️警告：检测到异常高温（${temp}℃），可能发生火灾！`,
    );
  }
});

HomeCenter.on("door_close", (temp) => {
  temp.off(["door_open", "temperature_change"]);
});
HomeCenter.emit("door_close",HomeCenter)
