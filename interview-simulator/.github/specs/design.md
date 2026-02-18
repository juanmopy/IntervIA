# Interview Simulator with Avatar — System Design

## D1 · Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular 19+)                     │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐ │
│  │ Interview │  │  Avatar   │  │   Chat    │  │  Report    │ │
│  │  Config   │  │  Canvas   │  │ Transcript│  │  Viewer    │ │
│  │  Panel    │  │ (WebGL)   │  │   Panel   │  │            │ │
│  └────┬─────┘  └────┬──────┘  └─────┬─────┘  └─────┬──────┘ │
│       │              │               │              │         │
│  ┌────┴──────────────┴───────────────┴──────────────┴──────┐ │
│  │              Core Services Layer                         │ │
│  │  InterviewService │ AvatarService │ VoiceService         │ │
│  │  ChatService      │ ReportService │ StorageService       │ │
│  └──────────────────────┬──────────────────────────────────┘ │
│                          │ HTTP                               │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                   BACKEND (NestJS)                            │
│  ┌───────────┐  ┌────────┴──────┐  ┌──────────────────────┐ │
│  │  Auth      │  │  Interview    │  │  OpenRouter Proxy    │ │
│  │  Guard     │  │  Controller   │  │  (Trinity LLM)       │ │
│  └───────────┘  └───────────────┘  └──────────┬───────────┘ │
│                                                │              │
└────────────────────────────────────────────────┼──────────────┘
                                                 │
                              ┌───────────────────┼──────────┐
                              │    EXTERNAL APIs              │
                              │  ┌─────────────────────────┐  │
                              │  │ OpenRouter API           │  │
                              │  │ arcee-ai/trinity-large   │  │
                              │  │ -preview                 │  │
                              │  └─────────────────────────┘  │
                              │  ┌─────────────────────────┐  │
                              │  │ Google Cloud TTS (free)  │  │
                              │  └─────────────────────────┘  │
                              └───────────────────────────────┘
