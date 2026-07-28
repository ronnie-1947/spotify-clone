# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Spotify web client clone built with Next.js 11 (pages router) and TypeScript, styled with SCSS modules, using Material-UI (v4) for icons/components and `spotify-web-api-js` as the Spotify Web API wrapper.

## Commands

```bash
yarn dev      # start dev server (http://localhost:3000)
yarn build    # production build
yarn start    # run production build
yarn lint     # next lint (eslint-config-next)
```

There is no test suite configured in this repo.

Note: `package-lock.json` and `yarn.lock` are both present; the project has historically used yarn (scripts reference `yarn` in this doc, but either package manager works since both lockfiles exist).

## Environment variables

Auth/config is driven entirely by env vars (see [lib/spotify.ts](lib/spotify.ts)):

- `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` — Spotify app client ID
- `NEXT_PUBLIC_VERCEL_URL` — used to build the OAuth redirect URI
- `NEXT_PUBLIC_MODE` — when set to `'production'`, the redirect URI is built as `https://${NEXT_PUBLIC_VERCEL_URL}/`; otherwise it uses `NEXT_PUBLIC_VERCEL_URL` as-is (for local dev over http)

## Architecture

### Auth flow (implicit grant, no backend)

This app has no server-side auth — it uses Spotify's implicit-grant OAuth flow entirely client-side:

1. [pages/login/index.tsx](pages/login/index.tsx) renders a login link built from `loginUrl` in [lib/spotify.ts](lib/spotify.ts), which redirects to Spotify's `/authorize` endpoint.
2. Spotify redirects back to `/` with the access token in the URL hash fragment.
3. [layout/Layout.tsx](layout/Layout.tsx) (the `Common` component, wrapped around every page) reads the token from the hash via `getAccessCode()`, falling back to `localStorage.getItem('access_token')`. It then:
   - sets the token on the shared `spotify` client singleton ([lib/api_spotify.ts](lib/api_spotify.ts))
   - calls `spotify.getMe()` to validate the token and load the user
   - dispatches `SET_USER_N_TOKEN` into global state and persists the token to `localStorage`
   - redirects to `/login` on failure (invalid/expired token), or to `/` on success
   - kicks off initial data loads: current playback, a "discover weekly" search fallback used as the default active playlist, and featured playlists
4. All pages are expected to be wrapped in `<Layout>` (see [pages/index.tsx](pages/index.tsx), [pages/login/index.tsx](pages/login/index.tsx)) — this is what gates rendering on auth state and shows a spinner while resolving it.

### Global state

State is a single React Context + `useReducer` store, not Redux:

- [context/StateProvider.tsx](context/StateProvider.tsx) provides `StateContext` at the `_app.tsx` level, wrapping every page.
- [context/Reducer.ts](context/Reducer.ts) defines `initialState` and the reducer (action types like `SET_USER_N_TOKEN`, `SET_PLAYLISTS`, `SET_ACTIVE_PLAYLIST`, `SET_PAGE`, `SET_PLAYING_DETAILS`, `SET_PLAYING_TRACK`, `SET_PLAY_PAUSE`, `SET_SHUFFLE`, `SET_REPEAT`).
- Access state/dispatch anywhere with `useStateContextValue()` from [context/StateProvider.tsx](context/StateProvider.tsx) — it returns `[state, dispatch]` just like `useReducer`.
- `current_page` in state (`'home' | 'playlist' | 'search' | 'library'`) drives which view [page_components/Player_body/Player_body.tsx](page_components/Player_body/Player_body.tsx) renders — there is no client-side routing between these views, just state switching.

### Spotify API access

[lib/api_spotify.ts](lib/api_spotify.ts) exports a single shared `spotify` instance (`spotify-web-api-js`). Its access token is set once in `Layout.tsx` after auth; all other components import this same singleton and call methods directly (e.g. `spotify.getPlaylist()`, `spotify.searchPlaylists()`) rather than going through API routes — there's no backend proxy for Spotify calls.

### Playback

Audio playback is handled entirely in [page_components/footer/Footer.tsx](page_components/footer/Footer.tsx) via a plain `<audio>` element (ref'd, not a library), playing Spotify's 30s `preview_url` per track. Footer owns local player state (current playlist order, volume, play time) and syncs play/pause/track-change with global state (`playing`, `playing_track_id`, `playing_playlist_id`, `outer_playing_track_id`). Shuffle re-orders a local copy of the track list; repeat wraps `playNext` back to index 0.

### Directory layout

- `pages/` — Next.js routes (`/`, `/login`); thin, just compose `layout` + `page_components`.
- `layout/` — the single `Layout` component that gates auth and wraps all pages.
- `page_components/` — larger, route-specific composite components (sidebar, footer, player body and its sub-views: library/playlist/search, login).
- `components/` — smaller shared/presentational components (header, song row, search row, sidebar option, media progress, loading spinner, etc).
- `context/` — global state (provider + reducer).
- `lib/` — Spotify auth helpers and the shared `spotify-web-api-js` client instance.
- `sass/` — shared SCSS abstracts (`abstract/_variables.scss`, `abstract/_mixin.scss`) and base styles, imported into `styles/globals.scss`. Individual components use co-located `*.module.scss` CSS modules.

## Notes

- `tsconfig.json` targets `es5` with `strict: true`.
- Material-UI v4 (`@material-ui/core`, `@material-ui/icons`) is used for icons and a few controls (e.g. the volume `Slider`, `Grid`) — not for full-scale theming.
