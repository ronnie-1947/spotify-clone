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
