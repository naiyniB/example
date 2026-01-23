// 模拟的商品数据
const items = [
  { id: 1, name: "Item 1", category: "Electronics", tags: ["New", "Sale"] },
  { id: 2, name: "Item 2", category: "Clothing", tags: ["Hot", "Popular"] },
  { id: 3, name: "Item 3", category: "Electronics", tags: ["Sale"] },
  { id: 4, name: "Item 4", category: "Home", tags: ["New", "Popular"] },
  { id: 5, name: "Item 5", category: "Electronics", tags: ["Hot"] },
];

// 标签
const tagFilters = document.querySelectorAll(".tag-filter");
// 分类
const categoryFilters = document.querySelectorAll(".category-filter");
// 筛选结果
const filteredItemsContainer = document.getElementById("filtered-items");

function render(items) {
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.category} - ${item.tags.join(", ")}`;
    filteredItemsContainer.appendChild(li);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  render(items);
});
