This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## GPU-first rendering configuration

This project is configured to use GPU whenever possible:

- API renders (`/api/render`) now run a safe cascade:
  - `gpu+nvenc` (Windows, non-transparent render)
  - `gpu` (OpenGL backend for Chromium)
  - `cpu` fallback (last resort, avoids breaking renders)
- CLI renders use `remotion.config.ts`, which sets a GPU OpenGL backend by default.
- Launcher sets:
  - `REMOTION_USE_GPU=1`
  - `REMOTION_USE_NVENC=1`
  - `REMOTION_GL=angle` (Windows default)
  - `REMOTION_TRY_VULKAN=1` (tries a Vulkan pass first, then falls back)
  - `REMOTION_CONCURRENCY=<cpu-cores>` (auto-detected when omitted)
  - `REMOTION_NVENC_PRESET=medium`
  - `REMOTION_NVENC_RC=vbr`
  - `REMOTION_NVENC_CQ=19`

### Optional environment variables

- `REMOTION_USE_GPU=0`: disables GPU-first attempts.
- `REMOTION_USE_NVENC=0`: disables NVENC attempt.
- `REMOTION_GL=angle|angle-egl|egl|swiftshader|vulkan|swangle`: overrides GL backend.
- `REMOTION_TRY_VULKAN=0|1`: try a Vulkan GPU pass before the preferred GL backend.
- `REMOTION_CONCURRENCY=<n>`: caps render workers (default = detected CPU cores).
- `REMOTION_NVENC_PRESET=<preset>`: NVENC preset override.
- `REMOTION_NVENC_RC=<mode>` and `REMOTION_NVENC_CQ=<value>`: NVENC quality/rate control.

### Important limitation

In the current Remotion stack, hardware-accelerated encoding support is platform-limited (official docs currently indicate macOS support for Remotion hardware encoding).  
On Windows, this setup still speeds up GPU-accelerated visual rendering (`text-shadow`, `blur`, `transforms`, WebGL), while final encode may still rely on CPU in the standard Remotion path.

## Editor workflows

### PNG del fotograma actual

En `Exportar`, usa `Exportar PNG del fotograma actual` para guardar el frame pausado de la previsualización. El PNG conserva transparencia, usa el frame seleccionado y la resolución activa; no captura el DOM ni el canvas de la interfaz.

### Preferencia GPU

En Exportar puedes elegir `Auto`, `GPU` o `CPU`. `Auto` intenta la ruta GPU y usa CPU si falla; `GPU` mantiene la exigencia GPU y `CPU` evita los flags GPU. Tras exportar, el diagnóstico muestra modo de render, backend, encoder y si hubo fallback. Un fallback solo se informa después de que un intento anterior haya fallado.

### Subtítulos

En la pestaña `Subtítulos` puedes cargar un video, pegar/importar SRT, introducir o editar cues manualmente, aplicar los presets `clean` o `cinema`, previsualizar y renderizar el video subtitulado. La transcripción automática es opcional y requiere configurar el proveedor server-side; sin esa configuración, SRT y edición manual siguen disponibles.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
