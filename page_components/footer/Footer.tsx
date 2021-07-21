import React from 'react'
import styles from './Footer.module.scss'
import Image from 'next/image'

import {PlayCircleOutlineOutlined, SkipPrevious, SkipNext, PlaylistPlay, Shuffle, Repeat, VolumeDown} from '@material-ui/icons'
import {Grid, Slider} from '@material-ui/core'

const Footer = () => {
    return (
        <div className={styles.footer}>
            <div className={styles.footer__left}>
                <span className={styles.footer__albumImg}>
                    <Image src="/music.jpg" alt="song album" height={60} width={60}/>
                </span>
                <div className={styles.footer__songInfo}>
                    <h4>Kine</h4>
                    <p>Rihanna</p>
                </div>
            </div>
            <div className={styles.footer__center}>
                <Shuffle className={styles.footer__green}/>
                <SkipPrevious className={styles.footer__icon}/>
                <PlayCircleOutlineOutlined style={{fontSize: '4rem'}} className={styles.footer__icon}/>
                <SkipNext className={styles.footer__icon}/>
                <Repeat className={styles.footer__green}/>
            </div>
            <div className={styles.footer__right}>
                <Grid container spacing={2} >
                    <Grid item>
                        <span className={styles.footer__right_span}>
                            <PlaylistPlay className={styles.footer__icon}/>
                        </span>
                    </Grid>
                    <Grid item>
                        <span className={styles.footer__right_span}>
                            <VolumeDown className={styles.footer__icon}/>
                        </span>
                    </Grid>
                    <Grid item xs>
                        <span className={styles.footer__right_span}>
                            <Slider style={{color: '#1db954'}}/>
                        </span>
                    </Grid>
                </Grid>
            </div>
        </div>
    )
}

export default Footer
