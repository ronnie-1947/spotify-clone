import React, { useRef, useEffect, useState } from 'react'
import styles from './Footer.module.scss'
import Image from 'next/image'
import { useStateContextValue } from '../../context/StateProvider'

import { PlayCircleFilledRounded, PauseCircleFilledRounded, VolumeOffRounded, SkipPreviousRounded, SkipNextRounded, QueueMusicRounded, ShuffleRounded, RepeatRounded, VolumeDownRounded, VolumeUpRounded } from '@mui/icons-material'
import { Slider } from '@mui/material'
import MediaProgress from '../../components/mediaProgress/MediaProgress'
import { resolvePreview, prefetchPreview } from '../../lib/preview'

// A playlist where nothing resolves shouldn't spin through all 50 tracks.
const MAX_CONSECUTIVE_MISSES = 3

// Spotify green -- mirrors $spotify_green, which SCSS can't hand to MUI's sx prop.
const SPOTIFY_GREEN = '#1db954'

const RAIL_GREY = '#eeeeee91'

const volumeSliderSx = {
    color: SPOTIFY_GREEN,
    padding: '1.3rem 0',
    '& .MuiSlider-rail': {
        opacity: 1,
        backgroundColor: RAIL_GREY,
    },
    '& .MuiSlider-track': {
        border: 'none',
    },
    // Thumb hidden until the bar is hovered/focused, like Spotify's.
    '& .MuiSlider-thumb': {
        width: 12,
        height: 12,
        backgroundColor: '#fff',
        opacity: 0,
        transition: 'opacity 0.1s ease-in-out',
        '&:hover, &.Mui-focusVisible, &.Mui-active': {
            boxShadow: 'none',
        },
    },
    '&:hover .MuiSlider-thumb, & .MuiSlider-thumb.Mui-focusVisible, & .MuiSlider-thumb.Mui-active': {
        opacity: 1,
    },
}

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${`${secs}`.padStart(2, '0')}`
}

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
    const [elapsed, setElapsed] = useState(0)
    const [duration, setDuration] = useState(0)
    const [playingTrack, setPlayingTrack] = useState<any>(null)

    // Guards against a slow lookup landing after the user has skipped on.
    const requestedTrackId = useRef<string | null>(null)
    const unavailableIds = useRef<Set<string>>(new Set())

    // The bar and the elapsed label would otherwise keep the outgoing track's
    // position until the new preview's first timeupdate.
    const resetProgress = () => {
        setPlayTime(0)
        setElapsed(0)
        setDuration(0)
    }

    const loadTrack = async (track: any, queue: any[], misses = 0) => {

        const { current } = audio

        if (!track) {
            current.src = ''
            resetProgress()
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
                resetProgress()
                dispatch({
                    type: 'SET_PLAY_PAUSE',
                    playing: false
                })
                return
            }

            return loadTrack(nextInQueue, queue, misses + 1)
        }

        current.src = url
        resetProgress()
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

        setElapsed(currentTime)
        setPlayTime((currentTime / fullDuration) * 100)
    }

    // Previews are nominally 30s, but the real length comes off the loaded file.
    const handleLoadedMetadata = () => {
        setDuration(audio.current.duration)
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
                            <Image src={playingTrack?.images?.[0]?.url} alt="song album" height={56} width={56} />
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
                    <button
                        type="button"
                        onClick={handleSuffle}
                        title="Shuffle"
                        aria-label="Shuffle"
                        aria-pressed={shuffle}
                        className={`${styles.footer__ctrl} ${shuffle ? styles.footer__green : ''}`}
                    >
                        <ShuffleRounded className={styles.footer__icon} />
                    </button>
                    <button
                        type="button"
                        onClick={playPrev}
                        title="Previous"
                        aria-label="Previous track"
                        disabled={!playing_track_id}
                        className={styles.footer__ctrl}
                    >
                        <SkipPreviousRounded className={styles.footer__icon} />
                    </button>
                    <button
                        type="button"
                        onClick={handlePlayPause}
                        title={playing ? 'Pause' : 'Play'}
                        aria-label={playing ? 'Pause' : 'Play'}
                        disabled={!playing_track_id}
                        className={`${styles.footer__ctrl} ${styles.footer__ctrl_play}`}
                    >
                        {
                            !playing ? (
                                <PlayCircleFilledRounded className={styles.footer__icon_play} />
                            ) : (
                                <PauseCircleFilledRounded className={styles.footer__icon_play} />
                            )
                        }
                    </button>
                    <button
                        type="button"
                        onClick={playNext}
                        title="Next"
                        aria-label="Next track"
                        disabled={!playing_track_id}
                        className={styles.footer__ctrl}
                    >
                        <SkipNextRounded className={styles.footer__icon} />
                    </button>
                    <button
                        type="button"
                        onClick={handleRepeat}
                        title="Repeat"
                        aria-label="Repeat"
                        aria-pressed={repeat}
                        className={`${styles.footer__ctrl} ${repeat ? styles.footer__green : ''}`}
                    >
                        <RepeatRounded className={styles.footer__icon} />
                    </button>
                </div>
                <div className={styles.footer__center_progress}>
                    <span className={styles.footer__time}>{formatTime(elapsed)}</span>
                    <MediaProgress playTime={playTime} playTimeHandler={playTimeHandler} />
                    <span className={styles.footer__time}>{formatTime(duration)}</span>
                </div>
            </div>
            <div className={styles.footer__right}>
                <button
                    type="button"
                    title="Queue"
                    aria-label="Queue"
                    className={styles.footer__ctrl}
                >
                    <QueueMusicRounded className={styles.footer__icon} />
                </button>
                <button
                    type="button"
                    onClick={() => changeVolume(volume > 0 ? 0 : 30)}
                    title={volume > 0 ? 'Mute' : 'Unmute'}
                    aria-label={volume > 0 ? 'Mute' : 'Unmute'}
                    className={styles.footer__ctrl}
                >
                    {volume === 0 ? (
                        <VolumeOffRounded className={styles.footer__icon} />
                    ) : volume < 50 ? (
                        <VolumeDownRounded className={styles.footer__icon} />
                    ) : (
                        <VolumeUpRounded className={styles.footer__icon} />
                    )}
                </button>
                <span className={styles.footer__right_slider}>
                    <Slider value={volume} onChange={handleVolume} aria-label="Volume" sx={volumeSliderSx} />
                </span>
            </div>

            <audio onTimeUpdate={handlePlayerTimeUpdate} onLoadedMetadata={handleLoadedMetadata} onEnded={playNext} autoPlay={true} ref={audio} />
        </div>
    )
}

export default Footer
