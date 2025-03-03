import { existsSync, promises } from "node:fs";
import { join, resolve } from "node:path";

async function copy_ffmpeg_libs() {
	console.log("prepare ffmpeg libs...");
	const source_modules = ["/core/dist/umd", "/ffmpeg/dist/umd"];
	const target_dir = resolve("public/app");
	try {
		for (const source of source_modules) {
			const source_dir = resolve(`node_modules/@ffmpeg/${source}`);
			const files = await promises.readdir(source_dir);

			for (const file of files) {
				const target_file = join(target_dir, file);
				if (existsSync(target_file)) continue;

				const source_file = join(source_dir, file);
				await promises.copyFile(source_file, target_file);
			}
		}
		console.log("OK");
	} catch (error) {
		console.error(error);
	}
}

copy_ffmpeg_libs();
