class Marquee {
    constructor(containerId, speed = 3) {
      this.container = document.getElementById(containerId);
      if (!this.container)
        throw new Error(`Element with id "${containerId}" not found.`);

    this.speed = speed;
    this.translateX = 0;
    this.rafId = 0;
    this.isRunning = false;
    this.lastTimestamp = 0;
    this.isPageHidden = document.hidden;
    this.style = this.container.style;

    // 保存原始子元素
    this.originalChildren = Array.from(this.container.children);

    // 克隆一次形成无缝循环
    this.originalChildren.forEach((child) =>
      this.container.appendChild(child.cloneNode(true)),
    );

    // 容器宽度的一半
    this.itemsWidth = this.container.scrollWidth / 2;

    this.animate = this.animate.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    this.style.willChange = "transform";
    this.style.transform = "translate3d(0, 0, 0)";

    this.container.addEventListener("mouseenter", this.pause);
    this.container.addEventListener("mouseleave", this.resume);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    if (!this.isPageHidden) {
      this.resume();
    }
  }

  animate(timestamp) {
    if (!this.isRunning) return;

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = timestamp;
    }

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.translateX -= this.speed * (deltaTime / 16.6667);

    if (this.translateX <= -this.itemsWidth) {
      this.translateX = this.translateX % this.itemsWidth;
    }

    this.style.transform = `translate3d(${this.translateX}px, 0, 0)`;
    this.rafId = requestAnimationFrame(this.animate);
  }

  pause() {
    this.isRunning = false;
    this.lastTimestamp = 0;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  resume() {
    if (this.isRunning || this.isPageHidden) return;

    this.isRunning = true;
    this.lastTimestamp = 0;
    this.rafId = requestAnimationFrame(this.animate);
  }

  handleVisibilityChange() {
    this.isPageHidden = document.hidden;

    if (this.isPageHidden) {
      this.pause();
      return;
    }

    this.resume();
  }

  destroy() {
    this.pause();
    this.container.removeEventListener("mouseenter", this.pause);
    this.container.removeEventListener("mouseleave", this.resume);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.style.willChange = "";
  }
}

// 使用示例
const marquee = new Marquee("logos", 3);
