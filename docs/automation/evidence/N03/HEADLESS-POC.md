# N03 Headless POC Evidence

## Overview
This document records the empirical execution and technical proof of headless rendering using **Automation Core** and the native **Remotion Renderer Adapter** without running the Next.js development server, Electron, or the web editor UI.

## Execution Context
- **Runtime Environment:** Node.js `v22.17.0` (win32-x64)
- **Architecture Pipeline:** Node script -> `AutomationCore` -> `createRemotionRenderer` -> `@remotion/bundler` + `@remotion/renderer` (Chromium Headless Shell) -> Artifact
- **Headless Invariants Verified:**
  - No Next.js server running (no HTTP listening ports, `/api/render` was not invoked).
  - No Electron process launched.
  - No web editor browser tab or UI opened.
  - Chromium headless shell launched autonomously by Remotion as expected.

## Execution Steps & Generated Artifacts

### 1. PNG Still Frame
- **Animation ID:** `typewriter`
- **Text:** `HEADLESS TEST`
- **Dimensions:** 1080 x 1920 (Aspect Ratio: `9:16`, Preset: `1080p`)
- **Profile:** `png-alpha`
- **Duration / Frame:** 60 frames, captured frame index `30`
- **Artifact Path:** `.automation-runtime/poc-renders/headless-poc-typewriter.png`
- **File Size:** 1,535,927 bytes (~1.46 MB)
- **Status:** **PASS**
- **Media Inspection (`ffprobe`):**
  - Codec: `png`
  - Pixel Format: `rgba` (Alpha channel confirmed present)
  - Dimensions: 1080x1920

### 2. Video H.264
- **Animation ID:** `typewriter`
- **Text:** `HEADLESS TEST`
- **Dimensions:** 1080 x 1920
- **Profile:** `h264-opaque`
- **Duration:** 60 frames (2.000s @ 30fps)
- **Artifact Path:** `.automation-runtime/poc-renders/headless-poc-typewriter-h264.mp4`
- **File Size:** 351,700 bytes (~343.4 KB)
- **Status:** **PASS**
- **Media Inspection (`ffprobe`):**
  - Format / Container: `mov,mp4,m4a,3gp,3g2,mj2`
  - Video Stream Codec: `h264` (High Profile)
  - Pixel Format: `yuvj420p`
  - Dimensions: 1080x1920
  - Frame Rate: `30/1`
  - Duration: `2.000000` s
  - Audio Stream: `aac` (2.048000s)

### 3. Alpha Video ProRes 4444
- **Animation ID:** `typewriter`
- **Text:** `HEADLESS TEST`
- **Dimensions:** 1080 x 1920
- **Profile:** `prores4444-alpha`
- **Duration:** 60 frames (2.000s @ 30fps)
- **Artifact Path:** `.automation-runtime/poc-renders/headless-poc-typewriter-prores.mov`
- **File Size:** 252,045,268 bytes (~240.3 MB)
- **Status:** **PASS**
- **Media Inspection (`ffprobe`):**
  - Format / Container: `mov,mp4,m4a,3gp,3g2,mj2`
  - Video Stream Codec: `prores`
  - Pixel Format: `yuva444p12le` (Alpha plane present: `yuva` 12-bit per channel)
  - Dimensions: 1080x1920
  - Frame Rate: `30/1`
  - Duration: `2.000000` s
  - Audio Stream: `pcm_s16le` (2.000000s)
