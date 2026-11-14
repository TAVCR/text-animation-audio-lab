# N03 Real Media Profile Matrix (Phase C1)

## Overview
This matrix summarizes the empirical observations and technical metadata obtained from 12 real rendering operations performed via **AutomationCore** + **Remotion Headless Adapter** in a standalone Node.js environment without Next.js server, Electron, or editor UI.

- **Animation:** `typewriter`
- **Text:** `MEDIA PROFILE TEST`
- **Profiles Tested:** `png-alpha`, `h264-opaque`, `prores4444-alpha`, `vp9-alpha`
- **Ratios Tested:** `9:16` (1080x1920), `16:9` (1920x1080), `1:1` (1080x1080)
- **Pipeline Architecture:** Automation Core -> Remotion Adapter -> Remotion Chromium -> Staging -> Publication

---

## Media Profile Matrix Table

| Profile | Ratio | Status | Container | Codec | Codec Profile | PixFmt | Color Range | Alpha | Dimensions | FPS | Duration | File Size |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `png-alpha` | `9:16` | **PASS** | `png_pipe` | `png` | - | `rgba` | `pc` | **YES** | 1080x1920 | 25/1 | 1 frame | 1,520,418 B (~1.45 MB) |
| `png-alpha` | `16:9` | **PASS** | `png_pipe` | `png` | - | `rgba` | `pc` | **YES** | 1920x1080 | 25/1 | 1 frame | 1,683,886 B (~1.61 MB) |
| `png-alpha` | `1:1` | **PASS** | `png_pipe` | `png` | - | `rgba` | `pc` | **YES** | 1080x1080 | 25/1 | 1 frame | 1,314,069 B (~1.25 MB) |
| `h264-opaque` | `9:16` | **PASS** | `mov,mp4` | `h264` | `High` | `yuvj420p` | `pc` | **NO** | 1080x1920 | 30/1 | 2.000s (60f) | 357,099 B (~348.7 KB) |
| `h264-opaque` | `16:9` | **PASS** | `mov,mp4` | `h264` | `High` | `yuvj420p` | `pc` | **NO** | 1920x1080 | 30/1 | 2.000s (60f) | 357,112 B (~348.7 KB) |
| `h264-opaque` | `1:1` | **PASS** | `mov,mp4` | `h264` | `High` | `yuvj420p` | `pc` | **NO** | 1080x1080 | 30/1 | 2.000s (60f) | 350,925 B (~342.7 KB) |
| `prores4444-alpha` | `9:16` | **PASS** | `mov,mp4` | `prores` | `4444` | `yuva444p12le` | - | **YES** | 1080x1920 | 30/1 | 2.000s (60f) | 251,712,207 B (~240.0 MB) |
| `prores4444-alpha` | `16:9` | **PASS** | `mov,mp4` | `prores` | `4444` | `yuva444p12le` | - | **YES** | 1920x1080 | 30/1 | 2.000s (60f) | 255,128,794 B (~243.3 MB) |
| `prores4444-alpha` | `1:1` | **PASS** | `mov,mp4` | `prores` | `4444` | `yuva444p12le` | - | **YES** | 1080x1080 | 30/1 | 2.000s (60f) | 177,964,516 B (~169.7 MB) |
| `vp9-alpha` | `9:16` | **PASS** | `matroska,webm` | `vp9` | `Profile 0` | `yuv420p` | `tv` | **YES** | 1080x1920 | 30/1 | 2.000s (60f) | 1,155,827 B (~1.10 MB) |
| `vp9-alpha` | `16:9` | **PASS** | `matroska,webm` | `vp9` | `Profile 0` | `yuv420p` | `tv` | **YES** | 1920x1080 | 30/1 | 2.000s (60f) | 1,174,463 B (~1.12 MB) |
| `vp9-alpha` | `1:1` | **PASS** | `matroska,webm` | `vp9` | `Profile 0` | `yuv420p` | `tv` | **YES** | 1080x1080 | 30/1 | 2.000s (60f) | 761,227 B (~743.4 KB) |

---

## Single Pass Execution Invariant
- Every video render triggered **exactly one** `renderMedia` invocation.
- Every PNG still render triggered **exactly one** `renderFrames` invocation on the target frame.
- Zero double renders, zero post-render extractions.
