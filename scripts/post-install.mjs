import { existsSync, mkdirSync, promises } from "node:fs";
import { join, resolve } from "node:path";

const ext_files = new Set();
const target_dir = resolve("public/ext");

async function copy_ffmpeg_libs() {
	console.log("prepare ffmpeg libs...");
	const source_modules = ["/core/dist", "/ffmpeg/dist"];

	try {
		if (!existsSync(target_dir)) {
			mkdirSync(target_dir);
		}

		for (const source of source_modules) {
			const source_dir = resolve(`node_modules/@ffmpeg/${source}`);
			const files = await promises.readdir(source_dir);

			for (const file of files) {
				const target_file = join(target_dir, file);
				ext_files.add(`/ext/${file}`);

				if (existsSync(target_file)) continue;

				const source_file = join(source_dir, file);
				await promises.copyFile(source_file, target_file);
			}
		}
		console.log("OK");
		await gen_sw_file();
	} catch (error) {
		console.error(error);
	}
}

async function gen_sw_file() {
	console.log("generating service worker file...");
	const file = join(target_dir, "sw.js");
	const script = `const ext_files = ${JSON.stringify([...ext_files], null, 2)};
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open("cache-${Date.now()}").then((cache) => {
			return cache.addAll([
				"/",
				"/index.html",
				"/index.css",
				"/app/index.js",
				"/offline.html",
				...ext_files,
			]);
		})
	);
});
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((response) => {
			return (
				response ||
				fetch(event.request).catch(() => {
					return caches.match("/offline.html");
				})
			);
		})
	);
});
`;
	await promises.writeFile(file, script);
	console.log(`generated: ${file}`);
}

await Promise.all([
	copy_ffmpeg_libs(), //
]);
