---
applyTo: "**/*.spec.ts"
---

# Testing Instructions — Interview Simulator

- Structure tests with `describe` → `it` blocks; use descriptive names
- Follow AAA pattern: Arrange → Act → Assert
- Mock external dependencies:
  - OpenRouter API: mock HTTP responses with structured JSON
  - Google TTS: mock audio base64 + lipsync data
  - TalkingHead: mock WebGL context and avatar methods
  - Web Speech API: mock SpeechRecognition events
- Use `TestBed` with standalone component imports (no module declarations)
- Test services independently from components
- Test interview flow state transitions: config → questions → closing → report
- Assert that API keys are never present in frontend bundles
- Minimum 80% coverage on `core/services/` and `backend/src/`
- E2E tests (Cypress): test full interview flow with mocked backend
- Use `cy.intercept()` to mock API responses in E2E tests
