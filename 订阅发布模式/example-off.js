class MyEmitter {
  constructor() {
    this.events = {};
  }

  on(name, fn) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(fn);
  }

  emit(name, data) {
    if (!this.events[name]) {
      return;
    }
    this.events[name].forEach((fn) => fn(data));
  }

  off(name) {
    if (!this.events[name]) {
      return;
    }
    this.events[name] = [];
  }
}
const emitter = new MyEmitter();
emitter.on("click", () => console.log("click"));
emitter.on("click", () => console.log("click2"));
emitter.on("click", () => console.log("click3"));
emitter.emit("click");
emitter.off("click");
emitter.emit("click");
