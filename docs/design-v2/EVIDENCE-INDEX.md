# Visual evidence index

Screenshots live in `.design-evidence/` at the repository root. That folder is excluded from git via `.git/info/exclude`, so it is local to the working copy.
Captured with Chrome DevTools MCP against a local production build. Playwright MCP was unavailable (its browser profile was locked by another process).
Anything not listed here was not captured.

## Homepage, before and after

| Viewport | Before | After |
|---|---|---|
| 1440 | before/home-1440.png | after/home-1440.png, after/home-1440-hero.png |
| 1920 | before/home-1920.png | after/home-1920.png |
| 1024 | before/home-1024.png | after/home-1024.png |
| 768 | before/home-768.png | after/home-768.png |
| 390 | before/home-390.png | after/home-390.png |
| 360 | before/home-360.png | after/home-360.png |

Optional 3D layer (off by default, `?flow3d=1`): after/home-1440-3d.png, after/home-1440-3d-parallax.png.

## Arabic / RTL

| Page | Before | After |
|---|---|---|
| Home 1440 | before/ar-home-1440.png | after/ar-home-1440-hero.png |
| Home 390 | before/ar-home-390.png | after/ar-home-390-hero.png |
| Data Analytics 390 | n/a | after/ar-analytics-390-hero.png, after/ar-analytics-390-flow.png |

## Academy (light)

| Viewport | Before | After |
|---|---|---|
| 1440 | before/academy-1440.png | after/academy-1440.png |
| 390 | before/academy-390.png | after/academy-390.png |
| 768 / 1920 | n/a | after/academy-768.png, after/academy-1920.png |

## Service pages

| Page | Before | After |
|---|---|---|
| AI Agents 1440 | before/agents-diagram-1440.png | after/agents-1440-hero.png, after/agents-1440-flow.png |
| AI Agents 390 | n/a | after/agents-390-hero.png, after/agents-390-flow.png |
| Power BI 1440 | before/powerbi-sketch-1440.png (the removed fake dashboard sketch) | after/powerbi-1440-flow.png |
| Data Analytics 390 | n/a | after/analytics-390-flow.png |
| Machine Learning 1440 | n/a | after/ml-1440-flow.png |
| Services index 1440 | n/a | after/services-1440.png |

A full-page capture of the AI Agents 390 page was discarded because the tool tiled it incorrectly.

## Not captured

Not screenshotted: Data Analytics at 1440, Machine Learning at 390, Power BI at 390, WhatsApp Automation, and 768/1024/1920 for the service pages.
These were checked by DOM overflow checks (no horizontal overflow at 390 or 1440) and the automated tests instead.
About, Contact, Blog, Resources and the auth pages were restyled by token migration and confirmed by build and DOM checks only;
of the non-service pages, only the Services index was inspected visually.
