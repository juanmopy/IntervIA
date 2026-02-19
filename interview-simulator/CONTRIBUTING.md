# Contributing to IntervIA

Thank you for your interest in contributing! Here's how to get started.

## Development Setup

1. **Fork** and clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```
3. Copy environment variables:
   ```bash
   cd backend && cp .env.example .env
   ```
4. Start development servers:
   ```bash
   # Terminal 1 — Backend
   cd backend && npm run start:dev
   
   # Terminal 2 — Frontend
   cd frontend && npm start
   ```

## Code Standards

- **TypeScript** everywhere — strict mode enabled
- **Angular** — standalone components, signals, `ChangeDetectionStrategy.OnPush`
- **NestJS** — DTOs with class-validator, dependency injection
- **Testing** — Vitest for frontend, Jest for backend
- **Styling** — Tailwind CSS 4, class-based dark mode

## Pull Request Guidelines

1. Create a feature branch from `main`
2. Keep PRs focused — one feature or fix per PR
3. Write or update tests for your changes
4. Ensure all tests pass before submitting
5. Fill in the PR template with a clear description

## Reporting Issues

- Use GitHub Issues with appropriate labels
- Include steps to reproduce bugs
- Screenshots/screencasts are helpful

## Code of Conduct

Be respectful, constructive, and inclusive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
