# Avatar Models

Place your GLB avatar model here as `interviewer.glb`.

## Requirements

The avatar must have:
- **Mixamo-compatible rig** (bone names like Hips, Spine, Spine1, Spine2, Neck, Head, etc.)
- **ARKit blend shapes** (52 facial expressions)
- **Oculus viseme blend shapes** (viseme_sil, viseme_PP, viseme_FF, etc.)

## Recommended Sources

1. **Ready Player Me** (https://readyplayer.me/) — Free 3D avatar creator
   - Create avatar → Download as GLB
   - Select "Full body" with "Visemes" morph targets enabled

2. **Mixamo** (https://www.mixamo.com/) — For rigged models

3. **TalkingHead examples** — The library author provides sample models:
   - https://github.com/met4citizen/TalkingHead#3d-model

## Quick Start

Download a Ready Player Me avatar with visemes:
```
https://models.readyplayer.me/[YOUR_ID].glb?morphTargets=ARKit,Oculus+Visemes
```

Save it as `interviewer.glb` in this directory.
