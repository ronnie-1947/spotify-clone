# Plan: restore track listings and playback via an iTunes preview fallback

Status: **not started**
Created: 2026-07-29

---

## 1. Background

### The symptom

The deployed app (`spotify-clone-jet.vercel.app`) shows no tracks anywhere and plays no
audio. Playlists, artists and albums all open to a blank body.

### The cause

Every track Spotify returns now has `preview_url: null`. This is part of the same
2024-11-27 Web API restriction already documented in [`lib/playlists.ts`](../lib/playlists.ts) —
30-second preview URLs were withdrawn from apps without extended quota mode. The
requests still return `200`; the field is simply always `null`.

Evidence from the 2026-07-29 HAR capture:

- `GET /v1/artists/5WUlDfRSoLAfcVSX1WnrxN/top-tracks?country=US` → 10 tracks, every
  one `"preview_url": null`
- `GET /v1/albums/0ujHQ5WCLuKJQXOqXpGtpf` → all 10 tracks `"preview_url": null`

The app treats `preview_url` as a precondition for a track *existing*, in four places,
so a null field means nothing renders and nothing plays:

| Location | Code | Effect |
|---|---|---|
| `components/songRow/SongRow.tsx:27` | `if (!track?.preview_url) return null` | every row renders as nothing |
| `page_components/Player_body/playlist/Playlist.tsx:82` | `.filter(t => t?.track?.preview_url)` | track list is empty |
| `page_components/Player_body/playlist/Playlist.tsx:30` | same predicate → `if(!track_id) return` | the big play button is a no-op |
| `page_components/footer/Footer.tsx:53` | `t.track.preview_url && t.track.id` | queue empty → `if (!track) return` at :65 → `audio.src` never set |

### Two secondary problems in the same capture

Independent of previews, and they would still leave Home and Search blank once
previews are fixed:

- `GET /v1/me/playlists` → the account owns exactly one playlist, `"Rony Techno"`,
  with `"tracks": {"total": 0}` and `"images": null`.
  `getDefaultPlaylist()` takes `own[0]?.id` unconditionally, so Home opens an
  empty playlist.
- `GET /v1/me/top/artists` → `{"items": [], "total": 0}` (fresh account, no listening
  history), so the Search landing state renders nothing.
- `SearchRow.tsx:98` drops any card without cover art, which silently eats the
  user's own playlist (`images: null`).

### Ruled out

The two `401`s on `/v1/albums/.../tracks?offset=0&limit=50` at the end of the capture
carry no `authorization` header and their initiator is an anonymous script with an
empty URL — devtools/extension traffic, not app code. Not a bug in this codebase.

---

## 2. Chosen approach

Source 30-second previews from the **iTunes Search API** (free, no auth, still serves
`previewUrl`), matched by artist + track name. Keep the existing `<audio>` element and
the whole of `Footer`'s player model intact.

### Two decisions that shape the design

**A. Previews are resolved lazily, at play time — never in bulk.**

The obvious implementation (hydrate `preview_url` for a whole playlist on load) breaks
on iTunes' rate limit of roughly 20 requests/minute per IP: a 50-track playlist is 50
lookups, and on Vercel that IP is shared across all visitors. Instead:

- rendering never waits on, or depends on, a preview — rows appear as soon as Spotify
  returns them;
- a lookup happens only when a track is actually played, plus a fire-and-forget
  prefetch of the next track in the queue (~1 lookup per play);
- results are cached by Spotify track id in memory and `localStorage`, **including
  negative results**, so repeat plays cost nothing.

**B. Lookups go through a Next.js API route, not the browser.**

`itunes.apple.com/search` has inconsistent CORS headers (it is really a JSONP-era API),
so a direct `fetch` from the client is not dependable. A route also gets free edge
caching on Vercel via `s-maxage`, and keeps the iTunes response contract in one file.

This does not conflict with the "no backend proxy" convention in `CLAUDE.md` — that
rule is about **Spotify** calls, which stay client-side and untouched.

### Known limitations (accept these, don't try to engineer them away)

- **Matching is heuristic.** Name + artist + duration proximity is reliable for
  mainstream catalogue, weaker for obscure or non-Western releases, where the result
  is a null and a dimmed row.
