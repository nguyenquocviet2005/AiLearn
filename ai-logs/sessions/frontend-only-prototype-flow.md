# AI Collaboration Log — Frontend-only prototype flow

- **Date:** 2026-07-19
- **Human owner:** viet2005
- **AI tool / model:** Cursor Agent (Composer)
- **Linear issue:** none (design-review spike)
- **Objective:** Build a frontend-only prototype that demonstrates the complete closed user flow with mock data and no backend/API integration.

## Work performed

1. Added `/prototype` route with guided steps: intro → class overview → lesson plan → student path → intervention report (+ printable).
2. Created in-memory mock teacher/report repositories from existing Grade 7 fixtures.
3. Reused production UI (`TeacherWorkspace`, `StudentPreviewWorkspace`, `TeacherReport`, `PrintableTeacherReport`) with injected repositories.
4. Linked prototype from the landing hero CTA.
5. Added focused Vitest coverage asserting no `fetch` during the walkthrough.

## Files changed

- `apps/web/src/features/prototype/**`
- `apps/web/src/App.tsx`
- `apps/web/src/features/landing/LandingPage.tsx`
- `ai-logs/sessions/frontend-only-prototype-flow.md`

## How to review

```bash
pnpm --filter @ailearn/web dev
# open http://localhost:5173/prototype
```

## Remaining limitations

- Student step uses the existing `/student-preview` mock personas, not live Engine 3.
- Plan approve/publish state is session-local and resets on remount.
- Print step is mock-backed; browser print CSS is unchanged.
