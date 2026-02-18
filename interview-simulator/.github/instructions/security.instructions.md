---
applyTo: "**/*.ts"
---

# Security Instructions — Interview Simulator

- NEVER expose API keys (OpenRouter, Google TTS) in frontend code
- All external API calls MUST go through the NestJS backend proxy
- Validate all DTOs with `class-validator` decorators
- Sanitize user text input before sending to OpenRouter (strip HTML/scripts)
- Use `DOMPurify` when rendering AI-generated text in the chat panel
- Set `HttpOnly`, `Secure`, `SameSite` on any cookies
- Configure CORS to whitelist only the production frontend domain
- Add rate limiting via `@nestjs/throttler` on all public endpoints
- Never log full API keys; mask them in logs (show last 4 chars only)
- Validate file uploads: PDF only, max 5MB, check MIME type server-side
- Use CSP headers: restrict `script-src`, allow `worker-src` for Web Speech API
