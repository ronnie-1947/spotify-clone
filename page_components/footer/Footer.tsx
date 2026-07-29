import React, { useRef, useEffect, useState } from 'react'
import styles from './Footer.module.scss'
import Image from 'next/image'
import { useStateContextValue } from '../../context/StateProvider'

import { PlayCircleOutlineOutlined, PauseCircleFilledOutlined, VolumeMute, SkipPrevious, SkipNext, PlaylistPlay, Shuffle, Repeat, VolumeDown } from '@mui/icons-material'
import { Grid, Slider } from '@mui/material'
import MediaProgress from '../../components/mediaProgress/MediaProgress'
import { resolvePreview, prefetchPreview } from '../../lib/preview'

// A playlist where nothing resolves shouldn't spin through all 50 tracks.
const MAX_CONSECUTIVE_MISSES = 3

const suffleArray: (arr: any[]) => any[] = (pointerarr) => {

    const arr = [...pointerarr]
    arr.forEach((_, indx) => {
        const newPos = Math.floor(Math.random() * arr.length)
        const temp = arr[newPos]
        arr[newPos] = arr[indx]
        arr[indx] = temp
    })
    return arr
}

const Footer = () => {

    const [{ active_playlist, shuffle, outer_playing_track_id, repeat, playing_playlist_id, playing_track_id, playing }, dispatch] = useStateContextValue()
    const audio = useRef<any>(null)

    const [current_playlist, setCurrent_playlist] = useState<any[]>([])
    const [dupCurrent_playlist, setDupCurrent_playlist] = useState([])
    const [volume, setVolume] = useState<number>(50)
    const [playTime, setPlayTime] = useState(0)
    const [playingTrack, setPlayingTrack] = useState<any>(null)

    // Guards against a slow lookup landing after the user has skipped on.
    const requestedTrackId = useRef<string | null>(null)
    const unavailableIds = useRef<Set<string>>(new Set())

    const loadTrack = async (track: any, queue: any[], misses = 0) => {

        const { current } = audio

        if (!track) {
            current.src = ''
            dispatch({
                type: 'SET_PLAY_PAUSE',
                playing: false
            })
            return
        }

        requestedTrackId.current = track.id
        dispatch({
            type: 'SET_PLAYING_TRACK',
            playing_track_id: track.id
        })
        setPlayingTrack(track)

        const url = await resolvePreview(track)

        // The user moved on while we were waiting — drop this result on the floor.
        if (requestedTrackId.current !== track.id) return

        const nextInQueue = queue[queue.findIndex((c: any) => c.id === track.id) + 1]

        if (!url) {
            unavailableIds.current.add(track.id)
            dispatch({
                type: 'SET_UNAVAILABLE_TRACKS',
                payload: [...unavailableIds.current]
            })

            if (misses >= MAX_CONSECUTIVE_MISSES) {
                current.src = ''
                dispatch({
                    type: 'SET_PLAY_PAUSE',
                    playing: false
                })
                return
            }

            return loadTrack(nextInQueue, queue, misses + 1)
        }

        current.src = url
        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: true
        })

        prefetchPreview(nextInQueue)
    }

    useEffect(() => {

        const derivedVolume = localStorage.getItem('volume')
        if (!derivedVolume) return
        setVolume(+derivedVolume * 100)
    }, [])

    useEffect(() => {

        if (active_playlist?.id !== playing_playlist_id) return

        const current_playlist = active_playlist?.tracks?.items?.map((t: any) => {

            if (t && t.track && t.track.id) {
                return {
                    id: t?.track?.id,
                    preview_url: t?.track?.preview_url ?? null,
                    name: t?.track?.name,
                    duration_ms: t?.track?.duration_ms,
                    images: t?.track?.album?.images,
                    artists: t?.track?.artists
                }
            }
        }).filter((c: any) => c)

        const track = current_playlist.filter((c: { id: string }) => c.id === outer_playing_track_id)?.[0]
        if (!track) return

        setDupCurrent_playlist(current_playlist)

        let c_playlist = current_playlist

        if (shuffle) {
            c_playlist = [track, ...suffleArray(current_playlist).filter((c: { id: string }) => c.id !== outer_playing_track_id)]
        }

        setCurrent_playlist(c_playlist)

        // c_playlist, not current_playlist: with shuffle on, the shuffled order is
        // what "next" should follow.
        void loadTrack(track, c_playlist)

    }, [audio, outer_playing_track_id, playing_playlist_id])



    useEffect(() => {
        const { current } = audio

        // With previews resolved lazily, `src` can legitimately be empty --
        // play() on an empty source rejects with a DOMException.
        if (playing && current.src) { current.play().catch(() => {}) }
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

        let nextIndx = current_playlist?.findIndex(c => c.id === playing_track_id) + 1
        if (nextIndx >= current_playlist.length && repeat) nextIndx = 0

        void loadTrack(current_playlist[nextIndx], current_playlist)
    }


    const playPrev = () => {

        if (!playing_track_id) return
        const { current } = audio

        if (current.currentTime > 1) {
            current.currentTime = 0
            return
        }

        const prevIndx = current_playlist?.findIndex(c => c.id === playing_track_id) - 1
        if (prevIndx < 0) {

            current.src = ''
            return
        }

        // Backward auto-skip is deliberately not implemented — loadTrack's miss path
        // always advances forward, which is right when the previous track is a miss.
        void loadTrack(current_playlist[prevIndx], current_playlist)
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

    // Persisted here rather than in an effect on `volume`: that effect fires on the
    // first commit too, overwriting the restored value with the default.
    const changeVolume = (value: number) => {
        const clamped = Math.min(100, Math.max(0, value))
        setVolume(clamped)
        localStorage.setItem('volume', `${clamped / 100}`)
    }

    // Slider hands back number[] for range sliders -- this one has a single thumb
    const handleVolume = (_event: Event, newValue: number | number[]) => {
        changeVolume(Array.isArray(newValue) ? newValue[0] : newValue)
    }

    useEffect(()=>{
        audio.current.volume = volume / 100
    }, [volume])


    return (
        <div className={styles.footer}>
            <div className={styles.footer__left}>
                <span className={styles.footer__albumImg}>
                    {
                        playingTrack?.images?.[0]?.url && (
                            <Image src={playingTrack?.images?.[0]?.url} alt="song album" height={60} width={60} />
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
                {/* v9's Grid container dropped v4's `width: 100%`, so a `size="grow"`
                    child (flex-basis: 0) collapsed the slider to a hairline. */}
                <Grid container spacing={2} sx={{ width: '100%' }} >
                    <Grid>
                        <span className={styles.footer__right_span}>
                            <PlaylistPlay className={styles.footer__icon} />
                        </span>
                    </Grid>
                    <Grid>
                        <span className={styles.footer__right_span}>
                            {volume > 0 ? (
                                <VolumeDown onClick = {()=>changeVolume(0)} className={styles.footer__icon} />
                            ) : (
                                <VolumeMute onClick = {()=>changeVolume(30)} className={styles.footer__icon} />
                            )}
                        </span>
                    </Grid>
                    <Grid size="grow">
                        <span className={styles.footer__right_span}>
                            <Slider value={volume} onChange={handleVolume} style={{ color: '#1db954' }} />
                        </span>
                    </Grid>
                </Grid>
            </div>

            <audio onTimeUpdate={handlePlayerTimeUpdate} onEnded={playNext} autoPlay={true} ref={audio} />
        </div>
    )
}

export default Footer
