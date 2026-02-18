# Interview Simulator with Avatar — Tasks

> **Estimation**: 1 SP ≈ 2 hours | Total: ~88 SP | 5 Phases, 22 Tasks

---

## Phase 0 · Project Setup (8 SP)

### T0.1 — Initialize Monorepo & Tooling (3 SP)
**Context**: Set up the repository structure, linting, and base configuration.
**Actions**:
1. Create GitHub repo `interview-simulator`
2. Initialize monorepo structure: `frontend/`, `backend/`, `infra/`
3. Create `.github/` directory with specs and instructions
4. Add `.nvmrc` (Node 22), `.npmrc` (strict engines), `.editorconfig`
5. Add `.gitignore` for Angular + NestJS
6. Create root `README.md` with project overview
**Verify**: `tree -L 3` shows correct structure; `git status` clean after initial commit.

### T0.2 — Scaffold Angular Frontend (3 SP)
**Context**: Create Angular 19+ app with standalone components.
**Actions**:
1. `npx @angular/cli@latest new frontend --style=scss --routing --standalone --ssr=false`
2. Install Tailwind CSS 4: `npm i -D tailwindcss @tailwindcss/postcss postcss`
3. Configure `tailwind.config.js` with dark mode and custom theme
4. Set up path aliases in `tsconfig.json` (`@core/`, `@features/`, `@shared/`)
5. Create base folder structure: `core/`, `features/`, `shared/`
6. Add `environments/` with `environment.ts` and `environment.prod.ts`
**Verify**: `ng serve` runs; Tailwind classes render; path aliases resolve.

### T0.3 — Scaffold NestJS Backend (2 SP)
**Context**: Create NestJS API for proxying OpenRouter and TTS calls.
**Actions**:
1. `npx @nestjs/cli new backend`
2. Install deps: `@nestjs/config`, `@nestjs/throttler`, `class-validator`, `class-transformer`
3. Configure `.env` with `OPENROUTER_API_KEY`, `GOOGLE_TTS_API_KEY`
4. Set up `ConfigModule.forRoot()` with validation schema
5. Add global validation pipe and throttler guard
6. Create health check endpoint `GET /api/health`
**Verify**: `npm run start:dev` runs; `curl localhost:3000/api/health` returns 200.

---

## Phase 1 · Core AI Integration (18 SP)

### T1.1 — OpenRouter Service (5 SP)
**Context**: Backend service to communicate with Arcee AI Trinity via OpenRouter.
**Actions**:
1. Create `openrouter/openrouter.module.ts` and `openrouter/openrouter.service.ts`
2. Implement `chat()` method:
   - POST to `https://openrouter.ai/api/v1/chat/completions`
   - Model: `arcee-ai/trinity-large-preview`
   - Headers: `Authorization: Bearer $OPENROUTER_API_KEY`, `HTTP-Referer`, `X-Title`
3. Implement structured JSON response parsing with Zod validation
4. Add retry logic with exponential backoff (3 retries, 1s/2s/4s)
5. Add request/response logging (sanitized, no API keys)
6. Handle rate limit errors (429) with queue mechanism
**Verify**: Unit test sends mock request; integration test hits OpenRouter with test prompt.

### T1.2 — Interviewer System Prompts (4 SP)
**Context**: Define AI persona and response format for the interviewer.
**Actions**:
1. Create `openrouter/prompts/interviewer-system.prompt.ts`
2. Define base interviewer persona:
   ```
   You are Alex, a professional and friendly job interviewer.
   You conduct structured interviews with empathy and precision.
   Always respond with a JSON object following this exact schema:
   { messages: [{ text, facialExpression, animation, emotion }], metadata: { questionNumber, totalQuestions, phase, scoreHint } }
   ```
3. Create persona variants: `friendly`, `strict`, `casual`
4. Create `evaluator-system.prompt.ts` for post-interview scoring
5. Create prompt builder that injects: role, difficulty, resume context, job description
6. Add template tests validating JSON output structure
**Verify**: Prompt + test message → valid JSON matching `InterviewerResponse` schema.

### T1.3 — Interview Controller & Session Management (5 SP)
**Context**: REST API for managing interview sessions.
**Actions**:
1. Create DTOs: `StartInterviewDto`, `SendMessageDto`, `InterviewResponseDto`
2. Create `interview/interview.controller.ts`:
   - `POST /api/interview/start` → creates session, returns first question
   - `POST /api/interview/message` → sends user answer, returns AI response
   - `POST /api/interview/end` → triggers evaluation, returns report
   - `GET /api/interview/:id` → get session state
