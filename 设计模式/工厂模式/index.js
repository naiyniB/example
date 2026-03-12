function MessageFactory(type, msg) {
  if (type === "email") {
    return {
      send(msg) {
        console.log("emial");
      },
    };
  } else if (type === "sms") {
    return {
      send(msg) {
        console.log("sms");
      },
    };
  } else if (type === "wechat") {
    return {
      send(msg) {
        console.log("wechat");
      },
    };
  }
}
function sendMessage(f) {
  f.send();
}
const msgf = new MessageFactory("sms", "123");
sendMessage(msgf);
