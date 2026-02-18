# Interview Simulator with Avatar — Copilot Instructions

## Project Context
This is an **Interview Simulator with 3D Talking Avatar** using Angular 19+ (frontend), NestJS (backend), and Arcee AI Trinity Large Preview via OpenRouter as the LLM brain. The avatar uses the TalkingHead library (Three.js) for real-time lip-sync.

## Architecture
- **Monorepo**: `frontend/` (Angular), `backend/` (NestJS), `infra/` (CI/CD)
- **LLM**: OpenRouter API → `arcee-ai/trinity-large-preview` (400B MoE, 128K context)
- **Avatar**: TalkingHead library (GLB models, Mixamo animations, ARKit blend shapes)
- **TTS**: Google Cloud TTS with word-level timestamps for lip-sync
- **STT**: Web Speech API (browser-native)
- **Deploy**: GitHub Pages (FE) + Vercel/Railway (BE)

## Coding Conventions

### Angular (frontend/)
- Use **standalone components** exclusively (no NgModules)
- Use **Angular Signals** for state management, RxJS for async streams
- Use `inject()` function instead of constructor injection
- Use `ChangeDetectionStrategy.OnPush` on every component
- Use **lazy loading** via `loadComponent` in routes
- Use **Reactive Forms** with typed `FormGroup`
- File naming: `feature-name.component.ts`, `feature-name.service.ts`
- One component per file; co-locate template if < 30 lines

### Styling
- **Tailwind CSS 4** utility classes as primary styling
- SCSS only for complex animations or component-specific overrides
- Use `dark:` variants for theme support
- Mobile-first responsive design (`sm:`, `md:`, `lg:`)
- Never use inline styles

### TypeScript (both frontend & backend)
- Strict mode enabled; no `any` types
- Use interfaces for data models, types for unions
- Use `readonly` where possible
- Prefer `const` assertions for literal types
- Document public APIs with JSDoc

### NestJS (backend/)
- One module per domain: `interview/`, `openrouter/`, `tts/`
- Use DTOs with `class-validator` decorators for all inputs
- Use `ConfigService` for environment variables (never `process.env` directly)
- Use `@nestjs/throttler` for rate limiting
- Return consistent response format: `{ data, meta, error }`

### TalkingHead / Avatar
- Initialize TalkingHead in `AfterViewInit` lifecycle hook
- Always check WebGL support before rendering
- Use `speakText()` for TTS-driven speech with built-in lip-sync
- Map AI response `facialExpression` to TalkingHead expression names
- Map AI response `animation` to loaded Mixamo FBX animation names
- Dispose Three.js resources in `OnDestroy` to prevent memory leaks

## Security (SCA)
- API keys ONLY in backend `.env`, never in frontend
- All external API calls go through NestJS proxy
- Run `npm audit --audit-level=high` in CI
- Dependabot enabled for automated dependency updates
- Validate and sanitize all user inputs
- CSP headers on all responses

## Testing
- Unit tests: Vitest (frontend), Jest (backend)
- E2E tests: Cypress
- Minimum 80% coverage on services
- Mock external APIs (OpenRouter, Google TTS) in tests
- Test avatar component with WebGL mock context

## Git Standards
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`
- Branch naming: `feat/T1.2-interviewer-prompts`, `fix/T2.1-avatar-loading`
- PR template references task ID from `.github/specs/tasks.md`
- Squash merge to main
