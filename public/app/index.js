// @ts-check

function app() {
	const ffmpeg = FFmpeg.createFFmpeg({
		corePath: new URL("/ext/ffmpeg-core.js", location.toString()).href,
		log: true,
	});

	const input_el = /** @type {HTMLInputElement} */ (document.getElementById("input-source"));
	const video_el = /** @type {HTMLVideoElement} */ (document.getElementById("video-result"));
	const log_el = /** @type {HTMLPreElement} */ (document.getElementById("logs"));
	const loading_el = /** @type {HTMLSpanElement} */ (document.getElementById("loading"));

	let /** @type {string | undefined} */ result_url;
	let loaded = false;

	async function init() {
		if (loaded) {
			log("already loaded");
			return;
		}

		input_el.disabled = true;
		log("initializing...");
		try {
			ffmpeg.setLogger(({ message }) => {
				log(message);
			});

			await ffmpeg.load();

			input_el.onchange = transcode;
			log("initialized");
			loaded = true;
			input_el.disabled = false;
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

			input_el.disabled = true;
			loading_el.hidden = false;

			log(`preparing file "${input}"...`);
			const buffer = await file.arrayBuffer();
			ffmpeg.FS("writeFile", `/${input}`, new Uint8Array(buffer));

			const command = `-i ${input} -vf scale=-2:1920,fps=30 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k ${output}`;
			log(`exec: "ffmpeg ${command}"`);

			await ffmpeg.run(...command.split(" "));

			log(`reading result file "${output}"...`);
			const data = ffmpeg.FS("readFile", output);

			if (result_url) URL.revokeObjectURL(result_url);
			result_url = URL.createObjectURL(new Blob([data], { type: "video/mp4" }));
			video_el.src = result_url;

			create_save_link(output);

			cleanup(input, output);
			log("done");
		} catch (error) {
			log("transcode error:", error);
		} finally {
			input_el.disabled = false;
			loading_el.hidden = true;
		}
	}

	/** @param {string} file_name */
	function create_save_link(file_name) {
		if (!result_url) return;

		const attr = {
			id: "download-result",
			href: result_url,
			download: file_name,
			innerText: `Save "${file_name}"`,
		};

		const prev_link = /** @type {HTMLAnchorElement} */ (document.getElementById(attr.id));
		if (prev_link) {
			Object.assign(prev_link, attr);
			return;
		}

		const save_el = document.createElement("a");
		Object.assign(save_el, attr);
		video_el.parentNode.insertBefore(save_el, video_el.nextSibling);
	}

	async function cleanup(/** @type {string[]} */ ...files) {
		log("cleaning up...");
		try {
			for (const file of files) {
				ffmpeg.FS("unlink", file);
			}
		} catch (error) {
			console.warn("failed to delete files:", error);
		}
	}

	/**
	 * @param {string} message
	 * @param {Error | any =} error
	 */
	function log(message, error) {
		if (error) console.error(error);
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

if ("serviceWorker" in navigator) {
	navigator.serviceWorker
		.register("/ext/sw.js")
		.then((reg) => console.log("Service Worker registered", reg))
		.catch((err) => console.log("Service Worker registration failed", err));
}
