import React, { useState } from 'react'
import styles from './SearchRow.module.scss'
import spotify from '../../lib/api_spotify'
import { useStateContextValue } from '../../context/StateProvider'

interface Props {
    row: any[]
    heading: ('artists' | 'albums' | 'playlists' | 'shows' | 'recently played')
}

const SearchRow = ({ row, heading }: Props) => {

    const [more, setMore] = useState(false)
    const [{ }, dispatch] = useStateContextValue()

    const clickHandler = async (lib: any, type: ('artists' | 'albums' | 'playlists' | 'shows'| 'recently played')) => {

        if (type === 'artists') {

            const artist_tracks = await spotify.getArtistTopTracks(lib?.id, 'US')

            const playlist = {
                ...lib,
                tracks: {
                    items: artist_tracks?.tracks?.map((c: any) => ({ track: c }))
                }
            }


            dispatch({
                type: 'SET_ACTIVE_PLAYLIST',
                active_playlist: playlist
            })

        } else if (type === 'albums') {

            const album = await spotify.getAlbum(lib?.id)

            const playlist = {
                ...lib,
                tracks: {
                    items: album?.tracks?.items.map((c: any) => ({ track: { ...c, album: { images: lib?.images } } }))
                }
            }
            // console.log(playlist)
            dispatch({
                type: 'SET_ACTIVE_PLAYLIST',
                active_playlist: playlist
            })

        } else if (type === 'shows') {

            const shows = await spotify.getShowEpisodes(lib?.id)

            const playlist = {
                ...lib,
                tracks: {
                    items: shows?.items?.map((c: any) => ({
                        track: {
                            preview_url: c.audio_preview_url,
                            name: c.name,
                            album: { images: c.images }
                        }
                    }))
                }
            }

            dispatch({
                type: 'SET_ACTIVE_PLAYLIST',
                active_playlist: playlist
            })

        } else if (type === 'playlists') {

            const playlist = await spotify.getPlaylist(lib?.id)

            dispatch({
                type: 'SET_ACTIVE_PLAYLIST',
                active_playlist: playlist
            })
        }

        dispatch({
            type: 'SET_PAGE',
            current_page: 'playlist'
        })
        return
    }

    return (
        <div className={styles.songRow}>
            <h1 className={styles.songRow__heading}>{heading}</h1>
            <div className={`${more ? styles.songRow__cardsAll : styles.songRow__cards}`}>
                {
                    row?.map((lib: any) => {
                        if (!lib || !lib.images[0] || !lib.images[0].url) return null
                        return (
                            <div onClick={() => clickHandler(lib, heading)} key={lib.id} className={styles.card}>
                                <span className={heading === 'artists' ? styles.card__imgContainerRounded : ''}>
                                    <img src={lib.images[0].url} alt={lib.name} />
                                </span>
                                <p className={styles.card__name}>{lib.name}</p>

                                {lib?.artists && (
                                    <p className={styles.card__author}>
                                        By
                                        {
                                            lib?.artists && (
                                                lib.artists.map((artist: any) => ` ${artist.name} `)
                                            )
                                        }
                                    </p>
                                )}

                                {
                                    lib?.owner && (
                                        <p className={styles.card__author}>
                                            By
                                            {
                                                ` ${lib?.owner?.display_name}`
                                            }
                                        </p>
                                    )
                                }
                            </div>
                        )
                    })
                }
            </div>
            {
                row?.length > 7 && (
                    <div className={styles.more__container}>
                        <span onClick={() => setMore(!more)}>{!more ? 'SEE ALL' : 'SHOW LESS'}</span>
                    </div>
                )
            }
        </div>
    )
}

export default SearchRow