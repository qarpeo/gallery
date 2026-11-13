# Gallery

Minimal edge image gallery template for **Nuxt 5**, **Nuxt UI**, and **Cloudflare R2** with zero authentication.

Powered by [Qarpeo](https://qarpeo.com).

## Features

- **Cloudflare R2 Object Storage**: Zero egress bandwidth fees ($0 egress).
- **No Auth**: Zero login or database dependencies required — pure image upload and download.
- **Client Composable**: Uses `useBlob()` for programmatic file picking, progress tracking, and reactive previews.
- **Server Utilities**: `handleUpload()` and `blob.serve()` for streaming directly to/from Cloudflare R2.
- **Image Operations**: Upload, download (Content-Disposition: attachment), copy direct link, and delete.

## Quick Start

### 1. Install dependencies

```bash
vp i
```

### 2. Start Development Server

```bash
vpr dev
```

Miniflare 4 automatically emulates Cloudflare R2 locally in `.wrangler/state/v3` with zero credentials needed.

### 3. Deploy to Cloudflare Workers

```bash
vpx qp deploy
```

`qp deploy` automatically builds Nuxt, provisions the remote R2 storage bucket on your Cloudflare account, and activates the Worker.
