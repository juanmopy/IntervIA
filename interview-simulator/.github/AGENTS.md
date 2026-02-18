# AGENTS.md — Interview Simulator with Avatar

## General Guidelines
- Read `.github/specs/requirements.md`, `design.md`, and `tasks.md` before making changes
- Follow the task IDs (T0.1, T1.2, etc.) when implementing features
- Always check existing code patterns before creating new ones
- Run tests after every change

## Frontend Modifications (frontend/)
- Use Angular 19+ standalone components with Signals
- Import TalkingHead as ES module; do not bundle Three.js separately
- All API calls go through services in `core/services/`
- Use the `HttpClient` with interceptors for API base URL and error handling
- Avatar-related code stays in `features/interview/avatar-canvas.component.ts`

## Backend Modifications (backend/)
- All OpenRouter calls go through `openrouter/openrouter.service.ts`
- System prompts are in `openrouter/prompts/` — modify persona there
- Session state is managed in `interview/interview.service.ts`
- Add new endpoints to existing controllers; don't create new controllers unless new domain

## Avatar & 3D Assets
- GLB models go in `frontend/src/assets/avatars/`
- FBX animations go in `frontend/src/assets/animations/`
- Models MUST have Mixamo rig + ARKit blend shapes + Oculus visemes
- Test new models with TalkingHead's `showAvatar()` before committing

## OpenRouter / LLM
- Model: `arcee-ai/trinity-large-preview` (do NOT change without discussion)
- All prompts return structured JSON matching `InterviewerResponse` interface
- Temperature: 0.7 for interviews, 0.3 for evaluation
- Max tokens: 1024 for responses, 2048 for evaluation reports

## Dependencies
- Run `npm audit` before adding any new dependency
- Prefer built-in Angular/NestJS features over third-party libraries
- Document why a new dependency is needed in the PR description
