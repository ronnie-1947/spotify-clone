import React, {useRef, useEffect, useState} from 'react'
import styles from './Footer.module.scss'
import Image from 'next/image'
import {useStateContextValue} from '../../context/StateProvider'

import { PlayCircleOutlineOutlined, PauseCircleFilledOutlined, SkipPrevious, SkipNext, PlaylistPlay, Shuffle, Repeat, VolumeDown } from '@material-ui/icons'
import { Grid, Slider} from '@material-ui/core'
import MediaProgress from '../../components/mediaProgress/MediaProgress'

const Footer = () => {

    const [{active_playlist, shuffle, outer_playing_track_id, repeat, playing_playlist_id, playing_track_id, playing}, dispatch] = useStateContextValue()
    const audio = useRef<any>()

    const [current_playlist, setCurrent_playlist] = useState([])
    const [dupCurrent_playlist, setDupCurrent_playlist] = useState([])
    const [playedPlaylist, setPlayedPlaylist] = useState<any[]>([])

    useEffect(()=>{

        if(active_playlist?.id !== playing_playlist_id)return
        
        const {current} = audio
        dispatch({
            type: 'SET_PLAYING_TRACK',
            playing_track_id: outer_playing_track_id
        })
        
        const current_playlist = active_playlist?.tracks?.items?.map((t:any)=>{
            if(t && t.track && t.track.preview_url){
                return {
                    id: t?.track?.id,
                    preview_url: t?.track?.preview_url
                }
            }
        }).filter((c:any)=>c)
        
        
        const track = current_playlist.filter((c:{id:string})=>c.id===outer_playing_track_id)?.[0]
        
        setCurrent_playlist(current_playlist)
        setDupCurrent_playlist(current_playlist)
        
        current.src = track?.preview_url
        
        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: true
        })
        
    }, [audio, outer_playing_track_id, playing_playlist_id])
    


    useEffect(()=>{
        const {current} = audio

        if(playing){current.play()}
        else{current.pause()}

    }, [playing])




    const handlePlayPause = ()=>{

        if(!playing_track_id)return
        const action = !playing

        dispatch({
            type: 'SET_PLAY_PAUSE',
            playing: action
        })
    }




    const playNext = ()=>{

        if(!playing_track_id)return
        const {current} = audio

        const previousPlayed = [...playedPlaylist]

        let randomIndx:number = current_playlist.findIndex((c: {id: string})=>c.id === playing_track_id)

        let modifiedPlaylist = [...current_playlist].filter((c:{id:string})=>{

            if(c.id !== playing_track_id)return c

            previousPlayed.push(c)
        })

        if(randomIndx>modifiedPlaylist.length-1)randomIndx = 0
        
        if(modifiedPlaylist.length<1){
            if(!repeat)return
            modifiedPlaylist = [...dupCurrent_playlist]
            randomIndx = 0
        }
        
        if(shuffle){
            randomIndx = Math.floor(Math.random()*modifiedPlaylist.length)
        }
        
        
        try {
            const {id, preview_url} = modifiedPlaylist[randomIndx]
            dispatch({
                type: 'SET_PLAYING_TRACK',
                playing_track_id: id
            })
            
            setCurrent_playlist(modifiedPlaylist)
            setPlayedPlaylist(previousPlayed)
    
            current.src= preview_url
            
        } catch (error) {
            console.log(modifiedPlaylist)
        }

    }


    return (
        <div className={styles.footer}>
            <div className={styles.footer__left}>
                <span className={styles.footer__albumImg}>
                    <Image src="/music.jpg" alt="song album" height={60} width={60} />
                </span>
                <div className={styles.footer__songInfo}>
                    <h4>Kine</h4>
                    <p>Rihanna</p>
                </div>
            </div>
            <div className={styles.footer__center}>
                <div className={styles.footer__center_btns}>
                    <Shuffle className={`${styles.footer__icon} ${shuffle && styles.footer__green}`}  />
                    <SkipPrevious className={styles.footer__icon} />
                    {
                        !playing? (
                            <PlayCircleOutlineOutlined onClick={handlePlayPause} style={{ fontSize: '4rem' }} className={styles.footer__icon} />
                            ): (
                            <PauseCircleFilledOutlined onClick={handlePlayPause} style={{ fontSize: '4rem' }} className={styles.footer__icon} />
                        )
                    }
                    <SkipNext onClick={playNext} className={styles.footer__icon} />
                    <Repeat className={`${styles.footer__icon} ${repeat && styles.footer__green}`} />
                </div>
                <MediaProgress/>
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
                            <VolumeDown className={styles.footer__icon} />
                        </span>
                    </Grid>
                    <Grid item xs>
                        <span className={styles.footer__right_span}>
                            <Slider style={{ color: '#1db954' }} />
                        </span>
                    </Grid>
                </Grid>
            </div>

            <audio onEnded={playNext} autoPlay={true} ref={audio}/>
        </div>
    )
}

export default Footer
