# Interview Simulator with Avatar — Requirements

## R1 · Project Overview

**Interview Simulator with Avatar** is a web application that simulates realistic job interviews using an AI-powered 3D talking avatar. The system uses **Arcee AI Trinity Large Preview** via **OpenRouter** as the conversational brain, combined with browser-based 3D avatar rendering with real-time lip-sync.

---

## R2 · Functional Requirements

### R2.1 — Interview Configuration
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | The user SHALL select a job role/position for the interview (e.g., Frontend Developer, Data Scientist) | Must |
| FR-02 | The user SHALL select interview type: Technical, Behavioral, Mixed | Must |
| FR-03 | The user SHALL select difficulty level: Junior, Mid, Senior | Must |
| FR-04 | The user MAY upload their resume/CV (PDF) for personalized questions | Should |
| FR-05 | The user MAY paste a job description URL or text for targeted questions | Should |
| FR-06 | The system SHALL support interview language selection (EN, ES) | Should |

### R2.2 — Conversational AI (Brain)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10 | The system SHALL use OpenRouter API with `arcee-ai/trinity-large-preview` model | Must |
| FR-11 | The system SHALL maintain multi-turn conversation context throughout the interview | Must |
| FR-12 | The AI SHALL generate contextual follow-up questions based on user responses | Must |
| FR-13 | The AI SHALL provide structured JSON responses including text, facial expression, and animation cues | Must |
| FR-14 | The system SHALL support system prompts defining interviewer persona and behavior | Must |
| FR-15 | The AI SHALL evaluate user answers and provide scoring at the end | Should |

### R2.3 — 3D Avatar & Lip-Sync
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-20 | The system SHALL render a 3D avatar in the browser using Three.js/WebGL | Must |
| FR-21 | The avatar SHALL perform real-time lip-sync synchronized with TTS audio | Must |
| FR-22 | The avatar SHALL display facial expressions (smile, neutral, thinking, surprised, nodding) | Must |
| FR-23 | The avatar SHALL play contextual body animations (idle, talking, listening, gesturing) | Must |
| FR-24 | The user MAY select from multiple avatar appearances | Should |
| FR-25 | The system SHALL use the TalkingHead library for 3D avatar rendering and lip-sync | Must |

### R2.4 — Voice I/O
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-30 | The system SHALL support text-to-speech for avatar responses (Google TTS / Web Speech API) | Must |
| FR-31 | The system SHALL support speech-to-text for user input (Web Speech API / Whisper) | Must |
| FR-32 | The user MAY toggle between voice and text input modes | Must |
| FR-33 | The system SHALL show real-time transcription of user speech | Should |

### R2.5 — Interview Flow & Feedback
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-40 | The system SHALL manage interview phases: Introduction → Questions → Follow-ups → Closing | Must |
| FR-41 | The system SHALL display a progress indicator (question X of Y) | Must |
| FR-42 | The system SHALL generate a post-interview report with scores and feedback per answer | Must |
| FR-43 | The report SHALL include: overall score, strengths, areas to improve, suggested resources | Should |
| FR-44 | The user MAY download the report as PDF | Should |
| FR-45 | The system SHALL store interview history in local storage or user account | Should |

### R2.6 — User Interface
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-50 | The app SHALL be a Single Page Application (SPA) | Must |
| FR-51 | The app SHALL be fully responsive (desktop, tablet, mobile) | Must |
| FR-52 | The app SHALL have a dark/light theme toggle | Should |
| FR-53 | The app SHALL display a chat transcript panel alongside the avatar | Must |
| FR-54 | The app SHALL show avatar loading state with skeleton/spinner | Must |

---

## R3 · Non-Functional Requirements

| ID | Requirement | Category |
|----|-------------|----------|
| NFR-01 | Avatar response latency SHALL be < 3 seconds (text generation + TTS) | Performance |
| NFR-02 | The app SHALL work on Chrome, Firefox, Edge (latest 2 versions) | Compatibility |
| NFR-03 | WebGL SHALL be required; the app SHALL show a fallback message if unsupported | Compatibility |
| NFR-04 | API keys SHALL never be exposed in frontend code | Security |
| NFR-05 | All API calls SHALL go through a backend proxy | Security |
| NFR-06 | The app SHALL score ≥ 90 on Lighthouse accessibility audit | Accessibility |
| NFR-07 | The app SHALL implement CSP headers and input sanitization | Security |
| NFR-08 | Dependencies SHALL be audited with `npm audit` on every CI run | SCA |
| NFR-09 | The app SHALL support offline mode for reviewing past interviews | Resilience |
| NFR-10 | The system SHALL handle API rate limits gracefully with retry logic | Resilience |

---

## R4 · Constraints

- **LLM Provider**: OpenRouter API exclusively (model: `arcee-ai/trinity-large-preview`)
- **Avatar Engine**: TalkingHead (Three.js-based, MIT license)
- **Frontend**: Angular 19+ with standalone components
- **Backend**: Node.js with NestJS (API proxy + session management)
- **Deployment**: GitHub Pages (frontend) + Serverless functions (backend)
- **Budget**: Free tier OpenRouter (Trinity Large Preview is free during preview)
- **No paid TTS**: Use Google TTS free tier or Web Speech API
