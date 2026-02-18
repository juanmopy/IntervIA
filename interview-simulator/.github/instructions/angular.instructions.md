---
applyTo: "frontend/**/*.ts"
---

# Angular Instructions — Interview Simulator

- Use standalone components; never create NgModules
- Use `inject()` for dependency injection, not constructor params
- Use `ChangeDetectionStrategy.OnPush` on every component
- Use Angular Signals (`signal()`, `computed()`, `effect()`) for reactive state
- Use `@defer` for heavy components (avatar canvas, report charts)
- Lazy load all feature routes with `loadComponent`
- Use typed Reactive Forms with `FormBuilder`
- Handle TalkingHead as a service wrapper, not directly in components
- Dispose Three.js/WebGL resources in `ngOnDestroy`
- Use `takeUntilDestroyed()` for RxJS subscriptions
