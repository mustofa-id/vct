// @ts-check
// NOTE: This server is intended for use during development only.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const clients = new Set();

const server = http.createServer((req, res) => {
	if (req.url === "/sse") {
		// SSE endpoint
		res.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		});
		res.write("data: connected\n\n");

		clients.add(res);

		req.on("close", () => {
			clients.delete(res);
		});
		return;
	}

	let file_path = path.join("public", req.url === "/" ? "index.html" : req.url || "");
	let extname = path.extname(file_path);
	let content_type = "text/html";

	const mime_types = {
		".js": "text/javascript",
		".css": "text/css",
		".json": "application/json",
		".png": "image/png",
		".jpg": "image/jpg",
	};

	if (mime_types[extname]) {
		content_type = mime_types[extname];
	}

	fs.readFile(file_path, (err, content) => {
		if (err) {
			if (err.code == "ENOENT") {
				res.writeHead(404, { "Content-Type": "text/html" });
				res.end("404 Not Found", "utf8");
			} else {
				res.writeHead(500);
				res.end(`Server Error: ${err.code}`);
			}
		} else {
			// inject for live-reload
			if (extname === ".html") {
				/** @type {any} */ (content) += `
				<script>
					const es = new EventSource("/sse");
					es.onmessage = (e) => {
						if (e.data === "reload") {
							location.reload();
						}
					};
				</script>
				`;
			}
			res.writeHead(200, { "Content-Type": content_type });
			res.end(content, "utf8");
		}
	});
});

// watch for changes in the "public" dir
let reload_count = 0;
const watcher = fs.watch("public", { recursive: true }, () => {
	console.clear();
	console.info(`file changed, triggering reload...(${reload_count}x)`);
	clients.forEach((client) => {
		client.write("data: reload\n\n"); // send reload event
	});
	++reload_count;
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`server running on port ${PORT}`));

for (const event of ["SIGTERM", "SIGINT", "beforeExit"]) {
	process.on(event, () => {
		watcher.close();
		server.close();
		console.log("\nserver closed");
		process.exit(0);
	});
}
