// @ts-check

function app() {
	const ffmpeg = new FFmpegWASM.FFmpeg();
	const timeout = 15000; // seconds

	const input_el = /** @type {HTMLInputElement} */ (document.getElementById("input-source"));
	const video_el = /** @type {HTMLVideoElement} */ (document.getElementById("video-result"));
	const log_el = /** @type {HTMLPreElement} */ (document.getElementById("logs"));

	let /** @type {string | undefined} */ result_url;

	async function init() {
		if (ffmpeg.loaded) {
			log("already loaded");
			return;
		}

		log("initializing...");
		try {
			await ffmpeg.load({
				coreURL: "/app/ffmpeg-core.js",
				wasmURL: "/app/ffmpeg-core.wasm",
			});

			ffmpeg.on("log", ({ type, message }) => {
				log(`${type}: ${message}`);
			});

			input_el.onchange = transcode;
			log("initialized");
		} catch (error) {
			log("init error:", error);
		}
	}

	async function transcode() {
		try {
			const file = input_el.files[0];
			if (!file) return;

			const input = file.name.replace(/\s+/g, "-");
			const output = input.replace(/\.[^/.]+$/, "") + "_out_" + Date.now() + ".mp4";

			log(`preparing file "${input}"...`);
			const buffer = await file.arrayBuffer();
			await ffmpeg.writeFile(`/${input}`, new Uint8Array(buffer));

			const command = `-i ${input} ${output}`;
			log(`exec: "ffmpeg ${command}"`);
			const code = await ffmpeg.exec(command.split(" "), timeout);
			if (code != 0) throw new Error("return " + code);

			log(`reading result file "${output}"...`);
			const data = await ffmpeg.readFile(output);

			if (result_url) URL.revokeObjectURL(result_url);
			result_url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
			video_el.src = result_url;

			cleanup(input, output);
			log("done");
		} catch (error) {
			log("transcode error:", error);
		}
	}

	async function cleanup(/** @type {string[]} */ ...files) {
		log("cleaning up...");
		for (const file of files) {
			ffmpeg.deleteFile(file).catch((e) => {
				console.warn("failed to delete file:", file, e);
			});
		}
	}

	/**
	 * @param {string} message
	 * @param {Error | any =} error
	 */
	function log(message, error) {
		console[error ? "error" : "log"](message, error || "");
		const line = document.createElement("span");
		line.textContent = message + " " + (error || "") + "\n";
		if (error) line.style.color = "red";
		log_el.prepend(line);
	}

	init();
}

document.addEventListener("DOMContentLoaded", () => {
	app();
});
