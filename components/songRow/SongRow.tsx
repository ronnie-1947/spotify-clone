import React from 'react'
import styles from './SongRow.module.scss'
import Image from 'next/image'
import { PlayCircleFilled, PauseCircleFilled } from '@mui/icons-material'

import { useStateContextValue } from '../../context/StateProvider'

interface Props {
    track: any
    clickHandler: (track: any) => void
    position: number
}

const SongRow = ({ track, position, clickHandler }: Props) => {

    const [{ playing, playing_track_id }, dispatch] = useStateContextValue()
    const handlePlayPause = () => {

        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: !playing
        })

    }

    return (
        <div className={styles.song_container}>
            {
                playing_track_id === track?.id && playing && (
                    <div className={styles.position}>
                        <PauseCircleFilled onClick={handlePlayPause} className={styles.icon} style={{ fontSize: '4rem' }} />
                    </div>
                )
            }
            {
                playing_track_id === track?.id && !playing && (
                    <div className={styles.position}>
                        <PlayCircleFilled onClick={handlePlayPause} className={styles.icon} style={{ fontSize: '4rem' }} />
                    </div>
                )
            }{
                playing_track_id !== track?.id && (
                    <div className={styles.position}>
                        <p>#{position +1}</p>
                    </div>
                )
            }
            <div onClick={() => clickHandler(track)} className={styles.song}>
                {track?.album?.images?.[0]?.url && (
                    <Image src={track?.album?.images?.[0]?.url} alt={track?.name} height={50} width={50} />
                )}
                <div className={styles.song__info}>
                    <h1>{track.name}</h1>
                    <p>
                        {track?.artists?.map((artist: { name: string }) => artist.name).join(', ')}
                        - {track?.album?.name}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default SongRow
