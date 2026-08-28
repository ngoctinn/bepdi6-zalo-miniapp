# Bep Di 6 Zalo Mini App Frontend

Frontend React 18 + Vite cho Zalo Mini App dat mon Bep Di 6. App gom menu, gio hang, checkout, lich su/chi tiet don hang va man hinh bep/nhan vien.

## Tech Stack

- React 18
- React Router v7
- TanStack Query
- Zustand
- TailwindCSS + Sass
- ZMP SDK + ZMP UI

## Commands

```bash
npm run lint
npm run build
npm run dev
zmp start
zmp deploy
```

## Source Layout

- `src/index.ts`: app entrypoint and global styles.
- `src/app.tsx`: root providers and router mount.
- `src/router.tsx`: page routes and layout handles.
- `src/pages`: route-level screens.
- `src/components`: shared UI and feature components.
- `src/services`: API clients, query hooks, and mutations.
- `src/stores`: local Zustand state.
- `src/types`: API and domain TypeScript types.
- `src/tokens.js`: Tailwind theme tokens and UI copy.
- `src/css`: Tailwind entry and app-level ZMP overrides.

## Design System

Follow `../../docs/DESIGN.md`: Rustic Olive & Warm Ginger Bistro, light mobile-first surfaces, Zalo safe-area aware headers and bottom actions, olive/amber brand palette, and restrained shadows.

## Guardrails

- Do not calculate prices, shipping fees, or voucher discounts on the frontend.
- Disable order submit buttons immediately on first click.
- Do not edit `.env` or commit secrets.
- Do not add dependencies without confirmation.
- Keep generated `www/` assets out of source refactors unless rebuilding for release.
