import spotify from './api_spotify'

/**
 * Spotify restricted a chunk of the Web API on 2024-11-27. Two of those
 * restrictions matter here, and both surface as a 404 rather than a 403:
 *
 *  - `GET /browse/featured-playlists` is deprecated and gone for any app
 *    without extended quota mode.
 *  - Spotify-owned editorial and algorithmic playlists (Discover Weekly and
 *    friends) 404 on `GET /playlists/{id}` — the API acts as if they don't exist.
 *
 * Everything below sticks to playlists the user owns, plus search, which are
 * still open. Go through these helpers rather than calling the browse endpoints.
 */

// Search still lists Spotify's own playlists as null holes in `items`, and any
// that do come back owned by `spotify` would 404 on getPlaylist — drop both.
export const usable = (items: any[] | undefined | null): any[] =>
    (items ?? []).filter((item: any) => item?.id && item?.owner?.id !== 'spotify')

// Fills the sidebar, standing in for the old featured playlists.
export const getOwnPlaylists = async (): Promise<any[]> => {
    const playlists: any = await spotify.getUserPlaylists()
    return usable(playlists?.items)
}

// The playlist Home opens with, standing in for the hardcoded Discover Weekly.
// Pass `own` if the caller already has the user's playlists, to save a round trip.
export const getDefaultPlaylist = async (own?: any[]): Promise<any | null> => {
    let id = (own ?? await getOwnPlaylists())[0]?.id

    if (!id) {
        // Nothing of their own to open — fall back to whatever search hands us.
        const results: any = await spotify.searchPlaylists('top hits')
        id = usable(results?.playlists?.items)[0]?.id
    }

    if (!id) return null

    return spotify.getPlaylist(id)
}
