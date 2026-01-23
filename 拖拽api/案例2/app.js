// 元素
const itemContainer = document.getElementById("item-container");
const logContainer = document.getElementById("log-container");
const dropContainer = document.getElementById("drop-container");
const butten = document.querySelector("button");
butten.addEventListener("click", () => {
  logContainer.textContent = "";
});
// 日志函数
function log(message) {
  const timestamp = new Date().toLocaleTimeString();
  logContainer.textContent += `[${timestamp}] ${message}\n`;
  logContainer.scrollTop = logContainer.scrollHeight;
}

// 节流函数
function throttle(func, delay) {
  let lock = false;
  return (...args) => {
    if (lock) return;
    func(...args);
    lock = true;
    setTimeout(() => {
      lock = false;
    }, delay);
  };
}

function debounce(func, delay) {
  let id = null;
  if (id) {
    clearTimeout(id);
  }
  id = setTimeout(() => {
    func();
    id = null;
  }, delay);
}
const throttledLog = throttle((text) => {
  log(text);
}, 1000);
const throttledLog2 = throttle((text) => {
  log(text);
}, 1000);
itemContainer.addEventListener("dragstart", (e) => {
  if (e.target.classList.contains("item")) {
    log("dragstart intercepted: " + e.target.outerHTML);
    e.dataTransfer.effectAllowed = "copy";
    e.stopPropagation();
  }
});
itemContainer.addEventListener("drag", (e) => {
  if (e.target.classList.contains("item")) {
    throttledLog("drag intercepted: " + e.target.textContent);
    e.stopPropagation();
  }
});
itemContainer.addEventListener("dragend", (e) => {
  if (e.target.classList.contains("item")) {
    log("dragend intercepted: " + e.target.textContent);
    e.stopPropagation();
  }
});

dropContainer.addEventListener("dragover", (e) => {
  e.preventDefault(); // 允许放置
  throttledLog2("dragover intercepted: " + e.dataTransfer.items);
});
dropContainer.addEventListener("drop", (e) => {
  e.dataTransfer.dropEffect = "copy";
  log("drop intercepted: " + e.target.textContent);
});
dropContainer.addEventListener("dragenter", (e) => {
  log("dragenter intercepted: " + e.target.id);
});
dropContainer.addEventListener("dragleave", (e) => {
  log("dragleave intercepted: " + e.target.textContent);
});
