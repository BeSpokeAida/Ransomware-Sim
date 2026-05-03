/**
 * Serve la cartella progetto (root = __dirname): sim, backend/*, scenari/*.
 * Locale: PORT=3888 (default). Railway: imposta PORT automaticamente · entry `npm start`.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname);
const PORT = process.env.PORT || 3888;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function send(res, status, mime, buf) {
  res.writeHead(status, {
    "Content-Length": Buffer.byteLength(buf),
    "Content-Type": mime,
    "Cross-Origin-Resource-Policy": "same-origin",
  });
  res.end(buf);
}

const server = http.createServer(function (req, res) {
  try {
    const url = decodeURIComponent((req.url || "/").split("?")[0]);
    let rel = url === "/" ? "/ransomware_sim.html" : url;
    if (rel.endsWith("/")) rel += "index.html";
    const file = path.join(ROOT, path.normalize(rel.replace(/^\//, "")));

    if (!file.startsWith(ROOT)) {
      send(res, 403, "text/plain", "Forbidden");
      return;
    }

    fs.readFile(file, function (err, data) {
      if (err) {
        send(res, 404, "text/plain", "Not found");
        return;
      }
      const ext = path.extname(file).toLowerCase();
      const mime = MIME[ext] || "application/octet-stream";
      send(res, 200, mime, data);
    });
  } catch (_) {
    send(res, 500, "text/plain", "Err");
  }
});

const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, function () {
  console.log("[CyberDrill] listening on " + HOST + ":" + PORT + " · /ransomware_sim.html");
});
