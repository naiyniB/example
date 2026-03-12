const reader = new ReadableStream({
  start(controller) {
    this.string = "lorem ipsum dolor sit amet consectetur adipisicing elit";
  },
  pull(controller) {
    const chunk = this.string.slice(0, 1);
    this.string = this.string.slice(1);
    controller.enqueue(chunk);
    if (this.string.length === 0) {
      controller.close();
    }
  },
}).getReader();

(async () => {
  for await (const element of ) {
    console.log(element);
  }
})();

console.log("结束");
