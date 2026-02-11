const http = require("http");

const host = "127.0.0.1";
const port = Number(process.env.PORT || 3000);

http
  .createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("ok");
  })
  .listen(port, host, () => {
    console.log(`[devserver] listening on http://${host}:${port}`);
  });