```

---

## D2 · Monorepo Structure

```
interview-simulator/
├── .github/
│   ├── copilot-instructions.md
│   ├── AGENTS.md
│   ├── instructions/
│   │   ├── angular.instructions.md
│   │   ├── security.instructions.md
│   │   ├── testing.instructions.md
│   │   ├── styling.instructions.md
│   │   └── avatar.instructions.md
│   ├── specs/
│   │   ├── requirements.md
│   │   ├── design.md
│   │   └── tasks.md
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-frontend.yml
│       └── deploy-backend.yml
├── frontend/                          # Angular 19+ SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/                  # Guards, interceptors, services
│   │   │   │   ├── services/
│   │   │   │   │   ├── interview.service.ts
│   │   │   │   │   ├── openrouter.service.ts
│   │   │   │   │   ├── avatar.service.ts
│   │   │   │   │   ├── voice.service.ts
│   │   │   │   │   ├── report.service.ts
│   │   │   │   │   └── storage.service.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── api.interceptor.ts
│   │   │   │   └── guards/
│   │   │   │       └── webgl.guard.ts
│   │   │   ├── features/
│   │   │   │   ├── home/              # Landing + interview config
│   │   │   │   │   ├── home.component.ts
│   │   │   │   │   └── interview-config.component.ts
│   │   │   │   ├── interview/         # Main interview view
│   │   │   │   │   ├── interview.component.ts
│   │   │   │   │   ├── avatar-canvas.component.ts
│   │   │   │   │   ├── chat-panel.component.ts
│   │   │   │   │   └── voice-controls.component.ts
│   │   │   │   ├── report/            # Post-interview report
│   │   │   │   │   ├── report.component.ts
│   │   │   │   │   └── score-card.component.ts
│   │   │   │   └── history/           # Past interviews
│   │   │   │       └── history.component.ts
│   │   │   ├── shared/                # Reusable components
│   │   │   │   ├── components/
│   │   │   │   │   ├── navbar.component.ts
│   │   │   │   │   ├── theme-toggle.component.ts
│   │   │   │   │   └── loading-skeleton.component.ts
│   │   │   │   └── pipes/
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── assets/
│   │   │   ├── avatars/               # GLB 3D models
│   │   │   ├── animations/            # FBX Mixamo animations
│   │   │   └── i18n/                  # Translation files
│   │   ├── environments/
│   │   ├── styles/
│   │   │   ├── tailwind.scss
│   │   │   └── themes/
│   │   └── index.html
│   ├── angular.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── backend/                           # NestJS API
│   ├── src/
│   │   ├── interview/
│   │   │   ├── interview.controller.ts
│   │   │   ├── interview.service.ts
│   │   │   ├── interview.module.ts
│   │   │   └── dto/
│   │   │       ├── start-interview.dto.ts
│   │   │       ├── send-message.dto.ts
│   │   │       └── interview-response.dto.ts
│   │   ├── openrouter/
│   │   │   ├── openrouter.service.ts
│   │   │   ├── openrouter.module.ts
│   │   │   └── prompts/
│   │   │       ├── interviewer-system.prompt.ts
│   │   │       ├── evaluator-system.prompt.ts
│   │   │       └── persona-templates.ts
│   │   ├── tts/
│   │   │   ├── tts.service.ts
│   │   │   └── tts.module.ts
│   │   ├── common/
│   │   │   ├── filters/
│   │   │   ├── guards/
│   │   │   └── interceptors/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── nest-cli.json
│   ├── tsconfig.json
│   └── package.json
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.frontend
│   │   └── Dockerfile.backend
│   └── serverless/
│       └── serverless.yml             # Optional: AWS Lambda / Vercel
├── .nvmrc
├── .npmrc
├── .gitignore
├── .editorconfig
└── README.md
```

---

## D3 · Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend Framework** | Angular 19+ (standalone) | Signals, SSR-ready, strong typing |
| **3D Avatar** | [TalkingHead](https://github.com/met4citizen/TalkingHead) + Three.js | MIT license, real-time lip-sync, browser-native, emoji→expressions |
| **Avatar Models** | Ready Player Me GLB / Custom GLB | Mixamo-compatible rig + ARKit blend shapes |
| **Animations** | Mixamo FBX | Free library of body animations |
| **Styling** | Tailwind CSS 4 + SCSS | Utility-first, dark mode built-in |
| **State Management** | Angular Signals + RxJS | Native reactivity, no extra deps |
| **Backend** | NestJS 11 (Node.js 22) | TypeScript, modular, OpenAPI support |
| **LLM** | [Arcee AI Trinity Large Preview](https://openrouter.ai/arcee-ai/trinity-large-preview:free) via OpenRouter | 400B MoE, 13B active, 128K context, FREE, excels at role-play & chat |
| **TTS** | Google Cloud TTS (free tier) + TalkingHead built-in lip-sync | Word-level timestamps for precise viseme sync |
| **STT** | Web Speech API (browser) | Zero cost, no backend needed |
| **Deployment (FE)** | GitHub Pages | Free, CI/CD with Actions |
| **Deployment (BE)** | Vercel Serverless / Railway | Free tier, auto-scaling |
| **CI/CD** | GitHub Actions | Native integration |
| **Testing** | Vitest (unit) + Cypress (e2e) | Fast, modern |
| **SCA** | `npm audit` + Dependabot | Automated vulnerability scanning |

---

## D4 · Data Flow — Interview Session

```
User speaks → Web Speech API (STT) → text
    ↓
Frontend sends POST /api/interview/message { sessionId, text }
    ↓
Backend: InterviewService
    → Builds message array with system prompt + conversation history
    → Calls OpenRouter API (arcee-ai/trinity-large-preview)
    → Receives structured JSON:
       {
         "messages": [
           {
             "text": "Tell me about a challenging project...",
             "facialExpression": "thinking",
             "animation": "TalkingOne",
             "emotion": "curious"
           }
         ],
         "metadata": {
           "questionNumber": 3,
           "totalQuestions": 8,
           "phase": "technical"
         }
       }
    → Sends text to Google TTS → receives audio + word timestamps
    → Returns { messages, audio (base64), lipsync data }
    ↓
Frontend: AvatarService
    → Feeds audio to TalkingHead instance
    → TalkingHead performs real-time lip-sync using viseme data
    → Applies facial expression + animation from response
    → Chat panel updates with transcript
    ↓