- **iTunes may rate-limit.** The resolver treats any non-200 as "no preview", so the
  UI degrades to "unavailable" instead of breaking.
- **Provenance.** This serves Apple preview audio next to Spotify metadata. Fine for a
  personal portfolio demo; note it in the README (step 7). Not a basis for a
  commercial product.

---

## 3. Execution order

Eight steps, two commits. Steps 1–2 are worth landing on their own: they turn the
blank screen into a working browsable app even before any audio works.

```
Step 1  Unhook the UI from preview_url          ─┐
Step 2  Fix the empty-account states             ─┴─ commit 1: "fix: render tracks without preview_url"
Step 3  Add the /api/preview route              ─┐
Step 4  Add lib/preview.ts                       │
Step 5  Rewire Footer to resolve at play time    │
Step 6  Surface unavailable tracks in the UI     │
Step 7  README note                              ─┴─ commit 2: "feat: iTunes preview fallback"
Step 8  Verify
```

---

## Step 1 — Unhook the UI from `preview_url`

**Goal:** rows render regardless of whether audio can ever be resolved.

### 1.1 `components/songRow/SongRow.tsx`

Delete line 27 entirely:

```tsx
-    if (!track?.preview_url) return null
```

### 1.2 `page_components/Player_body/playlist/Playlist.tsx`

Line 30 — first *playable* track becomes first *real* track:

```tsx
-            const track_id = active_playlist?.tracks?.items?.filter((t:any)=>t && t.track && t.track.preview_url && t.track.id)[0]?.track?.id
+            const track_id = active_playlist?.tracks?.items?.filter((t:any)=>t?.track?.id)[0]?.track?.id
```

Line 82 — keep a null-safety filter, drop the preview condition (search results
contain literal `null` entries, so the filter itself must stay):

```tsx
-                    active_playlist?.tracks?.items?.filter((t:any)=>t?.track?.preview_url).map((item: any, i: number) => (
+                    active_playlist?.tracks?.items?.filter((t:any)=>t?.track?.id).map((item: any, i: number) => (
```

### 1.3 `page_components/footer/Footer.tsx`

Lines 51–62 — the queue no longer carries `preview_url` (it is resolved at play time
in step 5). Keep `duration_ms`, which the matcher needs:

```tsx
         const current_playlist = active_playlist?.tracks?.items?.map((t: any) => {
-            if (t && t.track && t.track.preview_url && t.track.id) {
+            if (t && t.track && t.track.id) {
                 return {
                     id: t?.track?.id,
-                    preview_url: t?.track?.preview_url,
+                    preview_url: t?.track?.preview_url ?? null,
                     name: t?.track?.name,
+                    duration_ms: t?.track?.duration_ms,
                     images: t?.track?.album?.images,
                     artists: t?.track?.artists
                 }
             }
         }).filter((c: any) => c)
```

`preview_url` is kept on the entry deliberately: podcast episodes still get a real one
(`SearchRow.tsx:61` maps `audio_preview_url` into it), and the field starts working
again for free if the app is ever granted extended quota mode.

### 1.4 Guard `audio.play()` against an empty `src`

Lines 89–95. With previews unresolved, `src` can legitimately be empty, and
`play()` on an empty source rejects with a `DOMException` — currently unhandled:

```tsx
     useEffect(() => {
         const { current } = audio
-        if (playing) { current.play() }
+        if (playing && current.src) { current.play().catch(() => {}) }
         else { current.pause() }
     }, [playing])
```

**Check after this step:** `npm run typecheck` clean; open an artist from search and
confirm all 10 rows render. Clicking one does nothing yet — expected.

---

## Step 2 — Fix the empty-account states

Independent of previews. Without these, Home and Search stay blank on this account.

### 2.1 `lib/playlists.ts` — skip empty playlists in `getDefaultPlaylist`

Replace the body (lines 29–41):

```ts
export const getDefaultPlaylist = async (own?: any[]): Promise<any | null> => {
    const playlists = own ?? await getOwnPlaylists()

    // The account may own only empty playlists — opening one gives a blank Home.
    let id = playlists.find((p: any) => p?.tracks?.total > 0)?.id

    if (!id) {
        // Nothing of their own worth opening — fall back to whatever search hands us.
        const results: any = await spotify.searchPlaylists('top hits')
        id = usable(results?.playlists?.items).find((p: any) => p?.tracks?.total > 0)?.id
            ?? usable(results?.playlists?.items)[0]?.id
    }

    if (!id) return null

    return spotify.getPlaylist(id)
}
```

