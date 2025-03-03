# Offline Video Compressor Tools

## Development

```bash
pnpm install
pnpm dev
```

## Production

You need to set up custom headers on your hosting to support SharedArrayBuffer. Here are the required headers:

```
"Cross-Origin-Embedder-Policy": "require-corp"
"Cross-Origin-Opener-Policy": "same-origin"
```