3. Create `interview/interview.service.ts`:
   - Manages conversation history per session (in-memory Map)
   - Builds message array for OpenRouter (system + history + user message)
   - Tracks question count and phase transitions
4. Add session timeout (30 min inactivity)
5. Validate all inputs with class-validator
**Verify**: Postman/curl flow: start → 3 messages → end → report returned.

### T1.4 — TTS Service (4 SP)
**Context**: Text-to-Speech with word-level timestamps for lip-sync.
**Actions**:
1. Create `tts/tts.service.ts` and `tts/tts.module.ts`
2. Implement Google Cloud TTS integration:
   - `POST https://texttospeech.googleapis.com/v1/text:synthesize`
   - Request `SSML` with `<mark>` tags for word boundaries
   - Audio encoding: MP3 (smaller) or LINEAR16 (better quality)
3. Parse `timepoints` from response for word-level timestamps
4. Convert timestamps to viseme timing data compatible with TalkingHead
5. Return `{ audio: base64, lipsync: { mouthCues: [...] } }`
6. Add fallback: if Google TTS fails, return text-only (frontend uses Web Speech API)
**Verify**: Send text → receive audio base64 + lipsync data with correct timing.

---

## Phase 2 · 3D Avatar & Frontend (24 SP)

### T2.1 — TalkingHead Integration (6 SP)
**Context**: Integrate the TalkingHead library into Angular for 3D avatar rendering.
**Actions**:
1. Install TalkingHead: `npm i talkinghead` or import from CDN
2. Create `features/interview/avatar-canvas.component.ts`:
   - Initialize TalkingHead instance on `AfterViewInit`
   - Configure canvas element with WebGL context
   - Set camera view to "upper" (head + shoulders)
3. Download/create GLB avatar model with:
   - Mixamo-compatible rig
   - ARKit blend shapes (52 expressions)
   - Oculus viseme blend shapes
4. Load avatar: `head.showAvatar({ url, body, avatarMood, lipsyncLang })`
5. Implement `speak()` method that receives audio + lipsync from backend
6. Map `facialExpression` and `animation` from AI response to TalkingHead API
7. Add loading state with skeleton while avatar loads
**Verify**: Avatar renders in browser; speaks test phrase with lip-sync; expressions change.

### T2.2 — Voice Input/Output Controls (4 SP)
**Context**: Enable speech-to-text and text input for user responses.
**Actions**:
1. Create `features/interview/voice-controls.component.ts`
2. Implement Web Speech API (`SpeechRecognition`):
   - Start/stop recording with microphone button
   - Real-time transcription display
   - Language support: en-US, es-ES
3. Implement text input fallback (textarea + send button)
4. Add toggle between voice and text modes
5. Create `core/services/voice.service.ts` with:
   - `startListening()`, `stopListening()`, `onResult$` observable
   - Browser compatibility check
6. Visual feedback: pulsing mic icon when recording, waveform animation
**Verify**: Speak into mic → text appears; toggle to text mode → type and send works.

### T2.3 — Chat Transcript Panel (3 SP)
**Context**: Display conversation history alongside the avatar.
**Actions**:
1. Create `features/interview/chat-panel.component.ts`
2. Display messages in chat bubble format:
   - Interviewer messages: left-aligned, avatar icon
   - Candidate messages: right-aligned, user icon
3. Auto-scroll to latest message
4. Show typing indicator while AI is generating response
5. Display question progress: "Question 3 of 8 — Technical Phase"
6. Add timestamp to each message
**Verify**: Messages appear in correct order; auto-scroll works; progress updates.

### T2.4 — Interview Configuration Page (4 SP)
**Context**: Landing page where user configures their interview.
**Actions**:
1. Create `features/home/home.component.ts` with hero section
2. Create `features/home/interview-config.component.ts` with reactive form:
   - Job role: text input with autocomplete suggestions
   - Interview type: radio buttons (Technical, Behavioral, Mixed)
   - Difficulty: segmented control (Junior, Mid, Senior)
   - Language: dropdown (English, Spanish)
   - Number of questions: slider (5-15, default 8)
   - Resume upload: drag-and-drop PDF (optional)
   - Job description: textarea (optional)
3. Validate form with Angular Reactive Forms
4. On submit: call `POST /api/interview/start` → navigate to `/interview/session`
5. Store config in `InterviewService` signal state
**Verify**: Fill form → submit → navigates to interview; config persists in service.

