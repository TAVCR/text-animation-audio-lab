# N03 Profile Conformance Analysis (Phase C1)

## Conformance Classification by Profile

### 1. `png-alpha`
- **Observed:**
  - Container / Format: `png_pipe` / `image/png`
  - Codec: `png`
  - Pixel Format: `rgba` (4 channels: R, G, B, A)
  - Color Range: `pc` (full range [0..255])
  - Alpha: Verified present and functional
- **Historical Declared:**
  - Codec: `png`, Alpha: `configured`
- **Classification:** **EXACT PASS**
- **Notes:** Meets 100% of declared expectations across 9:16, 16:9, and 1:1.

---

### 2. `h264-opaque`
- **Observed:**
  - Container: `mov,mp4` (ISO MP4)
  - Codec: `h264` (High Profile)
  - Pixel Format: `yuvj420p`
  - Color Range: `pc` (Full Range / JPEG full scale YCbCr)
  - Dimensions: Exact to ratio (1080x1920, 1920x1080, 1080x1080)
  - FPS / Duration: 30 fps, exact 2.000s duration (60 frames)
- **Historical Declared:**
  - Codec: `h264`, Container: `mp4`, Pixel Format: `yuv420p`
- **Root Cause Investigation on `yuvj420p`:**
  - In Remotion's standard ffmpeg pipeline, when `imageFormat` is configured as `'jpeg'` for opaque renders (`imageFormat: request.profile === 'h264-opaque' ? 'jpeg' : 'png'`), the pre-stitcher feeds full-range JPEG color buffers into ffmpeg, which libx264 flags as `yuvj420p` (JPEG YUV full-range `color_range=pc`).
  - `yuvj420p` is standard YUV 4:2:0 with full color range `[0..255]`. It plays natively in modern browsers and media players.
  - To produce `yuv420p` (limited TV range `[16..235]`), the stitcher can use `-pix_fmt yuv420p` or PNG frames with limited color range.
- **Classification:** **FUNCTIONAL PASS**
- **Recommendation:** Document `yuvj420p` as valid output of the opaque pipeline or allow `-pix_fmt yuv420p` in stitcher options in a subsequent contract update. Do not change contracts prematurely.

---

### 3. `prores4444-alpha`
- **Observed:**
  - Container: `mov,mp4` (QuickTime MOV)
  - Codec: `prores` (Apple ProRes 4444, profile `4444`)
  - Pixel Format: `yuva444p12le`
  - Alpha: Active 12-bit per channel alpha plane confirmed
  - Dimensions: Exact to ratio (1080x1920, 1920x1080, 1080x1080)
  - FPS / Duration: 30 fps, exact 2.000s duration (60 frames)
- **Historical Declared:**
  - Codec: `prores`, Container: `mov`, Pixel Format: `yuva444p10le`, Alpha: `configured`
- **Root Cause Investigation on `yuva444p12le`:**
  - Remotion passes `proResProfile: '4444'` and `pixelFormat: 'yuva444p10le'`. However, ffmpeg's native `prores_ks` encoder implementation encodes ProRes 4444 with an internal 12-bit alpha channel representation (`yuva444p12le`), which is standard Apple ProRes 4444 behavior (12-bit RGB/YUV + 16-bit alpha container support).
  - This preserves higher color precision and dynamic range.
- **Classification:** **FUNCTIONAL PASS**
- **Recommendation:** Update documentation in N03 to state that ProRes 4444 produces `yuva444p12le` (or `yuva444p*le`), reflecting the true capability of the ProRes 4444 encoder.

---

### 4. `vp9-alpha`
- **Observed:**
  - Container: `matroska,webm` (WebM)
  - Codec: `vp9` (Profile 0)
  - Pixel Format: Reported as `yuv420p` by ffprobe, but with metadata tag `alpha_mode: "1"`
  - Alpha Verification Test:
    - Extracted frame with `libvpx-vp9` decoder produced raw 4-channel `rgba` PNG (`vp9_extracted.png`).
    - Applied ffmpeg `alphaextract` filter, isolating the discrete alpha matte plane (`vp9_alpha_mask.png`, size 77,126 bytes).
    - Tested `alphamerge` filter which successfully composited transparent text against a red test background without errors.
  - Dimensions: Exact to ratio (1080x1920, 1920x1080, 1080x1080)
  - FPS / Duration: 30 fps, 2.000s duration (60 frames)
  - File Size: Very compact (~740 KB - 1.12 MB)
- **Historical Declared:**
  - Codec: `vp9`, Container: `webm`, Pixel Format: `yuva420p`, Alpha: `configured`
- **Classification:** **FUNCTIONAL PASS**
- **Notes:** WebM VP9 implements alpha via a dual-stream Matroska BlockAdditional/alpha container mechanism (`alpha_mode: 1`). Remotion and libvpx-vp9 correctly encode transparency, and compliant decoders decode it as full RGBA transparency.
