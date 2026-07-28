# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Spotify web client clone built with Next.js 16 (Pages Router, Turbopack) and TypeScript, styled with SCSS modules, using MUI v9 for icons/a few controls and `spotify-web-api-js` as the Spotify Web API wrapper.

## Commands

```bash
npm run dev        # start dev server (http://localhost:3000)
npm run build      # production build
npm run start      # run production build
npm run lint       # eslint . (flat config)
npm run typecheck  # tsc --noEmit
```

There is no test suite configured in this repo.

Node >= 20.9 is required (`engines` + `.nvmrc` pin 24). npm is the package manager — `package-lock.json` is the only lockfile; don't add a `yarn.lock` alongside it, since two lockfiles make Vercel's package-manager detection ambiguous.

## Environment variables

Auth/config is driven entirely by env vars (see [lib/spotify.ts](lib/spotify.ts)):

- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` — Spotify app client ID
- `NEXT_PUBLIC_VERCEL_URL` — optional. Used to build the OAuth redirect URI; accepts a value with or without protocol/trailing slash and normalizes it (http for localhost, https otherwise). When unset, `getRedirectUri()` falls back to `window.location.origin`, which is the right answer in the browser.

The redirect URI must match a URI registered on the Spotify dashboard character for character, and must be identical in the `/authorize` request and the token exchange.

## Architecture

### Auth flow (Authorization Code + PKCE, no backend)

There is no server-side auth — the whole OAuth flow runs in the browser, with `localStorage` as the token store. All of it lives in [lib/spotify.ts](lib/spotify.ts):

1. [page_components/Login_/login/Login.tsx](page_components/Login_/login/Login.tsx) calls `redirectToLogin()` on click. The `/authorize` URL can only be built at click time because the PKCE code challenge is generated asynchronously (`crypto.subtle.digest`); the verifier is stashed in `localStorage` for the callback.
2. Spotify redirects back to the app with `?code=...` (or `?error=...`) in the query string.
3. [layout/Layout.tsx](layout/Layout.tsx) (the `Common` component, wrapped around every page) resolves a token on mount:
   - `?error=` → clear tokens, go to `/login`
   - `?code=` → `exchangeCodeForToken()` (POSTs to Spotify's `/api/token` with the stored verifier), then strips the query params via `history.replaceState`
   - otherwise → `getValidAccessToken()`, which refreshes via the stored refresh token when the access token is missing or within `EXPIRY_MARGIN` (60s) of expiring
4. With a token it sets the shared `spotify` client's token, calls `getMe()` to validate and load the user, dispatches `SET_USER_N_TOKEN`, and starts a `setInterval` (every 5 min) that keeps the token fresh while the app stays open. It then kicks off initial data loads: current playback, a "discover weekly" search used as the default active playlist, and featured playlists.
5. All pages must be wrapped in `<Layout>` (see [pages/index.tsx](pages/index.tsx), [pages/login/index.tsx](pages/login/index.tsx)) — this is what gates rendering on auth and shows a spinner while resolving. Because auth is resolved in an effect, the server-rendered HTML for every route is just that spinner.

Token/verifier storage keys and all refresh logic are centralized in `lib/spotify.ts` — go through `getValidAccessToken()` / `clearTokens()` rather than touching `localStorage` directly.

### Global state

State is a single React Context + `useReducer` store, not Redux:

- [context/StateProvider.tsx](context/StateProvider.tsx) provides `StateContext` at the `_app.tsx` level, wrapping every page.
- [context/Reducer.ts](context/Reducer.ts) defines `initialState` and the reducer (action types like `SET_USER_N_TOKEN`, `SET_PLAYLISTS`, `SET_ACTIVE_PLAYLIST`, `SET_PAGE`, `SET_PLAYING_DETAILS`, `SET_PLAYING_TRACK`, `SET_PLAY_PAUSE`, `SET_SHUFFLE`, `SET_REPEAT`).
- Access state/dispatch anywhere with `useStateContextValue()` from [context/StateProvider.tsx](context/StateProvider.tsx) — it returns `[state, dispatch]` just like `useReducer`.
- `current_page` in state (`'home' | 'playlist' | 'search' | 'library'`) drives which view [page_components/Player_body/Player_body.tsx](page_components/Player_body/Player_body.tsx) renders — there is no client-side routing between these views, just state switching.

### Spotify API access

[lib/api_spotify.ts](lib/api_spotify.ts) exports a single shared `spotify` instance (`spotify-web-api-js`). Its access token is set in `Layout.tsx` after auth (and refreshed on the interval); all other components import this same singleton and call methods directly (e.g. `spotify.getPlaylist()`, `spotify.searchPlaylists()`) rather than going through API routes — there's no backend proxy for Spotify calls.

### Playback

Audio playback is handled entirely in [page_components/footer/Footer.tsx](page_components/footer/Footer.tsx) via a plain `<audio>` element (ref'd, not a library), playing Spotify's 30s `preview_url` per track. Footer owns local player state (current playlist order, volume, play time) and syncs play/pause/track-change with global state (`playing`, `playing_track_id`, `playing_playlist_id`, `outer_playing_track_id`). Shuffle re-orders a local copy of the track list; repeat wraps `playNext` back to index 0.

### Directory layout

- `pages/` — Next.js routes (`/`, `/login`); thin, just compose `layout` + `page_components`.
- `layout/` — the single `Layout` component that gates auth and wraps all pages.
- `page_components/` — larger, route-specific composite components (sidebar, footer, player body and its sub-views: library/playlist/search, login).
- `components/` — smaller shared/presentational components (header, song row, search row, sidebar option, media progress, loading spinner, etc).
- `context/` — global state (provider + reducer).
- `lib/` — Spotify auth/PKCE helpers and the shared `spotify-web-api-js` client instance.
- `sass/` — shared SCSS abstracts (`abstract/_variables.scss`, `abstract/_mixin.scss`) and base styles, pulled into `styles/globals.scss`. Individual components use co-located `*.module.scss` CSS modules.

## Conventions and gotchas

- **Sass uses `@use`, not `@import`.** `@use` is not transitive, so every partial must load its own dependencies — e.g. `sass/base/_base.scss` pulls in `../abstract/mixin` itself. Files needing shared values use `@use "<path>/variables" as *` so `$spotify_green` / `respond()` stay unqualified.
- **Linting is ESLint flat config** ([eslint.config.mjs](eslint.config.mjs)) run via the ESLint CLI — `next lint` was removed in Next 16. `@typescript-eslint/no-explicit-any` and `react-hooks/set-state-in-effect` are deliberately downgraded to warnings: Spotify payloads are consumed untyped throughout, and Footer's `<audio>` syncing legitimately sets state from effects. Lint is expected to pass with ~65 warnings; keep it at zero *errors*.
- **`next/image` needs `remotePatterns`** in [next.config.js](next.config.js) for any new remote host (`images.domains` was removed in Next 16). Spotify art comes from `**.scdn.co`.
- **`overrides` in package.json** force patched `sharp` and `postcss` versions that Next's own dependency ranges lag behind — they exist to keep `npm audit --omit=dev` clean. Re-check them when upgrading Next.
- MUI v9 (`@mui/material`, `@mui/icons-material`, with Emotion) is used only for icons and a few controls (volume `Slider`, `Grid`, `Avatar`) — there's no theme provider. Note the v9 `Grid` API uses `size` (e.g. `size="grow"`); the old `item` / `xs` props are gone.
