// 模拟的商品数据
const items = [
  { id: 1, name: "Item 1", category: "Electronics", tags: ["New", "Sale"] },
  { id: 2, name: "Item 2", category: "Clothing", tags: ["Hot", "Popular"] },
  { id: 3, name: "Item 3", category: "Electronics", tags: ["Sale"] },
  { id: 4, name: "Item 4", category: "Home", tags: ["New", "Popular"] },
  { id: 5, name: "Item 5", category: "Electronics", tags: ["Hot"] },
];

// 选择的分类和标签
let selectedCategories = [];
let selectedTags = [];

// 获取 DOM 元素
const categoryFilters = document.querySelectorAll(".category-filter");
const tagFilters = document.querySelectorAll(".tag-filter");
const filteredItemsContainer = document.getElementById("filtered-items");

// 监听分类复选框的变化
categoryFilters.forEach((filter) => {
  filter.addEventListener("change", updateFilters);
});

// 监听标签复选框的变化
tagFilters.forEach((filter) => {
  filter.addEventListener("change", updateFilters);
});

// 更新筛选条件并刷新结果
function updateFilters() {
  // 获取所有被选中的分类
  selectedCategories = Array.from(categoryFilters)
    .filter((filter) => filter.checked)
    .map((filter) => filter.value);

  // 获取所有被选中的标签
  selectedTags = Array.from(tagFilters)
    .filter((filter) => filter.checked)
    .map((filter) => filter.value);

  // 筛选商品
  const filteredItems = filterItems(items, selectedCategories, selectedTags);

  // 更新展示的筛选结果
  renderItems(filteredItems);
}

// 筛选商品数据
function filterItems(items, selectedCategories, selectedTags) {
  return items.filter((item) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(item.category);
    const matchesTags = selectedTags.every((tag) => item.tags.includes(tag));
    return matchesCategory && matchesTags;
  });
}

// 渲染筛选后的商品
function renderItems(items) {
  filteredItemsContainer.innerHTML = ""; // 清空旧的内容

  if (items.length === 0) {
    filteredItemsContainer.innerHTML = "<li>没有找到符合条件的商品。</li>";
  } else {
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} - ${item.category} - ${item.tags.join(", ")}`;
      filteredItemsContainer.appendChild(li);
    });
  }
}

// 初始化页面，加载所有商品
renderItems(items);