### T2.5 — Main Interview View (4 SP)
**Context**: Compose avatar, chat, and controls into the interview experience.
**Actions**:
1. Create `features/interview/interview.component.ts`
2. Layout: split view
   - Left (60%): Avatar canvas (full height)
   - Right (40%): Chat panel + voice controls
   - Mobile: stacked (avatar top, chat bottom)
3. Wire up the interview flow:
   - On load: avatar speaks first question
   - User responds (voice or text)
   - Send to backend → receive response → avatar speaks
   - Repeat until `phase === 'closing'`
4. Add "End Interview" button → navigates to report
5. Handle errors: API timeout → retry prompt; WebGL fail → text-only mode
6. Add keyboard shortcuts: Space = toggle mic, Enter = send text
**Verify**: Full interview loop works: config → questions → answers → closing.

### T2.6 — Theme & Responsive Design (3 SP)
**Context**: Dark/light theme and responsive layout.
**Actions**:
1. Create `shared/components/theme-toggle.component.ts`
2. Implement theme with Tailwind `dark:` classes
3. Store preference in `localStorage`
4. Create `shared/components/navbar.component.ts` with:
   - Logo, navigation links, theme toggle
   - Mobile hamburger menu
5. Ensure all views are responsive:
   - Desktop: side-by-side layout
   - Tablet: adjusted proportions
   - Mobile: stacked layout, smaller avatar
6. Test with Chrome DevTools responsive mode
**Verify**: Toggle theme → all components update; resize → layout adapts correctly.

---

## Phase 3 · Reports & History (14 SP)

### T3.1 — Post-Interview Evaluation (5 SP)
**Context**: AI generates a comprehensive interview report.
**Actions**:
1. When interview ends, backend sends full conversation to evaluator prompt
2. Evaluator prompt instructs Trinity to analyze each answer and score:
   ```json
   {
     "overallScore": 72,
     "strengths": ["Strong technical knowledge", "Clear communication"],
     "improvements": ["Could provide more specific examples", "Time management"],
     "questionScores": [
       { "question": "...", "answer": "...", "score": 8, "feedback": "..." }
     ],
     "suggestedResources": ["System Design Primer", "STAR Method Guide"]
   }
   ```
3. Validate report structure with Zod
4. Store report in session object
5. Return report via `POST /api/interview/end`
**Verify**: End interview → receive valid report with scores and feedback.

### T3.2 — Report Viewer Component (4 SP)
**Context**: Display the interview report with visual scoring.
**Actions**:
1. Create `features/report/report.component.ts`
2. Display overall score with circular progress indicator
3. Show strengths and improvements as card lists
4. Display per-question breakdown:
   - Question text, user answer, score bar, AI feedback
5. Show suggested resources as clickable links
6. Add "Download as PDF" button (using browser print or jsPDF)
7. Add "Try Again" button → navigate to config
**Verify**: Report renders with all sections; PDF download works; navigation works.

### T3.3 — Interview History (3 SP)
**Context**: Store and display past interviews.
**Actions**:
1. Create `core/services/storage.service.ts`
2. Save completed interviews to `localStorage` (or IndexedDB for larger data)
3. Create `features/history/history.component.ts`:
   - List of past interviews with: date, role, score, duration
   - Click to view full report
   - Delete individual interviews
4. Add "Clear All History" with confirmation dialog
5. Sort by date (newest first)
**Verify**: Complete interview → appears in history; click → shows report; delete works.

### T3.4 — Resume PDF Parser (2 SP)
**Context**: Extract text from uploaded resume for personalized questions.
**Actions**:
1. Add `pdf-parse` or `pdfjs-dist` to backend
2. Create endpoint `POST /api/interview/parse-resume`
3. Accept multipart file upload (max 5MB, PDF only)
4. Extract text content from PDF
5. Return extracted text to frontend
6. Frontend includes resume text in interview config
**Verify**: Upload PDF → text extracted → used in interview questions.

---

## Phase 4 · CI/CD & Deployment (12 SP)

### T4.1 — GitHub Actions CI Pipeline (3 SP)
**Context**: Automated testing and security checks on every PR.
**Actions**:
1. Create `.github/workflows/ci.yml`:
   ```yaml
   on: [push, pull_request]
   jobs:
     frontend:
       - npm ci
       - npm run lint
       - npm run test -- --coverage
       - npm audit --audit-level=high
     backend:
       - npm ci
       - npm run lint
       - npm run test
       - npm audit --audit-level=high
   ```