### 2.2 `page_components/Player_body/search/Search.tsx` — seed the landing state

Replace the `if (!searchStr)` branch (lines 23–32):

```tsx
            if(!searchStr){
                // Featured playlists are gone from the Web API, and a fresh account
                // has no top artists — fall back to search for both.
                let playlists: any[] = await getOwnPlaylists()
                if (!playlists.length) {
                    const found: any = await spotify.searchPlaylists('top hits')
                    playlists = usable(found?.playlists?.items)
                }

                const top: any = await spotify.getMyTopArtists()
                let artists: any[] = top?.items ?? []
                if (!artists.length) {
                    const found: any = await spotify.searchArtists('this is')
                    artists = found?.artists?.items ?? []
                }

                setPlaylists(playlists)
                setArtists(artists)
                return
            }
```

### 2.3 `components/searchRow/SearchRow.tsx` — placeholder instead of dropping the card

Lines 96–103. Playlists come back with `images: null`; today those cards vanish:

```tsx
                    row?.map((lib: any) => {
-                        // `images` comes back as null, not [], for playlists with no cover art
-                        if (!lib?.images?.[0]?.url) return null
+                        if (!lib?.id) return null
+                        // `images` comes back as null, not [], for playlists with no cover art
+                        const art = lib?.images?.[0]?.url ?? PLACEHOLDER_ART
                         return (
                             <div onClick={() => clickHandler(lib, heading)} key={lib.id} className={styles.card}>
                                 <span className={heading === 'artists' ? styles.card__imgContainerRounded : ''}>
-                                    <img src={lib.images[0].url} alt={lib.name} />
+                                    <img src={art} alt={lib.name} />
                                 </span>
```

Add above the component, reusing the transparent-SVG idiom already in
`Playlist.tsx:58`:

```tsx
const PLACEHOLDER_ART = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+'
```

**Check after this step:** Home opens a playlist that actually has tracks; Search with
an empty box shows artist and playlist rows. `npm run lint` → 0 errors.

**→ Commit 1.**

---

## Step 3 — `pages/api/preview.ts` (new)

`GET /api/preview?artist=<name>&track=<name>&ms=<duration_ms>`
→ `200 { "previewUrl": string | null }`

Always responds 200, even on upstream failure, so the client never has to distinguish
"no match" from "iTunes is down".

```ts
import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Spotify stopped returning `preview_url` for apps without extended quota mode
 * (2024-11-27), so 30s previews are sourced from the iTunes Search API instead
 * and matched back to the Spotify track by name, artist and duration.
 *
 * This runs server-side because itunes.apple.com does not reliably send CORS
 * headers, and because Vercel can then edge-cache the result.
 */

const ITUNES = 'https://itunes.apple.com/search'
const DURATION_TOLERANCE_MS = 3000

// "Chandelier (Live) - Remastered 2014" -> "chandelier"
const normalize = (s: string): string =>
    (s ?? '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
        .replace(/\s-\s.*$/, '')
        .replace(/[^a-z0-9]+/g, '')
        .trim()

const score = (result: any, track: string, artist: string, ms: number): number => {
    const t = normalize(result?.trackName)
    const a = normalize(result?.artistName)
    const wantT = normalize(track)
    const wantA = normalize(artist)

    let s = 0
    if (t === wantT) s += 3
    else if (t.includes(wantT) || wantT.includes(t)) s += 1
    else return -1                                  // wrong song, no rescue

    if (a === wantA) s += 2
    else if (a.includes(wantA) || wantA.includes(a)) s += 1

    // The duration check is what keeps live cuts, remixes and karaoke versions out.
    if (ms && result?.trackTimeMillis) {
        s += Math.abs(result.trackTimeMillis - ms) <= DURATION_TOLERANCE_MS ? 2 : -1
    }
    return s
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const artist = String(req.query.artist ?? '')
    const track = String(req.query.track ?? '')
    const ms = Number(req.query.ms ?? 0)

    if (!artist || !track) {
        return res.status(400).json({ previewUrl: null, error: 'artist and track are required' })
    }

    // Cached hard: the answer for a given track never changes.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')

    try {
        const url = `${ITUNES}?${new URLSearchParams({
            term: `${artist} ${track}`,
            media: 'music',
            entity: 'song',
            limit: '5',
            country: 'US',
        })}`

        const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
        if (!response.ok) return res.status(200).json({ previewUrl: null })

        // iTunes replies with text/javascript, so parse the body ourselves.
        const data = JSON.parse(await response.text())

        const best = (data?.results ?? [])
            .map((r: any) => ({ r, s: score(r, track, artist, ms) }))
            .filter((c: any) => c.s > 0 && c.r?.previewUrl)
            .sort((a: any, b: any) => b.s - a.s)[0]

        return res.status(200).json({ previewUrl: best?.r?.previewUrl ?? null })
    } catch {
        // Rate limit, timeout, malformed body — all mean "no preview" to the caller.
        return res.status(200).json({ previewUrl: null })
    }
}
```

