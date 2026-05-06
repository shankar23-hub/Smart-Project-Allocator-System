# SPA Admin Portal — Professional Redesign

A complete UI/UX overhaul of the SPA Admin Portal frontend. Backend untouched and 100% backwards-compatible.

## What changed

### Design system
- **New brand color palette:** indigo `#7c5cff` (primary) + cyan `#38bdf8` (accent), replacing the previous aggressive red theme. Refined danger red `#ef4d6a` used only for true error/destructive states.
- **Layered dark surfaces:** `#0b0e1a` (background) → `#161b2a` (surface) → `#1d2236` (elevated), with subtle radial gradient ambience and clean borders.
- **Typography:** Plus Jakarta Sans for UI text, JetBrains Mono for numerics — preloaded in `index.html`.
- **8px grid alignment** throughout — consistent spacing, padding, and gaps.
- **Glass-morphism topbar** with backdrop blur, refined input focus rings, custom select chevrons.

### Pages rewritten from scratch
- **`Login.jsx`** — Two-column auth layout: left brand panel with image carousel + feature list, right form panel with icon-prefixed inputs, password show/hide toggle, "Remember me" + "Forgot password" links.
- **`CreateAccount.jsx`** — Matching two-column layout. Fields with icon prefixes, role selector, password validation (match + min 6 chars), show/hide toggles.

### Components rewritten
- **`Sidebar.jsx`** — Replaced Unicode symbols (`◫ ◉ ◌`) with crisp inline SVG icons (8 icons). Two sections: Main + Account. User avatar with gradient initials, refined logout button.
- **`Navbar.jsx`** — Cleaner topbar with breadcrumb, search input, notification bell, divider, user avatar with initials.

### Pages polished (color & alignment pass)
- `Dashboard.jsx` — neo-styled stat cards, conic-gradient activity ring, area chart with new gradient fills.
- `StaffProfiles.jsx`, `Certifications.jsx`, `ProjectStatus.jsx`, `ProjectAIAllocation.jsx`, `StaffID.jsx`, `MyProfile.jsx`, `Settings.jsx` — legacy red/purple hexes replaced with new brand palette; ID card gradient stripe updated to indigo→cyan.

### Other updates
- **`global.css`** — Full new ~1100-line design system with all utility classes (cards, buttons, forms, badges, tables, tabs, modals, toasts, responsive grids). Includes backwards-compat aliases (`--bg2`, `--panel`, `--accent`, etc.) so nothing breaks.
- **`App.jsx`** — Loader spinner updated to brand colors.
- **`index.html`** — New title, theme-color meta, gradient SVG favicon, font preloads.

## Setup

```bash
# Frontend
cd frontend
npm install
npm run dev          # dev server on http://localhost:5173
npm run build        # production build to dist/

# Backend (Flask)
cd backend
pip install -r requirements.txt
python app.py        # http://localhost:5000
```

Environment: copy `backend/.env.example` to `backend/.env` and configure SMTP if you want PDF email delivery.

## Backwards compatibility

- All API endpoints, routes, auth flow, localStorage keys (`spa_token`, `spa_user`), and database schema are unchanged.
- Page components that still use inline styles continue to work — they reference CSS variables that resolve correctly via the new aliasing layer.
- Existing data in MongoDB/SQLite will render correctly without migration.

## Verified
✅ `npm run build` — clean production build, 845 modules, ~32KB CSS, ~710KB JS (gzipped: 6.83KB CSS / 197KB JS).