2. Add Dependabot configuration for automated dependency updates
3. Add branch protection rules: require CI pass + 1 review
**Verify**: Push to PR → CI runs → all checks pass.

### T4.2 — Deploy Frontend to GitHub Pages (3 SP)
**Context**: Automated deployment of Angular SPA to GitHub Pages.
**Actions**:
1. Create `.github/workflows/deploy-frontend.yml`
2. Build Angular with `--base-href` for GitHub Pages
3. Configure `404.html` redirect for SPA routing
4. Deploy to `gh-pages` branch on merge to `main`
5. Configure custom domain (optional)
6. Add environment-specific API URL for production
**Verify**: Merge to main → site live on `https://username.github.io/interview-simulator`.

### T4.3 — Deploy Backend to Vercel/Railway (3 SP)
**Context**: Deploy NestJS API to serverless platform.
**Actions**:
1. Create `vercel.json` or `railway.toml` configuration
2. Configure environment variables in platform dashboard
3. Set up auto-deploy from `main` branch
4. Configure CORS for production frontend domain
5. Add health check monitoring
6. Test production API endpoints
**Verify**: Backend live; frontend can call production API; health check passes.

### T4.4 — E2E Testing (3 SP)
**Context**: End-to-end tests for critical user flows.
**Actions**:
1. Install Cypress: `npm i -D cypress`
2. Write E2E tests:
   - `interview-config.cy.ts`: Fill form → start interview
   - `interview-flow.cy.ts`: Mock API → avatar speaks → user responds → report
   - `history.cy.ts`: View past interviews → delete
3. Add Cypress to CI pipeline
4. Configure test fixtures with mock OpenRouter responses
**Verify**: `npx cypress run` → all tests pass; CI includes E2E step.

---

## Phase 5 · Polish & Extras (12 SP)

### T5.1 — Internationalization (3 SP)
**Context**: Support English and Spanish.
**Actions**:
1. Install `@ngx-translate/core` and `@ngx-translate/http-loader`
2. Create translation files: `assets/i18n/en.json`, `assets/i18n/es.json`
3. Translate all UI strings
4. Add language selector in navbar
5. Sync UI language with interview language config
**Verify**: Switch language → all UI text updates; interview runs in selected language.

### T5.2 — Accessibility & Performance (3 SP)
**Context**: Ensure WCAG 2.1 AA compliance and fast loading.
**Actions**:
1. Add ARIA labels to all interactive elements
2. Ensure keyboard navigation works throughout
3. Add screen reader announcements for avatar speech
4. Optimize avatar model size (compress GLB, LOD)
5. Lazy load avatar assets
6. Add `@defer` blocks for heavy components
7. Run Lighthouse audit → fix issues until score ≥ 90
**Verify**: Lighthouse: Performance ≥ 90, Accessibility ≥ 90; keyboard-only navigation works.

### T5.3 — Error Handling & Offline Mode (3 SP)
**Context**: Graceful error handling and offline review capability.
**Actions**:
1. Create global error handler service
2. Add toast notifications for user-facing errors
3. Implement retry dialogs for API failures
4. Add service worker for offline access to history/reports
5. Cache avatar assets for faster subsequent loads
6. Show connection status indicator
**Verify**: Disconnect network → can view history; reconnect → interview resumes.

### T5.4 — Documentation & README (3 SP)
**Context**: Comprehensive project documentation.
**Actions**:
1. Write detailed `README.md`:
   - Project overview with demo GIF
   - Architecture diagram
   - Quick start guide
   - Environment variables reference
   - API documentation
   - Contributing guidelines
2. Add JSDoc comments to all services
3. Generate API docs with Swagger/OpenAPI
4. Create `CONTRIBUTING.md` and `LICENSE`
**Verify**: New developer can clone, configure, and run the project following README only.

---

## Summary

| Phase | Tasks | SP | Focus |
|-------|-------|----|-------|
| 0 — Setup | T0.1–T0.3 | 8 | Monorepo, Angular, NestJS |
| 1 — AI Core | T1.1–T1.4 | 18 | OpenRouter, prompts, sessions, TTS |
| 2 — Avatar & UI | T2.1–T2.6 | 24 | TalkingHead, voice, chat, config |
| 3 — Reports | T3.1–T3.4 | 14 | Evaluation, history, PDF parsing |
| 4 — CI/CD | T4.1–T4.4 | 12 | GitHub Actions, deployment, E2E |
| 5 — Polish | T5.1–T5.4 | 12 | i18n, a11y, offline, docs |
| **Total** | **22 tasks** | **88 SP** | **~176 hours** |
