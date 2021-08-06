import React, { Fragment } from 'react'
import styles from './Playlist.module.scss'
import { useStateContextValue } from '../../../context/StateProvider'

import { PlayCircleFilled, PauseCircleFilled } from '@material-ui/icons'
import SongRow from '../../../components/songRow/SongRow'

const Playlist = () => {

    const [{ active_playlist, playing_playlist_id, playing, user }, dispatch] = useStateContextValue()

    const playTrack = async (track: any) => {

        const playlist_id = active_playlist?.id

        dispatch({
            type: 'SET_PLAYING_DETAILS',
            payload: {
                playing_playlist_id: playlist_id,
                playing_track_id: track?.id
            }
        })
    }

    const handlePlayPause = () => {

        if (playing_playlist_id !== active_playlist?.id) {

            const playlist_id = active_playlist?.id
            const track_id = active_playlist?.tracks?.items?.filter((t:any)=>t && t.track && t.track.preview_url && t.track.id)[0]?.track?.id
            
            if(!track_id) return

            dispatch({
                type: 'SET_PLAYING_DETAILS',
                payload: {
                    playing_playlist_id: playlist_id,
                    playing_track_id: track_id
                }
            })
        }else {

            dispatch({
                type: 'SET_PLAY_PAUSE',
                playing: !playing
            })
        }
    }

    return (
        <Fragment>
            <div className={styles.body__info} >
                <span className={styles.body__info_img}>
                    {
                        active_playlist?.images?.[0]?.url ? (
                            <img src={active_playlist?.images?.[0]?.url} alt={user?.display_name?.trim()} />
                        ) : (
                            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmVyc2lvbj0iMS4xIi8+" alt="transparent" />
                        )
                    }
                </span>
                <div className={styles.body__info_text}>
                    <strong style={{ textTransform: 'uppercase' }}>{active_playlist?.type}</strong>
                    <h2>{active_playlist?.name}</h2>
                    <p>{active_playlist?.description}</p>
                </div>
            </div>

            <div className={styles.body__songs}>

                <div className={styles.body__icons}>
                    {
                        active_playlist?.id === playing_playlist_id && playing ? (
                            <PauseCircleFilled onClick={handlePlayPause} className={styles.icon} style={{ fontSize: '5rem' }} />
                        ) : (
                            <PlayCircleFilled onClick={handlePlayPause} className={styles.icon} style={{ fontSize: '5rem' }} />
                        )
                    }
                </div>

                {
                    active_playlist?.tracks?.items?.filter((t:any)=>t?.track?.preview_url).map((item: any, i: number) => (
                        <SongRow position={i} clickHandler={playTrack} key={i} track={item?.track} />
                    ))
                }
            </div>
        </Fragment>
    )
}

export default Playlist