**Check:** `npm run dev`, then
`curl 'http://localhost:3000/api/preview?artist=Sia&track=Chandelier&ms=216120'`
→ a `previewUrl` on `mzstatic.com`. Also try a nonsense track name → `{"previewUrl":null}`.

---

## Step 4 — `lib/preview.ts` (new)

Client-side resolver: cache → dedupe → fetch.

```ts
/**
 * Resolves a 30s preview for a Spotify track. Spotify itself returns
 * `preview_url: null` for apps without extended quota mode, so anything without
 * one falls through to /api/preview (iTunes). See docs/preview-fallback-plan.md.
 */

const MEMORY = new Map<string, string | null>()
const IN_FLIGHT = new Map<string, Promise<string | null>>()

const CACHE_PREFIX = 'preview:'
const HIT_TTL = 30 * 24 * 60 * 60 * 1000
const MISS_TTL = 7 * 24 * 60 * 60 * 1000   // retried sooner: a miss may be a rate limit

interface Cached { u: string | null; t: number }

const readCache = (id: string): { hit: boolean; url: string | null } => {
    if (MEMORY.has(id)) return { hit: true, url: MEMORY.get(id) ?? null }
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + id)
        if (!raw) return { hit: false, url: null }
        const { u, t }: Cached = JSON.parse(raw)
        if (Date.now() - t > (u ? HIT_TTL : MISS_TTL)) {
            localStorage.removeItem(CACHE_PREFIX + id)
            return { hit: false, url: null }
        }
        MEMORY.set(id, u)
        return { hit: true, url: u }
    } catch {
        return { hit: false, url: null }
    }
}

const writeCache = (id: string, url: string | null) => {
    MEMORY.set(id, url)
    try {
        localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ u: url, t: Date.now() }))
    } catch {
        // quota full or storage blocked — the memory cache still holds for this session
    }
}

export const resolvePreview = async (track: any): Promise<string | null> => {
    if (!track?.id) return null

    // Podcast episodes still carry a real one, and the field starts working again
    // for free if this app is ever granted extended quota mode.
    if (track.preview_url) return track.preview_url

    const cached = readCache(track.id)
    if (cached.hit) return cached.url

    const existing = IN_FLIGHT.get(track.id)
    if (existing) return existing

    const artist = track?.artists?.[0]?.name
    const name = track?.name
    if (!artist || !name) return null

    const request = (async () => {
        try {
            const params = new URLSearchParams({ artist, track: name })
            if (track?.duration_ms) params.set('ms', String(track.duration_ms))

            const res = await fetch(`/api/preview?${params}`)
            const data = await res.json()
            const url: string | null = data?.previewUrl ?? null
            writeCache(track.id, url)
            return url
        } catch {
            return null   // deliberately not cached: a network blip should be retried
        } finally {
            IN_FLIGHT.delete(track.id)
        }
    })()

    IN_FLIGHT.set(track.id, request)
    return request
}

// Fire-and-forget warm-up for the next track in the queue.
export const prefetchPreview = (track: any): void => {
    if (!track?.id || MEMORY.has(track.id)) return
    void resolvePreview(track)
}
```

---

## Step 5 — Rewire `Footer` to resolve at play time

