class TaskBoard {
  constructor() {
    this.dragCount = 0;
    this.currentDragElement = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateStats();
  }

  setupEventListeners() {
    // 任务卡片事件
    document.querySelectorAll(".task").forEach((task) => {
      task.addEventListener("dragstart", this.handleDragStart.bind(this));
      task.addEventListener("dragend", this.handleDragEnd.bind(this));
    });

    // 列事件
    document.querySelectorAll(".column").forEach((column) => {
      column.addEventListener("dragover", this.handleDragOver.bind(this));
      column.addEventListener("dragenter", this.handleDragEnter.bind(this));
      column.addEventListener("dragleave", this.handleDragLeave.bind(this));
      column.addEventListener("drop", this.handleDrop.bind(this));
    });
  }

  handleDragStart(event) {
    console.log("🚀 dragstart:", event.target.id);

    this.currentDragElement = event.target;
    // 设置this的currentDragElement为event.target
    // 设置拖拽数据
    event.dataTransfer.setData("text/plain", event.target.id);
    event.dataTransfer.effectAllowed = "move";

    // 添加要拖拽元素的 dragstart样式
    event.target.classList.add("dragging");

    // 设置自定义拖拽图像
    this.setDragImage(event);
  }

  handleDragOver(event) {
    console.log("📦 dragover:", event.currentTarget.id);

    // 🎯 必须阻止默认行为！
    event.preventDefault();

    // 设置拖拽效果
    event.dataTransfer.dropEffect = "move";

    // 计算插入位置
    this.updateDropIndicator(event);
  }

  handleDragEnter(event) {
    console.log("👉 dragenter:", event.currentTarget.id);

    // event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  }

  handleDragLeave(event) {
    console.log("👈 dragleave:", event.currentTarget.id);

    // 只有当鼠标离开列边界时才移除样式
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove("drag-over");
      this.hideDropIndicator();
    }
  }

  handleDrop(event) {
    console.log("🎯 drop:", event.currentTarget.id);

    event.preventDefault();

    // 清理样式
    event.currentTarget.classList.remove("drag-over");
    this.hideDropIndicator();

    // 获取拖拽数据
    const taskId = event.dataTransfer.getData("text/plain");
    const draggedElement = document.getElementById(taskId);

    if (draggedElement && draggedElement !== event.currentTarget) {
      // 插入到正确位置
      this.insertAtPosition(event.currentTarget, draggedElement, event.clientY);

      // 更新统计
      this.dragCount++;
      this.updateStats();

      // 显示成功反馈
      this.showSuccessFeedback(event.currentTarget);
    }
  }

  handleDragEnd(event) {
    console.log("🏁 dragend:", event.target.id);

    // 清理样式
    event.target.classList.remove("dragging");
    document.querySelectorAll(".column").forEach((col) => {
      col.classList.remove("drag-over", "drop-allowed");
    });
    this.hideDropIndicator();

    this.currentDragElement = null;
  }

  setDragImage(event) {
    // 创建自定义拖拽图像
    const dragImage = event.target.cloneNode(true);
    dragImage.style.width = event.target.offsetWidth + "px";
    dragImage.style.opacity = "0.8";
    dragImage.style.background = "#e3f2fd";

    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 20, 20);

    // 清理临时元素
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }

  updateDropIndicator(event) {
    const column = event.currentTarget;
    const tasks = Array.from(column.querySelectorAll(".task:not(.dragging)"));
    const mouseY = event.clientY;

    // 移除现有指示器
    this.hideDropIndicator();

    if (tasks.length === 0) {
      // 空列，在末尾添加指示器
      this.showDropIndicator(column, "end");
      return;
    }

    // 找到最近的元素
    let closestTask = null;
    let closestOffset = Number.NEGATIVE_INFINITY;

    tasks.forEach((task) => {
      const rect = task.getBoundingClientRect();
      const offset = mouseY - rect.top - rect.height / 2;

      if (offset < 0 && offset > closestOffset) {
        closestOffset = offset;
        closestTask = task;
      }
    });

    if (closestTask) {
      this.showDropIndicator(closestTask, "before");
    } else {
      this.showDropIndicator(column, "end");
    }
  }

  showDropIndicator(element, position) {
    const indicator = document.createElement("div");
    indicator.className = "drop-indicator visible";

    if (position === "before") {
      element.parentNode.insertBefore(indicator, element);
    } else {
      element.appendChild(indicator);
    }

    this.currentIndicator = indicator;
  }

  hideDropIndicator() {
    if (this.currentIndicator) {
      this.currentIndicator.remove();
      this.currentIndicator = null;
    }
  }

  insertAtPosition(column, element, mouseY) {
    const tasks = Array.from(column.querySelectorAll(".task:not(.dragging)"));

    if (tasks.length === 0) {
      column.appendChild(element);
      return;
    }

    let closestTask = null;
    // 无穷小
    let closestOffset = Number.NEGATIVE_INFINITY;

    tasks.forEach((task) => {
      const rect = task.getBoundingClientRect();
      const offset = mouseY - rect.top - rect.height / 2;

      if (offset < 0 && offset > closestOffset) {
        closestOffset = offset;
        closestTask = task;
      }
    });

    if (closestTask) {
      column.insertBefore(element, closestTask);
    } else {
      column.appendChild(element);
    }
  }

  showSuccessFeedback(column) {
    column.classList.add("drop-allowed");
    setTimeout(() => {
      column.classList.remove("drop-allowed");
    }, 500);
  }

  updateStats() {
    document.getElementById("dragCount").textContent = this.dragCount;
  }
}

// 初始化看板
document.addEventListener("DOMContentLoaded", () => {
  new TaskBoard();
});
