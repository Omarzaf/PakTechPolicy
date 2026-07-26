import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..", "dist");
const port = Number.parseInt(process.env.PAKTECH_PORT ?? "4173", 10);
const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
]);

const server = createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const candidate = resolve(root, `.${requestPath === "/" ? "/index.html" : requestPath}`);
    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const metadata = await stat(candidate);
    if (!metadata.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": types.get(extname(candidate)) ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    createReadStream(candidate).pipe(response);
  } catch (error) {
    if (error instanceof URIError) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Bad request");
      return;
    }
    try {
      const notFound = resolve(root, "404.html");
      const metadata = await stat(notFound);
      if (!metadata.isFile()) throw new Error("Missing 404 page");
      response.writeHead(404, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      createReadStream(notFound).pipe(response);
    } catch {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
    }
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PakTechPolicy preview: http://127.0.0.1:${port}/`);
});
