# N03 Media Verification POC Evidence

## Media Properties and Codec Verification

All artifacts were generated directly by invoking `AutomationCore.render()` / `AutomationCore.still()` from Node.js with the real Remotion adapter `createRemotionRenderer()`.

### Artifact 1: PNG Still (`png-alpha`)
- **File:** `.automation-runtime/poc-renders/headless-poc-typewriter.png`
- **Size:** 1,535,927 bytes
- **Decoder Verification:**
  - Decoded via ffprobe:
    - Streams: 1 (`codec_type: "video"`)
    - Codec Name: `png`
    - Dimensions: `1080 x 1920`
    - Pixel Format: `rgba` (4 channels: Red, Green, Blue, Alpha)
- **Single Pass Invariant:** Rendered using `renderFrames({ frameRange: [30, 30] })` without invoking `renderMedia`.

### Artifact 2: MP4 Video (`h264-opaque`)
- **File:** `.automation-runtime/poc-renders/headless-poc-typewriter-h264.mp4`
- **Size:** 351,700 bytes
- **Decoder Verification:**
  - Streams: 2 (Video + Audio)
  - Video Codec: `h264`
  - Dimensions: `1080 x 1920`
  - Pixel Format: `yuvj420p`
  - Framerate: `30/1` (30 fps)
  - Duration: `2.000000` seconds (60 frames)
  - Container: ISO Media, MP4 Base Media v1 [ISOD]
- **Single Pass Invariant:** Exactly 1 `renderMedia` call executed.

### Artifact 3: ProRes 4444 MOV (`prores4444-alpha`)
- **File:** `.automation-runtime/poc-renders/headless-poc-typewriter-prores.mov`
- **Size:** 252,045,268 bytes
- **Decoder Verification:**
  - Streams: 2 (Video + Audio)
  - Video Codec: `prores` (Apple ProRes 4444)
  - Dimensions: `1080 x 1920`
  - Pixel Format: `yuva444p12le` (Alpha component actively encoded in 12-bit depth)
  - Framerate: `30/1` (30 fps)
  - Duration: `2.000000` seconds (60 frames)
  - Container: QuickTime / MOV
- **Single Pass Invariant:** Exactly 1 `renderMedia` call executed.
