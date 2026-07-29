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
