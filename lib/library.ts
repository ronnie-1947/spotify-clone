import spotify from './api_spotify'

/**
 * Everything the sidebar needs to render "Your Library": the saved-tracks
 * collection, the user's own playlists and their saved albums, flattened into one
 * shape so the sidebar doesn't have to branch per Spotify payload.
 *
 * Opening an item is `openLibraryItem()` — it hands back an object shaped like a
 * playlist (`{ id, name, images, tracks: { items: [{ track }] } }`), which is what
 * `active_playlist` is expected to be everywhere downstream (Playlist, Footer).
 */

// Liked Songs is not a real playlist, so it needs an id of its own — this is what
// ends up in `playing_playlist_id`, so it must be stable across renders.
export const LIKED_SONGS_ID = 'liked-songs'

export type LibraryKind = 'liked' | 'playlist' | 'album'

export interface LibraryItem {
    id: string
    name: string
    kind: LibraryKind
    // "Playlist" / "Album" / "Single" — the first half of the subtitle line
    label: string
    // Owner, artists or track count — the second half of the subtitle line
    detail: string
    image: string | null
    // Liked Songs sits at the top with a pin, the way Spotify pins it
    pinned?: boolean
    // Saved albums can be pre-release; they get a clock instead of plain text
    upcoming?: boolean
    // Pre-resolved tracks, for items we already have in full (Liked Songs)
    tracks?: any[]
}

const artistNames = (artists: any[] | undefined | null): string =>
    (artists ?? []).map((a: any) => a?.name).filter(Boolean).join(', ')

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1)

// `release_date` is 'YYYY', 'YYYY-MM' or 'YYYY-MM-DD' depending on precision;
// string comparison against today's ISO date is correct for all three.
const isUpcoming = (release_date: string | undefined): boolean => {
    if (!release_date) return false
    return release_date > new Date().toISOString().slice(0, 10)
}

// Spotify returns `images` largest-first (a mosaic cover is 640/300/60). The sidebar
// rows are 48px, so take the smallest variant that still covers them rather than
// pulling the 640px one. Playlist covers sometimes come back as a single entry with
// `width: null` -- unknown size, so it's the fallback rather than a candidate.
const thumbnail = (images: any[] | undefined | null): string | null => {
    const usable = (images ?? []).filter((image: any) => image?.url)

    if (!usable.length) return null

    const sized = usable.filter((image: any) => typeof image.width === 'number' && image.width >= 48)

    if (!sized.length) return usable[usable.length - 1].url

    return sized.reduce((smallest: any, image: any) => (image.width < smallest.width ? image : smallest)).url
}

const toPlaylistItem = (playlist: any): LibraryItem => ({
    id: playlist.id,
    name: playlist.name,
    kind: 'playlist',
    label: 'Playlist',
    // Own playlists rarely carry a description, but they always have an owner
    detail: playlist?.owner?.display_name ?? `${playlist?.tracks?.total ?? 0} songs`,
    // `images` comes back as null, not [], for playlists with no cover art
    image: thumbnail(playlist?.images),
})

const toAlbumItem = (album: any): LibraryItem => ({
    id: album.id,
    name: album.name,
    kind: 'album',
    label: isUpcoming(album?.release_date)
        ? `Upcoming ${album?.album_type ?? 'album'}`
        : capitalize(album?.album_type ?? 'album'),
    detail: artistNames(album?.artists),
    image: thumbnail(album?.images),
    upcoming: isUpcoming(album?.release_date),
})

// Saved tracks, as a single pinned pseudo-playlist. Returns null when the account
// has liked nothing — an empty "Liked Songs" row is worse than no row.
export const getLikedSongs = async (): Promise<LibraryItem | null> => {
    try {
        const saved: any = await spotify.getMySavedTracks({ limit: 50 })
        const items = (saved?.items ?? []).filter((item: any) => item?.track?.id)

        if (!items.length) return null

        const total = saved?.total ?? items.length

        return {
            id: LIKED_SONGS_ID,
            name: 'Liked Songs',
            kind: 'liked',
            label: 'Playlist',
            detail: `${total} ${total === 1 ? 'song' : 'songs'}`,
            image: null,
            pinned: true,
            // Already in `{ added_at, track }` form — exactly what a playlist's
            // `tracks.items` looks like, so no reshaping needed.
            tracks: items,
        }
    } catch (err) {
        return null
    }
}

export const getSavedAlbums = async (): Promise<LibraryItem[]> => {
    try {
        const saved: any = await spotify.getMySavedAlbums({ limit: 50 })
        return (saved?.items ?? [])
            .map((item: any) => item?.album)
            .filter((album: any) => album?.id)
            .map(toAlbumItem)
    } catch (err) {
        return []
    }
}

// Liked Songs first (pinned), then playlists, then albums. `playlists` is passed in
// because Layout already loads it into global state — no need to fetch it twice.
export const getLibrary = async (playlists: any[] = []): Promise<LibraryItem[]> => {
    const [liked, albums] = await Promise.all([getLikedSongs(), getSavedAlbums()])

    return [
        ...(liked ? [liked] : []),
        ...playlists.filter((p: any) => p?.id).map(toPlaylistItem),
        ...albums,
    ]
}

// Resolves a sidebar row into an `active_playlist`.
export const openLibraryItem = async (item: LibraryItem): Promise<any> => {

    if (item.kind === 'liked') {
        return {
            id: LIKED_SONGS_ID,
            name: item.name,
            type: 'playlist',
            description: `${item.detail} you've liked`,
            images: [],
            liked: true,
            tracks: { items: item.tracks ?? [] },
        }
    }

    if (item.kind === 'playlist') {
        return spotify.getPlaylist(item.id)
    }

    const album: any = await spotify.getAlbum(item.id)

    // Album tracks are "simplified" objects — they carry no `album`, so the art the
    // footer and song rows read off `track.album.images` has to be grafted on.
    return {
        ...album,
        tracks: {
            items: (album?.tracks?.items ?? []).map((track: any) => ({
                track: { ...track, album: { images: album?.images } },
            })),
        },
    }
}

// The first track that can actually start playback, for the row's play button.
export const firstPlayableTrackId = (playlist: any): string | null =>
    playlist?.tracks?.items?.find((item: any) => item?.track?.id)?.track?.id ?? null
