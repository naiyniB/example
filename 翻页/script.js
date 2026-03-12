let currentPage = 0; // 当前页面索引
const pages = document.querySelectorAll(".page"); // 获取所有页面元素

// 监听滚轮事件
window.addEventListener("wheel", (event) => {
  if (event.deltaY > 0) {
    // 向下滚动
    nextPage();
  } else {
    // 向上滚动
    prevPage();
  }
});

// 翻到下一页
function nextPage() {
  if (currentPage < pages.length - 1) {
    currentPage++;
    updatePagePosition();
  }
}

// 翻到上一页
function prevPage() {
  if (currentPage > 0) {
    currentPage--;
    updatePagePosition();
  }
}

// 更新页面位置，实现翻页效果
function updatePagePosition() {
  pages.forEach((page, index) => {
    page.style.transform = `translateY(-${currentPage * 100}%)`; // 每页根据当前页数滑动
  });
}
