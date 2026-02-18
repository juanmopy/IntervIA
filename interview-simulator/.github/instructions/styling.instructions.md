---
applyTo: "frontend/**/*.{scss,html}"
---

# Styling Instructions — Interview Simulator

- Use Tailwind CSS utility classes as the primary styling method
- Use `dark:` variants for all color-related classes (theme support)
- Mobile-first: start with base styles, add `sm:`, `md:`, `lg:` breakpoints
- Avatar canvas: use `w-full h-full` with aspect ratio container
- Chat panel: use `flex flex-col` with `overflow-y-auto` for scrolling
- Use Tailwind `animate-` classes for loading states and transitions
- SCSS only for:
  - Complex keyframe animations (avatar loading, mic pulse)
  - Component-specific styles that can't be expressed in Tailwind
- Never use inline styles or `!important`
- Use CSS custom properties for theme colors: `--color-primary`, `--color-surface`
- Ensure minimum touch target size of 44x44px for mobile
- Use `sr-only` class for screen-reader-only text
- Avatar container: maintain 16:9 aspect ratio on desktop, 4:3 on mobile
