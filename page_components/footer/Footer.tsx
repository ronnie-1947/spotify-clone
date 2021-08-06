import React, { useRef, useEffect, useState } from 'react'
import styles from './Footer.module.scss'
import Image from 'next/image'
import { useStateContextValue } from '../../context/StateProvider'

import { PlayCircleOutlineOutlined, PauseCircleFilledOutlined, VolumeMute, SkipPrevious, SkipNext, PlaylistPlay, Shuffle, Repeat, VolumeDown } from '@material-ui/icons'
import { Grid, Slider } from '@material-ui/core'
import MediaProgress from '../../components/mediaProgress/MediaProgress'

const suffleArray: (arr: any[]) => any[] = (pointerarr) => {

    let newPos, temp, arr = [...pointerarr]
    arr.forEach((_, indx) => {
        newPos = Math.floor(Math.random() * arr.length)
        temp = arr[newPos]
        arr[newPos] = arr[indx]
        arr[indx] = temp
    })
    return arr
}

const Footer = () => {

    const [{ active_playlist, shuffle, outer_playing_track_id, repeat, playing_playlist_id, playing_track_id, playing }, dispatch] = useStateContextValue()
    const audio = useRef<any>()

    const [current_playlist, setCurrent_playlist] = useState<any[]>([])
    const [dupCurrent_playlist, setDupCurrent_playlist] = useState([])
    const [volume, setVolume] = useState<number>(50)
    const [playTime, setPlayTime] = useState(0)
    const [playingTrack, setPlayingTrack] = useState<any>(null)

    useEffect(() => {

        const derivedVolume = localStorage.getItem('volume')
        if (!derivedVolume) return
        setVolume(+derivedVolume * 100)
        audio.current.volume = +derivedVolume
    }, [])

    useEffect(() => {

        if (active_playlist?.id !== playing_playlist_id) return

        const { current } = audio
        dispatch({
            type: 'SET_PLAYING_TRACK',
            playing_track_id: outer_playing_track_id
        })

        const current_playlist = active_playlist?.tracks?.items?.map((t: any) => {

            if (t && t.track && t.track.preview_url && t.track.id) {
                return {
                    id: t?.track?.id,
                    preview_url: t?.track?.preview_url,
                    name: t?.track?.name,
                    images: t?.track?.album?.images,
                    artists: t?.track?.artists
                }
            }
        }).filter((c: any) => c)

        const track = current_playlist.filter((c: { id: string }) => c.id === outer_playing_track_id)?.[0]
        if (!track) return

        setDupCurrent_playlist(current_playlist)
        setPlayingTrack(track)

        let c_playlist = current_playlist

        if (shuffle) {
            c_playlist = [track, ...suffleArray(current_playlist).filter((c: { id: string }) => c.id !== outer_playing_track_id)]
        }

        setCurrent_playlist(c_playlist)

        current.src = track?.preview_url

        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: true
        })

    }, [audio, outer_playing_track_id, playing_playlist_id])



    useEffect(() => {
        const { current } = audio

        if (playing) { current.play() }
        else { current.pause() }

    }, [playing])


    const handlePlayPause = () => {

        if (!playing_track_id) return
        const action = !playing

        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: action
        })
    }

    const playNext = () => {

        if (!playing_track_id) return
        const { current } = audio

        let nextIndx = current_playlist?.findIndex(c => c.id === playing_track_id) + 1
        if (nextIndx >= current_playlist.length && repeat) nextIndx = 0

        const track = current_playlist[nextIndx]
        if (!track) {

            current.src = ''
            return
        }

        dispatch({
            type: 'SET_PLAYING_TRACK',
            playing_track_id: track?.id
        })
        setPlayingTrack(track)

        current.src = track?.preview_url
        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: true
        })
    }


    const playPrev = () => {

        if (!playing_track_id) return
        const { current } = audio

        if (current.currentTime > 1) {
            current.currentTime = 0
            return
        }

        let prevIndx = current_playlist?.findIndex(c => c.id === playing_track_id) - 1
        if (prevIndx < 0) {

            current.src = ''
            return
        }

        const track = current_playlist[prevIndx]

        dispatch({
            type: 'SET_PLAYING_TRACK',
            playing_track_id: track?.id
        })
        setPlayingTrack(track)

        current.src = track?.preview_url
        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: true
        })
    }

    const handleSuffle = () => {

        let c_playlist: any[] = dupCurrent_playlist

        if (!shuffle) {
            let track = null
            const shuffled_playlist = suffleArray(current_playlist).filter((c: { id: string }) => {
                if (c.id !== playing_track_id) return c
                track = c
            })

            c_playlist = [track, ...shuffled_playlist]
        }

        setCurrent_playlist(c_playlist)

        dispatch({
            type: 'SET_SHUFFLE',
            shuffle: !shuffle
        })
    }

    const handleRepeat = () => {

        dispatch({
            type: 'SET_REPEAT',
            repeat: !repeat
        })
    }

    const handlePlayerTimeUpdate = () => {
        const fullDuration = audio.current.duration
        const currentTime = audio.current.currentTime

        setPlayTime((currentTime / fullDuration) * 100)
    }

    const playTimeHandler = (e: any) => {
        if (!playing_track_id) return

        const playTime = (e.nativeEvent.offsetX / e.target.clientWidth) * 100
        const fullDuration = audio.current.duration
        setPlayTime(playTime)
        audio.current.currentTime = (playTime / 100) * fullDuration
    }

    const handleVolume: any = (event: any, newValue: number | number[]) => {
        if(newValue > 100 || newValue < .1) return
        setVolume(newValue as number)
    }

    useEffect(()=>{
        audio.current.volume = typeof (volume) === 'number' ? volume / 100 : volume[0] / 100
        localStorage.setItem('volume', `${typeof (volume) === 'number' ? volume / 100 : volume[0] / 100}`)
    }, [volume])


    return (
        <div className={styles.footer}>
            <div className={styles.footer__left}>
                <span className={styles.footer__albumImg}>
                    {
                        playingTrack?.images[0]?.url && (
                            <Image src={playingTrack?.images[0]?.url} alt="song album" height={60} width={60} />
                        )
                    }
                </span>
                <div className={styles.footer__songInfo}>
                    <h4>{playingTrack?.name}</h4>
                    <p>{playingTrack?.artists?.map((c: { name: string }) => c.name).join(' ')}</p>
                </div>
            </div>
            <div className={styles.footer__center}>
                <div className={styles.footer__center_btns}>
                    <Shuffle onClick={handleSuffle} className={`${styles.footer__icon} ${shuffle && styles.footer__green}`} />
                    <SkipPrevious onClick={playPrev} className={styles.footer__icon} />
                    {
                        !playing ? (
                            <PlayCircleOutlineOutlined onClick={handlePlayPause} style={{ fontSize: '4rem' }} className={styles.footer__icon} />
                        ) : (
                            <PauseCircleFilledOutlined onClick={handlePlayPause} style={{ fontSize: '4rem' }} className={styles.footer__icon} />
                        )
                    }
                    <SkipNext onClick={playNext} className={styles.footer__icon} />
                    <Repeat onClick={handleRepeat} className={`${styles.footer__icon} ${repeat && styles.footer__green}`} />
                </div>
                <MediaProgress playTime={playTime} playTimeHandler={playTimeHandler} />
            </div>
            <div className={styles.footer__right}>
                <Grid container spacing={2} >
                    <Grid item>
                        <span className={styles.footer__right_span}>
                            <PlaylistPlay className={styles.footer__icon} />
                        </span>
                    </Grid>
                    <Grid item>
                        <span className={styles.footer__right_span}>
                            {volume > 10 ? (
                                <VolumeDown onClick = {()=>setVolume(.1)} className={styles.footer__icon} />
                            ) : (
                                <VolumeMute onClick = {()=>setVolume(30)} className={styles.footer__icon} />
                            )}
                        </span>
                    </Grid>
                    <Grid item xs>
                        <span className={styles.footer__right_span}>
                            <Slider value={volume ? volume : 100} onChange={handleVolume} style={{ color: '#1db954' }} />
                        </span>
                    </Grid>
                </Grid>
            </div>

            <audio onTimeUpdate={handlePlayerTimeUpdate} onEnded={playNext} autoPlay={true} ref={audio} />
        </div>
    )
}

export default Footer
