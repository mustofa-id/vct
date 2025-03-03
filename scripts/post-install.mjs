import { existsSync, mkdirSync, promises } from "node:fs";
import { join, resolve } from "node:path";

async function copy_ffmpeg_libs() {
	console.log("prepare ffmpeg libs...");
	const source_modules = ["/core/dist", "/ffmpeg/dist"];
	const target_dir = resolve("public/ext");
	try {
		if (!existsSync(target_dir)) {
			mkdirSync(target_dir);
		}

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

await Promise.all([
	copy_ffmpeg_libs(), //
]);
