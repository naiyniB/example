class Cat {
  constructor() {
    this.list = []; // 名单
  }

  // 订阅：把老鼠逃跑的函数存起来
  addMouse(runFunc) {
    this.list.push(runFunc);
  }

  // 发布：猫叫了
  meow() {
    console.log("🐱：喵！！数据（猫）来了！");
    this.list.forEach((runFunc) => runFunc());
    this.list = [];
  }
}

// 运行测试
const myCat = new Cat();
myCat.addMouse(() => console.log("🐭 老鼠A：溜了溜了"));
myCat.addMouse(() => console.log("🐭 老鼠B：快跑，铲屎的疯了"));
myCat.meow();
myCat.meow();
