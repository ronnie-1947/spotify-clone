import React from 'react'
import styles from './Sidebar.module.scss'
import Image from 'next/image'

import spotify from '../../lib/api_spotify'

import SidebarOption from '../../components/sidebarOption/SidebarOption'
import { HomeOutlined, SearchOutlined, LibraryMusicOutlined } from '@material-ui/icons'
import { useStateContextValue } from '../../context/StateProvider'



const Sidebar = () => {

    const [{ playlists, active_playlist, current_page }, dispatch] = useStateContextValue()

    const handlePageChange = (page: string = 'home') => {
        dispatch({
            type: 'SET_PAGE',
            current_page: page
        })

        if (page === 'home') {
            spotify.searchPlaylists('discover weekly').then(async ({ playlists }: any) => {
                if (!playlists) return
                const id = playlists?.items?.[0]?.id

                const tracks = await spotify.getPlaylist(id ? id : '37i9dQZEVXcKatfd95a3vi')

                dispatch({
                    type: 'SET_ACTIVE_PLAYLIST',
                    active_playlist: tracks
                })
            })
        }
    }

    const handlePlaylistChange = async (id: string | undefined | null = undefined) => {

        if (!id) return

        dispatch({
            type: 'SET_PAGE',
            current_page: 'playlist'
        })

        const playlist = await spotify.getPlaylist(id)

        dispatch({
            type: 'SET_ACTIVE_PLAYLIST',
            active_playlist: playlist
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

            <br />

            <strong className={styles.sidebar__title}>PLAYLISTS</strong>
            <hr />

            <div className={styles.sidebar__playlists}>
                {
                    playlists?.playlists?.items?.map((playlist: { name: string, id: string }) => (
                        <SidebarOption key={playlist.id} title={playlist.name} clickHandler={handlePlaylistChange} id={playlist.id} Icon={null} highlight={current_page==='playlist' && active_playlist.name === playlist.name} />
                    ))
                }
            </div>
        </div>
    )
}

export default Sidebar
