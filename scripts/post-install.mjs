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

async function gen_vercel_headers() {
	console.log("vercel env:", process.env.VERCEL);
	if (!process.env.VERCEL) return;
	const file = "vercel.json";
	const data = JSON.stringify({
		headers: [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Cross-Origin-Embedder-Policy",
						value: "require-corp",
					},
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin",
					},
				],
			},
		],
	});
	await promises.writeFile(file, data);
	console.log(`${file} created`);
}

await Promise.all([
	copy_ffmpeg_libs(), //
	gen_vercel_headers(),
]);
