// 变量区域
const textInput = document.querySelector("#text");
const chat = document.querySelector(".chat");
const button = document.querySelector("#submit");
let socket = null;
let lastTime = null;
//

// 事件
button.addEventListener("click", submit);
textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    submit();
  }
});
document.addEventListener("DOMContentLoaded", init);
//

// 函数
function submit() {
  if (!textInput.value.trim()) return;
  const time = new Date();
  if (!lastTime || time - lastTime > 60 * 100) {
    // 1分钟 = 60000ms
    const timer = document.createElement("div");
    timer.innerText = time.toLocaleTimeString(); // 格式化为时:分:秒
    timer.classList.add("chat-timer");
    chat.appendChild(timer);
  }

  const message = document.createElement("div");
  message.innerText = textInput.value;
  message.classList.add("user-message");
  const avatar = document.createElement("img");
  avatar.src = "./Avatar2.jpg";
  const div = document.createElement("div");
  div.classList.add("wrapper");
  div.appendChild(message);
  div.appendChild(avatar);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  send(textInput.value);
  textInput.value = "";
  textInput.focus();
  lastTime = time;
}
function outerUserMessage(data) {
  const time = new Date();
  const message = document.createElement("div");
  message.innerText = data;
  message.classList.add("user-message");
  const avatar = document.createElement("img");
  avatar.src = "./Avatar2.jpg";
  const div = document.createElement("div");
  div.classList.add("remote");
  div.appendChild(avatar);
  div.appendChild(message);
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  lastTime = time;
}
function Createsocket() {
  // 启动创建websocket
  socket = new WebSocket("ws://localhost:8080");
  socket.onopen = () => {
    console.log("连接已建立");
  };

  // 3. 监听服务器发来的消息
  socket.onmessage = (event) => {
    outerUserMessage(event.data);
  };

  // 4. 监听错误或关闭
  socket.onclose = () => {
    console.log("连接已关闭");
  };
}
function send(message) {
  socket.send(message);
}
function init() {
  Createsocket();
}
//