User sees avatar speaking with synced lips + expressions
```

---

## D5 · OpenRouter API Integration

### Request Format
```typescript
// POST https://openrouter.ai/api/v1/chat/completions
{
  "model": "arcee-ai/trinity-large-preview",
  "messages": [
    {
      "role": "system",
      "content": "You are a professional job interviewer named Alex..."
    },
    {
      "role": "user",
      "content": "I have 3 years of experience with Angular..."
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1024,
  "response_format": { "type": "json_object" }
}
```

### Response Schema (enforced via system prompt)
```typescript
interface InterviewerResponse {
  messages: {
    text: string;
    facialExpression: 'smile' | 'neutral' | 'thinking' | 'surprised' | 'nodding' | 'serious';
    animation: 'Idle' | 'TalkingOne' | 'TalkingThree' | 'ThoughtfulHeadShake' | 'Surprised' | 'DismissingGesture';
    emotion: 'friendly' | 'curious' | 'impressed' | 'neutral' | 'encouraging';
  }[];
  metadata: {
    questionNumber: number;
    totalQuestions: number;
    phase: 'introduction' | 'technical' | 'behavioral' | 'closing';
    scoreHint?: number; // 1-10 internal scoring
  };
}
```

---

## D6 · Avatar System Design

### TalkingHead Integration
```typescript
// Angular component initialization
import { TalkingHead } from 'talkinghead';

const head = new TalkingHead(canvasElement, {
  ttsEndpoint: '/api/tts/',        // Backend proxy
  lipsyncModules: ['en', 'es'],    // Supported languages
  cameraView: 'upper',             // Frame: head + shoulders
  mixerGainSpeech: 3               // Audio volume
});

// Load avatar model
await head.showAvatar({
  url: '/assets/avatars/interviewer.glb',
  body: 'F',                        // or 'M'
  avatarMood: 'neutral',
  lipsyncLang: 'en'
});

// Speak with expression
await head.speakText('Tell me about yourself.', {
  expression: { name: 'thinking' },
  animation: 'TalkingOne'
});
```

### Avatar Features
- **Lip-sync**: Built-in viseme generation from Google TTS word timestamps
- **Expressions**: ARKit blend shapes (52 expressions mapped to emoji set)
- **Animations**: Mixamo FBX animations loaded dynamically
- **Physics**: Dynamic bones for hair/clothing movement
- **Camera**: Adjustable view (full body, upper body, close-up)

---

## D7 · Routing Strategy

| Route | Component | Guard |
|-------|-----------|-------|
| `/` | HomeComponent | — |
| `/interview/config` | InterviewConfigComponent | — |
| `/interview/session` | InterviewComponent | WebGLGuard |
| `/interview/report/:id` | ReportComponent | — |
| `/history` | HistoryComponent | — |

All routes lazy-loaded via `loadComponent`.

---

## D8 · Security Architecture

| Layer | Measure |
|-------|---------|
| API Keys | Stored in backend `.env`, never in frontend |
| Backend Proxy | All OpenRouter/TTS calls go through NestJS |
| Rate Limiting | NestJS `@nestjs/throttler` — 30 req/min per IP |
| Input Validation | `class-validator` DTOs on all endpoints |
| CORS | Whitelist frontend domain only |
| CSP | Strict Content-Security-Policy headers |
| XSS | Angular built-in sanitization + DOMPurify for chat |
| Dependencies | `npm audit` in CI + Dependabot alerts |
| Secrets | GitHub Secrets for CI/CD, never committed |

---

## D9 · Data Models

### InterviewSession
```typescript
interface InterviewSession {
  id: string;                    // UUID
  config: InterviewConfig;
  messages: ConversationMessage[];
  startedAt: Date;
  endedAt?: Date;
  report?: InterviewReport;
}

interface InterviewConfig {
  role: string;                  // "Frontend Developer"
  type: 'technical' | 'behavioral' | 'mixed';
  difficulty: 'junior' | 'mid' | 'senior';
  language: 'en' | 'es';
  resumeText?: string;           // Extracted from PDF
  jobDescription?: string;
  totalQuestions: number;         // Default: 8
}

interface ConversationMessage {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: Date;
  facialExpression?: string;
  animation?: string;
  score?: number;                // AI internal scoring
}

interface InterviewReport {
  overallScore: number;          // 1-100
  strengths: string[];
  improvements: string[];
  questionScores: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
  suggestedResources: string[];
  generatedAt: Date;
}
```
