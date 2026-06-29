import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function contentType(pathname) {
  const match = pathname.match(/\.[^.]+$/);
  return types[match?.[0].toLowerCase()] || "application/octet-stream";
}

http
  .createServer((request, response) => {
    const url = new URL(request.url, `http://localhost:${port}`);
    const decodedPath = decodeURIComponent(url.pathname);
    const safePath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
    let filePath = join(root, safePath);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, "index.html");
    }

    if (!existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentType(filePath) });
    createReadStream(filePath).pipe(response);
  })
  .listen(port, () => {
    console.log(`Su Lab site preview: http://localhost:${port}`);
  });