`page_components/footer/Footer.tsx`. Three sites currently assign
`current.src = track?.preview_url` — lines 78, 130 and 163. They collapse into one
async `loadTrack`.

### 5.1 Imports and refs

```tsx
import { resolvePreview, prefetchPreview } from '../../lib/preview'
```

Inside the component, alongside the existing `audio` ref:

```tsx
// Guards against a slow lookup landing after the user has skipped on.
const requestedTrackId = useRef<string | null>(null)
const [unavailable, setUnavailable] = useState<Set<string>>(new Set())

// A playlist where nothing resolves shouldn't spin through all 50 tracks.
const MAX_CONSECUTIVE_MISSES = 3
```

### 5.2 `loadTrack`

```tsx
const loadTrack = async (track: any, queue: any[], misses = 0) => {
    const { current } = audio

    if (!track) {
        current.src = ''
        dispatch({ type: 'SET_PLAY_PAUSE', playing: false })
        return
    }

    requestedTrackId.current = track.id
    dispatch({ type: 'SET_PLAYING_TRACK', playing_track_id: track.id })
    setPlayingTrack(track)

    const url = await resolvePreview(track)

    // The user moved on while we were waiting — drop this result on the floor.
    if (requestedTrackId.current !== track.id) return

    if (!url) {
        setUnavailable(prev => new Set(prev).add(track.id))

        if (misses >= MAX_CONSECUTIVE_MISSES) {
            current.src = ''
            dispatch({ type: 'SET_PLAY_PAUSE', playing: false })
            return
        }

        const next = queue[queue.findIndex((c: any) => c.id === track.id) + 1]
        return loadTrack(next, queue, misses + 1)
    }

    current.src = url
    dispatch({ type: 'SET_PLAY_PAUSE', playing: true })

    prefetchPreview(queue[queue.findIndex((c: any) => c.id === track.id) + 1])
}
```

`queue` is passed in rather than read from `current_playlist` state, because the
effect below builds the queue and plays from it in the same tick.

### 5.3 Call sites

**The playlist effect (lines 41–85)** — replace lines 78–83 (`current.src = ...` plus
the `SET_PLAY_PAUSE` dispatch) with:

```tsx
        void loadTrack(track, c_playlist)
```

Note `c_playlist`, not `current_playlist` — with shuffle on, the shuffled order is
what "next" should follow. Also drop the now-redundant `SET_PLAYING_TRACK` dispatch at
lines 46–49; `loadTrack` does it.

**`playNext` (lines 109–135)** — keep the index arithmetic, replace everything from
`if (!track)` down:

```tsx
    const playNext = () => {
        if (!playing_track_id) return

        let nextIndx = current_playlist?.findIndex(c => c.id === playing_track_id) + 1
        if (nextIndx >= current_playlist.length && repeat) nextIndx = 0

        void loadTrack(current_playlist[nextIndx], current_playlist)
    }
```

**`playPrev` (lines 138–168)** — same shape, keeping the `currentTime > 1` restart:

```tsx
    const playPrev = () => {
        if (!playing_track_id) return
        const { current } = audio

        if (current.currentTime > 1) {
            current.currentTime = 0
            return
        }

        const prevIndx = current_playlist?.findIndex(c => c.id === playing_track_id) - 1
        if (prevIndx < 0) {
            current.src = ''
            return
        }

        void loadTrack(current_playlist[prevIndx], current_playlist)
    }
```

Backward auto-skip is intentionally not implemented — `loadTrack`'s miss path always
advances forward, which is the right behaviour when the previous track has no preview.

### 5.4 Expose `unavailable`

`Playlist` renders the rows but `Footer` owns the resolution state, and there is no
parent/child link between them — both hang off `Player_body`. Route it through the
global store rather than lifting state:

- `context/Reducer.ts`: add `unavailable_track_ids: []` to `initialState` and a case:

```ts
        case 'SET_UNAVAILABLE_TRACKS':
            return {
                ...state,
                unavailable_track_ids: action.payload
            }
```

- `Footer`: replace the local `unavailable` state with a dispatch of the accumulated
  array on each miss (keep a `useRef<Set<string>>` as the accumulator so the dispatch
  does not need the previous state).

---

## Step 6 — Surface unavailable tracks in the UI

