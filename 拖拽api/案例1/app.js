// 获取拖动元素和目标区域
const dragItems = document.querySelectorAll(".draggable");
const dropZone = document.getElementById("dropZone");

// 为每个可拖动元素添加拖动事件
dragItems.forEach((item) => {
  item.addEventListener("dragstart", (e) => {
    // 设置拖动时的数据
    e.dataTransfer.setData("text", e.target.id);
    console.log("Drag started:", e.target.id);
  });

  item.addEventListener("dragend", (e) => {
    // 拖动结束，移除拖动效果
    e.target.style.opacity = "1";
    console.log("Drag ended:", e.target.id);
  });
});

// 处理拖拽进目标区域的事件
dropZone.addEventListener("dragover", (e) => {
  // 防止默认行为，以允许放置
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

// 处理拖拽离开目标区域的事件
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

// 处理元素被放置到目标区域的事件
dropZone.addEventListener("drop", (e) => {
  // 防止默认行为
  e.preventDefault();
  dropZone.classList.remove("drag-over");

  // 获取拖动的元素 ID
  const draggedElementId = e.dataTransfer.getData("text");
  const draggedElement = document.getElementById(draggedElementId);

  // 将拖动的元素添加到目标区域
  dropZone.appendChild(draggedElement);
  console.log(`Dropped ${draggedElementId} into the drop zone`);
});
