---
applyTo: "frontend/**/avatar*.ts,frontend/**/talking*.ts"
---

# Avatar & TalkingHead Instructions — Interview Simulator

- Import TalkingHead as ES module: `import { TalkingHead } from 'talkinghead'`
- Initialize in `ngAfterViewInit`, never in constructor
- Always check `WebGLRenderingContext` support before creating instance
- Use `showAvatar()` with GLB models that have:
  - Mixamo-compatible skeleton rig
  - ARKit blend shapes (52 expressions)
  - Oculus viseme blend shapes (15 visemes)
- Map AI response expressions to TalkingHead:
  - `smile` → `head.setExpression('happy')`
  - `thinking` → `head.setExpression('thoughtful')`
  - `serious` → `head.setExpression('neutral')`
  - `surprised` → `head.setExpression('surprised')`
- Use `speakText()` for Google TTS lip-sync or `speakAudio()` for pre-generated audio
- Load Mixamo FBX animations with `head.loadAnimation(name, url)`
- Dispose all Three.js resources in `ngOnDestroy`:
  - `head.dispose()` to clean up renderer, scene, and textures
  - Remove event listeners from canvas
- Handle window resize: update camera aspect ratio and renderer size
- Use `requestAnimationFrame` loop managed by TalkingHead (don't create your own)
- For mobile: reduce avatar polygon count and disable dynamic bones