Without this, a row with no resolvable preview looks clickable and silently does
nothing — worse than the current behaviour, where it at least isn't there.

### 6.1 `page_components/Player_body/playlist/Playlist.tsx`

Pull `unavailable_track_ids` from `useStateContextValue()` and pass it down:

```tsx
                    active_playlist?.tracks?.items?.filter((t:any)=>t?.track?.id).map((item: any, i: number) => (
                        <SongRow
                            position={i}
                            clickHandler={playTrack}
                            key={item?.track?.id ?? i}
                            track={item?.track}
                            unavailable={unavailable_track_ids?.includes(item?.track?.id)}
                        />
                    ))
```

(`key` moves from the array index to the track id while we're here.)

### 6.2 `components/songRow/SongRow.tsx`

Add `unavailable?: boolean` to `Props`; apply a class and suppress the click:

```tsx
        <div className={`${styles.song_container} ${unavailable ? styles.unavailable : ''}`}>
```

```tsx
            <div onClick={() => !unavailable && clickHandler(track)} className={styles.song}>
```

and in the info block:

```tsx
                    <p>
                        {track?.artists?.map((artist: { name: string }) => artist.name).join(', ')}
                        - {track?.album?.name}
                        {unavailable && <span className={styles.badge}>preview unavailable</span>}
                    </p>
```

### 6.3 `components/songRow/SongRow.module.scss`

```scss
.unavailable {
    opacity: .45;

    .song { cursor: default; }
    &:hover { background-color: transparent; }
}

.badge {
    margin-left: 1rem;
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: grey;
}
```

---

## Step 7 — README note

Add a short section to `README.md` recording that Spotify no longer returns
`preview_url` and that audio comes from the iTunes Search API via `/api/preview`, with
a pointer to this document. This is the provenance note called for in §2.

---

## Step 8 — Verify

```bash
npm run typecheck        # must be clean
npm run lint             # 0 errors (warnings will tick up a little; that's expected)
npm run build            # catches API-route issues that dev mode tolerates
```

Manual pass against the demo account:

1. **Home** opens a playlist with tracks in it (not the empty "Rony Techno").
2. **Search** with an empty box shows artist and playlist rows, including cards with
   no cover art.
3. Search `sia` → open the artist → **all 10 rows render**.
4. Click a row → audio plays within a second or two. Network shows
   `/api/preview?...` → `200` with an `mzstatic.com` URL.
5. Click the same row again → **no** second `/api/preview` call (cache hit).
6. Reload, play the same track → still no `/api/preview` call (`localStorage` hit).
7. Skip forward rapidly through several tracks → the track that ends up selected is
   the one that plays (the `requestedTrackId` guard).
8. Find a track that resolves to nothing → row is dimmed and labelled, and playback
   auto-advances past it rather than stalling.

**→ Commit 2.**

---

## 4. Files touched

**New**
- `pages/api/preview.ts`
- `lib/preview.ts`
- `docs/preview-fallback-plan.md` (this file)

**Edited**
- `components/songRow/SongRow.tsx` + `.module.scss`
- `components/searchRow/SearchRow.tsx`
- `page_components/Player_body/playlist/Playlist.tsx`
- `page_components/Player_body/search/Search.tsx`
- `page_components/footer/Footer.tsx`
- `lib/playlists.ts`
- `context/Reducer.ts`
- `README.md`

No new environment variables. No change to the auth flow, the Spotify client
singleton, or the scopes requested at login.

## 5. Rejected alternatives

- **Spotify Web Playback SDK.** The only route to real, full-length Spotify audio, but
  it requires every listener to have Premium, needs the `streaming` scope (absent from
  the current token — the HAR shows `user-modify-playback-state user-library-read
  user-read-playback-state user-read-currently-playing user-read-recently-played
  user-top-read`), and would mean rewriting `Footer`'s entire play/pause/seek/shuffle
  model against the SDK player. Reasonable as a later, larger piece of work.
- **Browse-only, playback disabled.** Step 1 alone, with the play controls greyed out.
  Honest and cheap, but the app stops being a music player.
- **Applying for extended quota mode.** Would restore `preview_url` at the source, but
  it requires a review process aimed at production applications and is not a plausible
  path for a portfolio demo.
