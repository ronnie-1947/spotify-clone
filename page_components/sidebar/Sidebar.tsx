import React, { useEffect, useState } from 'react'
import styles from './Sidebar.module.scss'
import Image from 'next/image'

import { getDefaultPlaylist } from '../../lib/playlists'
import { getLibrary, openLibraryItem, firstPlayableTrackId, LibraryItem as Item } from '../../lib/library'

import SidebarOption from '../../components/sidebarOption/SidebarOption'
import LibraryItem from '../../components/libraryItem/LibraryItem'
import { HomeOutlined, SearchOutlined, LibraryMusicOutlined } from '@mui/icons-material'
import { useStateContextValue } from '../../context/StateProvider'

// Placeholder rows shown while the library is still loading
const SKELETON_ROWS = [0, 1, 2, 3, 4]


const Sidebar = () => {

    const [{ playlists, active_playlist, current_page, playing_playlist_id, playing }, dispatch] = useStateContextValue()

    const [library, setLibrary] = useState<Item[] | null>(null)

    // Liked songs and saved albums are only needed here, so they're fetched here --
    // `playlists` already comes down from Layout, so it's reused rather than refetched.
    useEffect(() => {
        let cancelled = false

        getLibrary(playlists).then(items => {
            if (cancelled) return
            setLibrary(items)
        })

        return () => { cancelled = true }
    }, [playlists])

    const handlePageChange = (page: string = 'home') => {
        dispatch({
            type: 'SET_PAGE',
            current_page: page
        })

        if (page === 'home') {
            getDefaultPlaylist().then(tracks => {
                if (!tracks) return

                dispatch({
                    type: 'SET_ACTIVE_PLAYLIST',
                    active_playlist: tracks
                })
            })
        }
    }

    const openItem = async (item: Item) => {

        dispatch({
            type: 'SET_PAGE',
            current_page: 'playlist'
        })

        const playlist = await openLibraryItem(item)

        dispatch({
            type: 'SET_ACTIVE_PLAYLIST',
            active_playlist: playlist
        })

        return playlist
    }

    const playItem = async (item: Item) => {

        // Already the playing collection -- the button is a plain play/pause toggle
        if (playing_playlist_id === item.id) {
            dispatch({
                type: 'SET_PLAY_PAUSE',
                playing: !playing
            })
            return
        }

        // The footer only picks up a track once the collection is the active one,
        // so it has to be opened before playback details are dispatched.
        const playlist = await openItem(item)
        const track_id = firstPlayableTrackId(playlist)

        if (!track_id) return

        dispatch({
            type: 'SET_PLAYING_DETAILS',
            payload: {
                playing_playlist_id: playlist?.id,
                playing_track_id: track_id
            }
        })
    }

    return (
        <div className={styles.sidebar}>
            <div className={styles.sidebar__logoContainer}>
                <Image src="/spotify_logo_white_big.png" alt="spotify logo" height={70} width={170} />
            </div>
            <div>
                <SidebarOption clickHandler={handlePageChange} id="home" title="Home" Icon={HomeOutlined} highlight={current_page === 'home'} />
                <SidebarOption clickHandler={handlePageChange} id="search" title="Search" Icon={SearchOutlined} highlight={current_page === 'search'} />
                <SidebarOption clickHandler={handlePageChange} id="library" title="Your Library" Icon={LibraryMusicOutlined} highlight={current_page === 'library'} />
            </div>

            <div className={styles.sidebar__libraryHeader}>
                <strong className={styles.sidebar__title}>YOUR LIBRARY</strong>
                {library && <span className={styles.sidebar__count}>{library.length}</span>}
            </div>
            <hr />

            <div className={styles.sidebar__playlists}>
                {
                    library ? (
                        library.map(item => (
                            <LibraryItem
                                key={`${item.kind}-${item.id}`}
                                item={item}
                                active={current_page === 'playlist' && active_playlist?.id === item.id}
                                playing={playing_playlist_id === item.id && playing}
                                onOpen={openItem}
                                onPlay={playItem}
                            />
                        ))
                    ) : (
                        SKELETON_ROWS.map(i => (
                            <div key={i} className={styles.sidebar__skeleton}>
                                <span className={styles.sidebar__skeleton_art} />
                                <div className={styles.sidebar__skeleton_meta}>
                                    <span className={styles.sidebar__skeleton_line} />
                                    <span className={styles.sidebar__skeleton_lineShort} />
                                </div>
                            </div>
                        ))
                    )
                }

                {library?.length === 0 && (
                    <p className={styles.sidebar__empty}>Nothing saved yet — like a song or follow a playlist on Spotify and it will show up here.</p>
                )}
            </div>
        </div>
    )
}

export default Sidebar
