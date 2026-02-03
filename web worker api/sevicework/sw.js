const CACHE_NAME = "cat-v1";
const ASSETS = ["index.html", "cat.jpg"];

// 第一招：入职搬货 (waitUntil)
self.addEventListener("install", (event) => {
  event.waitUntil(
    new Promise((resolve, reject) => {
      console.log("微同步");
      setTimeout(() => {
        console.log("宏同步");
        resolve();
      }, 200);
    }),
  );
});

// 第二招：拦截并掉包 (respondWith)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    new Response("Hello, world!", {
      headers: {
        "Content-Type": "text/plain",
      },
    }),
  );
});

fetch(
  "https://customer-amj1dt4tnge8w6ji.cloudflarestream.com/76eacd386badc300c6dccecc6c23dbd4/manifest/video.m3u8",
).then(async (response) => {
  const reader = response.body.getReader();
  function read(reader) {
    reader.read().then((v) => {
      console.log(v.value);
      if (!v.done) {
        read(reader);
      }
    });
  }
  read(reader);
});
