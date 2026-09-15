# Grove — your study world

Study, make progress, grow a world. A personal, local-first study companion:
no ads, no accounts, no subscriptions, no premium currency.

## What's in v1

- **Home dashboard** — today's progress, streak, level, next task, a live preview of your world, wellness quick-log, weekly summary
- **Study timer** — pick a subject/topic/duration and go; distraction-free running screen; timestamp-based so it stays accurate even if your phone locks or the tab is backgrounded
- **Plan** — tasks, subjects & topics (with mastery status), a weekly planner, and a repeating after-school routine
- **Progress** — study time by day/week/subject, streaks, XP/levels, achievements
- **World** — a growing SVG scene (grass → sprout → trees → pond → path → cabin → forest → village → observatory) driven entirely by a config file (`src/lib/worldProgression.ts`), not hardcoded logic. Day/evening/night lighting, subtle seasons.
- **Settings** — profile, study targets, timer defaults, appearance, and full **data export/import** (JSON) plus a confirmed reset
- **PWA** — installable on your phone's home screen, works offline, icon + splash included

Everything is stored locally in IndexedDB via `src/data/dataStore.ts`. That file
is the only place that talks to storage, so cloud sync could be added later
without touching any page or component.

## Running it locally

```bash
npm install
npm run dev
```

Open the printed local URL. On your phone, open the same URL (make sure your
phone and computer are on the same network, or deploy it — see below — and
use "Add to Home Screen" from the browser share menu for the full app-like
experience).

## Building for production

```bash
npm run build
```

Output goes to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Deploying (free, in a few minutes)

Any static host works since this is a fully client-side PWA. Easiest options:

**Netlify** — drag the `dist/` folder onto app.netlify.com/drop, or connect the repo and set build command `npm run build`, publish directory `dist`.

**Vercel** — `npx vercel` from this folder, or connect the repo (framework preset: Vite).

**GitHub Pages** — push this folder to a repo, then `npm run build` and publish `dist/` to the `gh-pages` branch (or use a GitHub Actions workflow).

Once deployed, open the URL on your phone in Safari/Chrome and choose **Add to Home Screen**.

## Project structure

```
src/
  components/   shared UI (buttons, cards, nav, charts)
  data/         AppDataContext (state) + dataStore.ts (IndexedDB) + defaults
  features/
    timer/      timestamp-based timer engine
    world/      SVG scene renderer + element library
  hooks/        useStudyTimer
  lib/          xp.ts, stats.ts, worldProgression.ts, achievements.ts
  pages/        one file per route
  types/        the whole data model
  utils/        date/time formatting
```

## Notes for future you

- To add a new world unlockable: add one entry to `WORLD_UNLOCKS` in
  `src/lib/worldProgression.ts` with a `requirement` predicate — nothing else
  needs to change.
- To add a new achievement: same pattern in `src/lib/achievements.ts`.
- The timer is intentionally timestamp-based (`features/timer/timerEngine.ts`)
  rather than counting seconds with `setInterval`, so it can't drift or reset
  itself when the screen sleeps.
- Cloud sync, accounts, flashcards, spaced repetition, etc. were deliberately
  left out of v1 per the original brief — the data layer is shaped so they
  can be added later without a rewrite.
