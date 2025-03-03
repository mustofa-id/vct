export { };

declare global {
	const FFmpegWASM: {
		FFmpeg: typeof import("@ffmpeg/ffmpeg").FFmpeg;
	};
}
