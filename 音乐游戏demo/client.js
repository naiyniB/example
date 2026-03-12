const socket = io("http://localhost:3100");
let myRole = null;
let isAudioReady = false;

// 增加连接提示
socket.on("connect", () => {
  console.log("✅ 已成功连接到服务器");
  document.getElementById("player-status").innerText =
    "已连接到乐队服务器 (3100)";
});

socket.on("connect_error", (err) => {
  console.error("❌ 连接失败:", err);
  document.getElementById("player-status").innerText =
    "连接失败，请检查后端是否启动";
});

// 核心：点击激活音频
document
  .getElementById("start-audio-btn")
  .addEventListener("click", async () => {
    // 1. 启动 Tone.js 上下文
    await Tone.start();
    isAudioReady = true;

    // 2. 这里的提示非常重要
    document.getElementById("audio-status").innerText = "✅ 引擎已就绪";
    document.getElementById("start-audio-btn").style.display = "none"; // 隐藏启动按钮
    console.log("Audio Context Started!");
  });

// 修改播放逻辑，增加保护
function playInstrument(role) {
  if (!isAudioReady) {
    console.warn("音频引擎尚未启动，请先点击绿色按钮");
    return;
  }

  try {
    if (role === "piano") {
      // 注意：Sampler 需要时间加载图片，如果没有声音可能是还没加载完
      instruments.piano.triggerAttackRelease("C4", "8n");
    } else if (role === "drum") {
      instruments.drum.triggerAttackRelease("C2", "8n");
    } else if (role === "synth") {
      instruments.synth.triggerAttackRelease("E4", "8n");
    }
    console.log(`正在播放 ${role} 的声音`);
  } catch (e) {
    console.error("播放出错:", e);
  }
}
