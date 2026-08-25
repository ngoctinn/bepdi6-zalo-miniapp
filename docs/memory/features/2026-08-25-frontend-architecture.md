---
title: "Frontend Architecture & ZMP Integration"
description: "React 18 + Vite + ZMP SDK architecture, routing, and environment config"
tags: [frontend, architecture, react, vite, zmp-sdk]
created: 2026-08-25
updated: 2026-08-25
type: "fact"
importance: 3
source: scan
---

# Frontend Architecture & ZMP Integration

## Overview
The frontend is a Zalo Mini App SPA located in `apps/frontend`, built using React 18, Vite 5, TailwindCSS 3, React Router DOM 7, and the official ZMP SDK & ZaUI (`zmp-sdk`, `zmp-ui`).

## Key Points
- **Entry & Base Path**: Built with Vite and `zmp-vite-plugin`. Routes use `createBrowserRouter` with dynamic `basename` calculated via `getBasePath()` (`/zapps/${window.APP_ID}` under production or test environments).
- **Styling**: TailwindCSS with CSS variables defined in design tokens (`tokens.js`) and ZaUI Bistro theme styles.
- **Layout & Routing**: Managed under a root `<Layout />` in `src/router.tsx` handling sticky headers, bottom navigation, and cart overlays.

## Related
- `apps/frontend/src/router.tsx`
- `apps/frontend/src/utils/zma.ts`
- `apps/frontend/src/app.tsx`
- `apps/frontend/vite.config.mts`
